import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { PaymentProvider, Prisma } from '@prisma/client';
import { CashfreeWebhookPayload } from './cashfree.types';

// Confirmed against Cashfree's live webhook docs (not assumed):
// https://www.cashfree.com/docs/payments/online/webhooks/overview
const WEBHOOK_TYPE_TO_OUTCOME: Record<string, 'SUCCESS' | 'FAILED' | 'USER_DROPPED'> = {
  PAYMENT_SUCCESS_WEBHOOK: 'SUCCESS',
  PAYMENT_FAILED_WEBHOOK: 'FAILED',
  PAYMENT_USER_DROPPED_WEBHOOK: 'USER_DROPPED',
};

// Cashfree's own replay-protection guidance:
// https://www.cashfree.com/docs/payments/subscription/webhook-signature
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class CashfreeWebhookService {
  private readonly logger = new Logger(CashfreeWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * expectedSignature = base64(HMAC-SHA256(timestamp + rawBody, CLIENT_SECRET))
   * compared against x-webhook-signature. MUST run over the raw bytes
   * Cashfree sent — re-serializing the parsed JSON (different key order/
   * whitespace) produces a different signature even with identical values.
   */
  private verifySignature(rawBody: Buffer, signature: string | undefined, timestamp: string | undefined): boolean {
    const secret = this.config.get<string>('CASHFREE_CLIENT_SECRET');
    if (!secret || !signature || !timestamp) return false;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(timestamp + rawBody.toString('utf8'))
      .digest('base64');

    const expectedBuf = Buffer.from(expected);
    const gotBuf = Buffer.from(signature);
    // Length check before timingSafeEqual — it throws on mismatched
    // lengths rather than returning false, and the length check itself
    // isn't a timing side-channel worth caring about here (the signature
    // length is fixed for a given algorithm, not secret-dependent).
    if (expectedBuf.length !== gotBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, gotBuf);
  }

  async processWebhook(
    rawBody: Buffer,
    signature: string | undefined,
    timestamp: string | undefined,
    idempotencyKey: string | undefined,
    attempt: string | undefined,
  ): Promise<void> {
    // Core security rule (handover doc section 7/31): never trust an
    // unsigned/unverified request.
    if (!this.verifySignature(rawBody, signature, timestamp)) {
      this.logger.error('[SECURITY_ALERT] Rejected Cashfree webhook — signature verification failed');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Replay protection (Cashfree's own guidance: reject anything outside
    // a 5-minute window). Checked only after signature verification
    // succeeds — an attacker who can't forge a valid signature already
    // can't get here, and checking staleness first would leak "your
    // timestamp was wrong" to a request that was never going to be valid
    // anyway.
    const webhookTime = Number(timestamp);
    if (!Number.isFinite(webhookTime) || Math.abs(Date.now() - webhookTime) > REPLAY_WINDOW_MS) {
      this.logger.error(`[SECURITY_ALERT] Rejected Cashfree webhook — timestamp outside ${REPLAY_WINDOW_MS / 1000}s replay window`);
      throw new UnauthorizedException('Webhook timestamp expired');
    }

    if (attempt && attempt !== '1') {
      this.logger.log(`Webhook delivery attempt #${attempt}`);
    }

    // JSON.parse itself returns `any` — the cast through `unknown` is what
    // actually enforces CashfreeWebhookPayload's shape at every access
    // below, instead of trusting whatever JSON.parse handed back.
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as unknown as CashfreeWebhookPayload;
    } catch {
      throw new BadRequestException('Malformed webhook JSON');
    }

    const type: string | undefined = payload?.type;
    const order = payload?.data?.order;
    const payment = payload?.data?.payment;
    const orderId: string | undefined = order?.order_id;

    if (!orderId) {
      this.logger.warn(`Webhook missing data.order.order_id — type=${type}`);
      return;
    }

    // Idempotency (handover doc section 20). Cashfree sends a dedicated
    // x-idempotency-key per delivery — use it, it's the real identifier.
    // Fall back to a derived key only if some webhook type ever omits it;
    // a retry of the same event repeats both cf_payment_id and type, so
    // that fallback still collides correctly for the common case.
    const eventId = idempotencyKey || `${payment?.cf_payment_id ?? orderId}:${type ?? 'UNKNOWN'}`;
    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');

    let eventRecordId: string;
    try {
      const created = await this.prisma.paymentWebhookEvent.create({
        data: {
          provider: PaymentProvider.CASHFREE,
          eventId,
          eventType: type ?? 'UNKNOWN',
          payloadHash,
          status: 'RECEIVED',
        },
      });
      eventRecordId = created.id;
    } catch (err: unknown) {
      // P2002 = unique constraint violation — narrowed via Prisma's own
      // error class rather than a loose `err?.code` check on an untyped
      // catch variable.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // A row with this eventId already exists — but only skip if that
        // earlier attempt actually finished. If it's still RECEIVED/FAILED,
        // the process likely crashed between recording the event and
        // finishing applyCashfreeWebhook (e.g. right after marking Payment
        // SUCCESS but before the Receipt got updated) — a naive "row
        // exists = duplicate, ignore" here would silently drop Cashfree's
        // retry forever and leave the Receipt stuck PENDING despite the
        // donor having paid. applyCashfreeWebhook's own sticky-success
        // guard already makes reprocessing safe, so retry rather than skip.
        const existing = await this.prisma.paymentWebhookEvent.findUnique({ where: { provider_eventId: { provider: PaymentProvider.CASHFREE, eventId } } });
        if (existing?.status === 'PROCESSED' || existing?.status === 'IGNORED') {
          this.logger.log(`Duplicate webhook delivery ignored (already ${existing.status}): eventId=${eventId}`);
          return;
        }
        this.logger.warn(`Retrying previously-incomplete webhook: eventId=${eventId}, prior status=${existing?.status}`);
        eventRecordId = existing!.id;
      } else {
        throw err;
      }
    }

    const outcome = type ? WEBHOOK_TYPE_TO_OUTCOME[type] : undefined;
    if (!outcome) {
      this.logger.log(`Ignoring webhook type=${type} — not a payment success/failed/dropped event`);
      await this.prisma.paymentWebhookEvent.update({
        where: { id: eventRecordId },
        data: { status: 'IGNORED', processedAt: new Date() },
      });
      return;
    }

    const result = await this.paymentsService.applyCashfreeWebhook({
      orderId,
      // Confirmed live (not assumed): Cashfree sends cf_payment_id as a
      // JSON string on the current webhook version but as a raw JSON
      // number on at least one older version this account also has
      // subscribed — Payment.cashfreePaymentId is a Prisma String column,
      // and an unquoted number crashes strict validation. String(...)
      // handles both; also guards the (harmless) case where it's absent.
      cfPaymentId: payment?.cf_payment_id !== undefined && payment?.cf_payment_id !== null ? String(payment.cf_payment_id) : undefined,
      orderAmountRupees: Number(order?.order_amount ?? 0),
      orderCurrency: order?.order_currency,
      outcome,
      failureReason: payload?.data?.error_details?.error_description ?? payment?.payment_message,
    });

    if (result) {
      this.logger.log(
        `Cashfree webhook verified: orderId=${orderId} type=${type} outcome=${outcome} ` +
        `cf_payment_id=${payment?.cf_payment_id} -> Payment.status=${result.status}`,
      );
    } else {
      this.logger.warn(`Cashfree webhook verified but not applied: orderId=${orderId} type=${type} (see prior warning/error for why)`);
    }

    await this.prisma.paymentWebhookEvent.update({
      where: { id: eventRecordId },
      data: {
        status: result ? 'PROCESSED' : 'FAILED',
        paymentId: result?.id,
        processedAt: new Date(),
      },
    });
  }
}
