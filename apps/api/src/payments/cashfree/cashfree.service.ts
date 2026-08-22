import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import { CASHFREE_DEFAULT_API_VERSION } from './cashfree.constants';
import {
  CashfreeOrderPaymentsResponse,
  CashfreeOrderResponse,
  CashfreeSplitDetailsResponse,
  CashfreeSplitResponse,
  CashfreeUpiIntentResponse,
  CashfreeUpiQrResponse,
  CashfreeVendorResponse,
  CreateCashfreeOrderParams,
  CreateCashfreeSplitParams,
} from './cashfree.types';

/**
 * Talks to the Cashfree Payment Gateway API only. No business rules live
 * here — which Mandal can accept payments, what the platform fee is,
 * whether/when a receipt gets generated, all belong in PaymentsService
 * (handover doc section 12). Not built yet: addVendor — vendor onboarding
 * is a separate, bigger step (KYC/bank details) than testing against an
 * already-existing sandbox vendor.
 */
@Injectable()
export class CashfreeService {
  private readonly logger = new Logger(CashfreeService.name);
  private client: AxiosInstance | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Extracts the useful part of a failed Cashfree call for logging — the
   * response body Cashfree actually sent (error.response.data), where the
   * real "why" lives (bad field, auth failure, ...), falling back to the
   * bare Error message. Every catch block below used to be `catch (error:
   * any)` reaching for `error.response?.data` on faith; this narrows from
   * `unknown` (the correct catch-clause type) via axios's own isAxiosError
   * guard instead.
   */
  private describeError(error: unknown): unknown {
    if (axios.isAxiosError(error)) return error.response?.data ?? error.message;
    return error instanceof Error ? error.message : error;
  }

  /**
   * False when the CASHFREE_* env vars aren't set. Checked instead of using
   * `ConfigService.getOrThrow` in the constructor, which would crash the
   * whole API at boot (every module's providers are instantiated at
   * startup) in any environment — including today's — that doesn't have
   * Cashfree configured yet. Mirrors StorageService.isR2Configured().
   */
  isConfigured(): boolean {
    return !!(
      this.config.get('CASHFREE_CLIENT_ID') &&
      this.config.get('CASHFREE_CLIENT_SECRET') &&
      this.config.get('CASHFREE_BASE_URL') &&
      this.config.get('CASHFREE_RETURN_URL') &&
      this.config.get('CASHFREE_NOTIFY_URL')
    );
  }

