import { BadRequestException, Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CashfreeService } from './cashfree.service';
import { CreateCashfreeOrderDto } from './dto/create-order.dto';
import { CreateCashfreeSplitDto, SplitEntryDto } from './dto/create-split.dto';
import { UpiSessionDto } from './dto/upi-session.dto';
import { CASHFREE_ORDER_ID_PREFIX } from './cashfree.constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards/auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@pavti/shared';
import { PaymentsService } from '../payments.service';

// Shared between createOrder (order_splits) and createSplit (post-payment
// split) — both take the same {vendorId, percentage?, amount?} shape and
// need the same "exactly one of the two" rule enforced.
function resolveSplitEntries(entries: SplitEntryDto[]) {
  return entries.map((s) => {
    const hasPercentage = s.percentage !== undefined;
    const hasAmount = s.amount !== undefined;
    if (hasPercentage === hasAmount) {
      throw new BadRequestException(`Split entry for vendorId=${s.vendorId} must set exactly one of percentage or amount`);
    }
    return hasPercentage
      ? { vendorId: s.vendorId, percentage: s.percentage! }
      : { vendorId: s.vendorId, amount: s.amount! };
  });
}

/**
 * Sandbox milestone-1 test surface only (handover doc section 42) — lets a
 * logged-in staff member create a Cashfree order manually to prove the
 * NestJS <-> Cashfree connection, before the real donor-facing flow exists.
 * Gated behind JwtAuthGuard + ORG_ADMIN/SUPER_ADMIN rather than left public
 * or open to any logged-in role: it calls a live payment gateway with real
 * credentials (including orders/:orderId/split, which actually moves money
 * between platform and vendor), so it shouldn't be reachable by anyone off
 * the internet, nor by a COLLECTOR/TREASURER/VIEWER account — matches the
 * Settings page, which only ever shows this link to ORG_ADMIN (2026-08 roles
 * audit). The eventual public donation endpoint (`POST /payments/donation`,
 * doc section 30) is a different, deliberately public route with its own
 * org/campaign/amount validation — don't just remove this guard to make
 * that one.
 */
@ApiTags('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
@ApiBearerAuth()
@Controller('payments/cashfree')
export class CashfreeController {
  private readonly logger = new Logger(CashfreeController.name);

  constructor(
    private readonly cashfreeService: CashfreeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('orders')
  @ApiOperation({ summary: '[Sandbox test only] Create a Cashfree order and return its payment_session_id' })
  async createOrder(@Body() body: CreateCashfreeOrderDto, @CurrentUser('orgId') orgId: string) {
    const orderId = `${CASHFREE_ORDER_ID_PREFIX}_TEST_${Date.now()}_${randomUUID().slice(0, 8)}`;

    const order = await this.cashfreeService.createOrder({
      orderId,
      amount: body.amount,
      customerId: body.customerId,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      orderSplits: body.splits ? resolveSplitEntries(body.splits) : undefined,
    });

    // Persist locally so the webhook has something to update. If this
    // write fails, the Cashfree order still exists and still works for
    // checkout — we log loudly rather than fail the whole request, since
    // the doc's own reconciliation step (not built yet) is the intended
    // safety net for exactly this kind of gap, not a hard failure here.
    // donorName is synthetic (customerId) — this test endpoint has no real
    // donor identity to record yet.
    try {
      await this.paymentsService.recordOrderCreated({
        orgId,
        orderId,
        amountRupees: body.amount,
        donorName: body.customerId,
        donorPhone: body.customerPhone,
        donorEmail: body.customerEmail,
      });
    } catch (err: any) {
      this.logger.error(`Failed to persist Payment row for orderId=${orderId} (Cashfree order still created): ${err.message}`);
    }

    return order;
  }

  /**
   * [Sandbox test only] Order-level status — mirrors Cashfree's own
   * `GET /orders/{order_id}`. `order_status` reads `PAID` once at least one
   * attempt on the order has succeeded. Still just a read — nothing here
   * marks a receipt PAID (handover doc section 7); that belongs to
   * PaymentsService once it exists.
   */
  @Get('orders/:orderId')
  @ApiOperation({ summary: '[Sandbox test only] Fetch an order\'s status from Cashfree' })
  async getOrder(@Param('orderId') orderId: string) {
    return this.cashfreeService.getOrder(orderId);
  }

  /**
   * [Sandbox test only] Step 7 — the individual payment attempts on an
   * order (there can be more than one, e.g. a failed card try followed by
   * a successful UPI retry), mirroring Cashfree's
   * `GET /orders/{order_id}/payments`.
   */
  @Get('orders/:orderId/payments')
  @ApiOperation({ summary: '[Sandbox test only] Fetch an order\'s payment attempts from Cashfree' })
  async getOrderPayments(@Param('orderId') orderId: string) {
    return this.cashfreeService.getOrderPayments(orderId);
  }

  /**
   * [Sandbox test only] Dynamic UPI QR for an existing order/session —
   * embeddable directly (data:image/png;base64,...), no Cashfree hosted
   * checkout redirect needed.
   */
  @Post('upi/qr')
  @ApiOperation({ summary: '[Sandbox test only] Generate a dynamic UPI QR for an order session' })
  async generateUpiQr(@Body() body: UpiSessionDto) {
    return this.cashfreeService.generateUpiQr(body.paymentSessionId);
  }

  /**
   * [Sandbox test only] Per-app UPI intent deep links (GPay/PhonePe/Paytm/
   * BHIM/web) for an existing order/session.
   */
  @Post('upi/intent')
  @ApiOperation({ summary: '[Sandbox test only] Generate UPI intent links for an order session' })
  async generateUpiIntent(@Body() body: UpiSessionDto) {
    return this.cashfreeService.generateUpiIntent(body.paymentSessionId);
  }

  /**
   * [Sandbox test only] Step 5a — confirm a vendor exists under these
   * credentials and check its current onboarding status before ever
   * attempting a split. Never assume a vendor id from a doc/old session is
   * still valid (handover doc section 36).
   */
  @Get('vendors/:vendorId')
  @ApiOperation({ summary: '[Sandbox test only] Fetch an Easy Split vendor\'s status from Cashfree' })
  async getVendor(@Param('vendorId') vendorId: string) {
    return this.cashfreeService.getVendor(vendorId);
  }

  /**
   * [Sandbox test only] Step 5b/5c — manually trigger an Easy Split on an
   * order, isolated from the webhook. Deliberately NOT auto-wired to
   * PAYMENT_SUCCESS yet — this is for running one split in isolation and
   * checking the real vendor/platform breakdown before making it automatic
   * (same "don't combine tests" discipline as every step before this one).
   * Caller is responsible for only calling this on an order confirmed PAID
   * (handover doc section 24) — this endpoint doesn't check that itself.
   */
  @Post('orders/:orderId/split')
  @ApiOperation({ summary: '[Sandbox test only] Create an Easy Split on an order' })
  async createSplit(@Param('orderId') orderId: string, @Body() body: CreateCashfreeSplitDto) {
    return this.cashfreeService.createSplit({ orderId, splits: resolveSplitEntries(body.splits) });
  }

  /** [Sandbox test only] Settlement + per-vendor breakdown for a split order. */
  @Get('orders/:orderId/split')
  @ApiOperation({ summary: '[Sandbox test only] Fetch split/settlement details for an order' })
  async getSplitDetails(@Param('orderId') orderId: string) {
    return this.cashfreeService.getSplitDetails(orderId);
  }
}
