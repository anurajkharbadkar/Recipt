'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, membersApi, internalCollectionsApi, receiptsApi } from '@/lib/api';
import { formatCurrency } from '@pavti/shared';
import { format, differenceInCalendarDays } from 'date-fns';
import { ArrowLeft, Wallet, IndianRupee, Users2, Clock, CheckCircle2, XCircle, AlertTriangle, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'badge-neutral',
  ACTIVE: 'badge-success',
  PAUSED: 'badge-warning',
  COMPLETED: 'badge-info',
};

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'neutral' }) {
  const color = tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-red-400' : 'text-theme-fg';
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-xs text-theme-fg/40 mb-1">{label}</p>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
    </div>
  );
}

function DeclareContributionForm({ campaignId, existingMemberIds, onDone }: { campaignId: string; existingMemberIds: string[]; onDone: () => void }) {
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: membersApi.list });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState('501');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const declareMutation = useMutation({
    mutationFn: () => internalCollectionsApi.declare({
      campaignId,
      amount: Number(amount),
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      memberIds: Array.from(selected),
    }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['internal-collection-roster', campaignId] });
      toast.success(`Declared for ${res.created} member${res.created === 1 ? '' : 's'}${res.skipped ? ` (${res.skipped} already on the roster)` : ''}`);
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to declare contribution'),
  });

  const activeMembers = (members || []).filter((m: any) => m.isActive);
  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-sm font-semibold text-theme-fg mb-4">Declare Contribution</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="form-label">Amount per member (₹) *</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="form-label">Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className="form-input" placeholder="Annual Mandal membership fee" />
        </div>
      </div>

      <label className="form-label">Select Members ({selected.size} selected)</label>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-theme p-2 space-y-1">
        {activeMembers.map((m: any) => {
          const already = existingMemberIds.includes(m.id);
          return (
            <label key={m.id} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm ${already ? 'opacity-40' : 'cursor-pointer hover:bg-theme-fg/5'}`}>
              <input type="checkbox" disabled={already} checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="accent-saffron-600" />
              <span className="text-theme-fg">{m.name}</span>
              {already && <span className="text-[10px] text-theme-fg/40">(already on roster)</span>}
            </label>
          );
        })}
        {!activeMembers.length && <p className="text-xs text-theme-fg/30 text-center py-4">No registered members yet — add some on the Members page first.</p>}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={onDone} className="btn-secondary flex-1">Cancel</button>
        <button
          onClick={() => declareMutation.mutate()}
          disabled={selected.size === 0 || !amount || declareMutation.isPending}
          className="btn-primary flex-1"
        >
          {declareMutation.isPending ? 'Declaring...' : `Declare for ${selected.size} Member${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}

function RosterRow({ member, campaignId }: { member: any; campaignId: string }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(member.amount));
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['internal-collection-roster', campaignId] });

  const amountMutation = useMutation({
    mutationFn: () => receiptsApi.update(member.receiptId, { amount: Number(amount) }),
    onSuccess: () => { invalidate(); setEditing(false); toast.success('Amount updated'); },
    onError: () => toast.error('Failed to update amount'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => receiptsApi.updateStatus(member.receiptId, status),
    onSuccess: invalidate,
    onError: () => toast.error('Failed to update status'),
  });

  const isPaid = member.status === 'PAID';

  return (
    <tr>
      <td>
        <div className="font-medium text-theme-fg">{member.name}</div>
        {member.phone && <div className="text-xs text-theme-fg/40">{member.phone}</div>}
      </td>
      <td>
        {editing ? (
          <input
            type="number"
            autoFocus
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onBlur={() => amountMutation.mutate()}
            onKeyDown={e => e.key === 'Enter' && amountMutation.mutate()}
            className="form-input py-1 px-2 w-24 text-sm"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-theme-fg hover:text-saffron-400 transition-colors">
            {formatCurrency(member.amount)}
            <Pencil size={11} className="opacity-40" />
          </button>
        )}
      </td>
      <td className="text-theme-fg/60 text-xs">{member.dueDate ? format(new Date(member.dueDate), 'dd MMM yyyy') : '—'}</td>
      <td>
        <button
          onClick={() => statusMutation.mutate(isPaid ? 'PENDING' : 'PAID')}
          disabled={statusMutation.isPending}
          className={`badge text-xs ${isPaid ? 'badge-success' : 'badge-danger'}`}
          title={isPaid ? 'Click to mark unpaid' : 'Click to mark paid'}
        >
          {isPaid ? <><CheckCircle2 size={11} /> Paid</> : <><XCircle size={11} /> Unpaid</>}
        </button>
      </td>
    </tr>
  );
}

function InternalCollectionSection({ campaignId }: { campaignId: string }) {
  const [showDeclareForm, setShowDeclareForm] = useState(false);
  const { data: roster, isLoading } = useQuery({
    queryKey: ['internal-collection-roster', campaignId],
    queryFn: () => internalCollectionsApi.roster(campaignId),
  });

  const members = roster?.members || [];
  const existingMemberIds = members.map((m: any) => m.memberId);

  // Urgency banner: earliest due date among unpaid members, per the "prominent
  // deadline warning" requirement — computed client-side since due dates can
  // differ across declare rounds.
  const unpaidDueDates = members.filter((m: any) => m.status !== 'PAID' && m.dueDate).map((m: any) => new Date(m.dueDate));
  const nearestDue = unpaidDueDates.length ? new Date(Math.min(...unpaidDueDates.map((d: Date) => d.getTime()))) : null;
  const daysLeft = nearestDue ? differenceInCalendarDays(nearestDue, new Date()) : null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users2 size={16} className="text-saffron-400" />
          <h3 className="text-sm font-semibold text-theme-fg">Internal Collection <span className="text-theme-fg/40 font-normal">(Mandal Contribution)</span></h3>
        </div>
        <button onClick={() => setShowDeclareForm(!showDeclareForm)} className="btn-secondary text-xs px-3 py-1.5">
          {members.length ? 'Add More Members' : 'Declare Contribution'}
        </button>
      </div>
      <p className="text-xs text-theme-fg/40 mb-4">Bulk-declare a fee for registered members and track who has paid.</p>

      {showDeclareForm && (
        <div className="mb-4">
          <DeclareContributionForm campaignId={campaignId} existingMemberIds={existingMemberIds} onDone={() => setShowDeclareForm(false)} />
        </div>
      )}

      {nearestDue && daysLeft !== null && (
        <div className={`glass-card p-3 mb-4 flex items-center gap-2.5 border ${daysLeft < 0 ? 'border-red-500/30' : daysLeft <= 3 ? 'border-amber-500/30' : 'border-theme'}`}>
          <AlertTriangle size={16} className={daysLeft < 0 ? 'text-red-400' : 'text-amber-400'} />
          <p className="text-xs text-theme-fg/80">
            {daysLeft < 0
              ? <>Payment was due <strong>{format(nearestDue, 'EEEE, dd MMM')}</strong> — {Math.abs(daysLeft)} day{Math.abs(daysLeft) === 1 ? '' : 's'} overdue for {roster.unpaidCount} member{roster.unpaidCount === 1 ? '' : 's'}.</>
              : <>Payment due by <strong>{format(nearestDue, 'EEEE, dd MMM')}</strong> — {daysLeft} day{daysLeft === 1 ? '' : 's'} left, {roster.unpaidCount} member{roster.unpaidCount === 1 ? '' : 's'} still unpaid.</>}
          </p>
        </div>
      )}

      {roster && members.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatTile label="Declared" value={formatCurrency(roster.totalDeclared)} />
          <StatTile label="Collected" value={formatCurrency(roster.totalPaid)} tone="good" />
          <StatTile label="Pending" value={formatCurrency(roster.totalPending)} tone={roster.totalPending > 0 ? 'bad' : 'neutral'} />
        </div>
      )}

      {isLoading ? (
        <div className="skeleton h-32 rounded-2xl" />
      ) : members.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => <RosterRow key={m.receiptId} member={m} campaignId={campaignId} />)}
            </tbody>
          </table>
        </div>
      ) : (
        !showDeclareForm && <p className="text-xs text-theme-fg/30 text-center py-6">No contributions declared yet for this campaign.</p>
      )}
    </div>
  );
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data: campaign, isLoading } = useQuery({ queryKey: ['campaign', params.id], queryFn: () => campaignsApi.get(params.id) });
  const { data: stats } = useQuery({ queryKey: ['campaign-stats', params.id], queryFn: () => campaignsApi.getStats(params.id) });

  if (isLoading || !campaign) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-theme-fg">{campaign.name}</h1>
            <span className={`badge text-xs ${STATUS_COLORS[campaign.status]}`}>{campaign.status}</span>
          </div>
          {campaign.nameMarathi && <p className="text-sm text-theme-fg/40 font-devanagari">{campaign.nameMarathi}</p>}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Collected" value={formatCurrency(stats.totalCollected || 0)} tone="good" />
          <StatTile label="Expenses" value={formatCurrency(stats.totalExpenses || 0)} tone="bad" />
          <StatTile label="Balance" value={formatCurrency(stats.netBalance || 0)} />
          <StatTile label="Pending Dues" value={formatCurrency(stats.pendingCollections || 0)} tone={stats.pendingCollections > 0 ? 'bad' : 'neutral'} />
        </div>
      )}

      <InternalCollectionSection campaignId={params.id} />
    </div>
  );
}
