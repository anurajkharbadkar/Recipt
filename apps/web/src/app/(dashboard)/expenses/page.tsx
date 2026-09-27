'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, campaignsApi, orgsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Plus, Trash2, FileDown, Upload, Camera, ImageIcon, X, ExternalLink, Loader2, Eye } from 'lucide-react';
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
    total: 'Total Expenses', logExpense: 'Log Expense',
    campaign: 'Campaign', selectCampaign: 'Select campaign...', category: 'Category', amount: 'Amount (₹)',
    date: 'Date', vendor: 'Vendor / Recipient Name', paymentMode: 'Payment Mode', recipientPhone: 'Recipient Phone',
    gst: 'GST Number (Optional)', description: 'Description', saving: 'Saving...', noExpenses: 'No expenses logged yet',
    billPhoto: 'Bill / Receipt Photo (Optional)', uploadBill: 'Upload Bill Photo / Receipt', uploadingBill: 'Uploading Bill...',
    removeBill: 'Remove Bill', viewBill: 'View Bill Photo',
  },
  hi: {
    total: 'कुल व्यय', logExpense: 'व्यय दर्ज करें',
    campaign: 'अभियान', selectCampaign: 'अभियान चुनें...', category: 'श्रेणी', amount: 'राशि (₹)',
    date: 'तारीख', vendor: 'विक्रेता / प्राप्तकर्ता का नाम', paymentMode: 'भुगतान मोड', recipientPhone: 'प्राप्तकर्ता का फोन',
    gst: 'GST नंबर (वैकल्पिक)', description: 'विवरण', saving: 'सहेजा जा रहा है...', noExpenses: 'अभी तक कोई व्यय नहीं जोड़ा गया',
    billPhoto: 'बिल / रसीद की फोटो (वैकल्पिक)', uploadBill: 'बिल फोटो अपलोड करें', uploadingBill: 'अपलोड हो रहा है...',
    removeBill: 'फोटो हटाएं', viewBill: 'बिल देखें',
  },
  mr: {
    total: 'एकूण खर्च', logExpense: 'खर्च नोंदवा',
    campaign: 'मोहीम', selectCampaign: 'मोहीम निवडा...', category: 'प्रकार', amount: 'रक्कम (₹)',
    date: 'दिनांक', vendor: 'विक्रेता / प्राप्तकर्त्याचे नाव', paymentMode: 'देय पद्धत', recipientPhone: 'प्राप्तकर्त्याचा फोन',
    gst: 'GST क्रमांक (पर्यायी)', description: 'तपशील', saving: 'जतन होत आहे...', noExpenses: 'अद्याप कोणताही खर्च नोंदवला नाही',
    billPhoto: 'पावती / बिलाचा फोटो (पर्यायी)', uploadBill: 'बिलाचा फोटो अपलोड करा', uploadingBill: 'अपलोड होत आहे...',
    removeBill: 'फोटो काढा', viewBill: 'बिल पहा',
  },
};

