'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { receiptsApi } from '@/lib/api';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import InteractivePavtiView from '@/components/receipt/InteractivePavtiView';
import { CheckCircle, XCircle, Sparkles, FileText } from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';
import { BRAND_NAME } from '@pavti/shared';

const LANGUAGE_OPTIONS: { code: 'en' | 'hi' | 'mr'; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'HI' },
  { code: 'mr', label: 'MR' },
];

export default function PublicReceiptPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const requestedLang = searchParams.get('lang');
  const requestedView = searchParams.get('view');
  
  const initialLang = (requestedLang === 'en' || requestedLang === 'hi' || requestedLang === 'mr') ? requestedLang : 'mr';
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>(initialLang);
  const [viewMode, setViewMode] = useState<'interactive' | 'standard'>(
    requestedView === 'standard' ? 'standard' : 'interactive'
  );

  const { data: receipt, isLoading, isError } = useQuery({
    queryKey: ['receipt-public', params.id],
    queryFn: () => receiptsApi.verifyPublic(params.id),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3000 : false),
  });

  // If receipt is loaded and viewMode is 'interactive' and not voided, render the 4-Slide Cinematic Experience!
  if (receipt && !receipt.isVoided && viewMode === 'interactive') {
    return (
      <InteractivePavtiView
        receipt={receipt}
        language={language}
        onSwitchToStandard={() => setViewMode('standard')}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center relative overflow-hidden bg-[#1A120B]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(244, 221, 154, 0.05) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
      </div>

      <div className="relative w-full max-w-sm space-y-4 my-6">
        {/* Header */}
        <div className="text-center">
          {/* forceTheme="dark": this page's background (bg-[#1A120B]) is
              hardcoded dark regardless of the site's own theme toggle. */}
          <LogoMark size={48} className="rounded-xl shadow-lg shadow-amber-950/40 mx-auto mb-3 block" forceTheme="dark" />
          <h1 className="text-lg font-bold text-amber-100">Receipt Verification</h1>
          <p className="text-xs text-amber-200/50 font-devanagari">पावती पडताळणी</p>
        </div>

        {isLoading && (
          <div className="bg-[#24170E] border border-amber-900/40 rounded-xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-amber-200/60 text-sm">पावती पडताळणी सुरू आहे...</p>
          </div>
        )}

        {isError && (
          <div className="bg-[#24170E] border border-red-900/40 rounded-xl p-8 text-center">
            <XCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-red-200 font-semibold mb-1">Receipt Not Found</h2>
            <p className="text-amber-200/40 text-sm">This receipt does not exist or has been removed.</p>
          </div>
        )}

        {receipt && (
          <>
            {/* Verification Badge */}
            <div className={`p-4 rounded-xl flex items-center gap-3 bg-[#24170E] ${receipt.isVoided ? 'border-red-500/40' : 'border-emerald-500/40'} border shadow-md`}>
              {receipt.isVoided ? (
                <>
                  <XCircle size={28} className="text-red-400 shrink-0" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm">This receipt has been VOIDED</p>
                    <p className="text-amber-200/40 text-xs">ही पावती रद्द करण्यात आली आहे</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">✓ Verified Authentic Receipt</p>
                    <p className="text-amber-200/40 text-xs">अधिकृत डिजिटल पावती</p>
                  </div>
                </>
              )}
            </div>

            {/* Interactive Mode CTA Switch */}
            {!receipt.isVoided && (
              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5c1220] via-amber-900 to-[#5c1220] border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-transform"
              >
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                <span>इंटेरॅक्टिव्ह दर्शन व पावती पहा (Interactive Darshan)</span>
              </button>
            )}

            {/* Language toggle */}
            <div className="flex items-center justify-center gap-1.5">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    language === opt.code 
                      ? 'bg-amber-600 text-white font-bold' 
                      : 'bg-[#24170E] text-amber-200/50 border border-amber-900/30 hover:text-amber-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Receipt Preview */}
            <ReceiptPreview receipt={receipt} language={language} />

            <p className="text-center text-xs text-amber-200/30 font-medium">Powered by {BRAND_NAME}</p>
          </>
        )}
      </div>
    </div>
  );
}
