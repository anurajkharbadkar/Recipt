'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
  PRICING_PLANS, formatCurrency, formatPlanLimit, MAX_ACTIVE_CAMPAIGNS_BY_PLAN, BRAND_NAME, BRAND_TAGLINE,
} from '@pavti/shared';
import { platformWhatsappLink } from '@/lib/platform';
import { ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';
import InteractivePavtiView from '@/components/receipt/InteractivePavtiView';

// Sample receipt — same structure the real portal uses when issuing a pavti.
// FESTIVE theme is the closest built-in design to the landing page's saffron
// palette so what visitors see here is never out of sync with the real product.
const HERO_PREVIEW_RECEIPT = {
  id: 'preview',
  receiptNumber: 'SGM-2026-0001',
  donorName: 'Rajendra Deshmukh',
  donorNameMarathi: 'राजेंद्र देशमुख',
  amount: 1100,
  amountInWords: 'One Thousand One Hundred Rupees Only',
  category: 'GENERAL',
  paymentMode: 'UPI',
  status: 'PAID',
  collectionType: 'DONATION',
  createdAt: '2026-08-21T12:00:00.000Z',
  collector: { name: 'Amit Joshi', nameMarathi: 'अमित जोशी' },
  area: { name: 'Kasba Peth', nameMarathi: 'कसबा पेठ' },
  campaign: {
    id: 'demo-campaign',
    name: 'Ganesh Utsav 2026',
    nameMarathi: 'गणेशोत्सव २०२६',
    organization: {
      id: 'demo-org',
      name: 'Shree Ganesh Mandal, Pune',
      nameMarathi: 'श्री गणेश मंडळ, पुणे',
      city: 'Pune',
      upiId: 'ganesh.mandal@upi',
      receiptTemplateSettings: {
        theme: 'FESTIVE',
        language: 'mr',
        interactiveTemplate: 'GANESHA_PORTRAIT_SAFFRON',
        shareMessage: 'नमस्कार! {{donorName}} यांनी {{organizationName}} ला ₹{{amount}} ची देणगी दिली. पावती पाहण्यासाठी: {{receiptUrl}}',
      },
    },
  },
} as any;

// ---------------------------------------------------------------------------
// Static page data
// ---------------------------------------------------------------------------

type Lang = 'en' | 'mr' | 'hi';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Issue the Pavti',
    titleMr: 'पावती द्या',
    titleHi: 'पावती जारी करें',
    desc: 'Generate a digital receipt the moment a donor pays — cash, UPI, or bank transfer.',
    descMr: 'देणगीदाराने पैसे भरताच डिजिटल पावती तयार करा — रोख, UPI किंवा बँक ट्रान्सफरने.',
    descHi: 'दानदाता के भुगतान करते ही डिजिटल पावती बनाएं — नकद, UPI या बैंक ट्रांसफर से.',
  },
  {
    step: '02',
    title: 'Collect Online',
    titleMr: 'ऑनलाइन स्वीकारा',
    titleHi: 'ऑनलाइन प्राप्त करें',
    desc: "Payments route straight to the cashier's account — no manual handoffs, no cash leakage.",
    descMr: 'पैसे थेट खजिनदाराच्या खात्यात जमा होतात, हातोहात देवाणघेवाणीची गरज नाही.',
    descHi: 'पैसा सीधे खजांची के खाते में जमा होता है, किसी हाथों-हाथ लेन-देन की जरूरत नहीं.',
  },
  {
    step: '03',
    title: 'Log Every Expense',
    titleMr: 'खर्चाची नोंद ठेवा',
    titleHi: 'हर खर्च दर्ज करें',
    desc: 'Track spends against collections so the balance is always current — not reconciled after the fact.',
    descMr: 'जमा व खर्चाचा ताळमेळ ठेवा, त्यामुळे शिल्लक नेहमी अद्ययावत राहते.',
    descHi: 'चंदे और खर्च का मिलान रखें ताकि बकाया राशि हमेशा अद्यतन रहे.',
  },
  {
    step: '04',
    title: 'Share the Record',
    titleMr: 'हिशोब सर्वांसोबत शेअर करा',
    titleHi: 'हिसाब सबके साथ साझा करें',
    desc: 'Committee members and donors see the same transparent, always-current account.',
    descMr: 'समिती सदस्य आणि देणगीदार दोघांनाही तोच पारदर्शक हिशोब दिसतो.',
    descHi: 'समिति सदस्य और दानदाता, दोनों को एक जैसा पारदर्शी हिसाब दिखता है.',
  },
];

const OCCASIONS: { en: string; mr: string; hi: string }[] = [
  { en: 'Ganesh Utsav Mandals', mr: 'गणेशोत्सव मंडळे', hi: 'गणेशोत्सव मंडल' },
  { en: 'Navratri Samitis', mr: 'नवरात्र समित्या', hi: 'नवरात्रि समितियां' },
  { en: 'Bhandara & Community Drives', mr: 'भंडारा व सामुदायिक उपक्रम', hi: 'भंडारा और सामुदायिक अभियान' },
  { en: 'Temple & Public Trusts', mr: 'सार्वजनिक ट्रस्ट', hi: 'सार्वजनिक ट्रस्ट' },
  { en: 'Housing Society Funds', mr: 'गृहनिर्माण सोसायटी निधी', hi: 'हाउसिंग सोसाइटी फंड' },
];

