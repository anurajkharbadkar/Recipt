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
import { useSearchParams } from 'next/navigation';
import { cashfreeApi } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, HelpCircle } from 'lucide-react';

type Outcome = 'checking' | 'paid' | 'failed' | 'pending' | 'unknown';

function CashfreeReturnContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
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
      .then(([order, payments]) => {
        setRaw({ order, payments });
        const status = order?.order_status;
        const latestFailed = Array.isArray(payments) && payments.length > 0
          && payments[payments.length - 1]?.payment_status === 'FAILED';
        if (status === 'PAID') setOutcome('paid');
        else if (status === 'EXPIRED' || status === 'TERMINATED' || latestFailed) setOutcome('failed');
        else setOutcome('pending');
      })
      .catch((err) => {
        setRaw(err?.response?.data ?? String(err));
        setOutcome('unknown');
      });
  }, [orderId]);

  const copy: Record<Outcome, { icon: React.ReactNode; title: string; body: string }> = {
    checking: { icon: <Loader2 className="animate-spin" size={40} />, title: 'Checking payment status…', body: 'Confirming with Cashfree — this is not read from the redirect itself.' },
    paid: { icon: <CheckCircle2 className="text-green-500" size={40} />, title: 'Payment verified', body: 'Cashfree confirmed this order as PAID (server-side check).' },
    failed: { icon: <XCircle className="text-red-500" size={40} />, title: 'Payment did not succeed', body: 'Cashfree reports this order as expired, or the latest payment attempt as failed.' },
    pending: { icon: <Loader2 size={40} />, title: 'Payment pending', body: 'Not confirmed as PAID yet. Retry the status check in a moment.' },
    unknown: { icon: <HelpCircle size={40} />, title: 'Could not verify', body: orderId ? 'The status check itself failed — see raw response below.' : 'No order_id was present in the return URL.' },
  };

  const c = copy[outcome];

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-6">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">{c.icon}</div>
        <h1 className="text-lg font-semibold text-theme-fg mb-2">{c.title}</h1>
        <p className="text-sm text-theme-fg/60 mb-4">{c.body}</p>
        {orderId && <p className="text-xs text-theme-fg/40 mb-4">Order ID: {orderId}</p>}
        {raw && (
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
