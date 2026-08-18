'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, campaignsApi, orgsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Plus, CheckCircle, Trash2, FileDown } from 'lucide-react';
import { formatCurrency, EXPENSE_CATEGORY_LABELS, PAYMENT_MODE_LABELS, PaymentMode } from '@pavti/shared';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ExpenseCategory } from '@pavti/shared';
import { useCommonLabels } from '@/lib/i18n';
import PickerWithAdd from '@/components/form/PickerWithAdd';

const CATEGORY_EMOJI: Record<string, string> = {
  DECORATION: '🎨', SOUND_SYSTEM: '🎵', FOOD: '🍱', FIREWORKS: '🎆',
  VENUE: '🏟️', PRINTING: '🖨️', TRANSPORT: '🚛', MISC: '📦',
};

const labels = {
  en: {
    approved: 'Approved Expenses', pending: 'Pending Approval', logExpense: 'Log Expense',
    campaign: 'Campaign', selectCampaign: 'Select campaign...', category: 'Category', amount: 'Amount (₹)',
    date: 'Date', vendor: 'Vendor / Recipient Name', paymentMode: 'Payment Mode', recipientPhone: 'Recipient Phone',
    gst: 'GST Number (Optional)', description: 'Description', saving: 'Saving...', noExpenses: 'No expenses logged yet',
  },
  hi: {
    approved: 'स्वीकृत व्यय', pending: 'लंबित अनुमोदन', logExpense: 'व्यय नोंदवा',
    campaign: 'अभियान', selectCampaign: 'अभियान चुनें...', category: 'श्रेणी', amount: 'राशि (₹)',
    date: 'तारीख', vendor: 'विक्रेता / प्राप्तकर्ता का नाम', paymentMode: 'भुगतान मोड', recipientPhone: 'प्राप्तकर्ता का फोन',
    gst: 'GST नंबर (वैकल्पिक)', description: 'विवरण', saving: 'सहेजा जा रहा है...', noExpenses: 'अभी तक कोई व्यय नहीं जोड़ा गया',
  },
  mr: {
    approved: 'मंजूर खर्च', pending: 'प्रलंबित मंजुरी', logExpense: 'खर्च नोंदवा',
    campaign: 'मोहीम', selectCampaign: 'मोहीम निवडा...', category: 'प्रकार', amount: 'रक्कम (₹)',
    date: 'दिनांक', vendor: 'विक्रेता / प्राप्तकर्त्याचे नाव', paymentMode: 'देय पद्धत', recipientPhone: 'प्राप्तकर्त्याचा फोन',
    gst: 'GST क्रमांक (पर्यायी)', description: 'तपशील', saving: 'जतन होत आहे...', noExpenses: 'अद्याप कोणताही खर्च नोंदवला नाही',
  },
};

