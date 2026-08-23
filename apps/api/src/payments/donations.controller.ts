import { Controller, Logger, Param, Post, ServiceUnavailableException, UseGuards, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { UserRole, DEFAULT_DONATION_SPLIT_POLICY } from '@pavti/shared';
import { CashfreeService, parseDeviceHeaders } from './cashfree/cashfree.service';
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
  async createDonationPayment(
    @Param('receiptId') receiptId: string,
    @CurrentUser('orgId') orgId: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const { receipt, organization, existingPayment } = await this.paymentsService.resolveDonationPaymentContext(receiptId, orgId);

    let orderId: string | undefined;
    let paymentSessionId: string | undefined;

    // Idempotent reuse (handover doc section 15) — a collector re-tapping
    // "Collect Online Payment" must not create a second Cashfree order.
    // Reuses the *stored* session from when the order was created, never
    // one re-derived via GET /orders/{id} — found live (2026-08-23): that
    // endpoint hands back a *different* payment_session_id string on every
    // single call, even for a still-ACTIVE order created a second earlier,
    // which is exactly what was producing "payment_session_id is not
    // present or is invalid" on Cashfree's own checkout page (and would
    // have broken the QR/UPI-intent generation below the same way, since
    // both take this same session id). See Payment.paymentSessionId's
    // schema comment and PaymentsService.isPaymentSessionReusable's time-
    // window reasoning for why this is the trustworthy source instead.
    if (existingPayment && this.paymentsService.isPaymentSessionReusable(existingPayment)) {
      orderId = existingPayment.orderId;
      paymentSessionId = existingPayment.paymentSessionId!;
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
        paymentSessionId,
      });

      if (saved.orderId !== orderId) {
        // Lost a race to a concurrent request for the same receipt — the
        // order we just created has no Payment row and is now a harmless
        // orphan on Cashfree's side; reuse the winner's own stored session
        // (not a fresh GET) instead.
        this.logger.warn(`Race on receiptId=${receiptId}: using existing orderId=${saved.orderId} instead of ${orderId}`);
        orderId = saved.orderId;
        paymentSessionId = saved.paymentSessionId ?? undefined;
      }
    }

    if (!paymentSessionId || !orderId) {
      throw new ServiceUnavailableException('Cashfree did not return an active payment session for this order');
    }

    const deviceHeaders = parseDeviceHeaders(userAgent);
    const [qr, intent] = await Promise.all([
      this.cashfreeService.generateUpiQr(paymentSessionId, deviceHeaders),
      this.cashfreeService.generateUpiIntent(paymentSessionId, deviceHeaders),
    ]);

    return {
      orderId,
      receiptId: receipt.id,
      amount: receipt.amount,
      paymentSessionId,
      qr: qr.data?.payload?.qrcode ?? null,
      intent: intent.data?.payload ?? null,
    };
  }
}
