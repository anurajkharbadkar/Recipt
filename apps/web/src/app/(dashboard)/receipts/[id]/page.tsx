'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import { ArrowLeft, Share2, Printer, XCircle, RefreshCw, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const [voidMode, setVoidMode] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const { language, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', params.id],
    queryFn: () => receiptsApi.get(params.id),
  });

  const resendMutation = useMutation({
    mutationFn: () => receiptsApi.resend(params.id),
    onSuccess: () => toast.success('Receipt resent via WhatsApp!'),
    onError: () => toast.error('Failed to resend'),
  });

  const voidMutation = useMutation({
    mutationFn: () => receiptsApi.void(params.id, voidReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', params.id] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setVoidMode(false);
      toast.success('Receipt voided');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => receiptsApi.updateStatus(params.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', params.id] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Receipt status updated!');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const handleShare = () => {
    if (!receipt?.donorPhone) { toast.error('No phone number on this receipt'); return; }
    const url = `${window.location.origin}/receipt/${params.id}`;
    const msg = encodeURIComponent(`पावती ${receipt.receiptNumber}: ₹${receipt.amount}\nपाहा: ${url}`);
    window.open(`https://wa.me/91${receipt.donorPhone.replace(/\D/g, '')}?text=${msg}`);
  };

  const handlePrint = () => {
    window.open(`/receipt/${params.id}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-12 w-48 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!receipt) return null;

  const canVoid = ['ORG_ADMIN', 'TREASURER'].includes(user?.role || '');

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{receipt.receiptNumber}</h1>
            <p className="text-xs text-white/40">{format(new Date(receipt.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {receipt.donorPhone && (
            <button onClick={handleShare} className="btn-secondary text-sm gap-1.5 px-3 py-2">
              <Share2 size={14} /> WhatsApp
            </button>
          )}
          <button onClick={handlePrint} className="btn-ghost p-2">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {receipt.isVoided && (
        <div className="glass-card p-4 border border-red-500/30 flex items-center gap-3">
          <XCircle size={20} className="text-red-400" />
          <div>
            <p className="text-red-400 font-semibold text-sm">This receipt has been voided</p>
            {receipt.voidReason && <p className="text-white/40 text-xs">Reason: {receipt.voidReason}</p>}
          </div>
        </div>
      )}

      {/* Receipt Preview */}
      <ReceiptPreview receipt={receipt} />

      {/* Metadata */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Receipt Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Campaign', value: receipt.campaign?.name },
            { label: 'Collector', value: receipt.collector?.name },
            { label: 'Area', value: receipt.area?.name || '—' },
            { label: 'WhatsApp', value: receipt.whatsappSent ? '✅ Sent' : '❌ Not sent' },
            { label: 'SMS', value: receipt.smsSent ? '✅ Sent' : '❌ Not sent' },
            { label: 'Amount', value: formatCurrency(receipt.amount) },
            { label: 'Type', value: receipt.collectionType || 'DONATION' },
            { label: 'Status', value: receipt.status || 'PAID' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-white/30">{label}</p>
              <p className="text-white/80 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {!receipt.isVoided && (
        <div className="flex gap-3">
          {receipt.status === 'PENDING' && canVoid && (
            <button
              onClick={() => statusMutation.mutate('PAID')}
              disabled={statusMutation.isPending}
              className="btn-primary flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 shadow-glow-emerald border-none text-white flex items-center justify-center gap-1.5"
            >
              {statusMutation.isPending ? 'Updating...' : '✓ Mark as Paid'}
            </button>
          )}
          {receipt.donorPhone && (
            <button onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending} className="btn-secondary flex-1 text-sm">
              <RefreshCw size={14} /> Resend WhatsApp
            </button>
          )}
          {canVoid && (
            <button onClick={() => setVoidMode(true)} className="btn-ghost text-red-400 hover:bg-red-500/10 flex-1 text-sm">
              <XCircle size={14} /> Void Receipt
            </button>
          )}
        </div>
      )}

      {/* Void Form */}
      {voidMode && (
        <div className="glass-card p-5 border border-red-500/30 animate-slide-up">
          <h3 className="text-sm font-semibold text-red-400 mb-3">⚠️ Void this receipt?</h3>
          <p className="text-xs text-white/40 mb-3">This action cannot be undone. The receipt will be marked as invalid.</p>
          <textarea
            value={voidReason}
            onChange={e => setVoidReason(e.target.value)}
            className="form-input resize-none mb-3"
            rows={2}
            placeholder="Reason for voiding (e.g., duplicate entry)..."
          />
          <div className="flex gap-3">
            <button onClick={() => setVoidMode(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => voidMutation.mutate()}
              disabled={!voidReason || voidMutation.isPending}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {voidMutation.isPending ? 'Voiding...' : 'Confirm Void'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