function ExpensesPageInner() {
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
  const l = labels[language] || labels.en;
  const common = useCommonLabels();
  const searchParams = useSearchParams();

  // Quick action from the Dashboard ("Add Expense" card) links here with
  // ?new=1 to jump straight into the form, same pattern as the quick-receipt
  // flow on receipts/new (?donorPhone=...).
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setForm((p) => ({ ...p, campaignId: p.campaignId || activeCampaignId || '' }));
      setShowForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', activeCampaignId],
    queryFn: () => expensesApi.list(activeCampaignId || undefined),
  });
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list });
  const { data: customExpenseCategories } = useQuery({ queryKey: ['categories', 'EXPENSE'], queryFn: () => orgsApi.getCategories('EXPENSE') });

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
        <h1 className="text-2xl font-bold text-theme-fg">
          {language === 'mr' ? 'खर्च' : language === 'hi' ? 'व्यय' : 'Expenses'}
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={15} /> {language === 'mr' ? 'खर्च नोंदवा' : 'Log Expense'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <p className="form-label">{l.approved}</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalApproved)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="form-label">{l.pending}</p>
          <p className="text-xl font-bold text-saffron-400">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-theme-fg mb-4">{l.logExpense}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{l.campaign} *</label>
              <select value={form.campaignId} onChange={e => setForm(p => ({ ...p, campaignId: e.target.value }))} className="form-select">
                <option value="">{l.selectCampaign}</option>
                {(campaigns || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">{l.category} *</label>
              <PickerWithAdd
                value={form.category}
                onChange={(v) => setForm(p => ({ ...p, category: v }))}
                options={[
                  ...Object.values(ExpenseCategory).map((cat) => ({ value: cat, label: `${CATEGORY_EMOJI[cat] || '📦'} ${EXPENSE_CATEGORY_LABELS[cat][language]}` })),
                  ...(customExpenseCategories || []).map((c: any) => ({ value: c.label, label: c.label })),
                ]}
                addLabel={language === 'mr' ? '+ नवीन प्रकार जोडा…' : '+ Add new category…'}
                addPlaceholder={language === 'mr' ? 'उदा. केटरिंग' : 'e.g. Catering'}
                onAddNew={async (label) => {
                  const created = await orgsApi.createCategory('EXPENSE', label);
                  queryClient.invalidateQueries({ queryKey: ['categories', 'EXPENSE'] });
                  return created.label;
                }}
              />
            </div>
            <div>
              <label className="form-label">{l.amount} *</label>
              <input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">{l.date}</label>
              <input type="date" value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">{l.vendor}</label>
              <input value={form.paidTo} onChange={e => setForm(p => ({ ...p, paidTo: e.target.value }))} className="form-input" placeholder="Mahalaxmi Decorators" />
            </div>
            <div>
              <label className="form-label">{l.paymentMode}</label>
              <select value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))} className="form-select">
                {Object.values(PaymentMode).map((mode) => (
                  <option key={mode} value={mode}>
                    {mode === 'CASH' ? '💵' : mode === 'UPI' ? '📱' : mode === 'CHEQUE' ? '📄' : mode === 'BANK_TRANSFER' ? '🏦' : '💻'} {PAYMENT_MODE_LABELS[mode][language]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">{l.recipientPhone}</label>
              <input value={form.beneficiaryPhone} onChange={e => setForm(p => ({ ...p, beneficiaryPhone: e.target.value }))} className="form-input" placeholder="9876543210" type="tel" inputMode="tel" />
            </div>
            <div>
              <label className="form-label">{l.gst}</label>
              <input value={form.gstNumber} onChange={e => setForm(p => ({ ...p, gstNumber: e.target.value.toUpperCase() }))} className="form-input" placeholder="27AAAAA1111A1Z1" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">{l.description} *</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-input" placeholder="Sound system rental for 10 days" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">{common.cancel}</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.campaignId || !form.amount || !form.description || createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? l.saving : l.logExpense}
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-theme-fg/30">Loading...</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="sm:hidden divide-y divide-theme-fg/8">
              {(expenses || []).map((e: any) => (
                <div key={e.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-theme-fg truncate">
                        <span className="mr-1">{CATEGORY_EMOJI[e.category]}</span>
                        {e.paidTo || '—'}
                      </p>
                      <p className="text-xs text-theme-fg/60 truncate">{e.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-red-400">{formatCurrency(e.amount)}</p>
                      {e.isApproved ? (
                        <span className="badge badge-success text-[10px] mt-1">✓ Approved</span>
                      ) : (
                        <span className="badge badge-warning text-[10px] mt-1">Pending</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="badge badge-neutral text-[10px]">{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory]?.[language] || e.category}</span>
                    <span className="badge badge-info text-[10px]">{PAYMENT_MODE_LABELS[e.paymentMode as PaymentMode]?.[language] || e.paymentMode}</span>
                    <span className="text-[11px] text-theme-fg/40 ml-auto">{format(new Date(e.expenseDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-theme-fg/60">{e.addedBy?.name}</span>
                    <div className="flex gap-1 -mr-2">
                      <button onClick={() => voucherMutation.mutate(e.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-saffron-500/10 text-theme-fg/40 hover:text-saffron-400 transition-colors" title="Download Voucher">
                        <FileDown size={17} />
                      </button>
                      {!e.isApproved && (
                        <button onClick={() => approveMutation.mutate(e.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-emerald-500/10 text-theme-fg/40 hover:text-emerald-400 transition-colors">
                          <CheckCircle size={17} />
                        </button>
                      )}
                      {!e.isApproved && (
                        <button onClick={() => deleteMutation.mutate(e.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-red-500/10 text-theme-fg/40 hover:text-red-400 transition-colors">
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!expenses?.length && (
                <p className="text-center text-theme-fg/30 py-8 text-sm">{l.noExpenses}</p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="table-container hidden sm:block">
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
                        <span className="ml-2 text-xs text-theme-fg/60">{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory]?.[language] || e.category}</span>
                      </td>
                      <td>
                        <div className="font-semibold text-theme-fg/80">{e.paidTo || '—'}</div>
                        {e.beneficiaryPhone && <div className="text-[10px] text-theme-fg/40">{e.beneficiaryPhone}</div>}
                      </td>
                      <td className="text-theme-fg/70 text-sm">{e.description}</td>
                      <td className="font-bold text-red-400">{formatCurrency(e.amount)}</td>
                      <td><span className="badge badge-info text-[10px]">{PAYMENT_MODE_LABELS[e.paymentMode as PaymentMode]?.[language] || e.paymentMode}</span></td>
                      <td className="text-theme-fg/40 text-xs">{format(new Date(e.expenseDate), 'dd MMM yyyy')}</td>
                      <td className="text-theme-fg/60 text-sm">{e.addedBy?.name}</td>
                      <td>
                        {e.isApproved ? (
                          <span className="badge badge-success">✓ Approved</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => voucherMutation.mutate(e.id)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-saffron-500/10 text-theme-fg/40 hover:text-saffron-400 transition-colors" title="Download Voucher">
                            <FileDown size={14} />
                          </button>
                          {!e.isApproved && (
                            <button onClick={() => approveMutation.mutate(e.id)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-emerald-500/10 text-theme-fg/40 hover:text-emerald-400 transition-colors">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {!e.isApproved && (
                            <button onClick={() => deleteMutation.mutate(e.id)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-red-500/10 text-theme-fg/40 hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!expenses?.length && (
                    <tr><td colSpan={11} className="text-center text-theme-fg/30 py-8">{l.noExpenses}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesPageInner />
    </Suspense>
  );
}
