'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Plus, Search, Download, Filter, Eye, Share2, XCircle, Users, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [collectionType, setCollectionType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [showDonors, setShowDonors] = useState(false);
  const [donorFilter, setDonorFilter] = useState('');
  const { activeCampaignId, language } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: repeatDonors } = useQuery({
    queryKey: ['existing-donors'],
    queryFn: receiptsApi.donors,
    enabled: showDonors,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', search, dateFrom, dateTo, page, activeCampaignId, collectionType, status],
    queryFn: () => receiptsApi.list({
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      campaignId: activeCampaignId || undefined,
      collectionType: collectionType || undefined,
      status: status || undefined,
      page,
      limit: 20,
    }),
  });

  const exportMutation = useMutation({
    mutationFn: () => receiptsApi.exportCsv(activeCampaignId || undefined),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      toast.success('CSV exported!');
    },
  });

  const handleShare = (r: any) => {
    if (!r.donorPhone) return;
    const url = `${window.location.origin}/receipt/${r.id}`;
    const msg = encodeURIComponent(`Receipt ${r.receiptNumber}: ₹${r.amount}\nView: ${url}`);
    window.open(`https://wa.me/91${r.donorPhone.replace(/\D/g, '')}?text=${msg}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {language === 'mr' ? 'पावत्या' : language === 'hi' ? 'रसीदें' : 'Receipts'}
        </h1>
        <div className="flex gap-2">
          <button onClick={() => exportMutation.mutate()} className="btn-secondary text-sm" disabled={exportMutation.isPending}>
            <Download size={15} /> CSV
          </button>
          <Link href="/receipts/new" className="btn-primary text-sm">
            <Plus size={15} />
            {language === 'mr' ? 'नवीन' : 'New'}
          </Link>
        </div>
      </div>

      {/* Repeat Donors quick-access panel */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowDonors((s) => !s)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users size={15} className="text-saffron-400" /> Repeat Donors — One-Click Receipt
          </span>
          {showDonors ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
        </button>
        {showDonors && (
          <div className="p-4 pt-0 space-y-3 animate-slide-up">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
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
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-sm text-white/85 font-medium">{d.donorName}</p>
                      {d.donorPhone && <p className="text-[10px] text-white/40">{d.donorPhone}</p>}
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
                <p className="text-xs text-white/30 text-center py-4">No repeat donors yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9 py-2 text-sm"
            placeholder={language === 'mr' ? 'नाव, फोन किंवा पावती क्र. शोधा...' : 'Search donor, phone, or receipt #...'}
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="form-input py-2 text-sm w-auto"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="form-input py-2 text-sm w-auto"
        />
        <select
          value={collectionType}
          onChange={(e) => { setCollectionType(e.target.value); setPage(1); }}
          className="form-select py-2 text-sm w-auto"
        >
          <option value="">All Types</option>
          <option value="DONATION">🤝 Donation</option>
          <option value="INTERNAL">🏢 Internal Collection</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="form-select py-2 text-sm w-auto"
        >
          <option value="">All Statuses</option>
          <option value="PAID">🟢 Paid</option>
          <option value="PENDING">🟡 Pending</option>
          <option value="CANCELLED">⚫ Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading...</div>
        ) : (
          <>
            <div className="table-container">
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
                    <th>Delivery</th>
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
                        <div className="font-medium text-white">{r.donorName}</div>
                        {r.donorPhone && <div className="text-xs text-white/40">{r.donorPhone}</div>}
                      </td>
                      <td className="font-bold text-emerald-400">{formatCurrency(r.amount)}</td>
                      <td><span className="badge badge-saffron text-xs">{r.category}</span></td>
                      <td><span className="badge badge-info text-xs">{r.paymentMode}</span></td>
                      <td className="text-white/70 text-sm">{r.collector?.name}</td>
                      <td className="text-white/40 text-xs">{format(new Date(r.createdAt), 'dd MMM, hh:mm a')}</td>
                      <td>
                        {r.status === 'PENDING' ? (
                          <span className="badge badge-warning">🟡 Pending</span>
                        ) : r.status === 'CANCELLED' ? (
                          <span className="badge badge-neutral">⚫ Cancelled</span>
                        ) : (
                          <span className="badge badge-success">🟢 Paid</span>
                        )}
                      </td>
                      <td>
                        {r.isVoided ? (
                          <span className="badge badge-danger">Voided</span>
                        ) : r.whatsappSent ? (
                          <span className="badge badge-success">Sent</span>
                        ) : (
                          <span className="badge badge-neutral">Not sent</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Link href={`/receipts/${r.id}`} className="p-1.5 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors">
                            <Eye size={14} />
                          </Link>
                          {r.donorPhone && (
                            <button onClick={() => handleShare(r)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/50 hover:text-green-400 transition-colors">
                              <Share2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!data?.data?.length && (
                    <tr>
                      <td colSpan={10} className="text-center text-white/30 py-12">
                        {language === 'mr' ? 'कोणत्याही पावत्या आढळल्या नाहीत' : 'No receipts found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/8">
                <p className="text-xs text-white/40">
                  Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
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
