import { Controller, Logger, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { UserRole } from '@pavti/shared';
import { CashfreeService } from './cashfree/cashfree.service';
import { CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX } from './cashfree/cashfree.constants';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SkipSubscriptionGate } from '../auth/decorators/skip-subscription-gate.decorator';

/**
 * A Mandal paying its own E-PavtiBook subscription fee — a plain, non-split
 * Cashfree order (the org is the actual merchant here, unlike
 * DonationsController's EasySplit-based donor payments, which route
 * through a third party's own vendor account and needed the split/RBI
 * approval this app's Cashfree account doesn't have). Deliberately no
 * request body: the org (from the JWT) and its plan (already on the
 * Organization row) are the only inputs — a client can't claim any amount
 * other than what their own plan actually costs.
 */
@ApiTags('payments')
@Controller('payments/subscription')
export class SubscriptionPaymentController {
  private readonly logger = new Logger(SubscriptionPaymentController.name);

  constructor(
    private readonly cashfreeService: CashfreeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORG_ADMIN)
  @SkipSubscriptionGate()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create (or reuse) a Cashfree order for this org's own subscription fee" })
  async createSubscriptionOrder(@CurrentUser() user: AuthenticatedUser) {
    const { organization, plan, existingPayment } = await this.paymentsService.resolveSubscriptionPaymentContext(user.orgId);

    let orderId: string | undefined;
    let paymentSessionId: string | undefined;

    // Idempotent reuse — an admin re-clicking "Pay Now" (e.g. after closing
    // the checkout without finishing) must not create a second Cashfree
    // order/charge. Reuses the *stored* session from when the order was
    // created, never one re-derived via GET /orders/{id} — found live
    // (2026-08-23): that endpoint hands back a *different*
    // payment_session_id string on every single call, even for a still-
    // ACTIVE order created a second earlier, which is exactly what was
    // producing "payment_session_id is not present or is invalid" on
    // Cashfree's own checkout page. See Payment.paymentSessionId's schema
    // comment and PaymentsService.isPaymentSessionReusable's time-window
    // reasoning for why this is the trustworthy source instead.
    if (existingPayment && this.paymentsService.isPaymentSessionReusable(existingPayment)) {
      orderId = existingPayment.orderId;
      paymentSessionId = existingPayment.paymentSessionId!;
    }

    if (!paymentSessionId) {
      const freshOrderId = `${CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX}_${Date.now()}_${randomUUID().slice(0, 8)}`;
      const cfOrder = await this.cashfreeService.createOrder({
        orderId: freshOrderId,
        amount: plan.priceInr,
        customerId: organization.id,
        customerPhone: organization.phone,
        customerEmail: organization.email ?? undefined,
        // No orderSplits — plain order, the org itself is the payee.
      });
      orderId = freshOrderId;
      paymentSessionId = cfOrder.payment_session_id;

      const saved = await this.paymentsService.recordOrderCreated({
        orgId: organization.id,
        orderId,
        amountRupees: plan.priceInr,
        donorName: organization.name,
        donorPhone: organization.phone,
        donorEmail: organization.email ?? undefined,
        paymentSessionId,
      });

      if (saved.orderId !== orderId) {
        // Lost a race to a concurrent request (e.g. two admin tabs) — reuse
        // the winner's own stored session (not a fresh GET) instead of
        // leaving an orphaned duplicate.
        this.logger.warn(`Race on orgId=${organization.id}: using existing orderId=${saved.orderId} instead of ${orderId}`);
        orderId = saved.orderId;
        paymentSessionId = saved.paymentSessionId ?? undefined;
      }
    }

    if (!paymentSessionId || !orderId) {
      throw new ServiceUnavailableException('Cashfree did not return an active payment session for this order');
    }

    return { orderId, amount: plan.priceInr, planName: plan.name, paymentSessionId };
  }
}
