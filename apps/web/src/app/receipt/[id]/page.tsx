'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { receiptsApi } from '@/lib/api';
import { buildUpiPaymentLink } from '@/lib/upi';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import InteractivePavtiView from '@/components/receipt/InteractivePavtiView';
import {
  CheckCircle, XCircle, Sparkles, Clock, CreditCard,
  Copy, Check, CheckCircle2, QrCode, ExternalLink
} from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';
import { BRAND_NAME } from '@pavti/shared';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

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
    requestedView === 'interactive' ? 'interactive' : 'standard'
  );
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [claimedPaid, setClaimedPaid] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const { data: receipt, isLoading, isError } = useQuery({
    queryKey: ['receipt-public', params.id],
    queryFn: () => receiptsApi.verifyPublic(params.id),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3000 : false),
  });

  // If viewMode is explicitly requested as 'interactive' and not voided, render InteractivePavtiView
  if (receipt && !receipt.isVoided && viewMode === 'interactive') {
    return (
      <InteractivePavtiView
        receipt={receipt}
        language={language}
        onSwitchToStandard={() => setViewMode('standard')}
      />
    );
  }

  // Derive organization & UPI parameters for upfront payment
  const orgObj = receipt?.campaign?.organization || receipt?.organization || {};
  const payeeName = orgObj.nameMarathi || orgObj.name || 'Mandal Trust';
  const upiId = orgObj.upiId || orgObj.bankAccountNumber || '8999842228@ybl';
  const amount = receipt?.amount || 0;
  const isPending = receipt?.status === 'PENDING' && !receipt?.isVoided;
  const isClaimed = !!receipt?.donorClaimedPaidAt || claimedPaid;

  const upiUrl = buildUpiPaymentLink({
    upiId,
    payeeName,
    amount,
    note: `Receipt-${receipt?.receiptNumber || params.id}`,
  });

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      toast.success('UPI ID कॉपी झाला!');
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      toast.error('कॉपी करता आले नाही.');
    }
  };

  const handleClaimPaid = async () => {
    if (!receipt?.id || isClaiming || isClaimed) return;
    setIsClaiming(true);
    try {
      await receiptsApi.claimPaid(receipt.id);
      setClaimedPaid(true);
      toast.success('पेमेंटच्या दाव्याची नोंद झाली! मंडळाचे प्रतिनिधी पडताळणी करतील.');
    } catch {
      toast.error('दावा नोंदवता आला नाही.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center relative overflow-hidden bg-[#1A120B]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(244, 221, 154, 0.05) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
      </div>

      <div className="relative w-full max-w-md space-y-4 my-6">
        {/* Header */}
        <div className="text-center">
          <LogoMark size={48} className="rounded-xl shadow-lg shadow-amber-950/40 mx-auto mb-3 block" forceTheme="dark" />
          <h1 className="text-lg font-bold text-amber-100">Receipt & Payment</h1>
          <p className="text-xs text-amber-200/50 font-devanagari">पावती आणि ऑनलाईन वर्गणी</p>
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
            {/* UPFRONT PAYMENT SECTION (When Receipt is PENDING) */}
            {isPending && (
              <div className="bg-[#24170E] border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl space-y-4 text-amber-100 animate-fade-in">
                {/* Pending Header */}
                <div className="flex items-center justify-between border-b border-amber-900/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={22} className="text-amber-400 animate-pulse shrink-0" />
                    <div>
                      <h2 className="text-sm font-bold text-amber-300">वर्गणी भरणा बाकी (Payment Pending)</h2>
                      <p className="text-[11px] text-amber-200/60">पावती क्र. {receipt.receiptNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-400 font-mono">₹{receipt.amount}</span>
                    <p className="text-[10px] text-amber-200/50">देणगी रक्कम</p>
                  </div>
                </div>

                {/* Upfront Action 1: Direct UPI App Pay Button */}
                <a
                  href={upiUrl}
                  target="_self"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-950/60 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <CreditCard size={18} className="shrink-0" />
                  <span>💳 Pay ₹{receipt.amount} via PhonePe / GPay / UPI</span>
                </a>

                {/* Upfront Action 2: Copy UPI ID */}
                <div className="bg-[#1A120B] border border-amber-900/60 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-amber-200/50 uppercase font-semibold">Mandal UPI ID (माहिती)</p>
                    <code className="text-xs font-mono font-bold text-amber-300 truncate block">{upiId}</code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-lg bg-amber-900/40 border border-amber-700/50 text-amber-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-900/80 active:scale-95 transition-all shrink-0"
                  >
                    {copiedUpi ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedUpi ? 'कॉपी झाले!' : 'Copy ID'}</span>
                  </button>
                </div>

                {/* Upfront Action 3: Scannable QR Code */}
                <div className="bg-[#1A120B] border border-amber-900/60 rounded-xl p-4 text-center space-y-2">
                  <p className="text-xs font-semibold text-amber-200/90 flex items-center justify-center gap-1.5">
                    <QrCode size={15} className="text-amber-400" />
                    <span>क्यूआर कोड स्कॅन करून वर्गणी जमा करा:</span>
                  </p>
                  <div className="bg-white p-3 rounded-xl inline-block shadow-md">
                    <QRCodeSVG value={upiUrl} size={160} level="M" />
                  </div>
                  <p className="text-[11px] text-amber-200/60 font-devanagari">GPay, PhonePe, Paytm किंवा BHIM द्वारे स्कॅन करा</p>
                </div>

                {/* Upfront Action 4: Claim Payment Button */}
                <button
                  type="button"
                  disabled={isClaiming || isClaimed}
                  onClick={handleClaimPaid}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    isClaimed
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 cursor-default'
                      : 'bg-amber-950/40 border-amber-800/40 text-amber-200 hover:bg-amber-900/40 active:scale-[0.99]'
                  }`}
                >
                  <CheckCircle2 size={16} className={isClaimed ? 'text-emerald-400' : 'text-amber-400'} />
                  <span>{isClaimed ? '✓ पेमेंट्सचा दावा नोंदवला गेला आहे' : 'मी पैसे भरले आहेत (Claim Payment)'}</span>
                </button>
              </div>
            )}

            {/* Verification Badge (When Receipt is Paid or Voided) */}
            {!isPending && (
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
                      <p className="text-emerald-400 font-semibold text-sm">✓ Verified Authentic Receipt (भरणा पूर्ण)</p>
                      <p className="text-amber-200/40 text-xs">अधिकृत डिजिटल पावती</p>
                    </div>
                  </>
                )}
              </div>
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

            {/* Optional Interactive Mode Button */}
            {!receipt.isVoided && (
              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5c1220] via-amber-900 to-[#5c1220] border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-transform"
              >
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                <span>इंटेरॅक्टिव्ह दर्शन व पावती पहा (Interactive View)</span>
              </button>
            )}

            <p className="text-center text-xs text-amber-200/30 font-medium">Powered by {BRAND_NAME}</p>
          </>
        )}
      </div>
    </div>
  );
}

