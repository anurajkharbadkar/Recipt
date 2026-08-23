import { load } from '@cashfreepayments/cashfree-js';
import { subscriptionPaymentApi } from './api';

// 'sandbox' unless explicitly told this is production — matches
// apps/api's own CASHFREE_ENV convention (defaults safe, not live).
const CASHFREE_MODE = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';

let cashfreeInstance: Awaited<ReturnType<typeof load>> | null = null;
async function getCashfree() {
  if (!cashfreeInstance) cashfreeInstance = await load({ mode: CASHFREE_MODE });
  return cashfreeInstance;
}

/**
 * Creates (or reuses) the org's own subscription-fee order on the backend,
 * then launches Cashfree's hosted checkout for it — full-page redirect,
 * not a drop-in modal, since this is a deliberate "go pay now" action, not
 * something to interrupt other work with. Cashfree redirects back to
 * CASHFREE_RETURN_URL (apps/api/.env) — /payment/cashfree/return — which
 * verifies the outcome server-side and, for a subscription order,
 * refreshes the org's subscriptionStatus in the auth store.
 *
 * @param targetPlan Omitted for a plain renewal of the org's current plan
 *   (the PendingPaymentBanner's "Pay Now"). Set for the subscription
 *   page's Change Plan action to pay for a different plan instead.
 */
export async function launchSubscriptionCheckout(targetPlan?: string): Promise<void> {
  const { paymentSessionId } = await subscriptionPaymentApi.createOrder(targetPlan);
  const cashfree = await getCashfree();
  await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
}

/**
 * Launches Cashfree's official checkout flow for a donation or payment order.
 */
export async function launchCashfreeCheckout(paymentSessionId: string, redirectTarget: '_self' | '_blank' | '_modal' = '_modal'): Promise<void> {
  const cashfree = await getCashfree();
  await cashfree.checkout({ paymentSessionId, redirectTarget });
}

