'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Phone, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck, Users2 } from 'lucide-react';
import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';
import { BRAND_NAME } from '@pavti/shared';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

// Not sensitive — closer to a workspace slug than a secret — so it's safe
// to remember locally for returning staff who'd otherwise retype it every
// shift. Admin tab doesn't use this at all (no mandal code to remember).
const LAST_MANDAL_CODE_KEY = 'pavti-last-mandal-code';

type LoginMode = 'admin' | 'staff';

const labels = {
  en: {
    back: 'Back',
    mandalAdmin: 'Mandal Admin', staff: 'Collector / Treasurer',
    mandalCode: 'Mandal Code', mandalCodePlaceholder: 'e.g. SGMP26', mandalCodeHint: "Ask your mandal admin if you don't have this.",
    adminHint: 'Use the mobile number your Mandal registered with — no Mandal Code needed.',
    mobileNumber: 'Mobile Number', mobilePlaceholder: 'Enter 10-digit mobile number',
    password: 'Password', forgotPassword: 'Forgot password?',
    signIn: 'Sign In', signingIn: 'Signing in...',
    welcomeBack: 'Welcome back! 🙏', invalidCredentials: 'Invalid credentials',
    newOrg: 'New organization?', registerHere: 'Register here',
  },
  hi: {
    back: 'वापस',
    mandalAdmin: 'मंडल एडमिन', staff: 'संग्रहकर्ता / कोषाध्यक्ष',
    mandalCode: 'मंडल कोड', mandalCodePlaceholder: 'उदा. SGMP26', mandalCodeHint: 'यदि यह नहीं है तो अपने मंडल एडमिन से पूछें।',
    adminHint: 'वह मोबाइल नंबर उपयोग करें जिससे आपके मंडल ने पंजीकरण किया था — मंडल कोड की आवश्यकता नहीं है।',
    mobileNumber: 'मोबाइल नंबर', mobilePlaceholder: '10 अंकों का मोबाइल नंबर दर्ज करें',
    password: 'पासवर्ड', forgotPassword: 'पासवर्ड भूल गए?',
    signIn: 'साइन इन करें', signingIn: 'साइन इन हो रहा है...',
    welcomeBack: 'वापसी पर स्वागत है! 🙏', invalidCredentials: 'गलत जानकारी',
    newOrg: 'नई संस्था?', registerHere: 'यहां पंजीकरण करें',
  },
  mr: {
    back: 'मागे',
    mandalAdmin: 'मंडळ अ‍ॅडमिन', staff: 'संग्राहक / कोषाध्यक्ष',
    mandalCode: 'मंडळ कोड', mandalCodePlaceholder: 'उदा. SGMP26', mandalCodeHint: 'हे नसल्यास तुमच्या मंडळ अ‍ॅडमिनला विचारा.',
    adminHint: 'तुमच्या मंडळाने नोंदणी केलेला मोबाइल नंबर वापरा — मंडळ कोडची गरज नाही.',
    mobileNumber: 'मोबाइल नंबर', mobilePlaceholder: '10 अंकी मोबाइल नंबर टाका',
    password: 'पासवर्ड', forgotPassword: 'पासवर्ड विसरलात?',
    signIn: 'साइन इन करा', signingIn: 'साइन इन होत आहे...',
    welcomeBack: 'परत स्वागत आहे! 🙏', invalidCredentials: 'चुकीची माहिती',
    newOrg: 'नवीन संस्था?', registerHere: 'येथे नोंदणी करा',
  },
};