const ROTATOR_WORDS: Record<Lang, string[]> = {
  en: ['by your mandal.', 'by your utsav team.', 'by your trust.', 'for every donor.'],
  mr: ['तुमच्या मंडळासाठी.', 'तुमच्या उत्सव समितीसाठी.', 'तुमच्या ट्रस्टसाठी.', 'प्रत्येक देणगीदारासाठी.'],
  hi: ['आपके मंडल के लिए.', 'आपकी उत्सव समिति के लिए.', 'आपके ट्रस्ट के लिए.', 'हर दानदाता के लिए.'],
};

// ---------------------------------------------------------------------------
// Brand logotype — styled "E-PavtiBook" treatment
// ---------------------------------------------------------------------------
function BrandLogo({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };
  return (
    <span className={`font-bold tracking-wide leading-none ${sizes[size]}`}>
      <span className={dark ? 'text-[rgba(247,239,221,0.70)]' : 'text-saffron-900 dark:text-saffron-100'}>E-</span>
      <span className={dark ? 'text-[#E8C878]' : 'text-saffron-600 dark:text-saffron-400'}>Pavti</span>
      <span className={dark ? 'text-[rgba(247,239,221,0.70)]' : 'text-saffron-900 dark:text-saffron-100'}>Book</span>
    </span>
  );
}

// ---------------------------------------------------------------------------

/** Generic IntersectionObserver trigger — fires once when element enters viewport. */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

type RevealDir = 'up' | 'down' | 'left' | 'right' | 'scale';

