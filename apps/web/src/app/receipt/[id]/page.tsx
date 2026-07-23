'use client';

import { useQuery } from '@tanstack/react-query';
import { receiptsApi } from '@/lib/api';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';

export default function PublicReceiptPage({ params }: { params: { id: string } }) {
  const { data: receipt, isLoading, isError } = useQuery({
    queryKey: ['receipt-public', params.id],
    queryFn: () => receiptsApi.verifyPublic(params.id),
  });

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Receipt Verification</h1>
          <p className="text-xs text-white/40 font-devanagari">पावती सत्यापन</p>
        </div>

        {isLoading && (
          <div className="glass-card p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-saffron-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white/50 text-sm">Verifying receipt...</p>
          </div>
        )}

        {isError && (
          <div className="glass-card p-8 text-center">
            <XCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-white font-semibold mb-1">Receipt Not Found</h2>
            <p className="text-white/40 text-sm">This receipt does not exist or has been removed.</p>
          </div>
        )}

        {receipt && (
          <>
            {/* Verification Badge */}
            <div className={`glass-card p-4 flex items-center gap-3 ${receipt.isVoided ? 'border-red-500/30' : 'border-emerald-500/30'} border`}>
              {receipt.isVoided ? (
                <>
                  <XCircle size={28} className="text-red-400 shrink-0" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm">This receipt has been VOIDED</p>
                    <p className="text-white/40 text-xs">This receipt is no longer valid</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">✓ Verified Authentic Receipt</p>
                    <p className="text-white/40 text-xs">This is a genuine digital pavti</p>
                  </div>
                </>
              )}
            </div>

            {/* Receipt Preview */}
            <ReceiptPreview receipt={receipt} />

            <p className="text-center text-xs text-white/20">Powered by Digital Pavti Book</p>
          </>
        )}
      </div>
    </div>
  );
}
