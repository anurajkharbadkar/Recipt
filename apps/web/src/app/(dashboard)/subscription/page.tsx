'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { subscriptionPaymentApi, getErrorMessage } from '@/lib/api';
import { launchSubscriptionCheckout } from '@/lib/cashfreeCheckout';
import { PRICING_PLANS, SubscriptionPlan, formatCurrency } from '@pavti/shared';
import {
  CreditCard, CheckCircle2, XCircle, AlertTriangle, Loader2, Sparkles,
  Clock, ArrowUpCircle, History,
} from 'lucide-react';
import toast from 'react-hot-toast';

const labels = {
  en: {
    title: 'Subscription', subtitle: "Your Mandal's plan, billing status, and payment history.",
    currentPlan: 'Current Plan', status: 'Status', expiresOn: 'Expires on', daysLeft: 'days left', expired: 'Expired',
    payNow: 'Pay Now', renewNow: 'Renew Now', processing: 'Processing…',
    active: 'Active', pendingPayment: 'Payment Pending', freeTrial: 'Free Trial',
    changePlan: 'Change Plan', currentPlanBadge: 'Current Plan', switchTo: 'Switch to this plan',
    history: 'Payment History', noHistory: 'No payments yet.',
    adminOnly: 'Only your Mandal Admin can manage the subscription — contact them for plan changes or payments.',
    perMonth: '/ 30 days',
  },
  hi: {
    title: 'सदस्यता', subtitle: 'आपके मंडल की योजना, भुगतान स्थिति और भुगतान इतिहास।',
    currentPlan: 'वर्तमान योजना', status: 'स्थिति', expiresOn: 'समाप्ति तिथि', daysLeft: 'दिन शेष', expired: 'समाप्त',
    payNow: 'अभी भुगतान करें', renewNow: 'नवीनीकरण करें', processing: 'प्रक्रिया जारी है…',
    active: 'सक्रिय', pendingPayment: 'भुगतान लंबित', freeTrial: 'निःशुल्क ट्रायल',
    changePlan: 'योजना बदलें', currentPlanBadge: 'वर्तमान योजना', switchTo: 'इस योजना पर स्विच करें',
    history: 'भुगतान इतिहास', noHistory: 'अभी तक कोई भुगतान नहीं।',
    adminOnly: 'केवल आपका मंडल एडमिन सदस्यता प्रबंधित कर सकता है — योजना बदलने या भुगतान के लिए उनसे संपर्क करें।',
    perMonth: '/ 30 दिन',
  },
  mr: {
    title: 'सदस्यता', subtitle: 'तुमच्या मंडळाची योजना, बिलिंग स्थिती आणि पेमेंट इतिहास.',
    currentPlan: 'सध्याची योजना', status: 'स्थिती', expiresOn: 'समाप्ती तारीख', daysLeft: 'दिवस शिल्लक', expired: 'समाप्त',
    payNow: 'आता पैसे भरा', renewNow: 'नूतनीकरण करा', processing: 'प्रक्रिया सुरू आहे…',
    active: 'सक्रिय', pendingPayment: 'पेमेंट प्रलंबित', freeTrial: 'मोफत ट्रायल',
    changePlan: 'योजना बदला', currentPlanBadge: 'सध्याची योजना', switchTo: 'या योजनेवर स्विच करा',
    history: 'पेमेंट इतिहास', noHistory: 'अद्याप कोणतेही पेमेंट नाही.',
    adminOnly: 'फक्त तुमचा मंडळ अ‍ॅडमिन सदस्यता व्यवस्थापित करू शकतो — योजना बदलण्यासाठी किंवा पेमेंटसाठी त्यांच्याशी संपर्क साधा.',
    perMonth: '/ ३० दिवस',
  },
};

const PAYMENT_STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PAYMENT_SUCCESS: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-600' },
  ORDER_CREATED: { label: 'Started', className: 'bg-theme-fg/10 text-theme-fg/50' },
  PAYMENT_PENDING: { label: 'Pending', className: 'bg-amber-500/10 text-amber-600' },
  PAYMENT_FAILED: { label: 'Failed', className: 'bg-red-500/10 text-red-600' },
};

