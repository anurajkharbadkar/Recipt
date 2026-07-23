'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { BookOpen, Phone, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(phone, password);
      setAuth(data);
      toast.success('Welcome back! 🙏');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(phone, otp);
      setAuth(data);
      toast.success('Welcome! 🙏');
      router.push('/dashboard');
    } catch {
      toast.error('Invalid OTP');
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
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 shadow-glow-saffron">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Digital Pavti Book</h1>
          <p className="text-sm text-white/40 mt-1 font-devanagari">डिजिटल पावती बुक</p>
        </div>

        <div className="glass-card p-7">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
            {(['password', 'otp'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-saffron-600 text-white' : 'text-white/50 hover:text-white'}`}
              >
                {m === 'password' ? '🔒 Password' : '📱 OTP'}
              </button>
            ))}
          </div>

          {mode === 'password' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">Mobile Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="form-input pl-9"
                    placeholder="9876543210"
                    type="tel"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input pl-9 pr-10"
                    placeholder="••••••••"
                    type={showPass ? 'text' : 'password'}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? <span className="animate-pulse-soft">Signing in...</span> : <><ArrowRight size={16} /> Sign In</>}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="form-label">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input pl-9" placeholder="9876543210" type="tel" inputMode="numeric" />
                  </div>
                  <button onClick={handleSendOtp} disabled={loading || otpSent} className="btn-secondary px-4 whitespace-nowrap text-sm">
                    {otpSent ? '✓ Sent' : 'Send OTP'}
                  </button>
                </div>
              </div>
              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-slide-up">
                  <div>
                    <label className="form-label">Enter 6-digit OTP</label>
                    <input
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="form-input text-center text-2xl tracking-[0.5em] font-mono"
                      placeholder="••••••"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                  <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
                    {loading ? 'Verifying...' : '✓ Verify & Sign In'}
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="btn-ghost w-full text-sm">
                    Resend OTP
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/8 text-center">
            <p className="text-sm text-white/40">
              New organization?{' '}
              <Link href="/register" className="text-saffron-400 hover:text-saffron-300 font-medium">
                Register here
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-white/5 rounded-xl text-xs text-white/40">
            <p className="font-semibold text-white/60 mb-1">Demo Credentials:</p>
            <p>📱 9876543210 | 🔑 Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
