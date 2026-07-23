'use client';

import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@pavti/shared';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/auth.store';

interface ReceiptPreviewProps {
  receipt: any;
  printMode?: boolean;
}

export default function ReceiptPreview({ receipt, printMode = false }: ReceiptPreviewProps) {
  const { language } = useAuthStore();
  const org = receipt.campaign?.organization;
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receipt/${receipt.id}`
    : `/receipt/${receipt.id}`;

  const labels = {
    en: { receipt: 'RECEIPT', no: 'No.', donor: 'Donor Name', address: 'Address', amount: 'Amount', words: 'Amount in Words', category: 'Category', mode: 'Payment Mode', collector: 'Collector', area: 'Area', sign: 'Authorized Signature', scan: 'Scan to verify' },
    hi: { receipt: 'रसीद', no: 'क्र.', donor: 'दानकर्ता', address: 'पता', amount: 'राशि', words: 'शब्दों में', category: 'श्रेणी', mode: 'भुगतान', collector: 'संग्राहक', area: 'क्षेत्र', sign: 'अधिकृत हस्ताक्षर', scan: 'स्कैन करें' },
    mr: { receipt: 'पावती', no: 'क्र.', donor: 'देणगीदार', address: 'पत्ता', amount: 'रक्कम', words: 'अक्षरी', category: 'प्रकार', mode: 'देय पद्धत', collector: 'संग्राहक', area: 'क्षेत्र', sign: 'अधिकृत स्वाक्षरी', scan: 'सत्यापनासाठी स्कॅन करा' },
  };
  const l = labels[language] || labels.en;

  const theme = org?.receiptTemplateSettings?.theme || 'DEFAULT';

  let primaryColor = '#C85000';
  let gradient = 'linear-gradient(135deg, #C85000 0%, #FF8C00 100%)';
  let border = 'border-3 border-orange-500';
  let amountBg = 'bg-orange-50';
  let amountBorder = 'border-orange-200 border-2';
  let badgeColor = 'text-orange-700';
  let bannerIcon = null;
  let bannerLine = null;

  if (theme === 'GANESHOTSAV') {
    primaryColor = '#E65100';
    gradient = 'linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FFB300 100%)';
    border = 'border-4 border-double border-amber-600';
    amountBg = 'bg-amber-50';
    amountBorder = 'border-amber-200 border-2 border-dashed';
    badgeColor = 'text-amber-800';
    bannerIcon = <div className="absolute top-0 right-0 text-2xl opacity-15 p-2 pointer-events-none">🪔</div>;
  } else if (theme === 'EID') {
    primaryColor = '#004D20';
    gradient = 'linear-gradient(135deg, #004D20 0%, #00873C 100%)';
    border = 'border-3 border-emerald-800';
    amountBg = 'bg-emerald-50';
    amountBorder = 'border-emerald-200 border-2';
    badgeColor = 'text-emerald-800';
    bannerIcon = <div className="absolute top-0 right-0 text-2xl opacity-15 p-2 pointer-events-none">🌙</div>;
  } else if (theme === 'BHAGAT_SINGH') {
    primaryColor = '#1A2530';
    gradient = 'linear-gradient(135deg, #1A2530 0%, #2c3e50 100%)';
    border = 'border-3 border-slate-800';
    amountBg = 'bg-slate-50';
    amountBorder = 'border-slate-300 border-2';
    badgeColor = 'text-slate-800';
    bannerLine = <div className="h-1 bg-gradient-to-r from-orange-400 via-white to-green-500 w-full" />;
  }

  const isInternal = receipt.collectionType === 'INTERNAL';
  const isUnpaid = receipt.status === 'PENDING';

  if (theme === 'CUSTOM_IMAGE' && org?.receiptTemplateSettings?.customImageUrl) {
    const templateSettings = org.receiptTemplateSettings;
    const positions = templateSettings.fieldPositions || {};
    const fieldValues: Record<string, string> = {
      donorName: receipt.donorName || '',
      donorAddress: receipt.donorAddress || '',
      amount: `₹${Number(receipt.amount).toLocaleString('en-IN')}`,
      amountInWords: receipt.amountInWords || '',
      receiptNumber: receipt.receiptNumber || '',
      date: format(new Date(receipt.createdAt), 'dd MMM yyyy'),
      collectorName: receipt.collector?.name || '',
      areaName: receipt.area?.name || '',
      category: receipt.category || '',
      paymentMode: receipt.paymentMode || '',
    };

    return (
      <div id="receipt-print" className={`${printMode ? 'w-[148mm] mx-auto' : 'max-w-sm mx-auto'} relative`}>
        <img src={templateSettings.customImageUrl} alt="Receipt" className="w-full block rounded-lg" />
        {Object.entries(positions).map(([key, pos]: [string, any]) => {
          if (!pos) return null;
          if (key === 'qrCode') {
            return (
              <div key={key} style={{ position: 'absolute', left: `${pos.xPct}%`, top: `${pos.yPct}%`, transform: 'translate(-50%,-50%)' }}>
                <QRCodeSVG value={verifyUrl} size={pos.fontSizePx ? pos.fontSizePx * 5 : 64} bgColor="transparent" fgColor={pos.color || '#000000'} level="M" />
              </div>
            );
          }
          const value = fieldValues[key];
          if (!value) return null;
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                left: `${pos.xPct}%`,
                top: `${pos.yPct}%`,
                fontSize: pos.fontSizePx || 14,
                color: pos.color || '#000000',
                fontWeight: pos.bold ? 700 : 400,
                textAlign: pos.align || 'left',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </div>
          );
        })}
        {receipt.isVoided ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-white/40">
            <div className="border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rotate-[-15deg] opacity-75 bg-white uppercase">Void</div>
          </div>
        ) : isUnpaid ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="border-4 border-amber-600 text-amber-600 font-black text-4xl px-4 py-2 rotate-[-15deg] opacity-25 uppercase">Unpaid</div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      id="receipt-print"
      className={`${printMode ? 'w-[148mm] mx-auto' : 'max-w-sm mx-auto'} bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl relative ${border}`}
      style={{ fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif" }}
    >
      {bannerLine}
      {/* Header */}
      <div
        className="px-5 py-4 text-white relative overflow-hidden"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {bannerIcon}
        <div className="flex items-center gap-3 relative z-10">
          {org?.logoUrl && (
            <img src={org.logoUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-white/10 p-0.5 border border-white/10 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base sm:text-lg leading-tight truncate">{org?.name}</h2>
            {org?.nameMarathi && (
              <p className="text-xs sm:text-sm opacity-90 mt-0.5 font-devanagari truncate">{org.nameMarathi}</p>
            )}
            {receipt.campaign && (
              <div className="inline-block bg-black/20 rounded-full px-2.5 py-0.5 text-[10px] mt-1">
                {receipt.campaign.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Number Bar */}
      <div className="flex justify-between items-center px-5 py-2.5 bg-orange-50/50 border-b-2 border-dashed border-orange-200">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {isInternal ? (language === 'mr' ? 'अंतर्गत पावती' : 'Internal Receipt') : l.receipt} {l.no}
          </span>
          <div className="font-bold text-orange-800 text-base" style={{ color: primaryColor }}>{receipt.receiptNumber}</div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Date</span>
          <div className="text-sm font-semibold text-gray-700">
            {format(new Date(receipt.createdAt), 'dd MMM yyyy')}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Donor */}
        <div className="grid grid-cols-3 gap-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">{l.donor}</span>
          <span className="col-span-2 text-sm font-semibold text-gray-900">{receipt.donorName}</span>
        </div>
        {receipt.donorAddress && (
          <div className="grid grid-cols-3 gap-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{l.address}</span>
            <span className="col-span-2 text-sm text-gray-700">{receipt.donorAddress}</span>
          </div>
        )}

        {/* Amount Box */}
        <div className={`${amountBg} ${amountBorder} rounded-xl p-3 text-center my-2`}>
          <div className="text-3xl font-bold" style={{ color: primaryColor }}>
            ₹{Number(receipt.amount).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 italic mt-1">
            {receipt.amountInWords}
          </div>
        </div>

        {/* Category, Mode & Status */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase">{l.category}</div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{receipt.category}</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase">{l.mode}</div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{receipt.paymentMode}</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase">Status</div>
            <div className="text-xs font-bold mt-0.5">
              {isUnpaid ? (
                <span className="text-amber-600">{language === 'mr' ? 'थकबाकी' : 'Unpaid'}</span>
              ) : (
                <span className="text-emerald-600">{language === 'mr' ? 'प्राप्त' : 'Paid'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Collector */}
        <div className="border-t border-dashed border-gray-200 pt-3 grid grid-cols-3 gap-1">
          <span className="text-[10px] text-gray-400 uppercase">{l.collector}</span>
          <span className="col-span-2 text-sm text-gray-700">{receipt.collector?.name}</span>
        </div>
        {receipt.area && (
          <div className="grid grid-cols-3 gap-1">
            <span className="text-[10px] text-gray-400 uppercase">{l.area}</span>
            <span className="col-span-2 text-sm text-gray-700">{receipt.area.name}</span>
          </div>
        )}
        {receipt.notes && (
          <div className="grid grid-cols-3 gap-1">
            <span className="text-[10px] text-gray-400 uppercase">Notes</span>
            <span className="col-span-2 text-xs text-gray-500 italic">{receipt.notes}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-orange-50/30 border-t-2 border-dashed border-orange-200 flex justify-between items-end">
        <div className="text-center">
          <div className="w-28 border-b border-gray-400 mb-1" />
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">{l.sign}</p>
        </div>
        <div className="text-center">
          <QRCodeSVG
            value={verifyUrl}
            size={64}
            bgColor="transparent"
            fgColor={primaryColor}
            level="M"
          />
          <p className="text-[9px] text-gray-400 mt-1">{l.scan}</p>
        </div>
      </div>

      {/* Stamps */}
      {receipt.isVoided ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-white/40">
          <div className="border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rotate-[-15deg] opacity-75 bg-white uppercase">
            Void
          </div>
        </div>
      ) : isUnpaid ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="border-4 border-amber-600 text-amber-600 font-black text-4xl px-4 py-2 rotate-[-15deg] opacity-25 uppercase">
            Unpaid
          </div>
        </div>
      ) : null}
    </div>
  );
}
