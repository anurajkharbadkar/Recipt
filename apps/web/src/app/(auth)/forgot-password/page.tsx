'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Phone, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck, Users2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';
import AuthLanguageSwitcher from '@/components/auth/AuthLanguageSwitcher';
import { useAuthStore } from '@/store/auth.store';
import { BRAND_NAME } from '@pavti/shared';

type Mode = 'admin' | 'staff';
type Step = 'request' | 'reset';

const labels = {
  en: {
    back: 'Back', backToSignIn: '← Back to Sign In', resetTitle: 'Reset your password',
    mandalAdmin: 'Mandal Admin', staff: 'Collector / Treasurer',
    mandalCode: 'Mandal Code', mandalCodePlaceholder: 'e.g. SGMP26',
    mobileNumber: 'Mobile Number', mobilePlaceholder: 'Enter 10-digit mobile number',
    otpHint: "We'll send a 6-digit code to this number on WhatsApp.",
    sendCode: 'Send Code', sendingCode: 'Sending code...',
    otpRequested: 'If that account exists, a code was sent over WhatsApp.',
    otpFailed: 'Could not send the code — please try again.',
    code: '6-Digit Code', newPassword: 'New Password', confirmPassword: 'Confirm New Password',
    resetPassword: 'Reset Password', resetting: 'Resetting...',
    resetSuccess: 'Password reset — sign in with your new password.',
    resetFailed: 'Could not reset your password — please try again.',
    passwordTooShort: 'Password must be at least 8 characters', passwordMismatch: 'Passwords do not match',
    useDifferentNumber: 'Use a different number',
  },
  hi: {
    back: 'वापस', backToSignIn: '← साइन इन पर वापस जाएं', resetTitle: 'अपना पासवर्ड रीसेट करें',
    mandalAdmin: 'मंडल एडमिन', staff: 'संग्रहकर्ता / कोषाध्यक्ष',
    mandalCode: 'मंडल कोड', mandalCodePlaceholder: 'उदा. SGMP26',
    mobileNumber: 'मोबाइल नंबर', mobilePlaceholder: '10 अंकों का मोबाइल नंबर दर्ज करें',
    otpHint: 'हम इस नंबर पर व्हाट्सएप के जरिए 6 अंकों का कोड भेजेंगे।',
    sendCode: 'कोड भेजें', sendingCode: 'कोड भेजा जा रहा है...',
    otpRequested: 'यदि वह खाता मौजूद है, तो व्हाट्सएप पर एक कोड भेजा गया।',
    otpFailed: 'कोड नहीं भेजा जा सका — कृपया फिर से प्रयास करें।',
    code: '6-अंकों का कोड', newPassword: 'नया पासवर्ड', confirmPassword: 'नए पासवर्ड की पुष्टि करें',
    resetPassword: 'पासवर्ड रीसेट करें', resetting: 'रीसेट हो रहा है...',
    resetSuccess: 'पासवर्ड रीसेट हो गया — अपने नए पासवर्ड से साइन इन करें।',
    resetFailed: 'आपका पासवर्ड रीसेट नहीं हो सका — कृपया फिर से प्रयास करें।',
    passwordTooShort: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए', passwordMismatch: 'पासवर्ड मेल नहीं खाते',
    useDifferentNumber: 'दूसरा नंबर उपयोग करें',
  },
  mr: {
    back: 'मागे', backToSignIn: '← साइन इनवर परत जा', resetTitle: 'तुमचा पासवर्ड रीसेट करा',
    mandalAdmin: 'मंडळ अ‍ॅडमिन', staff: 'संग्राहक / कोषाध्यक्ष',
    mandalCode: 'मंडळ कोड', mandalCodePlaceholder: 'उदा. SGMP26',
    mobileNumber: 'मोबाइल नंबर', mobilePlaceholder: '10 अंकी मोबाइल नंबर टाका',
    otpHint: 'आम्ही या नंबरवर व्हॉट्सअॅपद्वारे 6 अंकी कोड पाठवू.',
    sendCode: 'कोड पाठवा', sendingCode: 'कोड पाठवत आहे...',
    otpRequested: 'ते खाते अस्तित्वात असल्यास, व्हॉट्सअॅपवर कोड पाठवला गेला.',
    otpFailed: 'कोड पाठवता आला नाही — कृपया पुन्हा प्रयत्न करा.',
    code: '6-अंकी कोड', newPassword: 'नवीन पासवर्ड', confirmPassword: 'नवीन पासवर्डची पुष्टी करा',
    resetPassword: 'पासवर्ड रीसेट करा', resetting: 'रीसेट होत आहे...',
    resetSuccess: 'पासवर्ड रीसेट झाला — तुमच्या नवीन पासवर्डने साइन इन करा.',
    resetFailed: 'तुमचा पासवर्ड रीसेट करता आला नाही — कृपया पुन्हा प्रयत्न करा.',
    passwordTooShort: 'पासवर्ड किमान 8 अक्षरांचा असावा', passwordMismatch: 'पासवर्ड जुळत नाहीत',
    useDifferentNumber: 'वेगळा नंबर वापरा',
  },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { language } = useAuthStore();
  const l = labels[language] || labels.en;
  const [mode, setMode] = useState<Mode>('admin');
  const [step, setStep] = useState<Step>('request');
  const [mandalCode, setMandalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Always succeeds in shape regardless of whether a matching account
      // exists — see AuthService.requestPasswordReset for why (prevents
      // an attacker enumerating valid phone/mandal-code combinations).
      // So this toast is genuinely "we tried", not "we found your account".
      await authApi.requestPasswordReset(phone, mode === 'staff' ? mandalCode : undefined);
      toast.success(l.otpRequested);
      setStep('reset');
    } catch (err: any) {
      toast.error(getErrorMessage(err, l.otpFailed));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error(l.passwordTooShort); return; }
    if (newPassword !== confirmPassword) { toast.error(l.passwordMismatch); return; }

    setLoading(true);
    try {
      await authApi.resetPassword({
        phone, mandalCode: mode === 'staff' ? mandalCode : undefined, otp, newPassword,
      });
      toast.success(l.resetSuccess);
      router.push('/login');
    } catch (err: any) {
      toast.error(getErrorMessage(err, l.resetFailed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(var(--fg-rgb) / 0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-sm">
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
          <LogoMark size={64} className="rounded-2xl mx-auto mb-4 block" />
          <h1 className="text-2xl font-bold text-theme-fg">{BRAND_NAME}</h1>
          <p className="text-sm text-theme-fg/40 mt-1">{l.resetTitle}</p>
        </div>

        <div className="glass-card p-7 shadow-xl shadow-saffron-900/5">
          {step === 'request' ? (
            <>
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

              <form onSubmit={handleRequestOtp} className="space-y-4">
                {mode === 'staff' && (
                  <div>
                    <label className="form-label">{l.mandalCode}</label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                      <input
                        value={mandalCode}
                        onChange={(e) => setMandalCode(e.target.value.toUpperCase())}
                        className="form-input pl-9 uppercase tracking-wider"
                        placeholder={l.mandalCodePlaceholder}
                        required
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="form-label">{l.mobileNumber}</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input pl-9"
                      placeholder={l.mobilePlaceholder}
                      type="tel"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-theme-fg/35 mt-1.5 flex items-center gap-1">
                    <MessageCircle size={11} className="shrink-0" /> {l.otpHint}
                  </p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="animate-pulse-soft">{l.sendingCode}</span> : <><ArrowRight size={16} /> {l.sendCode}</>}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="form-label">{l.code}</label>
                <div className="relative">
                  <MessageCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-input pl-9 tracking-[0.3em] font-semibold"
                    placeholder="000000"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">{l.newPassword}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input pl-9 pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-fg/30 hover:text-theme-fg/60">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">{l.confirmPassword}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input pl-9"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? <span className="animate-pulse-soft">{l.resetting}</span> : <><ArrowRight size={16} /> {l.resetPassword}</>}
              </button>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="flex items-center justify-center gap-1.5 text-xs text-theme-fg/50 hover:text-theme-fg w-full py-1"
              >
                <ArrowLeft size={12} /> {l.useDifferentNumber}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-black/[0.04] text-center">
            <p className="text-sm text-theme-fg/60">
              <Link href="/login" className="text-saffron-700 hover:text-saffron-600 font-semibold underline underline-offset-2">
                {l.backToSignIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
