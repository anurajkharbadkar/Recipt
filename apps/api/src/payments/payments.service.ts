import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { PRICING_PLANS, SubscriptionPlan, SubscriptionStatus, SUBSCRIPTION_PERIOD_DAYS } from '@pavti/shared';
import { CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX } from './cashfree/cashfree.constants';

/**
 * The business-rule layer the handover doc describes (section 40) — owns
 * the Payment row's lifecycle and, since the real donation flow landed,
 * the Receipt <-> Payment relationship. CashfreeService/
 * CashfreeWebhookService only talk to Cashfree; this is what decides what
 * a verified event means for our own records.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  /**
   * All the validation for "can an online Cashfree payment be started for
   * this receipt, by this org's staff" (handover doc section 36 — a Mandal
   * may only accept online donations once vendor-ACTIVE and
   * paymentEnabled). Deliberately trusts nothing from the client except
   * the receiptId itself — amount and vendor come from the server-side
   * Receipt -> Campaign -> Organization chain, never from request input.
   *
   * Also carries any already-existing Payment for this receipt (there can
   * be at most one — Payment.receiptId is @unique) so the caller can reuse
   * it instead of creating a duplicate Cashfree order on a repeat request.
   */
  async resolveDonationPaymentContext(receiptId: string, requestingOrgId: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { campaign: { include: { organization: true } }, payment: true },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');

    const organization = receipt.campaign.organization;
    if (organization.id !== requestingOrgId) {
      // Same response as "not found" would leak less than a 403 (confirms
      // the id exists in someone else's org), but every other org-scoped
      // endpoint in this app (receipts.findOne, etc.) already uses
      // NotFoundException for cross-org access — matching that convention
      // rather than introducing a different information-leak posture here.
      throw new NotFoundException('Receipt not found');
    }
    if (receipt.campaign.status !== 'ACTIVE') {
      throw new BadRequestException('Campaign is not active');
    }
    if (receipt.paymentMode !== 'ONLINE') {
      throw new BadRequestException('Receipt is not marked for online payment');
    }
    if (receipt.status !== 'PENDING') {
      // Covers both "already PAID" (nothing to do) and CANCELLED/VOIDED —
      // callers should check receipt.status themselves for a friendlier
      // message; this is the server-side backstop.
      throw new BadRequestException(`Receipt is ${receipt.status}, not PENDING`);
    }
    if (!receipt.donorPhone) {
      // Cashfree's Create Order API requires customer_phone. Surfaced here
      // as a clear precondition rather than a confusing Cashfree 400 later.
      throw new BadRequestException('Receipt has no donor phone — required for online payment');
    }
    if (!organization.paymentEnabled || organization.cashfreeVendorStatus !== 'ACTIVE' || !organization.cashfreeVendorId) {
      throw new ForbiddenException('Online donations are not enabled for this organization yet');
    }

    return { receipt, organization, existingPayment: receipt.payment };
  }

  /**
   * Mirrors resolveDonationPaymentContext's shape for the other Cashfree
   * order type this app creates: a Mandal paying its own subscription fee
   * (plain, non-split — the org is the actual merchant here). Refuses on
   * FREE (nothing to pay) or already-ACTIVE (nothing owed) rather than
   * silently letting a second order get created.
   */
  /**
   * @param targetPlanId Omitted for a plain renewal (prices the org's
   *   current plan, matching this method's original behavior exactly).
   *   Set by the subscription page's Change Plan action to price a
   *   *different* plan — the only real difference an upgrade/downgrade
   *   makes at this layer is which plan gets priced and, once paid,
   *   applied (see the webhook's use of Payment.targetPlan).
   */
  async resolveSubscriptionPaymentContext(orgId: string, targetPlanId?: SubscriptionPlan) {
    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
    const planId = targetPlanId ?? (organization.subscriptionPlan as SubscriptionPlan);
    const plan = PRICING_PLANS.find((p) => p.id === planId);
    if (!plan) throw new BadRequestException('Unknown subscription plan');
    if (plan.id === SubscriptionPlan.FREE) {
      throw new BadRequestException('The Free Trial plan has nothing to pay.');
    }
    // Only refuse when there's genuinely nothing to do — already ACTIVE on
    // the exact plan being requested. An ACTIVE org choosing a *different*
    // plan (Change Plan — upgrade or downgrade) is exactly what this
    // param exists for, so it must not get caught by this guard.
    if (organization.subscriptionStatus === SubscriptionStatus.ACTIVE && planId === organization.subscriptionPlan) {
      throw new BadRequestException('Your subscription is already active on this plan.');
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orgId,
        orderId: { startsWith: CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX },
        status: { not: PaymentStatus.PAYMENT_FAILED },
        // Scoped to orders already created *for this exact plan* — reusing
        // one priced for a different plan would hand back a session for
        // the wrong amount/target.
        targetPlan: planId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { organization, plan, existingPayment };
  }

  /** Every subscription order (renewal or Change Plan) this org has ever
   *  created, newest first — the subscription page's payment history. */
  async getSubscriptionPaymentHistory(orgId: string) {
    return this.prisma.payment.findMany({
      where: { orgId, orderId: { startsWith: CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX } },
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true,
        targetPlan: true,
        amountPaise: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    });
  }

  /**
   * Called right after CashfreeService.createOrder() succeeds. This is
   * what makes the webhook meaningful — without a Payment row keyed by
   * orderId, a webhook has nothing to update.
   */
  async recordOrderCreated(params: {
    orgId: string;
    orderId: string;
    amountRupees: number;
    donorName: string;
    donorPhone: string;
    donorEmail?: string;
    /** Set for a real donation payment; omitted for the sandbox test flow. */
    receiptId?: string;
    /**
     * The exact payment_session_id Cashfree returned from creating this
     * order — stored so a later idempotent-reuse (re-clicking "Pay") can
     * hand back the one session actually known to work, instead of
     * re-deriving one via GET /orders/{id} (found live, 2026-08-23: that
     * endpoint mints a *different* session string on every call, even for
     * a still-ACTIVE order — see Payment.paymentSessionId's schema comment).
     */
    paymentSessionId?: string;
    /** Which plan this order is FOR — set on subscription orders only (see
     *  Payment.targetPlan's schema comment); never set for a donation. */
    targetPlan?: string;
  }) {
    return this.prisma.payment.create({
      data: {
        orgId: params.orgId,
        orderId: params.orderId,
        receiptId: params.receiptId,
        provider: PaymentProvider.CASHFREE,
        amountPaise: Math.round(params.amountRupees * 100),
        donorName: params.donorName,
        donorPhone: params.donorPhone,
        donorEmail: params.donorEmail,
        status: PaymentStatus.ORDER_CREATED,
        paymentSessionId: params.paymentSessionId,
        targetPlan: params.targetPlan,
      },
    });
  }

  /**
   * How long a stored payment_session_id is trusted for reuse without
   * re-creating the order. Deliberately short and conservative: Cashfree's
   * own checkout sessions are short-lived, and the exact TTL isn't
   * something this integration has verified — safer to err toward "just
   * create a fresh order" (harmless; see the orphaned-order comments in
   * both payment controllers) than to hand a likely-dead session to the
   * frontend. Covers the actual reuse case that matters: closing the
   * checkout tab and immediately clicking "Pay" again.
   */
  static readonly SESSION_REUSE_WINDOW_MS = 5 * 60 * 1000;

  /** Whether an existingPayment's stored session is still worth handing
   *  back as-is, rather than creating a fresh order. */
  isPaymentSessionReusable(payment: { paymentSessionId: string | null; createdAt: Date }): boolean {
    if (!payment.paymentSessionId) return false;
    return Date.now() - payment.createdAt.getTime() < PaymentsService.SESSION_REUSE_WINDOW_MS;
  }

  /**
   * Applies one verified Cashfree webhook event to its matching Payment
   * row. Caller (CashfreeWebhookService) already verified the signature
   * and idempotency; this does the state transition plus the amount
   * cross-check the handover doc requires (section 18) before trusting the
   * webhook at all.
   *
   * Returns null (and only logs) rather than throwing on an unmatched
   * order or amount mismatch — these aren't things retrying the webhook
   * delivery would fix, and Cashfree webhooks aren't the only path to
   * truth here (the sandbox test page's direct getOrder/getOrderPayments
   * calls work independently of this).
   */
  async applyCashfreeWebhook(params: {
    orderId: string;
    cfPaymentId?: string;
    orderAmountRupees: number;
    orderCurrency?: string;
    outcome: 'SUCCESS' | 'FAILED' | 'USER_DROPPED';
    failureReason?: string;
  }) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId: params.orderId } });
    if (!payment) {
      this.logger.warn(
        `Cashfree webhook for unknown orderId=${params.orderId} — no matching Payment row ` +
        `(likely an order created before Payment persistence existed, or an order id that isn't ours)`,
      );
      return null;
    }

    const webhookAmountPaise = Math.round(params.orderAmountRupees * 100);
    if (webhookAmountPaise !== payment.amountPaise) {
      this.logger.error(
        `Amount mismatch on orderId=${params.orderId}: webhook says ${webhookAmountPaise}p, ` +
        `our record says ${payment.amountPaise}p — refusing to update status`,
      );
      return null;
    }

    // Currency isn't selectable anywhere in this app yet (CashfreeService
    // always sends order_currency: 'INR', Payment.currency always defaults
    // to 'INR') so this can't fail today — but it's a one-line guard against
    // a future multi-currency bug silently marking a mismatched-currency
    // payment as paid, which the amount check alone wouldn't catch (100 of
    // one currency vs 100 of another looks identical to the amount check).
    if (params.orderCurrency && params.orderCurrency !== payment.currency) {
      this.logger.error(
        `Currency mismatch on orderId=${params.orderId}: webhook says ${params.orderCurrency}, ` +
        `our record says ${payment.currency} — refusing to update status`,
      );
      return null;
    }

    // Success is sticky. A duplicate or out-of-order webhook delivery must
    // never downgrade an already-successful payment back to failed
    // (handover doc section 38 — immutable financial record; corrections
    // go through refund/adjustment, never a silent overwrite).
    if (payment.status === PaymentStatus.PAYMENT_SUCCESS) {
      return payment;
    }

    const status = params.outcome === 'SUCCESS' ? PaymentStatus.PAYMENT_SUCCESS : PaymentStatus.PAYMENT_FAILED;

    // Payment update + (if applicable) Receipt update + its AuditLog all
    // commit atomically. Without this, a crash between "Payment ->
    // SUCCESS" and "Receipt -> PAID" leaves the donor's money confirmed
    // paid but their receipt stuck PENDING forever, with nothing to
    // reconcile it (the webhook-idempotency table would treat a Cashfree
    // retry as already-handled once Payment succeeded).
    //
    // The sticky-status check above reads outside this transaction, so two
    // genuinely concurrent webhook deliveries for the same order (verified
    // live — Cashfree sent this account two near-simultaneous versioned
    // webhooks for one payment, ~10ms apart) can both pass it before
    // either commits. updateMany's WHERE re-checks status != SUCCESS
    // *inside* the transaction, so only the winner actually writes; the
    // loser gets count 0 and no-ops instead of redundantly re-stamping
    // paidAt to a later timestamp or double-firing the receipt cascade.
    const { updatedPayment, updatedReceipt } = await this.prisma.$transaction(async (tx) => {
      const writeResult = await tx.payment.updateMany({
        where: { orderId: params.orderId, status: { not: PaymentStatus.PAYMENT_SUCCESS } },
        data: {
          status,
          cashfreePaymentId: params.cfPaymentId,
          failureReason: status === PaymentStatus.PAYMENT_FAILED ? (params.failureReason ?? params.outcome) : null,
          ...(status === PaymentStatus.PAYMENT_SUCCESS ? { paidAt: new Date() } : {}),
        },
      });

      const updatedPayment = await tx.payment.findUniqueOrThrow({ where: { orderId: params.orderId } });

      let updatedReceipt = null;
      // writeResult.count === 0 means a concurrent delivery already won —
      // this one must not touch the receipt/org or fire notifications either.
      if (writeResult.count > 0 && status === PaymentStatus.PAYMENT_SUCCESS) {
        if (updatedPayment.receiptId) {
          updatedReceipt = await this.receiptsService.markOnlinePaymentSuccessInTx(tx, updatedPayment.receiptId);
        }
        // A subscription order (see CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX)
        // has no receiptId — this is its equivalent of the receipt cascade
        // above: what actually makes a successful payment *mean* something.
        // The clock restarts from confirmed payment, not from the original
        // (unpaid) signup date — matches SUBSCRIPTION_PERIOD_DAYS's own
        // "30 days from signup" contract, just re-anchored to when they
        // actually paid rather than when they merely registered.
        if (updatedPayment.orderId.startsWith(CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX)) {
          // targetPlan is what the Change Plan action (subscription page)
          // actually paid for — apply it here so a paid upgrade/downgrade
          // takes effect, not just a renewal of whatever plan the org
          // happened to be on before. Null on Payment rows created before
          // this column existed (or if it's somehow not a real plan id
          // anymore) — those stay a plain renewal, same as this code
          // always did.
          const isValidPlan = Object.values(SubscriptionPlan).includes(updatedPayment.targetPlan as SubscriptionPlan);
          await tx.organization.update({
            where: { id: updatedPayment.orgId },
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionExpiry: new Date(Date.now() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000),
              ...(isValidPlan ? { subscriptionPlan: updatedPayment.targetPlan as SubscriptionPlan } : {}),
            },
          });
        }
      }

      return { updatedPayment, updatedReceipt };
    });

    // PDF generation only after the transaction has actually committed —
    // no point rendering a document for a status change that might still
    // roll back. WhatsApp sharing for this receipt is a manual click from
    // the UI (same as any other receipt), nothing to fire here.
    if (updatedReceipt) {
      this.receiptsService.fireReceiptPaidPdf(updatedReceipt);
    }

    return updatedPayment;
  }
}
