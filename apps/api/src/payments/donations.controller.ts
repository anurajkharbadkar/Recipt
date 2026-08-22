import { Controller, Logger, Param, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { UserRole, DEFAULT_DONATION_SPLIT_POLICY } from '@pavti/shared';
import { CashfreeService } from './cashfree/cashfree.service';
import { CASHFREE_DONATION_ORDER_ID_PREFIX } from './cashfree/cashfree.constants';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * The real donation payment flow (as opposed to CashfreeController's
 * sandbox test surface). Option 1 from the scope discussion: authenticated
 * collector workflow, not a public donor-facing page — a collector
 * creates a PENDING/ONLINE Receipt via the existing POST /receipts, then
 * calls this to get a Cashfree QR/UPI-intent to show the donor.
 *
 * Deliberately takes only receiptId. Everything else — amount, which
 * Mandal, which Cashfree vendor — comes from the server-side Receipt ->
 * Campaign -> Organization chain (see
 * PaymentsService.resolveDonationPaymentContext), never from request
 * input. A client claiming "pay ₹500 to Mandal X" is not trusted; only
 * "I want to pay receipt RCP-001" is, and the server looks up what that
 * actually means.
 */
@ApiTags('payments')
@Controller('payments/donations')
export class DonationsController {
  private readonly logger = new Logger(DonationsController.name);

  constructor(
    private readonly cashfreeService: CashfreeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post(':receiptId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN, UserRole.TREASURER, UserRole.COLLECTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create (or reuse) a Cashfree order for a PENDING/ONLINE receipt and return its QR + UPI intent' })
  async createDonationPayment(@Param('receiptId') receiptId: string, @CurrentUser('orgId') orgId: string) {
    const { receipt, organization, existingPayment } = await this.paymentsService.resolveDonationPaymentContext(receiptId, orgId);

    let orderId: string | undefined;
    let paymentSessionId: string | undefined;

    if (existingPayment) {
      // Idempotent reuse (handover doc section 15) — a collector re-tapping
      // "Collect Online Payment" must not create a second Cashfree order.
      // The order stays open across multiple payment attempts regardless
      // (verified earlier: a failed UPI attempt leaves order_status ACTIVE),
      // so re-fetching the same session is correct for that case. But a
      // *much later* re-tap (order created a while ago, never retried) is a
      // different failure mode that same earlier check never covered —
      // Cashfree's session itself can expire independent of attempt
      // outcome, and its checkout page flatly rejects a stale session_id
      // rather than refreshing it (found live 2026-08-22 on the
      // subscription-order twin of this code). isOrderSessionUsable checks
      // order_status is still ACTIVE before trusting the reuse.
      const order = await this.cashfreeService.getOrder(existingPayment.orderId);
      if (this.cashfreeService.isOrderSessionUsable(order)) {
        orderId = existingPayment.orderId;
        paymentSessionId = order.payment_session_id;
      }
    }

    if (!paymentSessionId) {
      const freshOrderId = `${CASHFREE_DONATION_ORDER_ID_PREFIX}_${Date.now()}_${randomUUID().slice(0, 8)}`;
      const policy = DEFAULT_DONATION_SPLIT_POLICY;
      const cfOrder = await this.cashfreeService.createOrder({
        orderId: freshOrderId,
        amount: receipt.amount,
        customerId: receipt.id,
        customerPhone: receipt.donorPhone!, // validated non-null in resolveDonationPaymentContext
        orderSplits: [
          policy.vendorShareType === 'PERCENTAGE'
            ? { vendorId: organization.cashfreeVendorId!, percentage: policy.vendorShare } // non-null: validated above
            : { vendorId: organization.cashfreeVendorId!, amount: policy.vendorShare },
        ],
      });
      orderId = freshOrderId;
      paymentSessionId = cfOrder.payment_session_id;

      const saved = await this.paymentsService.recordOrderCreated({
        orgId,
        orderId,
        amountRupees: receipt.amount,
        donorName: receipt.donorName,
        donorPhone: receipt.donorPhone!,
        receiptId: receipt.id,
      });

      if (saved.orderId !== orderId) {
        // Lost a race to a concurrent request for the same receipt — the
        // order we just created has no Payment row and is now a harmless
        // orphan on Cashfree's side; use the winner's order instead.
        this.logger.warn(`Race on receiptId=${receiptId}: using existing orderId=${saved.orderId} instead of ${orderId}`);
        orderId = saved.orderId;
        const order = await this.cashfreeService.getOrder(orderId);
        paymentSessionId = order.payment_session_id;
      }
    }

    if (!paymentSessionId || !orderId) {
      throw new ServiceUnavailableException('Cashfree did not return an active payment session for this order');
    }

    const [qr, intent] = await Promise.all([
      this.cashfreeService.generateUpiQr(paymentSessionId),
      this.cashfreeService.generateUpiIntent(paymentSessionId),
    ]);

    return {
      orderId,
      receiptId: receipt.id,
      amount: receipt.amount,
      qr: qr.data?.payload?.qrcode ?? null,
      intent: intent.data?.payload ?? null,
    };
  }
}
