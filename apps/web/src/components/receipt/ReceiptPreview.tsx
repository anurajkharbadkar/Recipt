'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/auth.store';
import { resolveReceiptTheme, resolveReceiptSettings, formatReceiptDateTime, SOCIAL_PLATFORMS, RECEIPT_GOLD_ACCENT, RECEIPT_FIELD_LABELS } from '@pavti/shared';

interface ReceiptPreviewProps {
  receipt: any;
  printMode?: boolean;
  /** Overrides the dashboard/template language for this receipt instance (e.g. for print or public toggle). */
  language?: 'en' | 'hi' | 'mr';
  /**
   * Overrides the QR code's target path (default: `/receipt/${receipt.id}`).
   * Needed for non-real receipts — e.g. the landing page's hero preview
   * uses a synthetic `receipt.id: 'preview'` that has no backing row, so the
   * default target would be a real, scannable QR code pointing at a
   * receipt-not-found page on the live domain. Pass a path that actually
   * resolves (e.g. `/register`) for any receipt that isn't a real one.
   */
  qrPath?: string;
}

/**
 * Monoline corner ornament rendered top-right of the header — replaces the
 * old emoji banners. One glyph per theme mood (see ReceiptThemeStyle.motif),
 * mirrored exactly in pdf.service.ts's buildReceiptHtml so the on-screen
 * preview and the printed pavti never disagree.
 */
function CornerMotif({ motif, color = 'white', size = 40 }: { motif: 'lotus' | 'diya' | 'chakra'; color?: string; size?: number }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const,
    stroke: color, strokeWidth: 1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  if (motif === 'diya') {
    return (
      <svg {...common}>
        <path d="M3.5 14.5c0 3.6 3.8 6 8.5 6s8.5-2.4 8.5-6" />
        <path d="M3.5 14.5c0-1.6 3.8-2.7 8.5-2.7s8.5 1.1 8.5 2.7" />
        <path d="M12 11.5c-1.6-2.2-1.6-4.4 0-7 1.6 2.6 1.6 4.8 0 7Z" />
      </svg>
    );
  }
  if (motif === 'lotus') {
    return (
      <svg {...common}>
        <path d="M12 20c-4.2-2.1-6.3-5.2-6.3-8.3 2.1 1 4.2 3.1 6.3 6.2 2.1-3.1 4.2-5.2 6.3-6.2 0 3.1-2.1 6.2-6.3 8.3Z" />
        <path d="M12 20c-2.6-3.1-3.1-6.8-1.6-10.4C11.6 12.9 12 16.4 12 20Z" />
        <path d="M12 20c2.6-3.1 3.1-6.8 1.6-10.4C12.4 12.9 12 16.4 12 20Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="7.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return <line key={deg} x1="12" y1="12" x2={12 + 7.5 * Math.cos(r)} y2={12 + 7.5 * Math.sin(r)} />;
      })}
    </svg>
  );
}

/**
 * A large, near-invisible mandala/rosette stamped in the paper's corner —
 * the ornamental "watermark" a real pavti book carries. Paisley petals for
 * the warm/traditional themes (diya, lotus); plain radiating rings for the
 * modern theme, so the ornamentation itself tracks each theme's mood
 * instead of decorating all three identically. Mirrored in pdf.service.ts.
 */
function MotifRosette({ motif, size, opacity, color }: { motif: 'lotus' | 'diya' | 'chakra'; size: number; opacity: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="0.6" />
      <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="0.6" />
      {motif === 'chakra' ? (
        <>
          <circle cx="50" cy="50" r="14" fill="none" stroke={color} strokeWidth="0.6" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return <line key={deg} x1={50 + 14 * Math.cos(r)} y1={50 + 14 * Math.sin(r)} x2={50 + 46 * Math.cos(r)} y2={50 + 46 * Math.sin(r)} stroke={color} strokeWidth="0.6" />;
          })}
        </>
      ) : (
        [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <path key={deg} d="M50,50 C58,38 58,16 50,4 C42,16 42,38 50,50 Z" fill="none" stroke={color} strokeWidth="0.6" transform={`rotate(${deg} 50 50)`} />
        ))
      )}
    </svg>
  );
}

/** Faint dot-grain texture — a plain color reads as a printed card; a whisper of paper grain reads as a physical, handled document. Same for every theme (a material quality, not a mood choice). */
const PAPER_GRAIN_BG = 'radial-gradient(circle, rgba(0,0,0,0.05) 0.6px, transparent 0.6px) 0 0/7px 7px';

