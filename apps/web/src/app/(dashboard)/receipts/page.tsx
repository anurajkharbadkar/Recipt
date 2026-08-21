'use client';

import { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '@/lib/api';
import { shareReceiptViaWhatsApp, prefetchReceiptImage } from '@/lib/whatsappShare';
import { useAuthStore } from '@/store/auth.store';
import { useUrlState } from '@/hooks/useUrlState';
import Link from 'next/link';
import { Plus, Search, Download, Filter, Eye, Share2, XCircle, Users, ChevronDown, ChevronUp, Zap, Loader2 } from 'lucide-react';
import {
  formatCurrency,
  RECEIPT_CATEGORIES_LABELS, PAYMENT_MODE_LABELS, RECEIPT_STATUS_LABELS, COLLECTION_TYPE_LABELS,
  DonationCategory, PaymentMode, ReceiptStatus, CollectionType,
} from '@pavti/shared';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function ReceiptsPageInner() {
  // Page/search/date-range/type/status are all navigation state — a
  // refresh, a shared link, or the browser back button should all land
  // back on the same filtered view, so these read from the URL rather
  // than local useState. showDonors/donorFilter/sharingId stay local:
  // they're transient UI state (a panel toggle, an in-panel-only search,
  // a per-row loading flag), not something worth bookmarking.
  const { get, getNumber, setParams } = useUrlState();
  const search = get('search');
  const dateFrom = get('dateFrom');
  const dateTo = get('dateTo');
  const page = getNumber('page', 1);
  const collectionType = get('collectionType');
  const status = get('status');
  const [showDonors, setShowDonors] = useState(false);
  const [donorFilter, setDonorFilter] = useState('');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const { activeCampaignId, language, user, organization } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: repeatDonors } = useQuery({
    queryKey: ['existing-donors'],
    queryFn: receiptsApi.donors,
    enabled: showDonors,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', page, search, dateFrom, dateTo, activeCampaignId, collectionType, status],
    queryFn: () =>
      receiptsApi.list({
        page,
        limit: 20,
        search: search || undefined,
        campaignId: activeCampaignId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        collectionType: collectionType || undefined,
        status: status || undefined,
      }),
  });

  const exportMutation = useMutation({
    mutationFn: () => receiptsApi.exportCsv(activeCampaignId || undefined),
    onSuccess: (csvData) => {
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      toast.success('CSV exported!');
    },
  });

  const handleShare = async (r: any) => {
    if (!r.donorPhone) return;
    setSharingId(r.id);
    try {
      await shareReceiptViaWhatsApp({
        donorPhone: r.donorPhone,
        donorName: r.donorName,
        amount: r.amount,
        receiptNumber: r.receiptNumber,
        receiptId: r.id,
        category: r.category,
        createdAt: r.createdAt,
        organization: organization as any,
      });
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-theme-fg">
          {language === 'mr' ? 'पावत्या' : language === 'hi' ? 'रसीदें' : 'Receipts'}
        </h1>
        <div className="flex gap-2">
          {/* Matches the backend exactly — GET /receipts/export/csv is
              ORG_ADMIN/TREASURER only, POST /receipts excludes VIEWER.
              Showing either to a role that will just get a 403 back is worse
              than not showing it, especially "New" — a VIEWER filling out
              the whole multi-step form only to be rejected at submit. */}
          {['ORG_ADMIN', 'TREASURER'].includes(user?.role || '') && (
            <button onClick={() => exportMutation.mutate()} className="btn-secondary text-sm" disabled={exportMutation.isPending}>
              <Download size={15} /> CSV
            </button>
          )}
          {user?.role !== 'VIEWER' && (
            <Link href="/receipts/new" className="btn-primary text-sm">
              <Plus size={15} />
              {language === 'mr' ? 'नवीन' : 'New'}
            </Link>
          )}
        </div>
      </div>

      {/* Repeat Donors quick-access panel */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowDonors((s) => !s)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-theme-fg">
            <Users size={15} className="text-saffron-400" /> Repeat Donors — One-Click Receipt
          </span>
          {showDonors ? <ChevronUp size={16} className="text-theme-fg/40" /> : <ChevronDown size={16} className="text-theme-fg/40" />}
        </button>
        {showDonors && (
          <div className="p-4 pt-0 space-y-3 animate-slide-up">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
              <input
                value={donorFilter}
                onChange={(e) => setDonorFilter(e.target.value)}
                className="form-input pl-8 py-1.5 text-xs"
                placeholder="Search donors..."
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {(repeatDonors || [])
                .filter((d: any) =>
                  d.donorName.toLowerCase().includes(donorFilter.toLowerCase()) ||
                  d.donorPhone?.includes(donorFilter)
                )
                .slice(0, 50)
                .map((d: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-theme-fg/5 rounded-lg">
                    <div>
                      <p className="text-sm text-theme-fg/85 font-medium">{d.donorName}</p>
                      {d.donorPhone && <p className="text-[10px] text-theme-fg/40">{d.donorPhone}</p>}
                    </div>
                    <Link
                      href={`/receipts/new?donorPhone=${encodeURIComponent(d.donorPhone || '')}`}
                      className="btn-primary text-xs px-3 py-1.5 gap-1"
                    >
                      <Zap size={12} /> New Receipt
                    </Link>
                  </div>
                ))}
              {!repeatDonors?.length && (
                <p className="text-xs text-theme-fg/30 text-center py-4">No repeat donors yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-fg/30" />
          <input
            value={search}
            onChange={(e) => setParams({ search: e.target.value })}
            className="form-input pl-9 py-2 text-sm"
            placeholder={language === 'mr' ? 'नाव, फोन किंवा पावती क्र. शोधा...' : 'Search donor, phone, or receipt #...'}
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setParams({ dateFrom: e.target.value })}
          className="form-input py-2 text-sm w-auto"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setParams({ dateTo: e.target.value })}
          className="form-input py-2 text-sm w-auto"
        />
        <select
          value={collectionType}
          onChange={(e) => setParams({ collectionType: e.target.value })}
          className="form-select py-2 text-sm w-auto"
        >
          <option value="">{language === 'mr' ? 'सर्व प्रकार' : language === 'hi' ? 'सभी प्रकार' : 'All Types'}</option>
          <option value="DONATION">🤝 {COLLECTION_TYPE_LABELS[CollectionType.DONATION][language]}</option>
          <option value="INTERNAL">🏢 {COLLECTION_TYPE_LABELS[CollectionType.INTERNAL][language]}</option>
        </select>
        <select
          value={status}
          onChange={(e) => setParams({ status: e.target.value })}
          className="form-select py-2 text-sm w-auto"
        >
          <option value="">{language === 'mr' ? 'सर्व स्थिती' : language === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
          <option value="PAID">🟢 {RECEIPT_STATUS_LABELS[ReceiptStatus.PAID][language]}</option>
          <option value="PENDING">🟡 {RECEIPT_STATUS_LABELS[ReceiptStatus.PENDING][language]}</option>
          <option value="CANCELLED">⚫ {RECEIPT_STATUS_LABELS[ReceiptStatus.CANCELLED][language]}</option>
        </select>
      </div>

      {/* List — a stacked card per receipt below sm:, the full table at sm: and up.
          The table doesn't overflow the page (it's wrapped in a scroll container),
          but "scroll sideways to see your own amount and status" is real friction
          on the screen collectors check most; see the mobile UX audit. */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-theme-fg/30">Loading...</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="sm:hidden divide-y divide-theme-fg/8">
              {(data?.data || []).map((r: any) => (
                <div key={r.id} className={`p-4 space-y-2.5 ${r.isVoided ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/receipts/${r.id}`} className="text-saffron-400 font-mono text-xs block">
                        {r.receiptNumber}
                      </Link>
                      <p className="font-semibold text-theme-fg truncate">{r.donorName}</p>
                      {r.donorPhone && <p className="text-xs text-theme-fg/40">{r.donorPhone}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-400">{formatCurrency(r.amount)}</p>
                      {r.isVoided ? (
                        <span className="badge badge-danger text-[10px] mt-1">Voided</span>
                      ) : r.status === 'PENDING' ? (
                        <span className="badge badge-warning text-[10px] mt-1">🟡 {RECEIPT_STATUS_LABELS[ReceiptStatus.PENDING][language]}</span>
                      ) : r.status === 'CANCELLED' ? (
                        <span className="badge badge-neutral text-[10px] mt-1">⚫ {RECEIPT_STATUS_LABELS[ReceiptStatus.CANCELLED][language]}</span>
                      ) : (
                        <span className="badge badge-success text-[10px] mt-1">🟢 {RECEIPT_STATUS_LABELS[ReceiptStatus.PAID][language]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="badge badge-saffron text-[10px]">{RECEIPT_CATEGORIES_LABELS[r.category as DonationCategory]?.[language] || r.category}</span>
                    <span className="badge badge-info text-[10px]">{PAYMENT_MODE_LABELS[r.paymentMode as PaymentMode]?.[language] || r.paymentMode}</span>
                    <span className="text-[11px] text-theme-fg/40 ml-auto">{format(new Date(r.createdAt), 'dd MMM, hh:mm a')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-theme-fg/60">{r.collector?.name}</span>
                    <div className="flex gap-1 -mr-2">
                      <Link href={`/receipts/${r.id}`} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-theme-fg/8 text-theme-fg/50 hover:text-theme-fg transition-colors">
                        <Eye size={17} />
                      </Link>
                      {r.donorPhone && (
                        <button onClick={() => handleShare(r)} onMouseEnter={() => prefetchReceiptImage(r.id)} onTouchStart={() => prefetchReceiptImage(r.id)} disabled={sharingId === r.id} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-green-500/10 text-theme-fg/50 hover:text-green-400 transition-colors">
                          {sharingId === r.id ? <Loader2 size={17} className="animate-spin" /> : <Share2 size={17} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!data?.data?.length && (
                <p className="text-center text-theme-fg/30 py-12 text-sm">
                  {language === 'mr' ? 'कोणत्याही पावत्या आढळल्या नाहीत' : 'No receipts found'}
                </p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="table-container hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Mode</th>
                    <th>Collector</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data || []).map((r: any) => (
                    <tr key={r.id} className={r.isVoided ? 'opacity-50' : ''}>
                      <td>
                        <Link href={`/receipts/${r.id}`} className="text-saffron-400 hover:text-saffron-300 font-mono text-sm">
                          {r.receiptNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="font-medium text-theme-fg">{r.donorName}</div>
                        {r.donorPhone && <div className="text-xs text-theme-fg/40">{r.donorPhone}</div>}
                      </td>
                      <td className="font-bold text-emerald-400">{formatCurrency(r.amount)}</td>
                      <td><span className="badge badge-saffron text-xs">{RECEIPT_CATEGORIES_LABELS[r.category as DonationCategory]?.[language] || r.category}</span></td>
                      <td><span className="badge badge-info text-xs">{PAYMENT_MODE_LABELS[r.paymentMode as PaymentMode]?.[language] || r.paymentMode}</span></td>
                      <td className="text-theme-fg/70 text-sm">{r.collector?.name}</td>
                      <td className="text-theme-fg/40 text-xs">{format(new Date(r.createdAt), 'dd MMM, hh:mm a')}</td>
                      <td>
                        {r.isVoided ? (
                          <span className="badge badge-danger">Voided</span>
                        ) : r.status === 'PENDING' ? (
                          <span className="badge badge-warning">🟡 {RECEIPT_STATUS_LABELS[ReceiptStatus.PENDING][language]}</span>
                        ) : r.status === 'CANCELLED' ? (
                          <span className="badge badge-neutral">⚫ {RECEIPT_STATUS_LABELS[ReceiptStatus.CANCELLED][language]}</span>
                        ) : (
                          <span className="badge badge-success">🟢 {RECEIPT_STATUS_LABELS[ReceiptStatus.PAID][language]}</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Link href={`/receipts/${r.id}`} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-theme-fg/8 text-theme-fg/50 hover:text-theme-fg transition-colors">
                            <Eye size={14} />
                          </Link>
                          {r.donorPhone && (
                            <button onClick={() => handleShare(r)} onMouseEnter={() => prefetchReceiptImage(r.id)} onTouchStart={() => prefetchReceiptImage(r.id)} disabled={sharingId === r.id} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-green-500/10 text-theme-fg/50 hover:text-green-400 transition-colors">
                              {sharingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!data?.data?.length && (
                    <tr>
                      <td colSpan={10} className="text-center text-theme-fg/30 py-12">
                        {language === 'mr' ? 'कोणत्याही पावत्या आढळल्या नाहीत' : 'No receipts found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-theme-fg/8">
                <p className="text-xs text-theme-fg/40">
                  Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setParams({ page: Math.max(1, page - 1) }, { resetPage: false })}
                    disabled={page === 1}
                    className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setParams({ page: Math.min(data.totalPages, page + 1) }, { resetPage: false })}
                    disabled={page === data.totalPages}
                    className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={null}>
      <ReceiptsPageInner />
    </Suspense>
  );
}
