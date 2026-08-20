'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
  PRICING_PLANS, formatCurrency, BRAND_NAME, BRAND_SHORT_NAME, BRAND_TAGLINE,
  resolvePlanFeatures, FEATURE_CATEGORY_LABELS, type PricingFeatureCategory,
} from '@pavti/shared';
import { platformWhatsappLink } from '@/lib/platform';
import {
  QrCode, MessageCircle, FileText, Globe2, Users2, ShieldCheck,
  BarChart3, Palette, Check, Star, ArrowRight, Smartphone, Wallet, Sparkles, ChevronDown,
} from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';

const FEATURES = [
  { icon: FileText, title: 'Digital Pavti Generation', desc: 'Traditional receipt design with QR code — issue a receipt in seconds instead of writing one by hand.' },
  { icon: MessageCircle, title: 'WhatsApp Delivery', desc: 'Send the digital receipt straight to the donor\'s WhatsApp the moment it\'s created.' },
  { icon: QrCode, title: 'QR Verification', desc: 'Anyone can scan a receipt\'s QR code to publicly verify it\'s genuine.' },
  { icon: Globe2, title: 'Multilingual', desc: 'English, Hindi & Marathi — switch the whole app, or just one receipt, independently.' },
  { icon: Users2, title: 'Role-Based Access', desc: 'Admin, Treasurer, Collector & Viewer roles, with fine-grained per-person overrides.' },
  { icon: Wallet, title: 'Internal Collection', desc: 'Declare a membership fee for your registered members and track who\'s paid at a glance.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Daily collection trends, collector rankings, category & donor breakdowns.' },
  { icon: Palette, title: 'Custom Branding', desc: 'Pick a receipt design and set your own accent color across the whole portal.' },
  { icon: ShieldCheck, title: 'Audit Trail', desc: 'Every create, edit, void and status change is logged.' },
];

// "Compare all plans" table data — each row is a category with at least one
// tagged feature somewhere in the ladder; each cell is that plan's full
// *cumulative* feature set for the category (resolvePlanFeatures walks the
// includesFrom chain, so Standard's cell correctly includes what it
// inherited from Basic/Free, not just what Standard's own card adds).
// Computed once at module load — PRICING_PLANS is static data, not state.
const COMPARISON_CATEGORY_ORDER: PricingFeatureCategory[] = [
  'pavti', 'collections', 'donors', 'payments', 'expenses', 'reports', 'branding', 'team', 'support',
];
const COMPARISON_ROWS = COMPARISON_CATEGORY_ORDER.map((category) => ({
  category,
  label: FEATURE_CATEGORY_LABELS[category],
  cells: PRICING_PLANS.map((plan) => resolvePlanFeatures(plan.id).filter((f) => f.category === category)),
})).filter((row) => row.cells.some((cell) => cell.length > 0));

