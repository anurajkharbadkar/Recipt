'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { PRICING_PLANS, SubscriptionPlan, formatCurrency } from '@pavti/shared';
import { platformWhatsappLink } from '@/lib/platform';
import { launchSubscriptionCheckout } from '@/lib/cashfreeCheckout';
import { AlertTriangle, MessageCircle, XCircle, Sparkles, Loader2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * A self-serve signup for a paid plan gets full access immediately
 * (Organization.subscriptionStatus = PENDING_PAYMENT) and this banner nags
 * until they actually pay — via real Cashfree checkout, which flips the org
 * to ACTIVE server-side once confirmed (SubscriptionPaymentController +
 * PaymentsService.applyCashfreeWebhook). Only ORG_ADMIN sees it (they're
 * the one who'd actually pay — @Roles(ORG_ADMIN) on the order endpoint
 * matches this).
 *
 * Every plan is a 30-day period, re-anchored to whenever payment actually
 * clears (not the original signup date) — once subscriptionExpiry has
 * passed, the API's RolesGuard rejects writes (new receipts, expenses,
 * etc.), so this switches to a more urgent "expired, renew now" banner
 * instead of the softer pending-payment nag. Past data stays fully
 * viewable either way (2026-08 roles/subscription audit).
 *
 * FREE is never PENDING_PAYMENT (nothing to pay, active immediately — see
 * AuthService.register) so it gets its own calmer, informational third
 * state: trial progress ("X of 10 pavtis used") with an upgrade nudge,
 * rather than the urgent amber/red treatment the paid-plan states use.
 */
export default function PendingPaymentBanner() {
  const { organization, user } = useAuthStore();
  const [payingViaCheckout, setPayingViaCheckout] = useState(false);

  if (!organization || user?.role !== 'ORG_ADMIN') return null;

  const plan = PRICING_PLANS.find((p) => p.id === organization.subscriptionPlan);
  if (!plan) return null;

  const isExpired = !!organization.subscriptionExpiry && new Date(organization.subscriptionExpiry).getTime() < Date.now();
  const isPending = organization.subscriptionStatus === 'PENDING_PAYMENT';
  const isFreeTrial = plan.id === SubscriptionPlan.FREE;
  if (!isExpired && !isPending && !isFreeTrial) return null;

  const handlePayNow = async () => {
    setPayingViaCheckout(true);
    try {
      await launchSubscriptionCheckout();
      // launchSubscriptionCheckout redirects the whole page to Cashfree on
      // success — this line only runs if it threw before getting there.
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not start checkout — please try again.');
      setPayingViaCheckout(false);
    }
  };

  const upgradeMessage = `Hi, I'm on the Free Trial for "${organization.name}" and would like to upgrade to a paid plan.`;

  if (isExpired || isPending) {
    return (
      <div className={`${isExpired ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'} border-b px-4 md:px-6 py-2.5`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-theme-fg/80">
            {isExpired ? (
              <>
                <XCircle size={14} className="shrink-0 text-red-500" />
                <span>
                  Your <strong className="text-theme-fg">{plan.name}</strong> plan expired on{' '}
                  <strong className="text-theme-fg">{new Date(organization.subscriptionExpiry!).toLocaleDateString('en-IN')}</strong>.
                  You can still view past receipts and reports, but can't create new ones until you renew.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                <span>
                  Your <strong className="text-theme-fg">{plan.name}</strong> plan ({formatCurrency(plan.priceInr)}, valid 1 month) is pending payment.
                  Pay online to activate it instantly.
                </span>
              </>
            )}
          </div>
          <button
            onClick={handlePayNow}
            disabled={payingViaCheckout}
            className={`flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-semibold text-white px-4 rounded-lg shrink-0 disabled:opacity-60 ${isExpired ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}
          >
            {payingViaCheckout ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
            {isExpired ? 'Renew Now' : 'Pay Now'}
          </button>
        </div>
      </div>
    );
  }

  const used = organization.receiptCount ?? 0;
  const limit = plan.receiptLimit;
  const remaining = Math.max(limit - used, 0);
  return (
    <div className="bg-saffron-500/8 border-b border-saffron-500/25 px-4 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-theme-fg/80">
          <Sparkles size={14} className="shrink-0 text-saffron-500" />
          <span>
            <strong className="text-theme-fg">Free Trial</strong> — {used} of {limit} pavtis used
            {remaining <= 3 && remaining > 0 && <span className="text-saffron-500"> ({remaining} left)</span>}
            {remaining === 0 && <span className="text-red-500"> — limit reached, upgrade to create more</span>}.
            Valid until {organization.subscriptionExpiry ? new Date(organization.subscriptionExpiry).toLocaleDateString('en-IN') : '—'}.
          </span>
        </div>
        <a
          href={platformWhatsappLink(upgradeMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-semibold text-white bg-saffron-600 hover:bg-saffron-500 px-4 rounded-lg shrink-0"
        >
          <MessageCircle size={13} /> Upgrade Plan
        </a>
      </div>
    </div>
  );
}