export default function ReceiptPreview({ receipt, printMode = false, language: languageOverride, qrPath }: ReceiptPreviewProps) {
  const { language: dashboardLanguage } = useAuthStore();
  const org = receipt.campaign?.organization;
  const preferredLang = (languageOverride || org?.receiptTemplateSettings?.language || dashboardLanguage || 'mr') as 'mr' | 'hi' | 'en';
  const settings = resolveReceiptSettings(org?.receiptTemplateSettings, preferredLang);
  const language = settings.language;
  const theme = resolveReceiptTheme(settings.theme);

  const path = qrPath ?? `/receipt/${receipt.id}`;
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${path}`
    : path;

  const l = RECEIPT_FIELD_LABELS[language] || RECEIPT_FIELD_LABELS.mr;

  const logoUrl = org?.logoUrl;
  const fontFamily = "'Noto Sans Devanagari', 'Inter', sans-serif";
  const displayFont = "'Playfair Display', Georgia, serif";

  const isInternal = receipt.collectionType === 'INTERNAL';
  const isUnpaid = receipt.status === 'PENDING';

  return (
    <div
      id="receipt-print"
      className={`${printMode ? 'w-[148mm] mx-auto' : 'w-full max-w-[380px] mx-auto'} relative transition-all duration-300 rounded-2xl shadow-2xl p-[3px]`}
      style={{ fontFamily, background: RECEIPT_GOLD_ACCENT }}
    >
      {/* Inner ink frame — the "double gold + ink" border that reads as an official ledger, not a colored SaaS card */}
      <div
        className="rounded-[13px] overflow-hidden relative"
        style={{ background: `${PAPER_GRAIN_BG}, ${theme.paperBg}`, border: `2px solid ${theme.primaryColor}` }}
      >
        {/* Watermark rosette — stamped in the paper's corner, barely visible, like a real ledger's embossed seal */}
        <div className="absolute -bottom-3 -right-3 pointer-events-none">
          <MotifRosette motif={theme.motif} size={150} opacity={0.07} color={theme.primaryColor} />
        </div>

        {/* Header — same paper canvas as the rest of the card, no separate color band; ink-toned text keeps it one calm, consistent surface top to bottom. */}
        <div className="px-4 sm:px-5 py-4 relative overflow-hidden">
          <div className="absolute top-2.5 right-2.5 opacity-20 pointer-events-none">
            <CornerMotif motif={theme.motif} color={theme.primaryColor} />
          </div>

          {settings.headerTagline && (
            <div className="text-center mb-2 pb-1.5" style={{ borderBottom: `1px solid ${theme.primaryColor}22` }}>
              <span className="text-xs font-semibold tracking-wider font-devanagari drop-shadow-sm" style={{ color: theme.primaryColor }}>
                {settings.headerTagline}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 relative z-10">
            {logoUrl && (
              <img src={logoUrl} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-contain bg-black/5 p-0.5 border border-black/10 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base sm:text-lg md:text-xl leading-tight line-clamp-2" style={{ fontFamily: displayFont, color: theme.primaryColor }}>
                {org?.name || 'Organization'}
              </h2>
              {org?.nameMarathi && (
                <p className="text-xs sm:text-sm mt-0.5 font-devanagari line-clamp-1" style={{ color: `${theme.primaryColor}cc` }}>{org.nameMarathi}</p>
              )}
              {receipt.campaign && (
                <div
                  className="inline-flex items-center text-[10px] mt-1.5 font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${RECEIPT_GOLD_ACCENT} 0%, #8f6a15 100%)`,
                    padding: '3px 12px 3px 8px',
                    clipPath: 'polygon(0 0, 100% 0, 91% 50%, 100% 100%, 0 100%)',
                    textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                  }}
                >
                  {receipt.campaign.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Receipt Number Bar */}
        <div className="flex justify-between items-center px-4 sm:px-5 py-2.5" style={{ background: theme.amountBg, borderBottom: `1px solid ${RECEIPT_GOLD_ACCENT}55` }}>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: `${theme.primaryColor}99` }}>
              {isInternal ? l.internalReceipt : (settings.receiptTitle || l.receipt)} {l.no}
            </span>
            <div className="font-bold text-sm sm:text-base tracking-tight" style={{ color: theme.primaryColor, fontFamily: displayFont }}>{receipt.receiptNumber}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: `${theme.primaryColor}99` }}>Date</span>
            <div className="text-xs sm:text-sm font-semibold" style={{ color: theme.primaryColor }}>
              {formatReceiptDateTime(receipt.createdAt)}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 py-3.5 space-y-3">
          {/* Donor */}
          <div className="grid grid-cols-3 gap-2 items-baseline">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">{l.donor}</span>
            <span className="col-span-2 text-sm font-semibold text-stone-900 leading-snug">
              {settings.donorPrefix ? <span className="text-stone-500 font-normal mr-1">{settings.donorPrefix}</span> : null}
              {receipt.donorName}
            </span>
          </div>
          {receipt.donorAddress && (
            <div className="grid grid-cols-3 gap-2 items-baseline">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">{l.address}</span>
              <span className="col-span-2 text-xs sm:text-sm text-stone-700 leading-snug">{receipt.donorAddress}</span>
            </div>
          )}

          {/* Amount Seal — ornate corners echo a certificate/ledger frame */}
          <div
            className="rounded-2xl p-3.5 text-center my-2 relative overflow-hidden"
            style={{ background: theme.amountBg, border: `1.5px solid ${RECEIPT_GOLD_ACCENT}`, boxShadow: `inset 0 0 0 1px ${theme.primaryColor}22` }}
          >
            <div className="absolute top-1 left-1 opacity-25" style={{ color: theme.primaryColor }}>
              <CornerMotif motif={theme.motif} size={20} color={theme.primaryColor} />
            </div>
            <div className="absolute top-1 right-1 opacity-25 -scale-x-100" style={{ color: theme.primaryColor }}>
              <CornerMotif motif={theme.motif} size={20} color={theme.primaryColor} />
            </div>
            <div className="absolute bottom-1 left-1 opacity-25 -scale-y-100" style={{ color: theme.primaryColor }}>
              <CornerMotif motif={theme.motif} size={20} color={theme.primaryColor} />
            </div>
            <div className="absolute bottom-1 right-1 opacity-25 -scale-100" style={{ color: theme.primaryColor }}>
              <CornerMotif motif={theme.motif} size={20} color={theme.primaryColor} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums relative" style={{ color: theme.primaryColor, fontFamily: displayFont }}>
              ₹{Number(receipt.amount).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-stone-600 italic mt-1 font-medium">
              {receipt.amountInWords}
            </div>
          </div>

          {/* Category, Mode & Status */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg p-2 text-center bg-black/[0.025] border border-black/5">
              <div className="text-[10px] text-stone-400 uppercase font-semibold">{l.category}</div>
              <div className="text-xs font-semibold text-stone-700 mt-0.5 leading-tight break-words">{receipt.category}</div>
            </div>
            <div className="rounded-lg p-2 text-center bg-black/[0.025] border border-black/5">
              <div className="text-[10px] text-stone-400 uppercase font-semibold">{l.mode}</div>
              <div className="text-xs font-semibold text-stone-700 mt-0.5 leading-tight break-words">{receipt.paymentMode}</div>
            </div>
            <div className="rounded-lg p-2 text-center bg-black/[0.025] border border-black/5">
              <div className="text-[10px] text-stone-400 uppercase font-semibold">Status</div>
              <div className="text-xs font-bold mt-0.5">
                {isUnpaid ? (
                  <span className="text-amber-600">{l.unpaid}</span>
                ) : (
                  <span className="text-emerald-600">{l.paid}</span>
                )}
              </div>
            </div>
          </div>

          {/* Collector */}
          <div className="pt-2.5 grid grid-cols-3 gap-2 items-baseline" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">{l.collector}</span>
            <span className="col-span-2 text-xs sm:text-sm font-medium text-stone-700">{receipt.collector?.name}</span>
          </div>
          {receipt.area && (
            <div className="grid grid-cols-3 gap-2 items-baseline">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">{l.area}</span>
              <span className="col-span-2 text-xs sm:text-sm text-stone-700">{receipt.area.name}</span>
            </div>
          )}
          {receipt.notes && (
            <div className="grid grid-cols-3 gap-2 items-baseline">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">Notes</span>
              <span className="col-span-2 text-xs text-stone-500 italic">{receipt.notes}</span>
            </div>
          )}
        </div>

        {/* Footer Note / Blessing */}
        {settings.footerNote && (
          <div className="px-4 sm:px-5 py-2 text-center" style={{ background: theme.amountBg, borderTop: `1px solid ${RECEIPT_GOLD_ACCENT}44` }}>
            <p className="text-[11px] sm:text-xs text-stone-700 font-medium font-devanagari">{settings.footerNote}</p>
          </div>
        )}

        {/* Footer Signature & QR */}
        <div className="px-4 sm:px-5 py-3.5 flex justify-between items-end" style={{ borderTop: `1.5px solid ${theme.primaryColor}` }}>
          <div className="text-center">
            <div className="w-24 sm:w-28 border-b mb-1" style={{ borderColor: 'rgba(0,0,0,0.3)' }} />
            <p className="text-[9px] text-stone-400 uppercase tracking-wider font-medium">{l.sign}</p>
          </div>
          <div className="text-center">
            <QRCodeSVG
              value={verifyUrl}
              size={56}
              bgColor="transparent"
              fgColor={theme.primaryColor}
              level="M"
            />
            <p className="text-[9px] text-stone-400 mt-0.5">{l.scan}</p>
          </div>
        </div>

        {/* Social Links — only the platforms the org actually filled in (Settings > Social Media Links) */}
        {org?.socialLinks && SOCIAL_PLATFORMS.some((p) => org.socialLinks[p.key]) && (
          <div className="px-4 sm:px-5 py-2 flex justify-center gap-3 flex-wrap" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {SOCIAL_PLATFORMS.filter((p) => org.socialLinks[p.key]).map((p) => (
              <a
                key={p.key}
                href={org.socialLinks[p.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-stone-500 hover:text-stone-700 flex items-center gap-1"
              >
                <span>{p.emoji}</span> {p.label}
              </a>
            ))}
          </div>
        )}

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
    </div>
  );
}