// Three self-contained visual identities, not scattered inline ternaries —
// each tone owns every color it needs so a card never depends on the site's
// light/dark toggle for contrast against its own (possibly toggle-
// independent) background. 'standard' and 'premium' deliberately keep a
// fixed card background regardless of site theme (that's *why* they stand
// out as the "special" tiers) — the site theme only reaches 'default' cards,
// which have no background override and just inherit glass-card's
// theme-aware var(--card-bg). Previously 'standard' forced a white
// background but still used var(--text-color)-driven text classes for its
// tagline/feature copy — invisible near-white-on-white the moment a visitor
// had the site in dark mode.
const CARD_TONES = {
  default: {
    card: 'border border-saffron-300/80 shadow-md hover:border-saffron-500/60',
    title: 'text-theme-fg',
    tagline: 'text-theme-fg/50',
    price: 'text-saffron-700 dark:text-saffron-300',
    priceNote: 'text-theme-fg/40',
    checkActive: 'text-success-500',
    checkComingSoon: 'text-theme-fg/30',
    featureActive: 'text-theme-fg/85',
    featureComingSoon: 'text-theme-fg/40',
    featureDesc: 'text-theme-fg/45',
    cta: 'btn-primary',
    whatsapp: 'text-theme-fg/50 hover:text-theme-fg/80',
  },
  standard: {
    card: 'border-2 border-royal-600 bg-gradient-to-b from-white via-white to-royal-50/50 shadow-xl shadow-royal-900/10 lg:-translate-y-2',
    title: 'text-royal-900',
    tagline: 'text-saffron-900/50',
    price: 'text-royal-600',
    priceNote: 'text-saffron-900/40',
    checkActive: 'text-royal-600',
    checkComingSoon: 'text-saffron-900/30',
    featureActive: 'text-saffron-900/85',
    featureComingSoon: 'text-saffron-900/40',
    featureDesc: 'text-saffron-900/50',
    cta: 'bg-royal-600 text-white hover:bg-royal-700 shadow-md shadow-royal-600/25',
    whatsapp: 'text-saffron-900/50 hover:text-saffron-900/80',
  },
  premium: {
    card: 'border-2 border-gold-400 bg-gradient-to-b from-[#21160E] to-[#120D08] text-[#F4F0E0] shadow-xl shadow-black/25',
    title: 'text-gold-300',
    tagline: 'text-saffron-100/70',
    price: 'text-gold-400',
    priceNote: 'text-saffron-200/50',
    checkActive: 'text-gold-400',
    checkComingSoon: 'text-white/20',
    featureActive: 'text-white/90',
    featureComingSoon: 'text-white/40',
    featureDesc: 'text-saffron-200/50',
    cta: 'bg-gradient-to-r from-[#C89B3C] to-[#E8C878] text-[#301000] hover:brightness-105 shadow-md shadow-gold-500/20',
    whatsapp: 'text-gold-300/80 hover:text-gold-200',
  },
} as const;

function PricingCard({ plan }: { plan: (typeof PRICING_PLANS)[number] }) {
  const isFree = plan.id === 'FREE';
  const isStandard = plan.id === 'STANDARD';
  const isPremium = plan.id === 'PREMIUM';
  const t = isStandard ? CARD_TONES.standard : isPremium ? CARD_TONES.premium : CARD_TONES.default;
  const freeCardStyle = 'border border-dashed border-theme-fg/25 hover:border-theme-fg/40';

  return (
    <div className={`relative glass-card p-6 flex flex-col transition-all duration-300 ${isFree ? freeCardStyle : t.card}`}>
      {/* Ribbon badges — all three share the same `badge` base (pill shape,
          sizing) plus `whitespace-nowrap` so none of them wrap to a second
          line; only the color variant differs between tiers. */}
      {isStandard && (
        <span className="badge badge-royal absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-3 py-1 font-bold shadow-sm">
          <Star size={10} className="fill-gold-500 text-gold-500" /> RECOMMENDED
        </span>
      )}
      {isPremium && (
        <span className="badge badge-gold absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-3 py-1 font-bold shadow-sm">
          👑 VIP ACCESS
        </span>
      )}
      {isFree && (
        <span className="badge badge-neutral absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-3 py-1 font-bold shadow-sm">
          NO PAYMENT NEEDED
        </span>
      )}

      {/* Positioning word — the value-progression framing (Experience → Go
          Digital → Manage Better → Elevate the Experience), not just a name
          + price. Marathi descriptor sits with the plan name as a
          personality layer, not a translation of the feature list below. */}
      <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${t.price}`}>{plan.positioningLine}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <h3 className={`text-xl font-bold ${t.title}`}>{plan.name}</h3>
        <span className={`text-xs font-devanagari ${t.tagline}`}>{plan.marathiDescriptor}</span>
      </div>
      <p className={`text-xs mt-1 min-h-[32px] ${t.tagline}`}>{plan.tagline}</p>

      <div className="mt-4 mb-1 flex items-baseline gap-1.5">
        <span className={`text-3xl font-extrabold ${t.price}`}>{formatCurrency(plan.priceInr)}</span>
        {plan.priceInr > 0 && <span className={`text-xs font-semibold ${t.priceNote}`}>/ season</span>}
      </div>
      <p className={`text-[11px] mb-5 ${t.priceNote}`}>{plan.priceNote}</p>

      {/* Tiered ladder, not four independent lists — each paid tier only
          shows what it adds on top of the one before it (see
          PricingPlan.includesFrom), so the list length reflects what a tier
          actually changes instead of repeating the same base features 4x. */}
      {plan.includesFrom && (
        <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2.5 ${t.tagline}`}>
          Everything in {plan.includesFrom}, plus:
        </p>
      )}

      <ul className="space-y-2.5 mb-6">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm">
            <Check size={15} className={`shrink-0 mt-0.5 ${f.comingSoon ? t.checkComingSoon : t.checkActive}`} />
            <span className={f.comingSoon ? t.featureComingSoon : t.featureActive}>
              {f.label}
              {f.comingSoon && <span className="ml-1.5 badge badge-neutral text-[9px] align-middle">Coming Soon</span>}
              {f.description && <span className={`block text-[11px] mt-0.5 ${t.featureDesc}`}>{f.description}</span>}
            </span>
          </li>
        ))}
      </ul>

      {/* Premium's signature moment — the Interactive/Devotional Pavti
          experience is real on every plan already (see
          InteractivePavtiView/INTERACTIVE_PAVTI_TEMPLATES — nothing here is
          plan-gated), so this is a spotlight, not an exclusivity claim.
          Deliberately not a checkmark bullet: it's the "wow" feature, not
          another line item. */}
      {isPremium && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gold-500/10 border border-gold-500/25 mb-6 -mt-2">
          <Sparkles size={16} className="text-gold-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gold-300">Premium Digital Pavti Experience</p>
            <p className="text-[11px] text-saffron-200/60 mt-0.5">A cinematic darshan-style pavti — your Mandal&apos;s signature moment for every donor.</p>
          </div>
        </div>
      )}

      <div className="flex-1" />

      <Link
        href={`/register?plan=${plan.id.toLowerCase()}`}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${t.cta}`}
      >
        {isFree ? 'Start Free Trial' : 'Get Started'} <ArrowRight size={15} />
      </Link>

      {/* No payment gateway wired up yet (see PendingPaymentBanner.tsx) — this
          is the low-friction alternative to filling out the whole signup
          form just to ask about a plan. Not shown for FREE — there's nothing
          to request, signup itself is instant. */}
      {!isFree && (
        <a
          href={platformWhatsappLink(`Hi, I'd like to request access to the ${plan.name} plan (${formatCurrency(plan.priceInr)}) for my mandal.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-1.5 mt-2 py-2 rounded-xl text-xs font-semibold transition-colors ${t.whatsapp}`}
        >
          <MessageCircle size={13} /> Request Access via WhatsApp
        </a>
      )}
    </div>
  );
}

