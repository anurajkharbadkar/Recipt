'use client';

// Cashfree redirects here after Sandbox checkout (this is CASHFREE_RETURN_URL
// in apps/api/.env, with ?order_id=... appended — see
// CashfreeService.createOrder). Deliberately outside the (dashboard) route
// group: it's a bare landing page, not a dashboard screen.
//
// Core rule from the handover doc (section 7/8): arriving here is NOT proof
// of payment. Cashfree can redirect back on a failed or abandoned attempt
// too. The only thing this page does is ask the backend — which asks
// Cashfree — what actually happened.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cashfreeApi, orgsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { CheckCircle2, XCircle, Loader2, HelpCircle, ArrowRight } from 'lucide-react';

type Outcome = 'checking' | 'paid' | 'failed' | 'pending' | 'unknown';

// Matches CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX (apps/api) — lets this page
// tell a Mandal's own subscription payment apart from a donation/sandbox-
// test order without a second round-trip, since only the subscription case
// needs the org's cached subscriptionStatus refreshed afterward.
const SUBSCRIPTION_ORDER_PREFIX = 'DP_SUB';

function CashfreeReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setOrganization } = useAuthStore();
  const orderId = searchParams.get('order_id');
  const isSubscriptionOrder = !!orderId?.startsWith(SUBSCRIPTION_ORDER_PREFIX);
  const [outcome, setOutcome] = useState<Outcome>('checking');
  const [raw, setRaw] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      setOutcome('unknown');
      return;
    }
    // order_status alone is NOT enough to detect a failed attempt — verified
    // directly against Cashfree Sandbox: a UPI collect that resolves FAILED
    // leaves order_status at "ACTIVE" (the order itself can still accept a
    // retry), not some failure value. Without also checking the individual
    // payment attempts, a donor whose payment was declined would sit on
    // "pending" forever. Must check both.
    Promise.all([cashfreeApi.getOrder(orderId), cashfreeApi.getOrderPayments(orderId)])
      .then(async ([order, payments]) => {
        setRaw({ order, payments });
        const status = order?.order_status;
        const latestFailed = Array.isArray(payments) && payments.length > 0
          && payments[payments.length - 1]?.payment_status === 'FAILED';
        if (status === 'PAID') {
          setOutcome('paid');
          // The webhook (server-side, already verified) is what actually
          // flips subscriptionStatus — this just refreshes the client's own
          // cached copy so the PendingPaymentBanner/gate disappear without
          // needing a manual page reload. If the webhook hasn't landed yet
          // (rare, but not guaranteed to beat this redirect), a subsequent
          // navigation still picks it up via the normal /organizations/me
          // call every page load already makes.
          if (isSubscriptionOrder) {
            try {
              const org = await orgsApi.getMe();
              setOrganization(org);
            } catch {
              // Non-fatal — the org just stays on its previous cached
              // status until the next natural refetch.
            }
          }
        }
        else if (status === 'EXPIRED' || status === 'TERMINATED' || latestFailed) setOutcome('failed');
        else setOutcome('pending');
      })
      .catch((err) => {
        setRaw(err?.response?.data ?? String(err));
        setOutcome('unknown');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const copy: Record<Outcome, { icon: React.ReactNode; title: string; body: string }> = {
    checking: { icon: <Loader2 className="animate-spin" size={40} />, title: 'Checking payment status…', body: 'Confirming with Cashfree — this is not read from the redirect itself.' },
    paid: {
      icon: <CheckCircle2 className="text-green-500" size={40} />,
      title: isSubscriptionOrder ? 'Subscription activated! 🙏' : 'Payment verified',
      body: isSubscriptionOrder
        ? 'Your plan is active — you can create receipts, add collectors, and everything else right away.'
        : 'Cashfree confirmed this order as PAID (server-side check).',
    },
    failed: { icon: <XCircle className="text-red-500" size={40} />, title: 'Payment did not succeed', body: 'Cashfree reports this order as expired, or the latest payment attempt as failed. No charge was made — you can try again from your dashboard.' },
    pending: { icon: <Loader2 size={40} />, title: 'Payment not completed', body: 'This checkout was cancelled or closed before finishing — no charge was made. You can try again any time from your dashboard.' },
    unknown: { icon: <HelpCircle size={40} />, title: 'Could not verify', body: orderId ? 'We couldn’t confirm this payment’s status right now — check back from your dashboard in a moment, or try again if it still shows pending.' : 'No order_id was present in the return URL.' },
  };

  const c = copy[outcome];
  // The raw Cashfree dump is a debugging aid for CashfreeController's
  // sandbox test surface (donation/split testing, internal staff only) —
  // never shown for a real subscription payment, no matter the outcome.
  // Originally this only hid on a *successful* subscription payment, which
  // missed the actual common case: a real admin cancelling or failing their
  // own real payment still got a wall of internal JSON (customer ids,
  // webhook URLs, order internals) dumped at them (found live, 2026-08-23).
  const showRawDump = raw && !isSubscriptionOrder;

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-6">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">{c.icon}</div>
        <h1 className="text-lg font-semibold text-theme-fg mb-2">{c.title}</h1>
        <p className="text-sm text-theme-fg/60 mb-4">{c.body}</p>
        {orderId && <p className="text-xs text-theme-fg/40 mb-4">Order ID: {orderId}</p>}
        {isSubscriptionOrder && outcome === 'paid' && (
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full justify-center gap-2 mb-2">
            Continue to Dashboard <ArrowRight size={16} />
          </button>
        )}
        {isSubscriptionOrder && (outcome === 'failed' || outcome === 'pending') && (
          <button onClick={() => router.push('/dashboard')} className="btn-secondary w-full justify-center gap-2 mb-2">
            Back to Dashboard
          </button>
        )}
        {showRawDump && (
          <pre className="text-left text-[11px] leading-snug bg-theme-fg/5 border border-theme-fg/10 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(raw, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function CashfreeReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-navy-900 p-6">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <Loader2 className="animate-spin text-saffron-500 mx-auto mb-4" size={40} />
            <h1 className="text-lg font-semibold text-theme-fg mb-2">Loading payment details…</h1>
          </div>
        </div>
      }
    >
      <CashfreeReturnContent />
    </Suspense>
  );
}
