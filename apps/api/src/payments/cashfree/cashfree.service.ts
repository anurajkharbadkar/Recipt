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
 * Parses incoming User-Agent string to dynamically set Cashfree's required
 * Order Pay headers (x-client-device / x-client-os / x-client-browser) rather
 * than hardcoding desktop/macOS (handover doc section 14 & consultant review).
 */
export function parseDeviceHeaders(userAgent?: string): Record<string, string> {
  const ua = userAgent?.toLowerCase() || '';
  if (ua.includes('android')) {
    return { 'x-client-device': 'mobile', 'x-client-os': 'android', 'x-client-browser': 'chrome' };
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return { 'x-client-device': 'mobile', 'x-client-os': 'ios', 'x-client-browser': 'safari' };
  }
  if (ua.includes('windows')) {
    return { 'x-client-device': 'desktop', 'x-client-os': 'windows', 'x-client-browser': 'chrome' };
  }
  if (ua.includes('macintosh') || ua.includes('mac os')) {
    return { 'x-client-device': 'desktop', 'x-client-os': 'macos', 'x-client-browser': 'chrome' };
  }
  // Default fallback for mobile-first donation/checkout flows
  return { 'x-client-device': 'mobile', 'x-client-os': 'android', 'x-client-browser': 'chrome' };
}

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
    let returnUrl = this.config.get<string>('CASHFREE_RETURN_URL') || 'https://recipt-web-wheat.vercel.app/payment/cashfree/return';
    const notifyUrl = this.config.get<string>('CASHFREE_NOTIFY_URL');

    // Cashfree Production mode strictly mandates https:// in return_url.
    // Upgrade http:// to https:// and replace localhost in production mode so Cashfree never rejects orders.
    const isProduction = this.config.get('CASHFREE_ENV') === 'production' || process.env.NODE_ENV === 'production';
    if (isProduction) {
      if (returnUrl.includes('localhost')) {
        returnUrl = 'https://recipt-web-wheat.vercel.app/payment/cashfree/return';
      } else if (returnUrl.startsWith('http://')) {
        returnUrl = returnUrl.replace(/^http:\/\//i, 'https://');
      }
    }

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
   * POST /orders/sessions, channel "qrcode" — a dynamic UPI QR tied to this
   * specific order/amount, for embedding directly in our own UI. Accepts
   * dynamic device headers so Cashfree knows whether the checkout is happening
   * on mobile vs desktop.
   */
  async generateUpiQr(paymentSessionId: string, customHeaders?: Record<string, string>): Promise<CashfreeUpiQrResponse> {
    try {
      const headers = customHeaders || parseDeviceHeaders();
      const { data } = await this.getClient().post<CashfreeUpiQrResponse>(
        '/orders/sessions',
        { payment_session_id: paymentSessionId, payment_method: { upi: { channel: 'qrcode' } } },
        { headers },
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
   * PhonePe/Paytm/BHIM/web) for this order. Takes dynamic device headers so
   * Cashfree returns proper mobile app intents (gpay://, phonepe://) on mobile
   * or web simulator links on desktop.
   */
  async generateUpiIntent(paymentSessionId: string, customHeaders?: Record<string, string>): Promise<CashfreeUpiIntentResponse> {
    try {
      const headers = customHeaders || parseDeviceHeaders();
      const { data } = await this.getClient().post<CashfreeUpiIntentResponse>(
        '/orders/sessions',
        { payment_session_id: paymentSessionId, payment_method: { upi: { channel: 'link' } } },
        { headers },
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