  private getClient(): AxiosInstance {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Cashfree is not configured — set CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET, ' +
        'CASHFREE_BASE_URL, CASHFREE_RETURN_URL and CASHFREE_NOTIFY_URL in apps/api/.env',
      );
    }
    if (!this.client) {
      this.client = axios.create({
        baseURL: this.config.get<string>('CASHFREE_BASE_URL'),
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-version': this.config.get('CASHFREE_API_VERSION', CASHFREE_DEFAULT_API_VERSION),
          'x-client-id': this.config.get('CASHFREE_CLIENT_ID'),
          'x-client-secret': this.config.get('CASHFREE_CLIENT_SECRET'),
        },
      });
    }
    return this.client;
  }

  /**
   * Step 1 of the integration (handover doc section 42): create a Cashfree
   * order and hand back its payment_session_id for the frontend checkout.
   * Deliberately does nothing else yet — no DB write, no receipt, no split.
   * The x-client-secret never leaves this method; only payment_session_id
   * is meant to reach the browser.
   */
  async createOrder(params: CreateCashfreeOrderParams): Promise<CashfreeOrderResponse> {
    const returnUrl = this.config.get<string>('CASHFREE_RETURN_URL');
    const notifyUrl = this.config.get<string>('CASHFREE_NOTIFY_URL');

    try {
      const { data } = await this.getClient().post<CashfreeOrderResponse>(
        '/orders',
        {
          order_id: params.orderId,
          order_amount: params.amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: params.customerId,
            customer_phone: params.customerPhone,
            customer_email: params.customerEmail,
          },
          order_meta: {
            return_url: `${returnUrl}?order_id=${params.orderId}`,
            notify_url: notifyUrl,
          },
          // Omitted entirely (not even an empty array) when not requested —
          // existing callers that don't pass orderSplits get byte-for-byte
          // the same request body as before this was added.
          ...(params.orderSplits && {
            order_splits: params.orderSplits.map((s) =>
              'percentage' in s
                ? { vendor_id: s.vendorId, percentage: s.percentage }
                : { vendor_id: s.vendorId, amount: s.amount },
            ),
          }),
        },
        {
          // Cashfree-side idempotency for this specific POST — a client
          // retry after a network timeout should not create a second order
          // for the same intent. Our own DB-level idempotency (Payment row
          // keyed by orderId) is a separate later step (handover doc
          // section 15) — this alone isn't sufficient once that lands.
          headers: { 'x-idempotency-key': randomUUID() },
        },
      );
      return data;
    } catch (error: unknown) {
      // Cashfree's error body (error.response.data) is where the actually
      // useful "why" lives (bad request field, auth failure, etc.) — log it
      // so a failed sandbox test is debuggable, but never log the secret
      // itself (handover doc section 31).
      this.logger.error(
        `Cashfree createOrder failed for orderId=${params.orderId}: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }

  /**
   * Order-level status — GET /orders/{order_id}. `order_status` reads
   * `PAID` once the order has a successful payment against it. Cheaper
   * first check than walking the full payments list in getOrderPayments().
   */
  async getOrder(orderId: string): Promise<CashfreeOrderResponse> {
    try {
      const { data } = await this.getClient().get<CashfreeOrderResponse>(
        `/orders/${encodeURIComponent(orderId)}`,
      );
      return data;
    } catch (error: unknown) {
      this.logger.error(
        `Cashfree getOrder failed for orderId=${orderId}: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }

  /**
   * Whether a previously-created order's payment_session_id is still safe
   * to hand to the frontend checkout, rather than just non-empty. Found
   * live (2026-08-22): re-fetching a Payment row's orderId weeks/hours
   * after it was first created (an admin who abandoned checkout once and
   * never retried, or a paused-then-resumed retry) returns a stale
   * payment_session_id — Cashfree's checkout page rejects it outright
   * ("payment_session_id is not present or is invalid") rather than
   * silently refreshing it. That's a distinct failure mode from the
   * already-verified "failed payment attempt, order still ACTIVE" case
   * getOrder()'s callers rely on (see DonationsController) — this only
   * guards the time-based expiry that case never exercised. `order_status`
   * reads 'ACTIVE' for an order whose session can still be checked out
   * against; anything else (EXPIRED, TERMINATED, PAID) means the caller
   * must create a fresh order instead of reusing this one.
   */
  isOrderSessionUsable(order: CashfreeOrderResponse): boolean {
    return order.order_status === 'ACTIVE' && !!order.payment_session_id;
  }

  /**
   * Step 7 (handover doc section 18/section 30's
   * `GET /payments/cashfree/:orderId`): ask Cashfree directly whether an
   * order was actually paid, instead of trusting the frontend's own report
   * of success (handover doc section 7 — "the backend is the source of
   * truth"). Callers must not write `status = PAID` off of anything except
   * this method's result (or a verified webhook, once that exists) — see
   * the Core Security Rule in the handover doc.
   *
   * Cashfree can return more than one payment attempt per order (e.g. a
   * failed card try followed by a successful UPI retry) — this returns all
   * of them and leaves it to the caller to decide what "paid" means
   * (currently: at least one entry with payment_status === 'SUCCESS').
   */
  async getOrderPayments(orderId: string): Promise<CashfreeOrderPaymentsResponse['payments']> {
    try {
      const { data } = await this.getClient().get<CashfreeOrderPaymentsResponse['payments']>(
        `/orders/${encodeURIComponent(orderId)}/payments`,
      );
      // Cashfree returns a bare array here, not wrapped in { payments: [...] }
      // — CashfreeOrderPaymentsResponse only exists to name the shape.
      return data;
    } catch (error: unknown) {
      this.logger.error(
        `Cashfree getOrderPayments failed for orderId=${orderId}: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }

  /**
   * POST /orders/sessions requires x-client-device/x-client-os/
   * x-client-browser (confirmed live — Cashfree rejects the call without
   * them). getClient()'s default headers don't include these because
   * every other method here is a server-to-server order-management call;
   * this one is the Order Pay API, meant to describe the actual device
   * completing checkout. We don't know the donor's real device from a
   * backend call — 'desktop'/generic values are honest placeholders, not a
   * spoofed real device, and don't affect whether the QR/intent works.
   */
  private orderPaySessionHeaders() {
    return { 'x-client-device': 'desktop', 'x-client-os': 'macos', 'x-client-browser': 'chrome' };
  }

  /**
   * POST /orders/sessions, channel "qrcode" — a dynamic UPI QR tied to this
   * specific order/amount, for embedding directly in our own UI (no
   * redirect to Cashfree's hosted checkout). `paymentSessionId` comes from
   * createOrder()'s response — this is a second, separate call against the
   * same session, not part of order creation itself.
   */
  async generateUpiQr(paymentSessionId: string): Promise<CashfreeUpiQrResponse> {
    try {
      const { data } = await this.getClient().post<CashfreeUpiQrResponse>(
        '/orders/sessions',
        { payment_session_id: paymentSessionId, payment_method: { upi: { channel: 'qrcode' } } },
        { headers: this.orderPaySessionHeaders() },
      );
      return data;
    } catch (error: unknown) {
      this.logger.error(
        `Cashfree generateUpiQr failed: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }

  /**
   * POST /orders/sessions, channel "link" — per-UPI-app deep links (GPay/
   * PhonePe/Paytm/BHIM/web) for this order, for a native "pay with your
   * app" button instead of a QR or Cashfree's hosted checkout. In Sandbox
   * these resolve to Cashfree's own payment simulator, not real upi://
   * URIs — verified live, not assumed (see handover doc).
   */
  async generateUpiIntent(paymentSessionId: string): Promise<CashfreeUpiIntentResponse> {
    try {
      const { data } = await this.getClient().post<CashfreeUpiIntentResponse>(
        '/orders/sessions',
        { payment_session_id: paymentSessionId, payment_method: { upi: { channel: 'link' } } },
        { headers: this.orderPaySessionHeaders() },
      );
      return data;
    } catch (error: unknown) {
      this.logger.error(
        `Cashfree generateUpiIntent failed: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }

  /**
   * GET /easy-split/vendors/{vendor_id}. Confirms a vendor exists under
   * *these* credentials and its current onboarding status before ever
   * attempting a split against it — a vendor id from an old doc/session
   * may not exist on this Cashfree account at all, or may have drifted out
   * of ACTIVE since it was last checked (handover doc section 36: only
   * split to a vendor confirmed ACTIVE, never assume).
   */
  async getVendor(vendorId: string): Promise<CashfreeVendorResponse> {
    try {
      const { data } = await this.getClient().get<CashfreeVendorResponse>(
        `/easy-split/vendors/${encodeURIComponent(vendorId)}`,
      );
      return data;
    } catch (error: unknown) {
      this.logger.error(
        `Cashfree getVendor failed for vendorId=${vendorId}: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }

  /**
   * POST /easy-split/orders/{order_id}/split — Split After Payment.
   * Cashfree's own docs say to wait ~2 minutes after a payment's success
   * confirmation before calling this; callers (not this method) are
   * responsible for that timing, since CashfreeService has no business
   * logic about when a payment is "confirmed enough" to split (handover
   * doc section 12). This method only ever does what it's told — the
   * "don't split before payment is verified" rule (section 24) is enforced
   * by what calls this, not by anything in here.
   */
  async createSplit(params: CreateCashfreeSplitParams): Promise<CashfreeSplitResponse> {
    const split = params.splits.map((s) =>
      'percentage' in s
        ? { vendor_id: s.vendorId, percentage: s.percentage }
        : { vendor_id: s.vendorId, amount: s.amount },
    );

    try {
      const { data } = await this.getClient().post<CashfreeSplitResponse>(
        `/easy-split/orders/${encodeURIComponent(params.orderId)}/split`,
        { split },
        { headers: { 'x-idempotency-key': randomUUID() } },
      );
      return data;
    } catch (error: unknown) {
      this.logger.error(
        `Cashfree createSplit failed for orderId=${params.orderId}: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }

  /** GET /easy-split/orders/{order_id} — settlement + per-vendor breakdown. */
  async getSplitDetails(orderId: string): Promise<CashfreeSplitDetailsResponse> {
    try {
      const { data } = await this.getClient().get<CashfreeSplitDetailsResponse>(
        `/easy-split/orders/${encodeURIComponent(orderId)}`,
      );
      return data;
    } catch (error: unknown) {
      this.logger.error(
        `Cashfree getSplitDetails failed for orderId=${orderId}: ${JSON.stringify(this.describeError(error))}`,
      );
      throw error;
    }
  }
}
