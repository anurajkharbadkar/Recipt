'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PRICING_PLANS, formatCurrency } from '@pavti/shared';
import toast from 'react-hot-toast';
import { BookOpen, ArrowRight, ArrowLeft, Check, Star } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

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
    subscriptionPlan: PRICING_PLANS.some((p) => p.id === preselected) ? preselected! : PRICING_PLANS[1].id,
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
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = PRICING_PLANS.find((p) => p.id === form.subscriptionPlan);

  return (
    <div className="min-h-screen py-10 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex w-16 h-16 rounded-2xl bg-gradient-brand items-center justify-center mx-auto mb-4 shadow-glow-saffron">
            <BookOpen size={28} className="text-white" />
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
                <input value={form.phone} onChange={e => set({ phone: e.target.value })} className="form-input" placeholder="9876543210" type="tel" inputMode="numeric" required />
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
            <p className="text-xs text-theme-fg/40 mb-4">You can start using the app right away — your plan activates once payment is confirmed.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRICING_PLANS.map((plan) => {
                const selected = form.subscriptionPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => set({ subscriptionPlan: plan.id })}
                    className={`relative text-left rounded-xl border-2 p-4 transition-all ${selected ? 'border-saffron-500 bg-saffron-600/10' : 'border-theme hover:border-saffron-500/40'}`}
                  >
                    {plan.highlighted && (
                      <span className="absolute -top-2.5 right-3 badge badge-saffron text-[9px] flex items-center gap-0.5">
                        <Star size={9} /> Popular
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      {selected && <Check size={14} className="text-saffron-400" />}
                      <span className="font-bold text-theme-fg">{plan.name}</span>
                    </div>
                    <div className="text-xl font-bold text-saffron-400">{formatCurrency(plan.priceInr)}</div>
                    <p className="text-[10px] text-theme-fg/40">{plan.priceNote}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={!canSubmit || loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : <>Create Account & Continue <ArrowRight size={16} /></>}
          </button>

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
