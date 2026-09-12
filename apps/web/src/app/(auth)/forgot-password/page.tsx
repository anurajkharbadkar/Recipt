'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Phone, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck, Users2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';
import { BRAND_NAME } from '@pavti/shared';

type Mode = 'admin' | 'staff';
type Step = 'request' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      toast.success('If that account exists, a code was sent over WhatsApp.');
      setStep('reset');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Could not send the code — please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authApi.resetPassword({
        phone, mandalCode: mode === 'staff' ? mandalCode : undefined, otp, newPassword,
      });
      toast.success('Password reset — sign in with your new password.');
      router.push('/login');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Could not reset your password — please try again.'));
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
        <div className="text-center mb-8">
          <LogoMark size={64} className="rounded-2xl mx-auto mb-4 block" />
          <h1 className="text-2xl font-bold text-theme-fg">{BRAND_NAME}</h1>
          <p className="text-sm text-theme-fg/40 mt-1">Reset your password</p>
        </div>

        <div className="glass-card p-7 shadow-xl shadow-saffron-900/5">
          {step === 'request' ? (
            <>
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-saffron-100/60 dark:bg-navy-800 rounded-2xl border border-theme/20 mb-5">
                {([
                  { key: 'admin' as const, label: 'Mandal Admin', icon: ShieldCheck },
                  { key: 'staff' as const, label: 'Collector / Treasurer', icon: Users2 },
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
                    <label className="form-label">Mandal Code</label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                      <input
                        value={mandalCode}
                        onChange={(e) => setMandalCode(e.target.value.toUpperCase())}
                        className="form-input pl-9 uppercase tracking-wider"
                        placeholder="e.g. SGMP26"
                        required
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="form-label">Mobile Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input pl-9"
                      placeholder="Enter 10-digit mobile number"
                      type="tel"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-theme-fg/35 mt-1.5 flex items-center gap-1">
                    <MessageCircle size={11} className="shrink-0" /> We'll send a 6-digit code to this number on WhatsApp.
                  </p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <span className="animate-pulse-soft">Sending code...</span> : <><ArrowRight size={16} /> Send Code</>}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="form-label">6-Digit Code</label>
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
                <label className="form-label">New Password</label>
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
                <label className="form-label">Confirm New Password</label>
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
                {loading ? <span className="animate-pulse-soft">Resetting...</span> : <><ArrowRight size={16} /> Reset Password</>}
              </button>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="flex items-center justify-center gap-1.5 text-xs text-theme-fg/50 hover:text-theme-fg w-full py-1"
              >
                <ArrowLeft size={12} /> Use a different number
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-black/[0.04] text-center">
            <p className="text-sm text-theme-fg/60">
              <Link href="/login" className="text-saffron-700 hover:text-saffron-600 font-semibold underline underline-offset-2">
                ← Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
