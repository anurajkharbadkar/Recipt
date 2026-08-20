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
  IndianRupee, Share2,
} from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';

// Sample data for the hero's receipt visual — a real ReceiptPreview render
// (same component the actual app uses for its own live preview and the
// donor-facing verify page), not a hand-drawn mockup, so what a visitor
// sees here is never out of sync with what the product actually produces.
// FESTIVE is the closest built-in receipt theme to this marketing page's
// own saffron palette (see RECEIPT_THEMES).
const HERO_PREVIEW_RECEIPT = {
  id: 'preview',
  receiptNumber: 'SGM-2026-0001',
  donorName: 'Rajendra Deshmukh',
  amount: 1100,
  amountInWords: 'One Thousand One Hundred Rupees Only',
  category: 'GENERAL',
  paymentMode: 'UPI',
  status: 'PAID',
  collectionType: 'DONATION',
  createdAt: new Date().toISOString(),
  collector: { name: 'Amit Joshi' },
  campaign: {
    name: 'Ganesh Utsav 2026',
    organization: {
      name: 'Shree Ganesh Mandal',
      nameMarathi: 'श्री गणेश मंडळ',
      receiptTemplateSettings: { theme: 'FESTIVE', language: 'en' },
    },
  },
};

const HOW_IT_WORKS = [
  { icon: FileText, title: 'Issue the Pavti', desc: 'Generate a QR-verified digital receipt the moment a donor pays — cash, UPI, or bank transfer.' },
  { icon: Wallet, title: 'Collect Online', desc: 'Show your UPI ID on every receipt so donors can pay you directly, or record cash and cheque just as fast.' },
  { icon: IndianRupee, title: 'Log Every Expense', desc: 'Track spends against collections so your balance is always current, not reconciled after the fact.' },
  { icon: Share2, title: 'Share the Record', desc: 'Committee members and donors see the same transparent, always-current account.' },
];