export default function LoginPage() {
  // Two explicit modes, not a smart auto-detect fallback — the Mandal
  // Admin's phone alone already resolves their org unambiguously
  // (Organization.phone is globally unique and never diverges from the
  // founding admin's own phone — see AuthService.findOrgAdminByPhone), but
  // a Collector/Treasurer's phone is only unique *within* their org, so
  // they still need the Mandal Code to disambiguate. Picking upfront beats
  // submit → get rejected → asked for more info.
  const [mode, setMode] = useState<LoginMode>('admin');
  const [mandalCode, setMandalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth, language } = useAuthStore();
  const l = labels[language] || labels.en;
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(LAST_MANDAL_CODE_KEY);
    if (saved) setMandalCode(saved);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(phone, password, mode === 'staff' ? mandalCode : undefined);
      if (mode === 'staff' && mandalCode) localStorage.setItem(LAST_MANDAL_CODE_KEY, mandalCode);
      setAuth(data);
      toast.success(l.welcomeBack);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(getErrorMessage(err, l.invalidCredentials));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(var(--fg-rgb) / 0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-start mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-800/70 dark:text-saffron-200/70 hover:text-saffron-700 dark:hover:text-saffron-300 transition-colors"
          >
            <ArrowLeft size={14} /> {l.back}
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <LogoMark size={64} className="rounded-2xl mx-auto mb-4 block" />
          <h1 className="text-2xl font-bold text-theme-fg">{BRAND_NAME}</h1>
          <p className="text-sm text-theme-fg/40 mt-1 font-devanagari">ई पावती बुक</p>
        </div>

        <div className="glass-card p-7 shadow-xl shadow-saffron-900/5">
          {/* Mode toggle — picking upfront instead of a smart auto-detect
              fallback that would mean submit, get rejected, then get asked
              for more info. Mandal Admin doesn't need the code at all: see
              AuthService.findOrgAdminByPhone. */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-saffron-100/60 dark:bg-navy-800 rounded-2xl border border-theme/20 mb-5">
            {([
              { key: 'admin' as const, label: l.mandalAdmin, icon: ShieldCheck },
              { key: 'staff' as const, label: l.staff, icon: Users2 },
            ]).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setMode(t.key)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  mode === t.key
                    ? 'bg-saffron-700 text-white shadow-sm'
                    : 'text-theme-fg/70 hover:text-theme-fg hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                <t.icon size={13} className={mode === t.key ? 'text-white' : 'text-saffron-700 dark:text-saffron-300'} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Google SSO */}
          <div className="mb-4">
            <GoogleAuthButton
              onSuccess={() => router.push('/dashboard')}
              onUnregistered={(profile) => {
                router.push(`/register?email=${encodeURIComponent(profile.email)}&name=${encodeURIComponent(profile.name)}`);
              }}
            />
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-theme-fg/10" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-theme-bg/80 px-2 text-theme-fg/40 font-semibold">किंवा (OR)</span></div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {mode === 'staff' && (
              <div>
                <label className="form-label">{l.mandalCode}</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                  <input
                    value={mandalCode}
                    onChange={e => setMandalCode(e.target.value.toUpperCase())}
                    className="form-input pl-9 uppercase tracking-wider"
                    placeholder={l.mandalCodePlaceholder}
                    required
                  />
                </div>
                <p className="text-[11px] text-theme-fg/35 mt-1">{l.mandalCodeHint}</p>
              </div>
            )}
            {mode === 'admin' && (
              <p className="text-[11px] text-theme-fg/35 -mb-1.5">{l.adminHint}</p>
            )}
            <div>
              <label className="form-label">{l.mobileNumber}</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="form-input pl-9"
                  placeholder={l.mobilePlaceholder}
                  type="tel"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">{l.password}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input pl-9 pr-10"
                  placeholder="••••••••"
                  type={showPass ? 'text' : 'password'}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-fg/30 hover:text-theme-fg/60">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-[11px] text-saffron-700 hover:text-saffron-600 hover:underline">
                  {l.forgotPassword}
                </Link>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <span className="animate-pulse-soft">{l.signingIn}</span> : <><ArrowRight size={16} /> {l.signIn}</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-black/[0.04] text-center">
            <p className="text-sm text-theme-fg/60">
              {l.newOrg}{' '}
              <Link href="/register" className="text-saffron-700 hover:text-saffron-600 font-semibold underline underline-offset-2">
                {l.registerHere}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
