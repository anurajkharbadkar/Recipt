'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/auth.store';
import { resolveReceiptTheme, resolveReceiptSettings, formatReceiptDateTime } from '@pavti/shared';

interface ReceiptPreviewProps {
  receipt: any;
  printMode?: boolean;
  /** Overrides the dashboard/template language for this receipt instance (e.g. for print or public toggle). */
  language?: 'en' | 'hi' | 'mr';
}

export default function ReceiptPreview({ receipt, printMode = false, language: languageOverride }: ReceiptPreviewProps) {
  const { language: dashboardLanguage } = useAuthStore();
  const org = receipt.campaign?.organization;
  const preferredLang = (languageOverride || org?.receiptTemplateSettings?.language || dashboardLanguage || 'mr') as 'mr' | 'hi' | 'en';
  const settings = resolveReceiptSettings(org?.receiptTemplateSettings, preferredLang);
  const language = settings.language;
  const theme = resolveReceiptTheme(settings.theme);

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receipt/${receipt.id}`
    : `/receipt/${receipt.id}`;

  const labels = {
    en: { receipt: 'RECEIPT', no: 'No.', donor: 'Donor Name', address: 'Address', amount: 'Amount', words: 'Amount in Words', category: 'Category', mode: 'Payment Mode', collector: 'Collector', area: 'Area', sign: 'Authorized Signature', scan: 'Scan to verify' },
    hi: { receipt: 'रसीद', no: 'क्र.', donor: 'दानकर्ता', address: 'पता', amount: 'राशि', words: 'शब्दों में', category: 'श्रेणी', mode: 'भुगतान विधि', collector: 'संग्रहकर्ता', area: 'क्षेत्र', sign: 'अधिकृत हस्ताक्षर', scan: 'सत्यापन हेतु स्कैन करें' },
    mr: { receipt: 'पावती', no: 'क्र.', donor: 'देणगीदार', address: 'पत्ता', amount: 'रक्कम', words: 'अक्षरी', category: 'प्रकार', mode: 'देय पद्धत', collector: 'संग्राहक', area: 'क्षेत्र', sign: 'अधिकृत स्वाक्षरी', scan: 'सत्यापनासाठी स्कॅन करा' },
  };
  const l = labels[language] || labels.mr;

  const border = `${theme.borderWidth}px ${theme.borderStyle} ${theme.primaryColor}`;
  const amountBorder = `${theme.amountBorderWidth}px ${theme.amountBorderStyle} ${theme.amountBorderColor}`;
  const bannerIcon = theme.bannerEmoji ? (
    <div className="absolute top-0 right-0 text-2xl opacity-15 p-2 pointer-events-none">{theme.bannerEmoji}</div>
  ) : null;
  const bannerLine = theme.tricolorBanner ? (
    <div className="h-1 bg-gradient-to-r from-orange-400 via-white to-green-500 w-full" />
  ) : null;

  const logoUrl = org?.logoUrl;
  const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";

  const isInternal = receipt.collectionType === 'INTERNAL';
  const isUnpaid = receipt.status === 'PENDING';

  return (
    <div
      id="receipt-print"
      className={`${printMode ? 'w-[148mm] mx-auto' : 'w-full max-w-[380px] mx-auto'} bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300`}
      style={{ fontFamily, border }}
    >
      {bannerLine}

      {/* Header */}
      <div
        className="px-4 sm:px-5 py-4 text-white relative overflow-hidden"
        style={{ background: theme.gradient }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {bannerIcon}

        {/* Custom Header Tagline / Shloka */}
        {settings.headerTagline && (
          <div className="text-center mb-2 pb-1.5 border-b border-white/20">
            <span className="text-xs font-semibold tracking-wider font-devanagari text-white/95 drop-shadow-sm">
              {settings.headerTagline}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 relative z-10">
          {logoUrl && (
            <img src={logoUrl} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-contain bg-white/10 p-0.5 border border-white/15 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm sm:text-base md:text-lg leading-tight line-clamp-2 drop-shadow-sm">{org?.name || 'Organization'}</h2>
            {org?.nameMarathi && (
              <p className="text-xs sm:text-sm opacity-90 mt-0.5 font-devanagari line-clamp-1">{org.nameMarathi}</p>
            )}
            {receipt.campaign && (
              <div className="inline-block bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[10px] mt-1 font-medium">
                {receipt.campaign.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Number Bar */}
      <div className="flex justify-between items-center px-4 sm:px-5 py-2.5 bg-orange-50/50 border-b-2 border-dashed border-orange-200">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            {isInternal
              ? (language === 'mr' ? 'अंतर्गत पावती' : language === 'hi' ? 'आंतरिक रसीद' : 'Internal Receipt')
              : (settings.receiptTitle || l.receipt)} {l.no}
          </span>
          <div className="font-bold text-sm sm:text-base tracking-tight" style={{ color: theme.primaryColor }}>{receipt.receiptNumber}</div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Date</span>
          <div className="text-xs sm:text-sm font-semibold text-gray-700">
            {formatReceiptDateTime(receipt.createdAt)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 py-3.5 space-y-3">
        {/* Donor */}
        <div className="grid grid-cols-3 gap-2 items-baseline">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{l.donor}</span>
          <span className="col-span-2 text-sm font-semibold text-gray-900 leading-snug">
            {settings.donorPrefix ? <span className="text-gray-500 font-normal mr-1">{settings.donorPrefix}</span> : null}
            {receipt.donorName}
          </span>
        </div>
        {receipt.donorAddress && (
          <div className="grid grid-cols-3 gap-2 items-baseline">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{l.address}</span>
            <span className="col-span-2 text-xs sm:text-sm text-gray-700 leading-snug">{receipt.donorAddress}</span>
          </div>
        )}

        {/* Amount Box */}
        <div className="rounded-xl p-3 text-center my-2 shadow-inner" style={{ background: theme.amountBg, border: amountBorder }}>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: theme.primaryColor }}>
            ₹{Number(receipt.amount).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-600 italic mt-1 font-medium">
            {receipt.amountInWords}
          </div>
          {org?.upiId && (
            <div className="text-[11px] text-gray-600 mt-1.5 pt-1.5 border-t border-dashed border-gray-300">
              📲 Pay via UPI: <strong className="font-mono text-gray-800">{org.upiId}</strong>
            </div>
          )}
        </div>

        {/* Category, Mode & Status */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
            <div className="text-[9px] text-gray-400 uppercase font-semibold">{l.category}</div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{receipt.category}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
            <div className="text-[9px] text-gray-400 uppercase font-semibold">{l.mode}</div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{receipt.paymentMode}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
            <div className="text-[9px] text-gray-400 uppercase font-semibold">Status</div>
            <div className="text-xs font-bold mt-0.5">
              {isUnpaid ? (
                <span className="text-amber-600">{language === 'mr' ? 'थकबाकी' : language === 'hi' ? 'बकाया' : 'Unpaid'}</span>
              ) : (
                <span className="text-emerald-600">{language === 'mr' ? 'प्राप्त' : language === 'hi' ? 'प्राप्त' : 'Paid'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Collector */}
        <div className="border-t border-dashed border-gray-200 pt-2.5 grid grid-cols-3 gap-2 items-baseline">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{l.collector}</span>
          <span className="col-span-2 text-xs sm:text-sm font-medium text-gray-700">{receipt.collector?.name}</span>
        </div>
        {receipt.area && (
          <div className="grid grid-cols-3 gap-2 items-baseline">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{l.area}</span>
            <span className="col-span-2 text-xs sm:text-sm text-gray-700">{receipt.area.name}</span>
          </div>
        )}
        {receipt.notes && (
          <div className="grid grid-cols-3 gap-2 items-baseline">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Notes</span>
            <span className="col-span-2 text-xs text-gray-500 italic">{receipt.notes}</span>
          </div>
        )}
      </div>

      {/* Footer Note / Blessing */}
      {settings.footerNote && (
        <div className="px-4 sm:px-5 py-2 bg-orange-50/70 border-t border-dashed border-orange-200 text-center">
          <p className="text-[11px] sm:text-xs text-gray-700 font-medium font-devanagari">{settings.footerNote}</p>
        </div>
      )}

      {/* Footer Signature & QR */}
      <div className="px-4 sm:px-5 py-3.5 bg-orange-50/30 border-t-2 border-dashed border-orange-200 flex justify-between items-end">
        <div className="text-center">
          <div className="w-24 sm:w-28 border-b border-gray-400 mb-1" />
          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">{l.sign}</p>
        </div>
        <div className="text-center">
          <QRCodeSVG
            value={verifyUrl}
            size={56}
            bgColor="transparent"
            fgColor={theme.primaryColor}
            level="M"
          />
          <p className="text-[9px] text-gray-400 mt-0.5">{l.scan}</p>
        </div>
      </div>

      {/* Stamps */}
      {receipt.isVoided ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-white/40">
          <div className="border-4 border-red-500 text-red-500 font-black text-3xl sm:text-4xl px-4 py-2 rotate-[-15deg] opacity-75 bg-white uppercase shadow-lg">
            Void
          </div>
        </div>
      ) : isUnpaid ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="border-4 border-amber-600 text-amber-600 font-black text-3xl sm:text-4xl px-4 py-2 rotate-[-15deg] opacity-25 uppercase">
            Unpaid
          </div>
        </div>
      ) : null}
    </div>
  );
}