const OCCASIONS = [
  'Ganesh Utsav Mandals', 'Navratri Samitis', 'Bhandara & Community Drives', 'Temple Trusts', 'Housing Society Funds',
];

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

      {/* Hero — text + a real ReceiptPreview render as the signature visual,
          not a hand-drawn mockup (see HERO_PREVIEW_RECEIPT above). */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-16 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="text-center lg:text-left">
            {/* Level 1 of the message hierarchy: what is it, in one line. */}
            <span className="inline-block badge badge-saffron text-xs mb-5">
              Digital Receipt & Collection Management for Mandals, Trusts &amp; NGOs
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-theme-fg leading-tight mb-5">
              Your Pavti. <span className="text-saffron-400">Now Digital.</span>
            </h1>
            {/* Level 2 (why) + Level 4 (benefit), blended into one subhead. */}
            <p className="text-sm sm:text-base text-theme-fg/60 max-w-lg mx-auto lg:mx-0 mb-7">
              Replace the paper Pavti book with a faster, simpler digital system — issue QR-verified receipts,
              deliver them over WhatsApp instantly, and keep every rupee your Mandal, trust or community
              organization collects fully accounted for. In English, Hindi or Marathi.
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <Link href="/register" className="btn-primary px-6 py-3">
                Try {BRAND_SHORT_NAME} <ArrowRight size={16} />
              </Link>
              <Link href="#pricing" className="btn-secondary px-6 py-3">View Pricing</Link>
            </div>
            {/* Level 3: the collection cycle in three words — the core brand
                idea (doc §2/§4) made literal. */}
            <div className="flex items-center justify-center lg:justify-start gap-1.5 mt-7 flex-wrap">
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
            <div className="flex items-center justify-center lg:justify-start gap-6 mt-6 text-xs text-theme-fg/40 flex-wrap">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Secure & Reliable</span>
              <span className="flex items-center gap-1.5"><Smartphone size={13} /> Easy to Use</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={13} /> Dedicated Support</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="-rotate-2 hover:rotate-0 transition-transform duration-300 w-full max-w-[320px]">
              <ReceiptPreview receipt={HERO_PREVIEW_RECEIPT} />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — the familiar Pavti workflow, made concrete in four
          steps (not asking anyone to learn something new). */}
      <section id="how" className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-theme-fg mb-2">From Collection to Accounted-For, in Four Steps</h2>
          <p className="text-sm text-theme-fg/50">The same Pavti workflow you already know — just digital, start to finish.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="glass-card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xs font-bold text-saffron-500/70 font-mono">0{i + 1}</span>
                <div className="w-9 h-9 rounded-xl bg-saffron-600/15 flex items-center justify-center text-saffron-400">
                  <step.icon size={16} />
                </div>
              </div>
              <h3 className="font-semibold text-theme-fg text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-theme-fg/50">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Occasions — broadens the "who this is for" read at a glance;
          e-Pavti isn't scoped to one festival or one kind of organization. */}
      <section id="occasions" className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
          <span className="text-xs font-semibold text-theme-fg/40 uppercase tracking-wide shrink-0">Built for —</span>
          {OCCASIONS.map((o) => (
            <span key={o} className="text-xs px-3.5 py-2 rounded-full border border-theme-fg/10 bg-theme-fg/[0.02] text-theme-fg/60">
              {o}
            </span>
          ))}
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

      {/* CTA band — the closing conversion moment the page was missing;
          same dark treatment as the Premium tier so it reads as "the
          serious version" of the page rather than a bolted-on banner. */}
      <section className="bg-navy-900 dark:bg-[#120D08]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-saffron-400">Get Started</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">Bring Your Next Collection Online</h2>
          <p className="text-sm text-white/60 max-w-lg mx-auto mb-8">
            Set up your Mandal&apos;s digital Pavti book before the next festival season — start free,
            or talk to us on WhatsApp and we&apos;ll help you pick the right plan.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="btn-primary px-6 py-3">
              Try {BRAND_SHORT_NAME} Free <ArrowRight size={16} />
            </Link>
            <a
              href={platformWhatsappLink(`Hi, I'd like to set up ${BRAND_NAME} for my mandal.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-6 py-3 border border-white/30 text-white hover:bg-white hover:text-navy-900"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-theme py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between gap-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <LogoMark size={28} className="rounded-lg" />
                <span className="font-bold text-theme-fg text-sm">{BRAND_NAME}</span>
              </div>
              <p className="text-xs text-theme-fg/45">
                Digital receipts and honest accounts for Mandals, utsav samitis, temple trusts and community organizations.
              </p>
            </div>
            <div className="flex gap-12 flex-wrap">
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-saffron-500 mb-3">Product</h4>
                <div className="flex flex-col gap-2 text-xs text-theme-fg/50">
                  <a href="#how" className="hover:text-theme-fg">How it works</a>
                  <a href="#pricing" className="hover:text-theme-fg">Pricing</a>
                  <a href="#occasions" className="hover:text-theme-fg">Who it&apos;s for</a>
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-saffron-500 mb-3">Account</h4>
                <div className="flex flex-col gap-2 text-xs text-theme-fg/50">
                  <Link href="/login" className="hover:text-theme-fg">Sign In</Link>
                  <Link href="/register" className="hover:text-theme-fg">Register</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-saffron-500 mb-3">Reach Us</h4>
                <div className="flex flex-col gap-2 text-xs text-theme-fg/50">
                  <a href={platformWhatsappLink(`Hi, I have a question about ${BRAND_NAME}.`)} target="_blank" rel="noopener noreferrer" className="hover:text-theme-fg">WhatsApp Us</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-theme text-xs text-theme-fg/40">
            © {new Date().getFullYear()} {BRAND_NAME} · {BRAND_TAGLINE}
          </div>
        </div>
      </footer>
    </div>
  );
}
