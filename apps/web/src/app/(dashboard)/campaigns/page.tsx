'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Plus, Play, CheckCircle, Calendar, Target, Receipt } from 'lucide-react';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'badge-neutral',
  ACTIVE: 'badge-success',
  PAUSED: 'badge-warning',
  COMPLETED: 'badge-info',
};

export default function CampaignsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', nameMarathi: '', year: new Date().getFullYear(), startDate: '', endDate: '', targetAmount: '', receiptPrefix: '', description: '' });
  const { language, setActiveCampaign } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list });

  const createMutation = useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowForm(false);
      toast.success('Campaign created!');
      setActiveCampaign(c.id);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create campaign'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.activate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign activated!'); },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.complete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign completed!'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {language === 'mr' ? 'मोहिमा' : language === 'hi' ? 'अभियान' : 'Campaigns'}
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={15} />
          {language === 'mr' ? 'नवीन मोहीम' : 'New Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Create Campaign</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Campaign Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Ganesh Utsav 2027" />
            </div>
            <div>
              <label className="form-label">मराठी नाव</label>
              <input value={form.nameMarathi} onChange={e => setForm(p => ({ ...p, nameMarathi: e.target.value }))} className="form-input font-devanagari" placeholder="गणेश उत्सव 2027" />
            </div>
            <div>
              <label className="form-label">Year *</label>
              <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Receipt Prefix</label>
              <input value={form.receiptPrefix} onChange={e => setForm(p => ({ ...p, receiptPrefix: e.target.value.toUpperCase() }))} className="form-input" placeholder="SGM-2027" />
            </div>
            <div>
              <label className="form-label">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Target Amount (₹)</label>
              <input type="number" value={form.targetAmount} onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))} className="form-input" placeholder="500000" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-input" placeholder="10 days annual festival" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || !form.startDate || createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {(campaigns || []).map((c: any) => (
            <CampaignCard key={c.id} campaign={c} onActivate={() => activateMutation.mutate(c.id)} onComplete={() => completeMutation.mutate(c.id)} />
          ))}
          {!campaigns?.length && (
            <div className="glass-card p-12 text-center text-white/30">
              No campaigns yet. Create your first campaign!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign: c, onActivate, onComplete }: any) {
  const { data: stats } = useQuery({
    queryKey: ['campaign-stats', c.id],
    queryFn: () => campaignsApi.getStats(c.id),
  });

  const progress = stats && c.targetAmount
    ? Math.min(100, (stats.totalCollected / c.targetAmount) * 100)
    : 0;

  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-lg">{c.name}</h3>
            <span className={`badge text-xs ${STATUS_COLORS[c.status]}`}>{c.status}</span>
          </div>
          {c.nameMarathi && <p className="text-sm text-white/40 font-devanagari">{c.nameMarathi}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
            <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(c.startDate), 'dd MMM yyyy')}</span>
            {c.endDate && <span>→ {format(new Date(c.endDate), 'dd MMM yyyy')}</span>}
            <span className="flex items-center gap-1"><Receipt size={11} /> {c._count?.receipts || 0} receipts</span>
          </div>
        </div>
        <div className="flex gap-2">
          {c.status === 'DRAFT' && (
            <button onClick={onActivate} className="btn-primary text-xs px-3 py-1.5 gap-1">
              <Play size={12} /> Activate
            </button>
          )}
          {c.status === 'ACTIVE' && (
            <button onClick={onComplete} className="btn-secondary text-xs px-3 py-1.5 gap-1">
              <CheckCircle size={12} /> Complete
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-white/40">Collected</p>
            <p className="font-bold text-emerald-400 text-sm">{formatCurrency(stats.totalCollected || 0)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-white/40">Expenses</p>
            <p className="font-bold text-red-400 text-sm">{formatCurrency(stats.totalExpenses || 0)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-white/40">Balance</p>
            <p className={`font-bold text-sm ${(stats.netBalance || 0) >= 0 ? 'text-saffron-400' : 'text-red-400'}`}>{formatCurrency(stats.netBalance || 0)}</p>
          </div>
        </div>
      )}

      {c.targetAmount && (
        <div>
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span className="flex items-center gap-1"><Target size={10} /> Target: {formatCurrency(c.targetAmount)}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