function ExpensesPageInner() {
  const [showForm, setShowForm] = useState(false);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [viewingBillUrl, setViewingBillUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    campaignId: '',
    category: 'DECORATION',
    amount: '',
    description: '',
    paidTo: '',
    beneficiaryPhone: '',
    gstNumber: '',
    paymentMode: 'CASH',
    receiptUrl: '',
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setUploadingBill(true);
    const toastId = toast.loading('Uploading bill photo...');
    try {
      const res = await expensesApi.uploadBillPhoto(file);
      setForm((p) => ({ ...p, receiptUrl: res.url }));
      toast.success('Bill photo uploaded!', { id: toastId });
    } catch (err: any) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setForm((p) => ({ ...p, receiptUrl: dataUrl }));
          toast.success('Bill photo attached!', { id: toastId });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingBill(false);
    }
  };

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
        receiptUrl: '',
        expenseDate: new Date().toISOString().split('T')[0]
      });
      toast.success('Expense added!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add expense'),
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

  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-theme-fg">
          {language === 'mr' ? 'खर्च' : language === 'hi' ? 'व्यय' : 'Expenses'}
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm w-full sm:w-auto justify-center">
          <Plus size={15} /> {l.logExpense}
        </button>
      </div>

      {/* Summary */}
      <div className="glass-card p-4 sm:p-5">
        <p className="form-label">{l.total}</p>
        <p className="text-xl sm:text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
      </div>

      {showForm && (
        <div className="glass-card p-4 sm:p-6 animate-slide-up">
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
                addLabel={language === 'mr' ? '+ नवीन प्रकार जोडा…' : language === 'hi' ? '+ नई श्रेणी जोड़ें…' : '+ Add new category…'}
                addPlaceholder={language === 'mr' ? 'उदा. केटरिंग' : language === 'hi' ? 'उदा. केटरिंग' : 'e.g. Catering'}
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
              <input value={form.beneficiaryPhone} onChange={e => setForm(p => ({ ...p, beneficiaryPhone: e.target.value }))} className="form-input" placeholder="98XXXXXXXX" type="tel" inputMode="tel" />
            </div>
            <div>
              <label className="form-label">{l.gst}</label>
              <input value={form.gstNumber} onChange={e => setForm(p => ({ ...p, gstNumber: e.target.value.toUpperCase() }))} className="form-input" placeholder="27AAAAA1111A1Z1" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">{l.description} *</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-input" placeholder="Sound system rental for 10 days" />
            </div>

            {/* Bill Photo Upload Option */}
            <div className="sm:col-span-2">
              <label className="form-label">{l.billPhoto}</label>
              {form.receiptUrl ? (
                <div className="relative flex items-center gap-3 p-3 bg-theme-fg/5 rounded-xl border border-theme-fg/10">
                  <img
                    src={form.receiptUrl}
                    alt="Bill Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-theme-fg/10 bg-black/20 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-theme-fg truncate">
                      {language === 'mr' ? 'बिलाची प्रत अपलोड झाली' : language === 'hi' ? 'बिल फोटो संलग्न है' : 'Bill Photo Attached'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setViewingBillUrl(form.receiptUrl)}
                      className="text-[11px] text-saffron-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Eye size={12} /> {l.viewBill}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, receiptUrl: '' }))}
                    className="p-1.5 rounded-lg text-theme-fg/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={l.removeBill}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-theme-fg/15 hover:border-saffron-500/50 rounded-xl p-4 text-center bg-theme-fg/5 transition-colors group">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                    disabled={uploadingBill}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    {uploadingBill ? (
                      <Loader2 size={24} className="animate-spin text-saffron-400 mb-1" />
                    ) : (
                      <div className="p-2 rounded-full bg-saffron-500/10 text-saffron-400 group-hover:scale-110 transition-transform">
                        <Camera size={20} />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-theme-fg">
                      {uploadingBill ? l.uploadingBill : l.uploadBill}
                    </span>
                    <span className="text-[10px] text-theme-fg/40">
                      {language === 'mr' ? 'कॅमेरा किंवा गॅलरीमधून बिलाचा फोटो निवडा (JPG, PNG, PDF)' : language === 'hi' ? 'कैमरा या गैलरी से बिल फोटो चुनें (JPG, PNG, PDF)' : 'Take camera photo or pick from gallery (JPG, PNG, PDF)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">{common.cancel}</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.campaignId || !form.amount || !form.description || createMutation.isPending || uploadingBill}
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
            <div className="sm:hidden p-3 space-y-3">
              {(expenses || []).map((e: any) => (
                <div key={e.id} className="p-4 rounded-xl bg-theme-fg/[0.03] border border-theme-fg/10 space-y-3 shadow-sm hover:border-theme-fg/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-saffron-500/10 border border-saffron-500/20 flex items-center justify-center text-lg shrink-0">
                        {CATEGORY_EMOJI[e.category] || '📦'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-theme-fg text-sm truncate">{e.paidTo || e.description || '—'}</h4>
                        <p className="text-xs text-theme-fg/60 line-clamp-1">{e.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-red-400 text-base">{formatCurrency(e.amount)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-theme-fg/5 text-xs">
                    <span className="badge badge-neutral text-[10px]">{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory]?.[language] || e.category}</span>
                    <span className="badge badge-info text-[10px]">{PAYMENT_MODE_LABELS[e.paymentMode as PaymentMode]?.[language] || e.paymentMode}</span>
                    <span className="text-[11px] text-theme-fg/40 ml-auto">{format(new Date(e.expenseDate), 'dd MMM yyyy')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-theme-fg/50 font-medium">By: {e.addedBy?.name || 'Admin'}</span>
                    <div className="flex items-center gap-1.5">
                      {e.receiptUrl && (
                        <button
                          onClick={() => setViewingBillUrl(e.receiptUrl)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
                          title={l.viewBill}
                        >
                          <ImageIcon size={13} />
                          <span>Bill</span>
                        </button>
                      )}
                      <button
                        onClick={() => voucherMutation.mutate(e.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-saffron-500/10 hover:bg-saffron-500/20 text-saffron-400 border border-saffron-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Download Voucher"
                      >
                        <FileDown size={13} />
                        <span>Voucher</span>
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(e.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
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
                      <td className="text-theme-fg/70 text-sm">
                        <div>{e.description}</div>
                        {e.receiptUrl && (
                          <button
                            onClick={() => setViewingBillUrl(e.receiptUrl)}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-0.5"
                          >
                            <ImageIcon size={11} /> {l.viewBill}
                          </button>
                        )}
                      </td>
                      <td className="font-bold text-red-400">{formatCurrency(e.amount)}</td>
                      <td><span className="badge badge-info text-[10px]">{PAYMENT_MODE_LABELS[e.paymentMode as PaymentMode]?.[language] || e.paymentMode}</span></td>
                      <td className="text-theme-fg/40 text-xs">{format(new Date(e.expenseDate), 'dd MMM yyyy')}</td>
                      <td className="text-theme-fg/60 text-sm">{e.addedBy?.name}</td>
                      <td>
                        <div className="flex gap-1">
                          {e.receiptUrl && (
                            <button
                              onClick={() => setViewingBillUrl(e.receiptUrl)}
                              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-emerald-500/10 text-theme-fg/40 hover:text-emerald-400 transition-colors"
                              title={l.viewBill}
                            >
                              <ImageIcon size={14} />
                            </button>
                          )}
                          <button onClick={() => voucherMutation.mutate(e.id)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-saffron-500/10 text-theme-fg/40 hover:text-saffron-400 transition-colors" title="Download Voucher">
                            <FileDown size={14} />
                          </button>
                          <button onClick={() => deleteMutation.mutate(e.id)} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-red-500/10 text-theme-fg/40 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
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

      {/* Bill Photo Lightbox Modal */}
      {viewingBillUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setViewingBillUrl(null)}>
          <div className="relative max-w-2xl w-full bg-theme-bg p-4 rounded-2xl border border-theme-fg/20 shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-theme-fg/10 mb-3">
              <h4 className="text-sm font-semibold text-theme-fg flex items-center gap-2">
                <ImageIcon size={16} className="text-saffron-400" />
                {l.viewBill}
              </h4>
              <button onClick={() => setViewingBillUrl(null)} className="p-1 rounded-lg text-theme-fg/50 hover:text-theme-fg hover:bg-theme-fg/10">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 rounded-xl p-2 min-h-[250px]">
              {viewingBillUrl.endsWith('.pdf') ? (
                <iframe src={viewingBillUrl} className="w-full h-[500px] rounded-lg" />
              ) : (
                <img src={viewingBillUrl} alt="Bill Document" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3 mt-1 border-t border-theme-fg/10">
              <a href={viewingBillUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                <ExternalLink size={13} /> Open Original
              </a>
              <button onClick={() => setViewingBillUrl(null)} className="btn-primary text-xs py-1.5 px-3">
                {language === 'mr' ? 'बंद करा' : language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
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
