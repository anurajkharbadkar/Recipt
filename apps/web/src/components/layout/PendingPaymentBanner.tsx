'use client';

import { useAuthStore } from '@/store/auth.store';
import { PRICING_PLANS, SubscriptionPlan, formatCurrency } from '@pavti/shared';
import { PLATFORM_UPI_ID, PLATFORM_EMAIL, platformWhatsappLink } from '@/lib/platform';
import { AlertTriangle, MessageCircle, XCircle, Sparkles } from 'lucide-react';

/**
 * There's no in-app payment gateway yet, so a self-serve signup gets full
 * access immediately (organization.subscriptionStatus = PENDING_PAYMENT) and
 * this banner nags until an admin manually confirms payment and flips the
 * org to ACTIVE — see AuthService.register / Organization.subscriptionStatus.
 * Only ORG_ADMIN sees it (they're the one who'd actually pay).
 *
 * Every plan is a 30-day period from signup (SUBSCRIPTION_PERIOD_DAYS,
 * packages/shared) regardless of that status — once subscriptionExpiry has
 * passed, the API's RolesGuard actually starts rejecting writes (new
 * receipts, expenses, etc.), so this switches to a more urgent "expired,
 * renew now" banner instead of the softer pending-payment nag. Past data
 * stays fully viewable either way (2026-08 roles/subscription audit).
 *
 * FREE is never PENDING_PAYMENT (nothing to pay, active immediately — see
 * AuthService.register) so it gets its own calmer, informational third
 * state: trial progress ("X of 10 pavtis used") with an upgrade nudge,
 * rather than the urgent amber/red treatment the paid-plan states use.
 */
export default function PendingPaymentBanner() {
  const { organization, user } = useAuthStore();

  if (!organization || user?.role !== 'ORG_ADMIN') return null;

  const plan = PRICING_PLANS.find((p) => p.id === organization.subscriptionPlan);
  if (!plan) return null;

  const isExpired = !!organization.subscriptionExpiry && new Date(organization.subscriptionExpiry).getTime() < Date.now();
  const isPending = organization.subscriptionStatus === 'PENDING_PAYMENT';
  const isFreeTrial = plan.id === SubscriptionPlan.FREE;
  if (!isExpired && !isPending && !isFreeTrial) return null;

  const message = isExpired
    ? `Hi, my ${plan.name} plan (${formatCurrency(plan.priceInr)}) for "${organization.name}" has expired. I'd like to renew it.`
    : isFreeTrial
    ? `Hi, I'm on the Free Trial for "${organization.name}" and would like to upgrade to a paid plan.`
    : `Hi, I've paid for the ${plan.name} plan (${formatCurrency(plan.priceInr)}) for "${organization.name}". Please activate my account.`;

  if (isExpired) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/30 px-4 md:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-theme-fg/80">
            <XCircle size={14} className="shrink-0 text-red-500" />
            <span>
              Your <strong className="text-theme-fg">{plan.name}</strong> plan expired on{' '}
              <strong className="text-theme-fg">{new Date(organization.subscriptionExpiry!).toLocaleDateString('en-IN')}</strong>.
              You can still view past receipts and reports, but can't create new ones until you renew.
            </span>
          </div>
          <a
            href={platformWhatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-semibold text-white bg-red-600 hover:bg-red-500 px-4 rounded-lg shrink-0"
          >
            <MessageCircle size={13} /> Renew Now
          </a>
        </div>
      </div>
    );
  }

  if (isFreeTrial) {
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
            href={platformWhatsappLink(message)}
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

  return (
    // Amber/yellow text reads fine for a short badge pill but fails contrast
    // badly as a full sentence, especially on the light theme (the app's
    // actual default) — pale text on a pale tint. Amber stays on the icon and
    // the CTA button (which has a solid-enough fill to carry it); the
    // sentence itself uses the normal theme-aware foreground color so it's
    // reliably readable in both themes.
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-theme-fg/80">
          <AlertTriangle size={14} className="shrink-0 text-amber-500" />
          <span>
            Your <strong className="text-theme-fg">{plan.name}</strong> plan ({formatCurrency(plan.priceInr)}, valid 1 month) is pending payment.
            Pay via UPI to <strong className="text-theme-fg">{PLATFORM_UPI_ID}</strong> or email <strong className="text-theme-fg">{PLATFORM_EMAIL}</strong>, then confirm below.
          </span>
        </div>
        <a
          href={platformWhatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 px-4 rounded-lg shrink-0"
        >
          <MessageCircle size={13} /> I've Paid — Notify Us
        </a>
      </div>
    </div>
  );
}
