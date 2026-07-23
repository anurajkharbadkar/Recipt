'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, campaignsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Plus, CheckCircle, Trash2, FileDown } from 'lucide-react';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ExpenseCategory } from '@pavti/shared';

const CATEGORY_EMOJI: Record<string, string> = {
  DECORATION: '🎨', SOUND_SYSTEM: '🎵', FOOD: '🍱', FIREWORKS: '🎆',
  VENUE: '🏟️', PRINTING: '🖨️', TRANSPORT: '🚛', MISC: '📦',
};

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    campaignId: '',
    category: 'DECORATION',
    amount: '',
    description: '',
    paidTo: '',
    beneficiaryPhone: '',
    gstNumber: '',
    paymentMode: 'CASH',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const { language, activeCampaignId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', activeCampaignId],
    queryFn: () => expensesApi.list(activeCampaignId || undefined),
  });
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowForm(false);
      setForm({
        campaignId: '',
        category: 'DECORATION',
        amount: '',
        description: '',
        paidTo: '',
        beneficiaryPhone: '',
        gstNumber: '',
        paymentMode: 'CASH',
        expenseDate: new Date().toISOString().split('T')[0]
      });
      toast.success('Expense added!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add expense'),
  });

  const approveMutation = useMutation({
    mutationFn: expensesApi.approve,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense approved!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted'); },
  });

  const voucherMutation = useMutation({
    mutationFn: (id: string) => expensesApi.downloadVoucher(id),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    },
    onError: () => toast.error('Failed to generate voucher'),
  });

  const totalApproved = (expenses || []).filter((e: any) => e.isApproved).reduce((s: number, e: any) => s + e.amount, 0);
  const totalPending = (expenses || []).filter((e: any) => !e.isApproved).reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {language === 'mr' ? 'खर्च' : language === 'hi' ? 'व्यय' : 'Expenses'}
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={15} /> {language === 'mr' ? 'खर्च नोंदवा' : 'Log Expense'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <p className="form-label">Approved Expenses</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalApproved)}</p>
        </div>
        <div className="stat-card">
          <p className="form-label">Pending Approval</p>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Log Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Campaign *</label>
              <select value={form.campaignId} onChange={e => setForm(p => ({ ...p, campaignId: e.target.value }))} className="form-select">
                <option value="">Select campaign...</option>
                {(campaigns || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Category *</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="form-select">
                {Object.values(ExpenseCategory).map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Vendor / Recipient Name *</label>
              <input value={form.paidTo} onChange={e => setForm(p => ({ ...p, paidTo: e.target.value }))} className="form-input" placeholder="Mahalaxmi Decorators" />
            </div>
            <div>
              <label className="form-label">Payment Mode</label>
              <select value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))} className="form-select">
                <option value="CASH">💵 Cash</option>
                <option value="UPI">📱 UPI</option>
                <option value="CHEQUE">📄 Cheque</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                <option value="ONLINE">💻 Online</option>
              </select>
            </div>
            <div>
              <label className="form-label">Recipient Phone</label>
              <input value={form.beneficiaryPhone} onChange={e => setForm(p => ({ ...p, beneficiaryPhone: e.target.value }))} className="form-input" placeholder="9876543210" type="tel" />
            </div>
            <div>
              <label className="form-label">GST Number (Optional)</label>
              <input value={form.gstNumber} onChange={e => setForm(p => ({ ...p, gstNumber: e.target.value.toUpperCase() }))} className="form-input" placeholder="27AAAAA1111A1Z1" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description *</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-input" placeholder="Sound system rental for 10 days" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.campaignId || !form.amount || !form.description || !form.paidTo || createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Saving...' : 'Log Expense'}
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Vendor / Recipient</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Date</th>
                  <th>Added By</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(expenses || []).map((e: any) => (
                  <tr key={e.id}>
                    <td>
                      <span className="text-lg">{CATEGORY_EMOJI[e.category]}</span>
                      <span className="ml-2 text-xs text-white/60">{e.category.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-white/80">{e.paidTo || '—'}</div>
                      {e.beneficiaryPhone && <div className="text-[10px] text-white/40">{e.beneficiaryPhone}</div>}
                    </td>
                    <td className="text-white/70 text-sm">{e.description}</td>
                    <td className="font-bold text-red-400">{formatCurrency(e.amount)}</td>
                    <td><span className="badge badge-info text-[10px]">{e.paymentMode}</span></td>
                    <td className="text-white/40 text-xs">{format(new Date(e.expenseDate), 'dd MMM yyyy')}</td>
                    <td className="text-white/60 text-sm">{e.addedBy?.name}</td>
                    <td>
                      {e.isApproved ? (
                        <span className="badge badge-success">✓ Approved</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => voucherMutation.mutate(e.id)} className="p-1.5 rounded-lg hover:bg-saffron-500/10 text-white/40 hover:text-saffron-400 transition-colors" title="Download Voucher">
                          <FileDown size={14} />
                        </button>
                        {!e.isApproved && (
                          <button onClick={() => approveMutation.mutate(e.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 transition-colors">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {!e.isApproved && (
                          <button onClick={() => deleteMutation.mutate(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!expenses?.length && (
                  <tr><td colSpan={11} className="text-center text-white/30 py-8">No expenses logged yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
