// Provider-facing shapes only — no business rules here (handover doc
// section 12: CashfreeService talks to Cashfree, application services own
// the business logic).

export interface CreateCashfreeOrderParams {
  /** Our own unique order id — never reused. */
  orderId: string;
  /** Rupees (decimal), NOT paise — Cashfree's order_amount field is decimal
   *  INR. Convert from the DB's integer-paise storage at the call site. */
  amount: number;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  /**
   * Optional — Cashfree's `order_splits`, i.e. "Split During Order
   * Creation" rather than the separate post-payment split call. Distinct
   * from (and, per Cashfree's docs, not gated by the same activation as)
   * the "Split After Payment" flow that returned "not eligible for split"
   * — being tested for the first time, not assumed to work.
   */
  orderSplits?: Array<
    | { vendorId: string; percentage: number }
    | { vendorId: string; amount: number }
  >;
}

// Cashfree's order response carries many more fields than we currently
// consume (payment methods config, order tags, etc.) — typed loosely on
// purpose rather than guessing at a full contract we haven't verified
// against the live API yet.
export interface CashfreeOrderResponse {
  cf_order_id?: string;
  order_id: string;
  order_status?: string;
  payment_session_id?: string;
  order_amount?: number;
  order_currency?: string;
  order_expiry_time?: string;
  [key: string]: unknown;
}

export interface CashfreeOrderPaymentsResponse {
  payments: Array<{
    cf_payment_id?: string;
    order_id?: string;
    payment_status?: string;
    payment_amount?: number;
    payment_currency?: string;
    payment_method?: unknown;
    [key: string]: unknown;
  }>;
}

// GET /easy-split/vendors/{vendor_id}. `status` is a KYC/onboarding-stage
// value (confirmed live against Cashfree's docs — e.g. "IN_BENE_CREATION",
// "IN_REVIEW"), not a simple boolean; "ACTIVE" is the terminal state a
// vendor must reach before it can receive a split (handover doc section 36).
export interface CashfreeVendorResponse {
  vendor_id: string;
  status?: string;
  name?: string;
  remarks?: string;
  [key: string]: unknown;
}

export interface CreateCashfreeSplitParams {
  orderId: string;
  splits: Array<
    | { vendorId: string; percentage: number }
    | { vendorId: string; amount: number }
  >;
}

export interface CashfreeSplitResponse {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

// POST /orders/sessions — verified live against Cashfree Sandbox for both
// channel: "qrcode" and channel: "link" (see
// Digital_Pavti_Cashfree_EasySplit_Developer_Handover.md for the raw
// responses this was typed from). Same OrderPayEntity shape Cashfree uses
// for the "collect" channel too, just a different data.payload contents.
export interface CashfreeUpiQrResponse {
  action?: string;
  cf_payment_id?: string;
  channel?: string;
  data?: {
    // Ready-to-use `data:image/png;base64,...` — no QR rendering needed on
    // our side.
    payload?: { qrcode?: string };
    [key: string]: unknown;
  };
  payment_amount?: number;
  [key: string]: unknown;
}

export interface CashfreeUpiIntentResponse {
  action?: string;
  cf_payment_id?: string;
  channel?: string;
  data?: {
    // Per-app deep links. In Sandbox these point at Cashfree's own
    // simulator (payments-test.cashfree.com/.../simulator/...), not real
    // upi:// URIs — that only happens in production, where a real UPI app
    // would be installed to intercept them.
    payload?: {
      default?: string;
      gpay?: string;
      phonepe?: string;
      paytm?: string;
      bhim?: string;
      web?: string;
      [app: string]: string | undefined;
    };
    [key: string]: unknown;
  };
  payment_amount?: number;
  [key: string]: unknown;
}

// POST /payments/cashfree/webhook body — Cashfree's PAYMENT_SUCCESS/FAILED/
// USER_DROPPED event shape. Only the fields CashfreeWebhookService actually
// reads are typed (matching this file's convention elsewhere); everything
// else stays reachable but unchecked via the index signatures, since
// Cashfree's full webhook schema isn't fully documented anywhere this
// codebase can cite. Replaces what used to be `let payload: any` parsed
// straight from JSON.parse with zero shape checking at all.
export interface CashfreeWebhookPayload {
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number | string;
      order_currency?: string;
      [key: string]: unknown;
    };
    payment?: {
      cf_payment_id?: string | number;
      payment_status?: string;
      payment_message?: string;
      [key: string]: unknown;
    };
    error_details?: {
      error_description?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// GET /easy-split/orders/{order_id} — settlement + per-vendor breakdown.
export interface CashfreeSplitDetailsResponse {
  settlement?: {
    cf_settlement_id?: number;
    cf_payment_id?: number;
    order_id?: string;
    order_amount?: number;
    settlement_amount?: number;
    transfer_utr?: string | null;
    transfer_time?: string | null;
    [key: string]: unknown;
  };
  vendors?: Array<{
    vendor_id: string;
    settlement_id?: number;
    settlement_amount?: number;
    settlement_eligibility_date?: string;
    [key: string]: unknown;
  }>;
  refunds?: unknown[];
  [key: string]: unknown;
}