export default function SubscriptionPage() {
  const { organization, user, language } = useAuthStore();
  const l = labels[language] || labels.en;
  const [payingPlan, setPayingPlan] = useState<string | null>(null);

  const isAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: subscriptionPaymentApi.getHistory,
    enabled: isAdmin,
  });

  if (!organization) return null;

  const plan = PRICING_PLANS.find((p) => p.id === organization.subscriptionPlan);
  const isExpired = !!organization.subscriptionExpiry && new Date(organization.subscriptionExpiry).getTime() < Date.now();
  const isPending = organization.subscriptionStatus === 'PENDING_PAYMENT';
  const isFreeTrial = organization.subscriptionPlan === SubscriptionPlan.FREE;
  const daysLeft = organization.subscriptionExpiry
    ? Math.ceil((new Date(organization.subscriptionExpiry).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  const handlePay = async (targetPlan?: string) => {
    setPayingPlan(targetPlan || organization.subscriptionPlan);
    try {
      await launchSubscriptionCheckout(targetPlan);
      // Redirects the whole page to Cashfree on success — this line only
      // runs if it threw before getting there.
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Could not start checkout — please try again.'));
      setPayingPlan(null);
    }
  };

  const statusBadge = isExpired
    ? { icon: <XCircle size={13} />, text: l.expired, className: 'bg-red-500/10 text-red-600' }
    : isPending
    ? { icon: <AlertTriangle size={13} />, text: l.pendingPayment, className: 'bg-amber-500/10 text-amber-600' }
    : isFreeTrial
    ? { icon: <Sparkles size={13} />, text: l.freeTrial, className: 'bg-saffron-500/10 text-saffron-600' }
    : { icon: <CheckCircle2 size={13} />, text: l.active, className: 'bg-emerald-500/10 text-emerald-600' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-theme-fg">{l.title}</h1>
        <p className="text-sm text-theme-fg/50 mt-0.5">{l.subtitle}</p>
      </div>

      {!isAdmin && (
        <div className="glass-card p-4 flex items-center gap-3 bg-theme-fg/[0.02]">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-xs text-theme-fg/60">{l.adminOnly}</p>
        </div>
      )}

      {/* Current plan */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="form-label">{l.currentPlan}</p>
            <p className="text-xl font-bold text-theme-fg mt-1">{plan?.name || organization.subscriptionPlan}</p>
            {plan && !isFreeTrial && (
              <p className="text-sm text-theme-fg/50 mt-0.5">{formatCurrency(plan.priceInr)} {l.perMonth}</p>
            )}
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${statusBadge.className}`}>
            {statusBadge.icon} {statusBadge.text}
          </span>
        </div>

        {organization.subscriptionExpiry && (
          <div className="flex items-center gap-2 mt-4 text-xs text-theme-fg/50">
            <Clock size={13} />
            <span>
              {l.expiresOn} {new Date(organization.subscriptionExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              {!isExpired && daysLeft !== null && daysLeft >= 0 && ` — ${daysLeft} ${l.daysLeft}`}
            </span>
          </div>
        )}

        {isAdmin && (isExpired || isPending) && (
          <button
            onClick={() => handlePay()}
            disabled={payingPlan !== null}
            className={`btn-primary text-sm mt-4 ${isExpired ? '!bg-red-600 hover:!bg-red-500' : ''}`}
          >
            {payingPlan === organization.subscriptionPlan ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            {payingPlan === organization.subscriptionPlan ? l.processing : (isExpired ? l.renewNow : l.payNow)}
          </button>
        )}
      </div>

      {/* Change plan */}
      {isAdmin && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-theme-fg flex items-center gap-2 mb-4">
            <ArrowUpCircle size={16} className="text-saffron-500" /> {l.changePlan}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRICING_PLANS.filter((p) => p.id !== SubscriptionPlan.FREE).map((p) => {
              const isCurrent = p.id === organization.subscriptionPlan && !isExpired && !isPending;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border-2 p-4 flex flex-col ${isCurrent ? 'border-saffron-500 bg-saffron-500/[0.04]' : 'border-theme-fg/10'}`}
                >
                  <p className="text-sm font-semibold text-theme-fg">{p.name}</p>
                  <p className="text-lg font-bold text-theme-fg mt-1">{formatCurrency(p.priceInr)}</p>
                  <p className="text-[11px] text-theme-fg/40 mb-3">{l.perMonth}</p>
                  <button
                    onClick={() => handlePay(p.id)}
                    disabled={isCurrent || payingPlan !== null}
                    className={`mt-auto text-xs font-semibold py-2 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-saffron-500/15 text-saffron-600 cursor-default'
                        : 'bg-theme-fg/5 hover:bg-theme-fg/10 text-theme-fg disabled:opacity-50'
                    }`}
                  >
                    {payingPlan === p.id ? l.processing : isCurrent ? l.currentPlanBadge : l.switchTo}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment history */}
      {isAdmin && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-theme-fg flex items-center gap-2 mb-4">
            <History size={16} className="text-saffron-500" /> {l.history}
          </h3>
          {historyLoading ? (
            <Loader2 size={18} className="animate-spin text-theme-fg/30 mx-auto my-4" />
          ) : !history || history.length === 0 ? (
            <p className="text-xs text-theme-fg/40 text-center py-4">{l.noHistory}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <tbody>
                  {history.map((h) => {
                    const st = PAYMENT_STATUS_STYLE[h.status] || PAYMENT_STATUS_STYLE.ORDER_CREATED;
                    const planName = PRICING_PLANS.find((p) => p.id === h.targetPlan)?.name || h.targetPlan || '—';
                    return (
                      <tr key={h.orderId} className="border-t border-theme-fg/5">
                        <td className="py-2.5 pr-3 text-theme-fg/70">
                          {new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 pr-3 text-theme-fg font-medium">{planName}</td>
                        <td className="py-2.5 pr-3 text-theme-fg/70">{formatCurrency(h.amountPaise / 100)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${st.className}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