// Collapsed by default — the four cards above are the actual decision-making
// surface (deliberately kept short per the ladder pattern); this is the
// "show me everything" detail view for anyone who wants the full picture
// without the cards themselves growing back into the wall of text they used
// to be.
function PlanComparisonTable() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-saffron-600 hover:text-saffron-700 transition-colors"
      >
        {open ? 'Hide' : 'Compare'} all plans in detail
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-6 glass-card p-4 sm:p-6 overflow-x-auto animate-fade-in">
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-theme">
                <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-theme-fg/40">Category</th>
                {PRICING_PLANS.map((plan) => (
                  <th key={plan.id} className="text-left py-3 px-3 min-w-[150px]">
                    <span className={`font-bold ${plan.highlighted ? 'text-royal-600' : plan.id === 'PREMIUM' ? 'text-saffron-600' : 'text-theme-fg'}`}>
                      {plan.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.category} className="border-b border-theme/60 last:border-0">
                  <td className="py-3 pr-4 text-xs font-semibold text-theme-fg/50 align-top whitespace-nowrap">{row.label}</td>
                  {row.cells.map((items, i) => (
                    <td key={PRICING_PLANS[i].id} className="py-3 px-3 align-top text-xs text-theme-fg/80">
                      {items.length ? (
                        <div className="space-y-1">
                          {items.map((f) => <div key={f.label}>{f.label}</div>)}
                        </div>
                      ) : (
                        <span className="text-theme-fg/20">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-saffron-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-navy-900/70 border-b border-theme">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={36} className="rounded-xl shadow-glow-saffron" />
            <span className="font-bold text-theme-fg">{BRAND_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm px-4">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">Try {BRAND_SHORT_NAME}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 pb-14 text-center">
          {/* Level 1 of the message hierarchy: what is it, in one line. */}
          <span className="inline-block badge badge-saffron text-xs mb-5">
            Digital Receipt & Collection Management for Mandals, Trusts &amp; NGOs
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-theme-fg leading-tight mb-5">
            Your Pavti. <span className="text-saffron-400">Now Digital.</span>
          </h1>
          {/* Level 2 (why) + Level 4 (benefit), blended into one subhead. */}
          <p className="text-sm sm:text-base text-theme-fg/60 max-w-2xl mx-auto mb-7">
            Replace the paper Pavti book with a faster, simpler digital system — issue QR-verified receipts,
            deliver them over WhatsApp instantly, and keep every rupee your Mandal, trust or community
            organization collects fully accounted for. In English, Hindi or Marathi.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="btn-primary px-6 py-3">
              Try {BRAND_SHORT_NAME} <ArrowRight size={16} />
            </Link>
            <Link href="#pricing" className="btn-secondary px-6 py-3">View Pricing</Link>
          </div>
          {/* Level 3: the collection cycle in three words — the core brand
              idea (doc §2/§4) made literal. */}
          <div className="flex items-center justify-center gap-1.5 mt-7 flex-wrap">
            {[
              { icon: Wallet, label: 'Collect' },
              { icon: FileText, label: 'Record' },
              { icon: MessageCircle, label: 'Share' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <span className="badge badge-saffron">
                  <step.icon size={12} /> {step.label}
                </span>
                {i < arr.length - 1 && <ArrowRight size={11} className="text-theme-fg/25" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-theme-fg/40 flex-wrap">
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Secure & Reliable</span>
            <span className="flex items-center gap-1.5"><Smartphone size={13} /> Easy to Use</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={13} /> Dedicated Support</span>
          </div>
        </div>
      </section>

      {/* Brand Story — "From Pavti to Digital" (doc §13). Not asking anyone
          to learn something new: the familiar Pavti workflow, evolved. */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16">
        <div className="glass-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-theme-fg mb-1">From Pavti to Digital</h2>
            <p className="text-xs text-theme-fg/50">We&apos;re not replacing the Pavti you know — we&apos;re evolving it.</p>
          </div>
          <div className="space-y-3.5">
            <BrandStoryFlow label="The old way" steps={['Write', 'Tear', 'Hand over', 'Count', 'Calculate', 'Reconcile', 'Store']} muted />
            <BrandStoryFlow label={`The ${BRAND_SHORT_NAME} way`} steps={['Collect', 'Record', 'Verify', 'Receipt', 'Track', 'Report']} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-theme-fg mb-2">Everything Your Organization Needs</h2>
          <p className="text-sm text-theme-fg/50">One app for receipts, collections, expenses and reporting.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card-hover p-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-600/15 flex items-center justify-center text-saffron-400 mb-3">
                <f.icon size={18} />
              </div>
              <h3 className="font-semibold text-theme-fg text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-theme-fg/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-theme-fg mb-2">Choose the Experience Your Mandal Deserves</h2>
          <p className="text-sm text-theme-fg/50">Go digital this festival season — every plan is priced per season, not a subscription you'll forget about.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => <PricingCard key={plan.id} plan={plan} />)}
        </div>
        <PlanComparisonTable />
      </section>

      {/* Footer */}
      <footer className="border-t border-theme py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-fg/40">
          <span>© {new Date().getFullYear()} {BRAND_NAME} · {BRAND_TAGLINE}</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-theme-fg">Sign In</Link>
            <Link href="/register" className="hover:text-theme-fg">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// The old manual Pavti workflow next to the e-Pavti one — same steps-and-
// arrows treatment for both so the comparison reads at a glance, with the
// muted variant only for what's being replaced.
function BrandStoryFlow({ label, steps, muted }: { label: string; steps: string[]; muted?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5">
      <span className={`text-[11px] font-semibold uppercase tracking-wider shrink-0 sm:w-32 ${muted ? 'text-theme-fg/35' : 'text-saffron-400'}`}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-1.5">
            <span className={`badge ${muted ? 'badge-neutral' : 'badge-saffron'}`}>{step}</span>
            {i < steps.length - 1 && (
              <ArrowRight size={10} className={muted ? 'text-theme-fg/15' : 'text-theme-fg/25'} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
