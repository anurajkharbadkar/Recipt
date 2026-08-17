'use client';

import { useAuthStore } from '@/store/auth.store';
import { PRICING_PLANS, formatCurrency } from '@pavti/shared';
import { PLATFORM_UPI_ID, PLATFORM_EMAIL, platformWhatsappLink } from '@/lib/platform';
import { AlertTriangle, MessageCircle } from 'lucide-react';

/**
 * There's no in-app payment gateway yet, so a self-serve signup gets full
 * access immediately (organization.subscriptionStatus = PENDING_PAYMENT) and
 * this banner nags until an admin manually confirms payment and flips the
 * org to ACTIVE — see AuthService.register / Organization.subscriptionStatus.
 * Only ORG_ADMIN sees it (they're the one who'd actually pay).
 */
export default function PendingPaymentBanner() {
  const { organization, user } = useAuthStore();

  if (!organization || organization.subscriptionStatus !== 'PENDING_PAYMENT' || user?.role !== 'ORG_ADMIN') {
    return null;
  }

  const plan = PRICING_PLANS.find((p) => p.id === organization.subscriptionPlan);
  if (!plan) return null;

  const message = `Hi, I've paid for the ${plan.name} plan (${formatCurrency(plan.priceInr)}) for "${organization.name}". Please activate my account.`;

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
            Your <strong className="text-theme-fg">{plan.name}</strong> plan ({formatCurrency(plan.priceInr)}) is pending payment.
            Pay via UPI to <strong className="text-theme-fg">{PLATFORM_UPI_ID}</strong> or email <strong className="text-theme-fg">{PLATFORM_EMAIL}</strong>, then confirm below.
          </span>
        </div>
        <a
          href={platformWhatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-lg shrink-0"
        >
          <MessageCircle size={13} /> I've Paid — Notify Us
        </a>
      </div>
    </div>
  );
}
