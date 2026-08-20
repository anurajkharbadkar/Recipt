'use client';

// Sandbox milestone-1 test page for the Cashfree integration (see
// Digital_Pavti_Cashfree_EasySplit_Developer_Handover.md). Not the real
// donor-facing donation flow — that doesn't exist yet. This exists purely
// so an admin can prove NestJS -> Cashfree -> Checkout works end to end,
// using the Cashfree Sandbox's documented test UPI VPAs.
//
// Reachable at /settings/payments-test — no role check *in this file*, but
// it doesn't need one: every /settings/* route (this one included, via
// inferRouteModule) is already gated to SUPER_ADMIN/ORG_ADMIN by
// DashboardLayout's canView('Settings') check (see
// apps/web/src/hooks/useModuleAccess.ts) before this component ever
// renders. Linked from the Settings page's Bank tab for the same two
// roles; not in the sidebar nav, since it isn't a product feature — every
// real ORG_ADMIN (i.e. every paying customer's own admin) can still reach
// it directly by URL, which is worth knowing before this ships live.

import { useState } from 'react';
import Script from 'next/script';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { cashfreeApi } from '@/lib/api';

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: '_self' | '_blank' | '_top' | '_modal' }) => Promise<unknown>;
    };
  }
}

// Cashfree Sandbox's test UPI VPAs — this exact list was confirmed live,
// straight from Cashfree's own 400 error body when an unrecognized VPA is
// submitted to the Order Pay API (it enumerates every valid one). There is
// no "testinvalid@gocash" — ANY unrecognized VPA gets rejected synchronously
// with upi_id_invalid; that rejection *is* the invalid-VPA test, not a
// specific VPA string.
const TEST_VPAS = [
  { vpa: 'testsuccess@gocash', label: 'Success' },
  { vpa: 'testfailure@gocash', label: 'Failed' },
  { vpa: 'testdeclineuser@gocash', label: 'Declined by user' },
  { vpa: 'testexpired@gocash', label: 'Expired' },
  { vpa: 'not-a-real-vpa@gocash', label: 'Invalid VPA (any unrecognized one — rejected immediately, not a status you reach)' },
];

export default function CashfreeSandboxTestPage() {
  const [amount, setAmount] = useState(100);
  const [customerId, setCustomerId] = useState('TEST_DONOR_001');
  const [customerPhone, setCustomerPhone] = useState('9999999999');
  const [customerEmail, setCustomerEmail] = useState('test@example.com');
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [lookupOrderId, setLookupOrderId] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);

  const createOrderMutation = useMutation({
    mutationFn: cashfreeApi.createOrder,
    onSuccess: (data) => {
      setLastOrder(data);
      setLookupOrderId(data.order_id ?? '');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create Cashfree order');
    },
  });

  const getOrderMutation = useMutation({
    mutationFn: cashfreeApi.getOrder,
    onSuccess: setLookupResult,
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to fetch order'),
  });

  const getPaymentsMutation = useMutation({
    mutationFn: cashfreeApi.getOrderPayments,
    onSuccess: setLookupResult,
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to fetch payments'),
  });

  const handlePay = async () => {
    const order = await createOrderMutation.mutateAsync({ amount, customerId, customerPhone, customerEmail });
    const sessionId = order?.payment_session_id;
    if (!sessionId) {
      toast.error('Order created but no payment_session_id came back — check the raw response below');
      return;
    }
    if (!window.Cashfree) {
      toast.error('Cashfree SDK has not loaded yet — wait a second and try again');
      return;
    }
    const cashfree = window.Cashfree({ mode: 'sandbox' });
    // _self keeps the donor in the same tab/origin, which matters here:
    // this page's staff auth token lives in localStorage, and the return
    // page (/payment/cashfree/return) needs that same token to call our
    // (JwtAuthGuard-protected) verification endpoints.
    await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_self' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />

      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-theme-fg/60 hover:text-theme-fg">
        <ArrowLeft size={16} /> Back to Settings
      </Link>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-theme">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/10 flex items-center justify-center text-saffron-400">
            <FlaskConical size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-theme-fg">Cashfree Sandbox — Create Order & Checkout</h3>
            <p className="text-xs text-theme-fg/50">
              Never real money. Backend must have CASHFREE_CLIENT_ID/SECRET/BASE_URL/RETURN_URL/NOTIFY_URL set, or this 503s.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs text-theme-fg/60 mb-1 block">Amount (₹)</label>
            <input type="number" min={1} className="form-input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-theme-fg/60 mb-1 block">Customer ID</label>
            <input className="form-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-theme-fg/60 mb-1 block">Customer Phone</label>
            <input className="form-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-theme-fg/60 mb-1 block">Customer Email</label>
            <input className="form-input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          </div>
        </div>

        <button onClick={handlePay} disabled={createOrderMutation.isPending} className="btn-primary">
          {createOrderMutation.isPending ? 'Creating order…' : `Pay ₹${amount}`}
        </button>

        <div className="mt-4 text-xs text-theme-fg/60">
          <p className="mb-1 font-medium text-theme-fg/80">In the checkout, use a Sandbox test UPI VPA — never a real one:</p>
          <ul className="space-y-0.5">
            {TEST_VPAS.map((t) => (
              <li key={t.vpa}><code className="text-saffron-400">{t.vpa}</code> → {t.label}</li>
            ))}
          </ul>
        </div>

        {lastOrder && (
          <pre className="mt-4 text-[11px] leading-snug bg-theme-fg/5 border border-theme-fg/10 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(lastOrder, null, 2)}
          </pre>
        )}
      </div>

      <div className="glass-card p-6 sm:p-8">
        <h3 className="text-base font-semibold text-theme-fg mb-4">Check an order's status</h3>
        <p className="text-xs text-theme-fg/50 mb-4">
          Use after completing (or abandoning) checkout — this is the server-side verification step; never trust the checkout redirect alone.
        </p>
        <div className="flex gap-2 mb-4">
          <input className="form-input flex-1" placeholder="Order ID (e.g. DP_TEST_...)" value={lookupOrderId} onChange={(e) => setLookupOrderId(e.target.value)} />
          <button className="btn-secondary" disabled={!lookupOrderId || getOrderMutation.isPending} onClick={() => getOrderMutation.mutate(lookupOrderId)}>
            Order status
          </button>
          <button className="btn-secondary" disabled={!lookupOrderId || getPaymentsMutation.isPending} onClick={() => getPaymentsMutation.mutate(lookupOrderId)}>
            Payment attempts
          </button>
        </div>
        {lookupResult && (
          <pre className="text-[11px] leading-snug bg-theme-fg/5 border border-theme-fg/10 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(lookupResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
