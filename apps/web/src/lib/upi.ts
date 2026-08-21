/**
 * Builds a standard UPI deep-link/intent URI (`upi://pay?...`) — scanning
 * or tapping this hands off straight to the donor's own UPI app (GPay,
 * PhonePe, Paytm, BHIM...), and money moves directly bank-to-bank between
 * the donor and the mandal. Deliberately NOT routed through any payment
 * gateway: Cashfree rejected EasySplit for this account (RBI PA/PG
 * regulations don't allow a private SaaS account to act as a donation
 * intermediary without NGO/Section 8 aggregator approval) — a plain UPI
 * link never touches this app's own account at all, so it sits outside
 * that requirement entirely (2026-08-21 payments architecture decision).
 *
 * Trade-off worth knowing: since the app never sees this payment, there's
 * no automatic confirmation — a collector/admin marks the receipt PAID
 * manually after confirming in their own bank app (see
 * PATCH /receipts/:id/status, already wired into receipts/[id]/page.tsx).
 */
export function buildUpiPaymentLink(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  /** Short transaction note (`tn=`) — donor name, category, or receipt number, whatever's known at the point this is built. Optional per the UPI spec. */
  note?: string;
}): string {
  const query = new URLSearchParams({
    pa: params.upiId,
    pn: params.payeeName,
    am: params.amount > 0 ? params.amount.toFixed(2) : '',
    cu: 'INR',
  });
  if (params.note) query.set('tn', params.note);
  // Drop am= entirely rather than send am=0.00 — an empty/absent amount
  // lets the donor's UPI app prompt them to enter it, which is the
  // correct fallback; a literal "0.00" would look like a real, wrong amount.
  if (!params.amount || params.amount <= 0) query.delete('am');
  return `upi://pay?${query.toString()}`;
}
