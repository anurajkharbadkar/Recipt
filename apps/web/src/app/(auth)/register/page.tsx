'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PRICING_PLANS, SubscriptionPlan, formatCurrency } from '@pavti/shared';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Check, Star, KeyRound, Copy, CheckCheck, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';
import AuthLanguageSwitcher from '@/components/auth/AuthLanguageSwitcher';
import { launchSubscriptionCheckout } from '@/lib/cashfreeCheckout';

// Plan names/taglines/price notes stay English everywhere in the app (see
// PRICING_PLANS in packages/shared — a deliberate choice, not an omission),
// so only the surrounding form chrome gets translated here.
const labels = {
  en: {
    back: 'Back', title: 'Register Your Mandal',
    mandalCodeTitle: 'Your Mandal Code',
    mandalCodeDesc: "Every collector or treasurer you add needs this — along with their own phone number and password — to log in. Share it with them, and keep it somewhere you won't lose it (it's also always in Settings).",
    payAndActivate: (amt: string) => `Pay ${amt} & Activate`,
    continueToDashboard: 'Continue to Dashboard',
    orgDetails: 'Organization Details', orgName: 'Organization Name *', orgNamePlaceholder: 'Shree Ganesh Mandal',
    city: 'City *', cityPlaceholder: 'Pune', address: 'Address *', addressPlaceholder: '123, MG Road', state: 'State',
    adminAccount: 'Your Admin Account', yourName: 'Your Name *', yourNamePlaceholder: 'Rajesh Kumar',
    mobileNumber: 'Mobile Number *', email: 'Email (optional)', password: 'Password *', passwordPlaceholder: 'At least 8 characters',
    choosePlan: 'Choose Your Plan',
    freePlanNote: "Free — no payment needed, you're active immediately.",
    paidPlanNote: 'You can start using the app right away — your plan activates once payment is confirmed.',
    popular: 'Popular', instant: 'Instant',
    creatingAccount: 'Creating account...', startFreeTrial: 'Start Free Trial', createAccount: 'Create Account & Continue',
    alreadyHaveAccount: 'Already have an account? Sign in',
    fillRequired: 'Please fill all required fields', accountCreated: 'Account created! 🙏',
    registrationFailed: 'Registration failed. Please check your details and try again.',
    checkoutFailed: 'Could not start checkout — please try again.', loading: 'Loading...',
  },
  hi: {
    back: 'वापस', title: 'अपने मंडल का पंजीकरण करें',
    mandalCodeTitle: 'आपका मंडल कोड',
    mandalCodeDesc: 'आपके जोड़े गए हर संग्रहकर्ता या कोषाध्यक्ष को लॉगिन के लिए यह कोड, अपने फोन नंबर और पासवर्ड के साथ चाहिए। इसे उनके साथ साझा करें और सुरक्षित रखें (यह हमेशा सेटिंग्स में भी मिलेगा)।',
    payAndActivate: (amt: string) => `${amt} भुगतान करें व सक्रिय करें`,
    continueToDashboard: 'डैशबोर्ड पर जाएं',
    orgDetails: 'संस्था विवरण', orgName: 'संस्था का नाम *', orgNamePlaceholder: 'श्री गणेश मंडल',
    city: 'शहर *', cityPlaceholder: 'पुणे', address: 'पता *', addressPlaceholder: '123, एमजी रोड', state: 'राज्य',
    adminAccount: 'आपका एडमिन खाता', yourName: 'आपका नाम *', yourNamePlaceholder: 'राजेश कुमार',
    mobileNumber: 'मोबाइल नंबर *', email: 'ईमेल (वैकल्पिक)', password: 'पासवर्ड *', passwordPlaceholder: 'कम से कम 8 अक्षर',
    choosePlan: 'अपना प्लान चुनें',
    freePlanNote: 'फ्री — कोई भुगतान नहीं, आप तुरंत सक्रिय हो जाते हैं।',
    paidPlanNote: 'आप ऐप का उपयोग तुरंत शुरू कर सकते हैं — भुगतान की पुष्टि होते ही आपका प्लान सक्रिय हो जाएगा।',
    popular: 'लोकप्रिय', instant: 'तुरंत',
    creatingAccount: 'खाता बनाया जा रहा है...', startFreeTrial: 'फ्री ट्रायल शुरू करें', createAccount: 'खाता बनाएं व आगे बढ़ें',
    alreadyHaveAccount: 'पहले से खाता है? साइन इन करें',
    fillRequired: 'कृपया सभी आवश्यक जानकारी भरें', accountCreated: 'खाता बन गया! 🙏',
    registrationFailed: 'पंजीकरण विफल रहा। कृपया अपनी जानकारी जांचें और फिर से प्रयास करें।',
    checkoutFailed: 'चेकआउट शुरू नहीं हो सका — कृपया फिर से प्रयास करें।', loading: 'लोड हो रहा है...',
  },
  mr: {
    back: 'मागे', title: 'तुमच्या मंडळाची नोंदणी करा',
    mandalCodeTitle: 'तुमचा मंडळ कोड',
    mandalCodeDesc: 'तुम्ही जोडलेल्या प्रत्येक संग्राहक किंवा कोषाध्यक्षाला लॉगिन करण्यासाठी हा कोड, त्यांचा स्वतःचा फोन नंबर व पासवर्ड लागेल. तो त्यांच्यासोबत शेअर करा व सुरक्षित ठेवा (तो नेहमी सेटिंग्जमध्येही मिळेल).',
    payAndActivate: (amt: string) => `${amt} भरा व सक्रिय करा`,
    continueToDashboard: 'डॅशबोर्डवर जा',
    orgDetails: 'संस्थेचा तपशील', orgName: 'संस्थेचे नाव *', orgNamePlaceholder: 'श्री गणेश मंडळ',
    city: 'शहर *', cityPlaceholder: 'पुणे', address: 'पत्ता *', addressPlaceholder: '123, एमजी रोड', state: 'राज्य',
    adminAccount: 'तुमचे अ‍ॅडमिन खाते', yourName: 'तुमचे नाव *', yourNamePlaceholder: 'राजेश कुमार',
    mobileNumber: 'मोबाइल नंबर *', email: 'ईमेल (पर्यायी)', password: 'पासवर्ड *', passwordPlaceholder: 'किमान 8 अक्षरे',
    choosePlan: 'तुमचा प्लॅन निवडा',
    freePlanNote: 'मोफत — पैसे भरण्याची गरज नाही, तुम्ही लगेच सक्रिय व्हाल.',
    paidPlanNote: 'तुम्ही अ‍ॅप लगेच वापरणे सुरू करू शकता — पेमेंटची पुष्टी झाल्यावर तुमचा प्लॅन सक्रिय होईल.',
    popular: 'लोकप्रिय', instant: 'त्वरित',
    creatingAccount: 'खाते तयार होत आहे...', startFreeTrial: 'मोफत ट्रायल सुरू करा', createAccount: 'खाते तयार करा व पुढे जा',
    alreadyHaveAccount: 'आधीच खाते आहे? साइन इन करा',
    fillRequired: 'कृपया सर्व आवश्यक माहिती भरा', accountCreated: 'खाते तयार झाले! 🙏',
    registrationFailed: 'नोंदणी अयशस्वी झाली. कृपया तुमची माहिती तपासा व पुन्हा प्रयत्न करा.',
    checkoutFailed: 'चेकआउट सुरू करता आले नाही — कृपया पुन्हा प्रयत्न करा.', loading: 'लोड होत आहे...',
  },
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, language } = useAuthStore();
  const l = labels[language] || labels.en;
  const [loading, setLoading] = useState(false);
  // Shown once, right after signup — this is the only time an admin is
  // guaranteed to be looking at the screen when their Mandal Code exists.
  // It's always in Settings afterward, but nobody reads Settings on day
  // one, and every collector they add needs this to actually log in.
  const [newMandalCode, setNewMandalCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [payingViaCheckout, setPayingViaCheckout] = useState(false);

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
    if (!canSubmit) { toast.error(l.fillRequired); return; }
    setLoading(true);
    try {
      const data = await authApi.register(form);
      setAuth(data);
      toast.success(l.accountCreated);
      setNewMandalCode(data.organization?.mandalCode || null);
    } catch (err: any) {
      toast.error(getErrorMessage(err, l.registrationFailed));
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

  const handlePayNow = async () => {
    setPayingViaCheckout(true);
    try {
      await launchSubscriptionCheckout();
      // Redirects the whole page to Cashfree on success — this only runs
      // if it threw before getting there.
    } catch (err: any) {
      toast.error(err?.response?.data?.message || l.checkoutFailed);
      setPayingViaCheckout(false);
    }
  };

  if (newMandalCode) {
    const isPaidPlan = form.subscriptionPlan !== SubscriptionPlan.FREE;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-saffron-500/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={26} className="text-saffron-500" />
          </div>
          <h2 className="text-lg font-bold text-theme-fg mb-1">{l.mandalCodeTitle}</h2>
          <p className="text-xs text-theme-fg/50 mb-5">
            {l.mandalCodeDesc}
          </p>
          <button
            onClick={handleCopyCode}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-saffron-500/10 border-2 border-dashed border-saffron-500/40 hover:border-saffron-500/60 transition-colors mb-5"
          >
            <span className="text-2xl font-extrabold tracking-[0.2em] text-saffron-600">{newMandalCode}</span>
            {copied ? <CheckCheck size={18} className="text-emerald-500" /> : <Copy size={16} className="text-theme-fg/40" />}
          </button>

          {isPaidPlan ? (
            // No "pay later" escape hatch — a paid plan gets no dashboard
            // access until payment actually clears (RolesGuard blocks
            // every write for a PENDING_PAYMENT org server-side regardless
            // of what this screen offers, but inviting someone to defer
            // payment at the exact moment they should be paying works
            // against that, not with it). Someone who closes this tab
            // without paying can still log in later and land on the
            // dashboard's own pending-payment gate/banner — this only
            // removes the *invitation* to skip, not the ability to log in.
            <button onClick={handlePayNow} disabled={payingViaCheckout} className="btn-primary w-full disabled:opacity-60">
              {payingViaCheckout ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {l.payAndActivate(formatCurrency(selectedPlan?.priceInr || 0))}
            </button>
          ) : (
            <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
              {l.continueToDashboard} <ArrowRight size={16} />
            </button>
          )}
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
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-800/70 dark:text-saffron-200/70 hover:text-saffron-700 dark:hover:text-saffron-300 transition-colors"
          >
            <ArrowLeft size={14} /> {l.back}
          </Link>
          <AuthLanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mx-auto mb-4">
            <LogoMark size={64} className="rounded-2xl" />
          </Link>
          <h1 className="text-2xl font-bold text-theme-fg">{l.title}</h1>
          <p className="text-sm text-theme-fg/40 mt-1 font-devanagari">आपल्या मंडळाची नोंदणी करा</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Details */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.orgDetails}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">{l.orgName}</label>
                <input value={form.organizationName} onChange={e => set({ organizationName: e.target.value })} className="form-input" placeholder={l.orgNamePlaceholder} required />
              </div>
              <div>
                <label className="form-label">मराठी नाव</label>
                <input value={form.organizationNameMarathi} onChange={e => set({ organizationNameMarathi: e.target.value })} className="form-input font-devanagari" placeholder="श्री गणेश मंडळ" />
              </div>
              <div>
                <label className="form-label">{l.city}</label>
                <input value={form.city} onChange={e => set({ city: e.target.value })} className="form-input" placeholder={l.cityPlaceholder} required />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">{l.address}</label>
                <input value={form.address} onChange={e => set({ address: e.target.value })} className="form-input" placeholder={l.addressPlaceholder} required />
              </div>
              <div>
                <label className="form-label">{l.state}</label>
                <input value={form.state} onChange={e => set({ state: e.target.value })} className="form-input" />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.adminAccount}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{l.yourName}</label>
                <input value={form.adminName} onChange={e => set({ adminName: e.target.value })} className="form-input" placeholder={l.yourNamePlaceholder} required />
              </div>
              <div>
                <label className="form-label">{l.mobileNumber}</label>
                <input value={form.phone} onChange={e => set({ phone: e.target.value })} className="form-input" placeholder="98XXXXXXXX" type="tel" inputMode="numeric" required />
              </div>
              <div>
                <label className="form-label">{l.email}</label>
                <input value={form.email} onChange={e => set({ email: e.target.value })} className="form-input" placeholder="admin@mandal.org" type="email" />
              </div>
              <div>
                <label className="form-label">{l.password}</label>
                <input value={form.password} onChange={e => set({ password: e.target.value })} className="form-input" placeholder={l.passwordPlaceholder} type="password" required />
              </div>
            </div>
          </div>

          {/* Plan Picker */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-theme-fg mb-1">{l.choosePlan}</h3>
            <p className="text-xs text-theme-fg/40 mb-4">
              {form.subscriptionPlan === SubscriptionPlan.FREE ? l.freePlanNote : l.paidPlanNote}
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
                        <Star size={9} className="fill-gold-500 text-gold-500" /> {l.popular}
                      </span>
                    )}
                    {isFree && (
                      <span className="absolute -top-2.5 right-3 badge-neutral text-[9px] flex items-center gap-0.5 font-bold">
                        {l.instant}
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
            {loading ? l.creatingAccount : form.subscriptionPlan === SubscriptionPlan.FREE
              ? <>{l.startFreeTrial} <ArrowRight size={16} /></>
              : <>{l.createAccount} <ArrowRight size={16} /></>}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-theme-fg/40 hover:text-theme-fg inline-flex items-center gap-1">
              <ArrowLeft size={14} /> {l.alreadyHaveAccount}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterFallback() {
  const { language } = useAuthStore();
  const l = labels[language] || labels.en;
  return <div className="min-h-screen flex items-center justify-center text-theme-fg/40 text-sm">{l.loading}</div>;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
