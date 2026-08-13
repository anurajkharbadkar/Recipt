'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { PRICING_PLANS, formatCurrency } from '@pavti/shared';
import {
  BookOpen, QrCode, MessageCircle, FileText, Globe2, Users2, ShieldCheck,
  BarChart3, Palette, Check, Star, ArrowRight, Smartphone, Wallet,
} from 'lucide-react';

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

function PricingCard({ plan }: { plan: (typeof PRICING_PLANS)[number] }) {
  return (
    <div className={`relative glass-card p-6 flex flex-col ${plan.highlighted ? 'border-2 border-saffron-500 shadow-glow-saffron' : ''}`}>
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-saffron text-[10px] flex items-center gap-1 px-3 py-1">
          <Star size={10} /> MOST POPULAR
        </span>
      )}
      <h3 className="text-xl font-bold text-theme-fg mt-2">{plan.name}</h3>
      <p className="text-xs text-theme-fg/50 mt-1 min-h-[32px]">{plan.tagline}</p>
      <div className="mt-4 mb-1">
        <span className="text-3xl font-bold text-saffron-400">{formatCurrency(plan.priceInr)}</span>
      </div>
      <p className="text-[11px] text-theme-fg/40 mb-5">{plan.priceNote}</p>

      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm">
            <Check size={15} className={`shrink-0 mt-0.5 ${f.comingSoon ? 'text-theme-fg/30' : 'text-emerald-400'}`} />
            <span className={f.comingSoon ? 'text-theme-fg/40' : 'text-theme-fg/85'}>
              {f.label}
              {f.comingSoon && <span className="ml-1.5 badge badge-neutral text-[9px] align-middle">Coming Soon</span>}
              {f.description && <span className="block text-[11px] text-theme-fg/35 mt-0.5">{f.description}</span>}
            </span>
          </li>
        ))}
      </ul>

      <Link href={`/register?plan=${plan.id.toLowerCase()}`} className={plan.highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'}>
        Get Started <ArrowRight size={15} />
      </Link>
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
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-saffron">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-theme-fg">e Pavti Book</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm px-4">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
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
          <span className="inline-block badge badge-saffron text-xs mb-5">🪔 Built for Ganesh Mandals, Trusts & Community Organizations</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-theme-fg leading-tight mb-5">
            Your Donation Receipt Book, <span className="text-saffron-400">Digitized</span>
          </h1>
          <p className="text-sm sm:text-base text-theme-fg/60 max-w-2xl mx-auto mb-8">
            Issue digital pavtis with QR verification, deliver them over WhatsApp instantly, track every collector and campaign,
            and manage member subscriptions — all from your phone, in English, Hindi or Marathi.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="btn-primary px-6 py-3">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link href="#pricing" className="btn-secondary px-6 py-3">View Pricing</Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-theme-fg/40 flex-wrap">
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Secure & Reliable</span>
            <span className="flex items-center gap-1.5"><Smartphone size={13} /> Easy to Use</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={13} /> Dedicated Support</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-theme-fg mb-2">Everything Your Mandal Needs</h2>
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
          <h2 className="text-2xl sm:text-3xl font-bold text-theme-fg mb-2">Simple, Seasonal Pricing</h2>
          <p className="text-sm text-theme-fg/50">Pick a plan for the festival — pay once, use all season.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => <PricingCard key={plan.id} plan={plan} />)}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-theme py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-fg/40">
          <span>© {new Date().getFullYear()} e Pavti Book</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-theme-fg">Sign In</Link>
            <Link href="/register" className="hover:text-theme-fg">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
