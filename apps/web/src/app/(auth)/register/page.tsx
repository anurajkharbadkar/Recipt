'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PRICING_PLANS, SubscriptionPlan, formatCurrency } from '@pavti/shared';
import { platformWhatsappLink } from '@/lib/platform';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Check, Star, MessageCircle, KeyRound, Copy, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  // Shown once, right after signup — this is the only time an admin is
  // guaranteed to be looking at the screen when their Mandal Code exists.
  // It's always in Settings afterward, but nobody reads Settings on day
  // one, and every collector they add needs this to actually log in.
  const [newMandalCode, setNewMandalCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const preselected = searchParams.get('plan')?.toUpperCase();
  const [form, setForm] = useState({
    organizationName: '',
    organizationNameMarathi: '',
    adminName: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    // Explicit lookup rather than a hardcoded array index — PRICING_PLANS[1]
    // used to be STANDARD before FREE was added as the first card, and would
    // have silently defaulted new signups to BASIC otherwise.
    subscriptionPlan: PRICING_PLANS.some((p) => p.id === preselected) ? preselected! : SubscriptionPlan.STANDARD,
  });

  const set = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }));

  const canSubmit = form.organizationName && form.adminName && form.phone.length >= 10
    && form.password.length >= 8 && form.address && form.city;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const data = await authApi.register(form);
      setAuth(data);
      toast.success('Account created! 🙏');
      setNewMandalCode(data.organization?.mandalCode || null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = PRICING_PLANS.find((p) => p.id === form.subscriptionPlan);

  const handleCopyCode = () => {
    if (!newMandalCode) return;
    navigator.clipboard.writeText(newMandalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (newMandalCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-saffron-500/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={26} className="text-saffron-500" />
          </div>
          <h2 className="text-lg font-bold text-theme-fg mb-1">Your Mandal Code</h2>
          <p className="text-xs text-theme-fg/50 mb-5">
            Every collector or treasurer you add needs this — along with their own phone number and password — to log in. Share it with them, and keep it somewhere you won&apos;t lose (it&apos;s also always in Settings).
          </p>
          <button
            onClick={handleCopyCode}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-saffron-500/10 border-2 border-dashed border-saffron-500/40 hover:border-saffron-500/60 transition-colors mb-5"
          >
            <span className="text-2xl font-extrabold tracking-[0.2em] text-saffron-600">{newMandalCode}</span>
            {copied ? <CheckCheck size={18} className="text-emerald-500" /> : <Copy size={16} className="text-theme-fg/40" />}
          </button>
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
            Continue to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mx-auto mb-4">
            <LogoMark size={64} className="rounded-2xl" />
          </Link>
          <h1 className="text-2xl font-bold text-theme-fg">Register Your Mandal</h1>
          <p className="text-sm text-theme-fg/40 mt-1 font-devanagari">आपल्या मंडळाची नोंदणी करा</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Details */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-theme-fg mb-4">Organization Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Organization Name *</label>
                <input value={form.organizationName} onChange={e => set({ organizationName: e.target.value })} className="form-input" placeholder="Shree Ganesh Mandal" required />
              </div>
              <div>
                <label className="form-label">मराठी नाव</label>
                <input value={form.organizationNameMarathi} onChange={e => set({ organizationNameMarathi: e.target.value })} className="form-input font-devanagari" placeholder="श्री गणेश मंडळ" />
              </div>
              <div>
                <label className="form-label">City *</label>
                <input value={form.city} onChange={e => set({ city: e.target.value })} className="form-input" placeholder="Pune" required />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Address *</label>
                <input value={form.address} onChange={e => set({ address: e.target.value })} className="form-input" placeholder="123, MG Road" required />
              </div>
              <div>
                <label className="form-label">State</label>
                <input value={form.state} onChange={e => set({ state: e.target.value })} className="form-input" />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-theme-fg mb-4">Your Admin Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Your Name *</label>
                <input value={form.adminName} onChange={e => set({ adminName: e.target.value })} className="form-input" placeholder="Rajesh Kumar" required />
              </div>
              <div>
                <label className="form-label">Mobile Number *</label>
                <input value={form.phone} onChange={e => set({ phone: e.target.value })} className="form-input" placeholder="98XXXXXXXX" type="tel" inputMode="numeric" required />
              </div>
              <div>
                <label className="form-label">Email (optional)</label>
                <input value={form.email} onChange={e => set({ email: e.target.value })} className="form-input" placeholder="admin@mandal.org" type="email" />
              </div>
              <div>
                <label className="form-label">Password *</label>
                <input value={form.password} onChange={e => set({ password: e.target.value })} className="form-input" placeholder="At least 8 characters" type="password" required />
              </div>
            </div>
          </div>

          {/* Plan Picker */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-theme-fg mb-1">Choose Your Plan</h3>
            <p className="text-xs text-theme-fg/40 mb-4">
              {form.subscriptionPlan === SubscriptionPlan.FREE
                ? "Free — no payment needed, you're active immediately."
                : 'You can start using the app right away — your plan activates once payment is confirmed.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRICING_PLANS.map((plan) => {
                const selected = form.subscriptionPlan === plan.id;
                const isFree = plan.id === 'FREE';
                const isStandard = plan.id === 'STANDARD';
                const isPremium = plan.id === 'PREMIUM';

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => set({ subscriptionPlan: plan.id })}
                    className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                      selected
                        ? isStandard
                          ? 'border-royal-600 bg-royal-50 dark:bg-royal-900/30 shadow-md shadow-royal-900/10'
                          : isPremium
                          ? 'border-gold-500 bg-amber-50 dark:bg-[#2A1A06] shadow-md shadow-gold-900/20'
                          : isFree
                          ? 'border-saffron-400 bg-saffron-50 dark:bg-saffron-900/20 shadow-sm'
                          : 'border-saffron-600 bg-saffron-50 dark:bg-saffron-900/20 shadow-md shadow-saffron-900/10'
                        : 'border-theme hover:border-saffron-400/50 bg-[var(--card-bg)] hover:bg-saffron-50/40 dark:hover:bg-saffron-900/10'
                    }`}
                  >
                    {isStandard && (
                      <span className="absolute -top-2.5 right-3 badge-royal text-[9px] flex items-center gap-0.5 font-bold">
                        <Star size={9} className="fill-gold-500 text-gold-500" /> Popular
                      </span>
                    )}
                    {isPremium && (
                      <span className="absolute -top-2.5 right-3 badge-gold text-[9px] flex items-center gap-0.5 font-bold">
                        👑 VIP
                      </span>
                    )}
                    {isFree && (
                      <span className="absolute -top-2.5 right-3 badge-neutral text-[9px] flex items-center gap-0.5 font-bold">
                        Instant
                      </span>
                    )}
                    {/* Positioning word only here, not the full Marathi/feature
                        treatment — this is a decision moment in a signup form,
                        not the marketing pricing section; keep it fast. */}
                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isPremium ? 'text-gold-400' : isStandard ? 'text-royal-600' : 'text-saffron-600'}`}>
                      {plan.positioningLine}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      {selected && (
                        <Check
                          size={14}
                          className={isPremium ? 'text-gold-400' : isStandard ? 'text-royal-600' : isFree ? 'text-theme-fg/70' : 'text-saffron-700'}
                        />
                      )}
                      <span className="font-bold text-theme-fg">{plan.name}</span>
                    </div>
                    <div
                      className={`text-xl font-extrabold ${
                        isPremium ? 'text-gold-400' : isStandard ? 'text-royal-600' : isFree ? 'text-theme-fg/70' : 'text-saffron-700'
                      }`}
                    >
                      {formatCurrency(plan.priceInr)}
                    </div>
                    <p className="text-[10px] text-theme-fg/50">{plan.priceNote}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={!canSubmit || loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : form.subscriptionPlan === SubscriptionPlan.FREE
              ? <>Start Free Trial <ArrowRight size={16} /></>
              : <>Create Account & Continue <ArrowRight size={16} /></>}
          </button>

          {/* Nothing to request for FREE — signup itself is instant. */}
          {form.subscriptionPlan !== SubscriptionPlan.FREE && (
          <div className="flex items-center gap-3 text-[11px] text-theme-fg/30">
            <div className="flex-1 h-px bg-theme-fg/10" />
            or
            <div className="flex-1 h-px bg-theme-fg/10" />
          </div>
          )}

          {/* No payment gateway wired up yet (see PendingPaymentBanner.tsx) —
              this skips the form entirely for someone who'd rather just ask
              about a plan first. Not shown for FREE — nothing to request. */}
          {form.subscriptionPlan !== SubscriptionPlan.FREE && (
          <a
            href={platformWhatsappLink(
              `Hi, I'd like to request access to the ${selectedPlan?.name || ''} plan (${selectedPlan ? formatCurrency(selectedPlan.priceInr) : ''}) for my mandal.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} /> Request Access via WhatsApp Instead
          </a>
          )}

          <div className="text-center">
            <Link href="/login" className="text-sm text-theme-fg/40 hover:text-theme-fg inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-theme-fg/40 text-sm">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