/** Fade + directional slide in — use delay for stagger effects. */
function Reveal({
  children, className = '', delay = 0, dir = 'up', threshold,
}: {
  children: React.ReactNode; className?: string; delay?: number;
  dir?: RevealDir; threshold?: number;
}) {
  const { ref, visible } = useReveal(threshold);
  const hidden: Record<RevealDir, string> = {
    up:    'translateY(28px)',
    down:  'translateY(-28px)',
    left:  'translateX(32px)',
    right: 'translateX(-32px)',
    scale: 'scale(0.92)',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (dir === 'scale' ? 'scale(1)' : 'translate(0)') : hidden[dir],
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pricing card tones — identical property names across all 4 tones so the
// PricingCard skeleton stays truly uniform, only the values change.
// ---------------------------------------------------------------------------
const CARD_TONES = {
  free: {
    wrapper: 'border border-dashed border-saffron-300/50 dark:border-saffron-700/40 bg-[var(--card-bg)]',
    badge: null as string | null,
    badgeCls: '',
    eyebrow: 'text-saffron-500 dark:text-saffron-400',
    name: 'text-saffron-900 dark:text-saffron-100',
    tagline: 'text-saffron-900/45 dark:text-saffron-100/40',
    price: 'text-saffron-700 dark:text-saffron-300',
    priceUnit: 'text-saffron-900/40 dark:text-saffron-100/35',
    divider: 'border-saffron-200/50 dark:border-saffron-700/40',
    featureText: 'text-saffron-900/75 dark:text-saffron-100/65',
    cta: 'border-2 border-saffron-600/70 text-saffron-700 dark:text-saffron-300 hover:bg-saffron-600/8 dark:hover:bg-saffron-400/10',
    ctaLabel: 'Start Free Trial',
    whatsapp: 'text-saffron-900/35 dark:text-saffron-100/30 hover:text-saffron-700 dark:hover:text-saffron-300',
  },
  basic: {
    wrapper: 'border border-saffron-200/80 dark:border-saffron-800/60 bg-[var(--card-bg)] shadow-sm',
    badge: null as string | null,
    badgeCls: '',
    eyebrow: 'text-saffron-500 dark:text-saffron-400',
    name: 'text-saffron-900 dark:text-saffron-100',
    tagline: 'text-saffron-900/45 dark:text-saffron-100/40',
    price: 'text-saffron-700 dark:text-saffron-300',
    priceUnit: 'text-saffron-900/40 dark:text-saffron-100/35',
    divider: 'border-saffron-200/50 dark:border-saffron-700/40',
    featureText: 'text-saffron-900/75 dark:text-saffron-100/65',
    cta: 'bg-saffron-700 hover:bg-saffron-800 text-white shadow-md shadow-saffron-700/20',
    ctaLabel: 'Get Started',
    whatsapp: 'text-saffron-900/35 dark:text-saffron-100/30 hover:text-saffron-700 dark:hover:text-saffron-300',
  },
  standard: {
    wrapper: 'border-2 border-royal-600 bg-gradient-to-b from-white via-white to-royal-50/50 dark:from-[#16213E] dark:via-[#14203A] dark:to-[#121D35] shadow-2xl shadow-royal-900/15',
    badge: '🌟 Most Popular',
    badgeCls: 'bg-royal-600 text-white',
    eyebrow: 'text-royal-500 dark:text-royal-400',
    name: 'text-royal-900 dark:text-white',
    tagline: 'text-royal-900/50 dark:text-white/45',
    price: 'text-royal-600 dark:text-royal-400',
    priceUnit: 'text-royal-900/40 dark:text-white/35',
    divider: 'border-royal-200/60 dark:border-royal-700/40',
    featureText: 'text-royal-900/80 dark:text-white/75',
    cta: 'bg-royal-600 hover:bg-royal-700 text-white shadow-lg shadow-royal-600/30',
    ctaLabel: 'Get Started',
    whatsapp: 'text-royal-900/40 dark:text-white/30 hover:text-royal-700 dark:hover:text-royal-300',
  },
  premium: {
    wrapper: 'border-2 border-gold-500/60 bg-gradient-to-b from-[#FBF5E8] via-white to-[#FDF8EF] dark:from-[#2A1F0E] dark:via-[#231A0C] dark:to-[#1E160A] shadow-xl shadow-gold-900/10 dark:shadow-gold-900/30',
    badge: '👑 VIP Access',
    badgeCls: 'bg-gradient-to-r from-gold-500 to-gold-300 text-[#2A1A00] font-bold',
    eyebrow: 'text-gold-600 dark:text-gold-400',
    name: 'text-gold-800 dark:text-gold-300',
    tagline: 'text-gold-900/50 dark:text-saffron-200/55',
    price: 'text-gold-700 dark:text-gold-400',
    priceUnit: 'text-gold-900/40 dark:text-saffron-200/45',
    divider: 'border-gold-400/30 dark:border-gold-500/20',
    featureText: 'text-gold-900/80 dark:text-saffron-100/80',
    cta: 'bg-gradient-to-r from-gold-600 to-gold-500 text-white hover:brightness-105 shadow-lg shadow-gold-500/30',
    ctaLabel: 'Get Started',
    whatsapp: 'text-gold-900/35 dark:text-saffron-300/40 hover:text-gold-700 dark:hover:text-gold-300',
  },
} as const;

// Trimmed to differentiators only — table-stakes features common to all plans
// (QR verification, WhatsApp sharing, expense tracking, reports, multi-language,
// multi-role, PDF download) are surfaced in the footnote below the grid so
// the cards stay short and scannable.
const PLAN_FEATURES: Record<string, { label: string; highlight?: boolean }[]> = {
  FREE: [
    { label: 'Up to 10 digital pavtis' },
    { label: 'Up to 5 collectors' },
    { label: '1 active festival or drive' },
    { label: 'No payment needed to start', highlight: true },
  ],
  BASIC: [
    { label: 'Unlimited digital pavtis', highlight: true },
    { label: 'Up to 5 collectors' },
    { label: '1 active festival or drive' },
    { label: 'PDF download & print' },
  ],
  STANDARD: [
    { label: 'Unlimited digital pavtis', highlight: true },
    { label: 'Up to 10 collectors', highlight: true },
    { label: 'Run 2 festivals at once', highlight: true },
    { label: 'Your branding on every pavti', highlight: true },
    { label: 'Mandal UPI ID on every pavti', highlight: true },
    { label: 'PDF download & print' },
  ],
  PREMIUM: [
    { label: 'Unlimited digital pavtis', highlight: true },
    { label: 'Unlimited collectors', highlight: true },
    { label: 'Run up to 5 festivals at once', highlight: true },
    { label: 'Your branding on every pavti', highlight: true },
    { label: 'Mandal UPI ID on every pavti', highlight: true },
    { label: 'Cinematic 4-slide pavti experience', highlight: true },
    { label: 'Full activity log', highlight: true },
  ],
};

type ToneKey = keyof typeof CARD_TONES;





function PricingCard({ plan }: { plan: (typeof PRICING_PLANS)[number] }) {
  const toneKey: ToneKey =
    plan.id === 'FREE' ? 'free'
    : plan.id === 'BASIC' ? 'basic'
    : plan.id === 'STANDARD' ? 'standard'
    : 'premium';
  const tone = CARD_TONES[toneKey];
  const features = PLAN_FEATURES[plan.id] ?? [];

  return (
    <div className={`relative rounded-2xl p-5 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${tone.wrapper}`}>

      {tone.badge && (
        <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] px-3.5 py-1 rounded-full whitespace-nowrap shadow-sm ${tone.badgeCls}`}>
          {tone.badge}
        </span>
      )}

      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${tone.eyebrow}`}>{plan.positioningLine}</p>

      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <h3 className={`text-[1.35rem] font-bold leading-tight ${tone.name}`}>{plan.name}</h3>
        <span className={`text-xs ${tone.tagline}`}>{plan.marathiDescriptor}</span>
      </div>

      <p className={`text-xs leading-relaxed mb-4 ${tone.tagline}`}>{plan.tagline}</p>

      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className={`text-[1.75rem] font-extrabold leading-none ${tone.price}`}>{formatCurrency(plan.priceInr)}</span>
        {plan.priceInr > 0 && <span className={`text-xs font-semibold ${tone.priceUnit}`}>/ season</span>}
      </div>
      <p className={`text-[11px] mb-4 ${tone.priceUnit}`}>{plan.priceNote}</p>

      <div className={`border-t mb-4 ${tone.divider}`} />

      <ul className="space-y-2.5 mb-5 flex-1">
        {features.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-[12px]">
            <span className={`shrink-0 mt-[3px] w-[5px] h-[5px] rounded-full ${f.highlight ? 'bg-current opacity-80' : 'opacity-30 bg-current'}`} />
            <span className={`leading-snug ${f.highlight ? `font-semibold ${tone.featureText}` : `${tone.featureText} opacity-75`}`}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={`/register?plan=${plan.id.toLowerCase()}`}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all duration-200 ${tone.cta}`}
      >
        {tone.ctaLabel} <ArrowRight size={14} />
      </Link>

      {plan.priceInr > 0 && (
        <a
          href={platformWhatsappLink(
            `Hi, I'd like to request access to the ${plan.name} plan (${formatCurrency(plan.priceInr)}) for my mandal.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-1.5 mt-2.5 py-2 rounded-full text-xs font-semibold transition-colors ${tone.whatsapp}`}
        >
          <MessageCircle size={12} /> Request access via WhatsApp
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>('en');
  const [rotatorIdx, setRotatorIdx] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setRotatorIdx((i) => (i + 1) % 4), 2000);
    return () => clearInterval(id);
  }, []);

  const t = (en: string, mr: string, hi: string) =>
    lang === 'mr' ? mr : lang === 'hi' ? hi : en;

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-saffron-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Hero pavti card float ── */
        @keyframes floatCard {
          0%,100% { transform: rotate(-3deg) translateY(0px); }
          50%      { transform: rotate(-1.5deg) translateY(-12px); }
        }

        /* ── Hero rotator word ── */
        .rotator-word {
          display: inline-block;
          animation: fadeWord 2s ease-in-out infinite;
        }
        @keyframes fadeWord {
          0%      { opacity: 0; transform: translateY(8px); }
          15%,80% { opacity: 1; transform: translateY(0); }
          100%    { opacity: 0; transform: translateY(-8px); }
        }

        /* ── Shimmer sweep on CTA buttons ── */
        .btn-shimmer {
          position: relative;
          overflow: hidden;
        }
        .btn-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0s;
        }
        .btn-shimmer:hover::after {
          transform: translateX(100%);
          transition: transform 0.55s ease;
        }

        /* ── Pulse glow on highlighted feature dots ── */
        @keyframes dotPulse {
          0%,100% { opacity: 0.8; }
          50%      { opacity: 1; box-shadow: 0 0 0 3px currentColor; }
        }
        .feature-dot-highlight { animation: dotPulse 3s ease-in-out infinite; }

        /* ── Section bg gradient drift ── */
        @keyframes gradDrift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .grad-drift {
          background-size: 200% 200%;
          animation: gradDrift 12s ease infinite;
        }

        /* ── Hover lift on cards ── */
        .card-lift {
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .card-lift:hover { transform: translateY(-6px); }

        /* ── Stat number count-up (font variant) ── */
        .stat-num { font-variant-numeric: tabular-nums; }

        /* ── Soft scroll-fade for section dividers ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      ` }} />

      <div className="min-h-screen">

        {/* ============================================================ NAV */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: navScrolled ? 'rgba(250,247,240,0.93)' : 'transparent',
            backdropFilter: navScrolled ? 'blur(10px)' : 'none',
            borderBottom: navScrolled ? '1px solid rgba(96,48,0,0.10)' : '1px solid transparent',
            padding: navScrolled ? '14px 0' : '20px 0',
          }}
        >
          <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <LogoMark size={32} className="rounded-xl" />
              <BrandLogo size="md" />
            </div>

            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-saffron-900/70 dark:text-saffron-100/70">
              <a href="#how" className="hover:text-saffron-700 dark:hover:text-saffron-300 transition-colors">{t('How it works', 'कसे काम करते', 'यह कैसे काम करता है')}</a>
              <a href="#occasions" className="hover:text-saffron-700 dark:hover:text-saffron-300 transition-colors">{t('For your mandal', 'तुमच्या मंडळासाठी', 'आपके मंडल के लिए')}</a>
              <a href="#pricing" className="hover:text-saffron-700 dark:hover:text-saffron-300 transition-colors">{t('Pricing', 'किंमत योजना', 'मूल्य योजनाएं')}</a>
              <a href="#contact" className="hover:text-saffron-700 dark:hover:text-saffron-300 transition-colors">{t('Contact', 'संपर्क', 'संपर्क')}</a>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex border border-saffron-800/20 rounded-full p-[3px]" role="group" aria-label="Language">
                {(['en', 'mr', 'hi'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLangState(l)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${
                      lang === l
                        ? 'bg-saffron-700 text-white'
                        : 'text-saffron-800/70 dark:text-saffron-200/70 hover:bg-saffron-100/60 dark:hover:bg-saffron-900/30'
                    }`}
                  >
                    {l === 'en' ? 'EN' : l === 'mr' ? 'मर' : 'हि'}
                  </button>
                ))}
              </div>

              <Link href="/login" className="hidden sm:inline-flex text-sm font-semibold text-saffron-800 dark:text-saffron-200 hover:text-saffron-600 transition-colors">
                {t('Sign In', 'लॉग इन', 'लॉग इन')}
              </Link>

              <Link
                href="/register"
                className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-full bg-saffron-700 hover:bg-saffron-800 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-saffron-700/25"
              >
                {t('Get Started', 'सुरुवात करा', 'शुरू करें')}
              </Link>
            </div>
          </div>
        </nav>

        {/* =========================================================== HERO */}
        <header className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center max-w-6xl mx-auto px-5 md:px-8 pt-40 pb-20">
          <Reveal dir="right" threshold={0.05}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-saffron-700 border border-saffron-500/50 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
              {t('Digital Pavtis · Honest Accounts', 'डिजिटल पावती · प्रामाणिक हिशोब', 'डिजिटल पावती · ईमानदार हिसाब')}
            </span>

            <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-tight text-saffron-900 dark:text-saffron-50 mb-5">
              {t('Every pavti, every rupee', 'प्रत्येक पावती, प्रत्येक रुपया', 'हर पावती, हर रुपया')}
              <span className="block mt-2">
                {t('— accounted for', '— हिशोबात,', '— का हिसाब,')}{' '}
                <span
                  className="inline-block rounded-xl px-4 py-1 text-[#4A3A0E]"
                  style={{ background: 'linear-gradient(135deg,#E8C878,#C89B3C)', boxShadow: '0 8px 20px -6px rgba(201,162,39,0.50)' }}
                >
                  <span key={rotatorIdx} className="rotator-word">{ROTATOR_WORDS[lang][rotatorIdx]}</span>
                </span>
              </span>
            </h1>

            <p className="text-base text-saffron-900/60 dark:text-saffron-100/60 max-w-lg mb-8 leading-relaxed">
              {t(
                `${BRAND_NAME} replaces the carbon-copy receipt book with digital pavtis, live expense logs and donation records every committee member and donor can see — for mandals, utsav samitis and public trusts.`,
                `${BRAND_NAME} कार्बन-कॉपी पावती पुस्तिकेच्या जागी डिजिटल पावती, लाइव्ह खर्चाचा हिशोब व देणगीच्या नोंदी आणते — मंडळे, उत्सव समित्या व सार्वजनिक ट्रस्टसाठी.`,
                `${BRAND_NAME} कार्बन-कॉपी पावती बुक की जगह डिजिटल पावती, लाइव खर्च का हिसाब और दान का रिकॉर्ड लाता है — मंडल, उत्सव समितियों और सार्वजनिक ट्रस्ट के लिए.`,
              )}
            </p>

            <div className="flex gap-3 flex-wrap mb-6">
              <a
                href="#pricing"
                className="btn-shimmer flex items-center gap-2 px-6 py-3 rounded-full bg-saffron-700 hover:bg-saffron-800 text-white font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-saffron-700/30"
              >
                {t('See plans', 'योजना पहा', 'योजनाएं देखें')} <ArrowRight size={15} />
              </a>
              <a
                href="#how"
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-saffron-800/25 dark:border-saffron-200/25 text-saffron-800 dark:text-saffron-200 font-semibold hover:bg-saffron-800/5 transition-all"
              >
                {t('How it works', 'कसे काम करते', 'यह कैसे काम करता है')}
              </a>
            </div>

            <div className="flex items-center gap-2 text-sm text-saffron-900/50 dark:text-saffron-100/40">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
              {t(
                'Built for Ganesh Utsav, Navratri and everyday mandal collections',
                'गणेशोत्सव, नवरात्र आणि दैनंदिन मंडळ वर्गणीसाठी तयार',
                'गणेशोत्सव, नवरात्रि और रोज़मर्रा की मंडल वसूली के लिए बनाया गया',
              )}
            </div>
          </Reveal>

          <Reveal dir="left" delay={200} className="flex justify-center lg:justify-end">
            {/* ── Interactive Pavti Demo ─────────────────────────────────────
                Visitors see the real cinematic 4-slide experience that their
                donors will receive. Sound is muted by default — they can
                unmute inside the viewer. The wrapper constrains it to a
                phone-frame so it doesn't dominate the hero layout. */}
            <div className="relative w-full max-w-[340px]">
              {/* Demo label */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-saffron-700 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-saffron-900/30 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                Live Demo — try it!
              </div>
              {/* Phone frame */}
              <div
                className="rounded-[2rem] overflow-hidden border-2 border-saffron-900/20 shadow-2xl shadow-saffron-900/20"
                style={{ height: '580px', position: 'relative' }}
              >
                <InteractivePavtiView
                  receipt={HERO_PREVIEW_RECEIPT}
                  language="mr"
                  defaultMuted={true}
                  embedded={true}
                />
              </div>
              {/* Scroll hint */}
              <p className="text-center text-[10px] text-saffron-900/35 dark:text-saffron-100/30 mt-2.5">
                Scroll inside to explore all 4 slides
              </p>
            </div>
          </Reveal>
        </header>

        {/* ========================================================== ABOUT */}
        <section id="about" className="max-w-6xl mx-auto px-5 md:px-8 py-20">
          <Reveal>
            <div className="max-w-xl mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-saffron-600 dark:text-saffron-400">
                {t('About', 'आमच्याबद्दल', 'हमारे बारे में')}
              </span>
              <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-bold text-saffron-900 dark:text-saffron-50 mt-2 leading-tight">
                {t('Trust is the real currency mandals run on', 'विश्वास हेच मंडळांचे खरे भांडवल आहे', 'विश्वास ही वह असली पूंजी है जिस पर मंडल चलते हैं')}
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <p className="text-saffron-900/60 dark:text-saffron-100/55 leading-relaxed text-sm">
                {t(
                  'Every mandal collects on trust — from members, from neighbours, from donors who expect their contribution to be recorded and used the way it was promised. Paper receipt books make that hard to prove after the fact.',
                  'प्रत्येक मंडळ विश्वासावर वर्गणी गोळा करते — सदस्यांकडून, शेजाऱ्यांकडून, देणगीदारांकडून जे आपल्या योगदानाची नोंद व्हावी अशी अपेक्षा ठेवतात. कागदी पावती पुस्तिकेत हे नंतर सिद्ध करणे कठीण जाते.',
                  'हर मंडल विश्वास पर चंदा इकट्ठा करता है — सदस्यों से, पड़ोसियों से, उन दानदाताओं से जो चाहते हैं कि उनका योगदान दर्ज हो। कागज़ी पावती बुक में यह बाद में साबित करना मुश्किल होता है.',
                )}
              </p>
              <p className="text-saffron-900/60 dark:text-saffron-100/55 leading-relaxed text-sm">
                {t(
                  `${BRAND_NAME} turns every collection into a digital pavti, logged the moment it's issued, with expenses and balances any committee member — or donor — can check. No more reconciling carbon copies after the utsav ends.`,
                  `${BRAND_NAME} प्रत्येक वर्गणीला डिजिटल पावतीत रूपांतरित करते, ती दिली जाताच नोंदवली जाते — खर्च आणि शिल्लक कोणताही समिती सदस्य तपासू शकतो. उत्सव संपल्यावर कार्बन कॉपी जुळवण्याची गरज उरत नाही.`,
                  `${BRAND_NAME} हर चंदे को डिजिटल पावती में बदल देता है, जो मिलते ही दर्ज हो जाती है — खर्च और बकाया कोई भी समिति सदस्य देख सकता है। उत्सव खत्म होने के बाद कार्बन कॉपी मिलाने की जरूरत नहीं रहती.`,
                )}
              </p>
          </div>
        </section>

        {/* ====================================================== HOW IT WORKS */}
        <section id="how" className="border-y" style={{ background: 'var(--card-bg)', borderColor: 'rgba(96,48,0,0.10)' }}>
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-20">
            <Reveal className="max-w-xl mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-saffron-600 dark:text-saffron-400">
                {t('How it works', 'कसे काम करते', 'यह कैसे काम करता है')}
              </span>
              <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-bold text-saffron-900 dark:text-saffron-50 mt-2 leading-tight">
                {t('From collection to accounted-for, in four steps', 'वर्गणी ते हिशोब, अवघ्या चार टप्प्यांत', 'चंदे से हिसाब तक, सिर्फ चार चरणों में')}
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-saffron-200/40 dark:divide-saffron-900/40 border border-saffron-200/40 dark:border-saffron-900/40 rounded-2xl overflow-hidden">
              {HOW_IT_WORKS.map((step, i) => (
                <Reveal key={step.step} delay={i * 100} dir="up" threshold={0.08}>
                  <div className="px-6 py-7 h-full" style={{ background: 'var(--card-bg)' }}>
                    <span className="font-mono text-xs font-bold text-gold-500/70">{step.step}</span>
                    <h3 className="font-semibold text-saffron-900 dark:text-saffron-50 text-sm mt-2 mb-2">
                      {lang === 'mr' ? step.titleMr : lang === 'hi' ? step.titleHi : step.title}
                    </h3>
                    <p className="text-xs text-saffron-900/55 dark:text-saffron-100/50 leading-relaxed">
                      {lang === 'mr' ? step.descMr : lang === 'hi' ? step.descHi : step.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================= OCCASIONS */}
        <section id="occasions" className="max-w-6xl mx-auto px-5 md:px-8 py-16">
          <Reveal>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-saffron-900/40 dark:text-saffron-100/40 shrink-0">
                {t('Built for —', 'यांच्यासाठी खास —', 'इनके लिए खास —')}
              </span>
              {OCCASIONS.map((o, i) => (
                <span
                  key={o.en}
                  className="text-xs px-4 py-2 rounded-full border border-saffron-300/50 dark:border-saffron-700/40 text-saffron-900/60 dark:text-saffron-100/50 inline-block"
                  style={{ background: 'var(--card-bg)', animation: `fadeUp 0.5s ease both`, animationDelay: `${i * 50}ms` }}
                >
                  {lang === 'mr' ? o.mr : lang === 'hi' ? o.hi : o.en}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ========================================================= PRICING */}
        <section id="pricing" className="max-w-6xl mx-auto px-5 md:px-8 py-20">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-saffron-600 dark:text-saffron-400">
              {t('Pricing', 'किंमत योजना', 'मूल्य योजनाएं')}
            </span>
            <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-bold text-saffron-900 dark:text-saffron-50 mt-2">
              {t('Choose the experience your Mandal deserves', 'तुमच्या मंडळासाठी योग्य योजना निवडा', 'अपने मंडल के लिए सही योजना चुनें')}
            </h2>
            <p className="text-sm text-saffron-900/50 dark:text-saffron-100/40 mt-2 max-w-lg mx-auto">
              {t('One price per festival season — not a recurring subscription.', 'एका उत्सव हंगामासाठी एक किंमत — मासिक शुल्क नाही.', 'एक त्योहार के मौसम के लिए एक कीमत — मासिक सदस्यता नहीं.')}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRICING_PLANS.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 90} dir="up" threshold={0.08}>
                <PricingCard plan={plan} />
              </Reveal>
            ))}
          </div>

          {/* ── Baseline features footnote ─────────────────────────────────── */}
          <Reveal delay={200}>
            <p className="text-center text-[11px] text-saffron-900/40 dark:text-saffron-100/35 mt-6 max-w-xl mx-auto leading-relaxed">
              {t(
                'Every plan includes QR-verified pavtis, WhatsApp sharing, income & expense tracking, reports, PDF download, and Marathi · Hindi · English support.',
                'सर्व योजनांमध्ये QR-पडताळणी, WhatsApp शेअरिंग, जमा-खर्च हिशोब, अहवाल, PDF डाउनलोड आणि मराठी · हिंदी · इंग्रजी भाषा आहे.',
                'सभी योजनाओं में QR-सत्यापन, WhatsApp शेयरिंग, आय-व्यय ट्रैकिंग, रिपोर्ट, PDF डाउनलोड और मराठी · हिंदी · अंग्रेज़ी भाषा शामिल है।',
              )}
            </p>
          </Reveal>

          {/* Collapsible comparison table */}
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setCompareOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-600 hover:text-saffron-700 dark:text-saffron-400 transition-colors"
            >
              {compareOpen
                ? t('Hide comparison', 'तुलना लपवा', 'तुलना छुपाएं')
                : t('Compare all plans in detail', 'सर्व योजनांची तुलना करा', 'सभी योजनाओं की तुलना करें')}
              <ChevronDown size={15} className={`transition-transform duration-300 ${compareOpen ? 'rotate-180' : ''}`} />
            </button>

            {compareOpen && (
              <div className="mt-6 rounded-2xl border border-saffron-200/50 dark:border-saffron-900/50 overflow-x-auto text-left" style={{ background: 'var(--card-bg)' }}>
                <table className="w-full min-w-[540px] text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-saffron-200/40 dark:border-saffron-900/40">
                      <th className="text-left py-3 px-5 text-saffron-900/40 dark:text-saffron-100/40 font-semibold uppercase tracking-wide">{t('Feature', 'वैशिष्ट्य', 'विशेषता')}</th>
                      {PRICING_PLANS.map((p) => (
                        <th key={p.id} className="text-left py-3 px-4 font-bold text-saffron-800 dark:text-saffron-200">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      // Driven by the real plan data (MAX_*_BY_PLAN, both
                      // already enforced server-side) rather than repeated
                      // literals, so this table can't silently drift out of
                      // sync the way a hand-copied ['1','1','2','5'] would.
                      { label: t('Digital Pavtis', 'डिजिटल पावत्या', 'डिजिटल पावतियां'), values: PRICING_PLANS.map((p) => formatPlanLimit(p.receiptLimit, '')) },
                      { label: t('Field Collectors', 'कार्यकर्ते', 'कार्यकर्ता'), values: PRICING_PLANS.map((p) => formatPlanLimit(p.collectorLimit, '')) },
                      { label: t('Active Campaigns', 'मोहिमा', 'अभियान'), values: PRICING_PLANS.map((p) => String(MAX_ACTIVE_CAMPAIGNS_BY_PLAN[p.id])) },
                      { label: t('WhatsApp Delivery', 'व्हॉट्सॲप शेअर', 'व्हाट्सएप शेयर'), values: ['✓', '✓', '✓', '✓'] },
                      { label: t('QR Code Verification', 'QR पडताळणी', 'QR सत्यापन'), values: ['✓', '✓', '✓', '✓'] },
                      // Every plan actually includes this (see the footnote
                      // just above the table, and resolvePlanFeatures's FREE
                      // entry) — was previously shown as "—" for FREE, which
                      // directly contradicted that footnote on the same page.
                      { label: t('Income & Expense Tracking', 'जमा-खर्च हिशोब', 'आय-व्यय ट्रैकिंग'), values: ['✓', '✓', '✓', '✓'] },
                      { label: t('Custom Branding', 'कस्टम ब्रँडिंग', 'कस्टम ब्रांडिंग'), values: ['—', '—', '✓', '✓'] },
                      { label: t('Devotional Pavti Experience', 'दर्शन पावती अनुभव', 'दर्शन पावती अनुभव'), values: ['—', '—', '—', '✓'] },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-saffron-200/30 dark:border-saffron-900/30 last:border-0">
                        <td className="py-2.5 px-5 font-medium text-saffron-900/60 dark:text-saffron-100/60">{row.label}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className={`py-2.5 px-4 font-semibold ${v === '✓' ? 'text-success-500' : v === '—' ? 'text-saffron-900/20 dark:text-saffron-100/20' : 'text-saffron-800 dark:text-saffron-200'}`}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================= CTA */}
        <section id="contact" style={{ background: 'radial-gradient(130% 150% at 20% 0%,#3B1310 0%,#260B09 70%)' }}>
          <div className="max-w-3xl mx-auto px-5 md:px-8 py-20 text-center">
            <Reveal>
              <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
                {t('Get started', 'सुरुवात करा', 'शुरू करें')}
              </span>
              <h2 className="text-[clamp(1.7rem,3.5vw,2.5rem)] font-bold text-[#FBF3DE] mt-3 mb-4">
                {t('Bring your next collection online', 'तुमची पुढील वर्गणी ऑनलाइन आणा', 'अपनी अगली वसूली ऑनलाइन लाएं')}
              </h2>
              <p className="text-sm max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: 'rgba(247,239,221,0.65)' }}>
                {t(
                  "Set up your mandal's digital pavti book before the next utsav — start free, or talk to us on WhatsApp and we'll help you pick the right plan.",
                  'पुढील उत्सवापूर्वी तुमच्या मंडळाचे डिजिटल पावती बुक सुरू करा — विनामूल्य सुरू करा किंवा आमच्याशी बोला.',
                  'अगले उत्सव से पहले अपने मंडल की डिजिटल पावती बुक शुरू करें — मुफ्त शुरू करें या हमसे बात करें.',
                )}
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-saffron-600 hover:bg-saffron-700 text-white font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-saffron-700/30"
                >
                  {t('Start Free Trial', 'मोफत सुरुवात करा', 'मुफ्त शुरू करें')} <ArrowRight size={15} />
                </Link>
                <a
                  href={platformWhatsappLink(`Hi, I'd like to set up ${BRAND_NAME} for my mandal.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all"
                  style={{ border: '1px solid rgba(247,239,221,0.35)', color: '#F7EFDD' }}
                >
                  <MessageCircle size={15} /> {t('Chat on WhatsApp', 'व्हॉट्सॲपवर बोला', 'व्हाट्सएप पर बात करें')}
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========================================================== FOOTER */}
        <footer style={{ background: '#260B09', color: 'rgba(247,239,221,0.60)' }} className="pt-12 pb-8">
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            <div className="flex flex-col sm:flex-row justify-between gap-10 flex-wrap">
              <div className="max-w-xs">
                <div className="flex items-center gap-2.5 mb-3">
                  {/* forceTheme="dark": this footer's background is
                      hardcoded dark regardless of the site's own theme
                      toggle — same reason BrandLogo takes its own `dark`
                      prop right below instead of reading site theme. */}
                  <LogoMark size={26} className="rounded-lg" forceTheme="dark" />
                  <BrandLogo size="sm" dark />
                </div>
                <p className="text-xs leading-relaxed">
                  {t(
                    'Digital pavtis and honest accounts for mandals, utsav samitis and public trusts.',
                    'मंडळे, उत्सव समित्या आणि सार्वजनिक ट्रस्टसाठी डिजिटल पावती व प्रामाणिक हिशोब.',
                    'मंडल, उत्सव समितियों और सार्वजनिक ट्रस्ट के लिए डिजिटल पावती और ईमानदार हिसाब.',
                  )}
                </p>
              </div>

              <div className="flex gap-14 flex-wrap">
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#C89B3C' }}>
                    {t('Product', 'उत्पादन', 'उत्पाद')}
                  </h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <a href="#how" className="transition-colors hover:text-[#F7EFDD]">{t('How it works', 'कसे काम करते', 'यह कैसे काम करता है')}</a>
                    <a href="#pricing" className="transition-colors hover:text-[#F7EFDD]">{t('Pricing', 'किंमत योजना', 'मूल्य योजनाएं')}</a>
                    <a href="#occasions" className="transition-colors hover:text-[#F7EFDD]">{t("Who it's for", 'कोणासाठी', 'किनके लिए')}</a>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#C89B3C' }}>
                    {t('Account', 'खाते', 'खाता')}
                  </h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <Link href="/login" className="transition-colors hover:text-[#F7EFDD]">{t('Sign In', 'लॉग इन', 'लॉग इन')}</Link>
                    <Link href="/register" className="transition-colors hover:text-[#F7EFDD]">{t('Register', 'नोंदणी', 'रजिस्टर')}</Link>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#C89B3C' }}>
                    {t('Reach us', 'आमच्याशी संपर्क', 'हमसे संपर्क करें')}
                  </h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <a href="mailto:hello@epavtibook.com" className="transition-colors hover:text-[#F7EFDD]">hello@epavtibook.com</a>
                    <a href="mailto:support@epavtibook.com" className="transition-colors hover:text-[#F7EFDD]">support@epavtibook.com</a>
                    <a href="mailto:sales@epavtibook.com" className="transition-colors hover:text-[#F7EFDD]">sales@epavtibook.com</a>
                    <a
                      href={platformWhatsappLink(`Hi, I have a question about ${BRAND_NAME}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-[#F7EFDD]"
                    >
                      {t('WhatsApp Us', 'व्हॉट्सॲप करा', 'व्हाट्सएप करें')}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-10 pt-5 flex flex-col sm:flex-row justify-between gap-2 text-[11px]"
              style={{ borderTop: '1px solid rgba(247,239,221,0.12)' }}
            >
              <span>© {new Date().getFullYear()} {BRAND_NAME} · {BRAND_TAGLINE}</span>
              <span style={{ color: 'rgba(247,239,221,0.35)' }}>
                {t('Made with devotion in India 🇮🇳', 'भारतात श्रद्धेने बनवले 🇮🇳', 'भारत में श्रद्धा से बनाया 🇮🇳')}
              </span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
