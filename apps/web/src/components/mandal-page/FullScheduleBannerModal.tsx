'use client';

import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, X, Sparkles, Calendar, Shirt, Loader2, Globe, Palette } from 'lucide-react';
import { formatLocalizedDate } from '@/utils/dateUtils';
import toast from 'react-hot-toast';

type BannerLang = 'mr' | 'en' | 'hi';
type BannerTheme = 'crimson' | 'saffron' | 'midnight' | 'purple';

const bannerThemes: Record<BannerTheme, { name: string; bg: string; border: string }> = {
  crimson: {
    name: 'Crimson',
    bg: 'linear-gradient(135deg, #180308 0%, #3b0816 45%, #120206 100%)',
    border: '2px solid rgba(245, 158, 11, 0.45)',
  },
  saffron: {
    name: 'Saffron',
    bg: 'linear-gradient(135deg, #2b0b00 0%, #7c2d12 45%, #1c0500 100%)',
    border: '2px solid rgba(251, 191, 36, 0.6)',
  },
  midnight: {
    name: 'Midnight',
    bg: 'linear-gradient(135deg, #030712 0%, #0f172a 45%, #020617 100%)',
    border: '2px solid rgba(56, 189, 248, 0.45)',
  },
  purple: {
    name: 'Royal Purple',
    bg: 'linear-gradient(135deg, #13031e 0%, #3b0764 45%, #0d0115 100%)',
    border: '2px solid rgba(192, 132, 252, 0.45)',
  },
};

interface FullScheduleBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandalName: string | any;
  mandalNameMarathi?: string | null;
  mandalLogo?: string | null;
  mandalCode?: string | null;
  mandalUrl: string;
  festivalDays: Array<{
    dayNumber: number;
    date: string;
    title: any;
    goddess?: any;
    color?: string;
    colorHex?: string;
    dressCode?: any;
    events?: Array<{
      time?: string;
      startTime?: string;
      title: any;
    }>;
  }>;
}

const resolveText = (val: any, lang: BannerLang = 'mr'): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val[lang] || val.mr || val.hi || val.en || '';
  }
  return String(val);
};

export default function FullScheduleBannerModal({
  isOpen,
  onClose,
  mandalName,
  mandalNameMarathi,
  mandalLogo,
  mandalCode,
  mandalUrl,
  festivalDays,
}: FullScheduleBannerModalProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [bannerLang, setBannerLang] = useState<BannerLang>('mr');
  const [bannerTheme, setBannerTheme] = useState<BannerTheme>('crimson');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTheme = bannerThemes[bannerTheme];

  const displayedMandalName = (bannerLang === 'mr' || bannerLang === 'hi')
    ? (mandalNameMarathi || resolveText(mandalName, 'mr') || resolveText(mandalName, 'en'))
    : (resolveText(mandalName, 'en') || mandalName);

  const totalDays = festivalDays.length || 9;

  const labels = {
    mr: {
      heading: `संपूर्ण ${totalDays} दिवसांचे उत्सव पत्रक`,
      subheading: 'उत्सव कार्यक्रम, रोजचा पोशाख रंग व आरती वेळ',
      dressCode: 'रंग',
      scan: 'स्कॅन करा किंवा भेट द्या:',
      dayPrefix: 'दिवस',
    },
    en: {
      heading: `Complete ${totalDays}-Day Festival Program`,
      subheading: 'Full schedule, daily dress code color & events',
      dressCode: 'Color',
      scan: 'Scan or Visit:',
      dayPrefix: 'Day',
    },
    hi: {
      heading: `संपूर्ण ${totalDays} दिवसीय उत्सव समयसारणी`,
      subheading: 'उत्सव कार्यक्रम, दैनिक पोशाख रंग व आरती समय',
      dressCode: 'रंग',
      scan: 'स्कैन करें या विजिट करें:',
      dayPrefix: 'दिवस',
    },
  }[bannerLang];

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(bannerRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${mandalName.replace(/\s+/g, '_')}_Complete_${totalDays}Days_Schedule_${bannerLang.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Complete Festival Schedule Banner downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Could not generate banner image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareBannerImage = async () => {
    if (!bannerRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(bannerRef.current, { cacheBust: true, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `${mandalName.replace(/\s+/g, '_')}_Complete_${totalDays}Days_Schedule_${bannerLang.toUpperCase()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      let sharedSuccessfully = false;

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${mandalName} - ${labels.heading}`,
            text: `🚩 ${mandalName}\n📅 ${labels.heading}\n🔗 ${mandalUrl}`,
            files: [file],
          });
          toast.success('Complete schedule banner shared!');
          sharedSuccessfully = true;
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return;
        }
      }

      if (!sharedSuccessfully) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();

        const summaryText = festivalDays.map((d) => {
          const title = resolveText(d.title, bannerLang) || resolveText(d.goddess, bannerLang);
          const colorText = resolveText(d.dressCode?.theme, bannerLang) || d.color || '';
          const dDate = d.date ? formatLocalizedDate(d.date, bannerLang) : '';
          return `• *${labels.dayPrefix} ${d.dayNumber}${dDate ? ` (${dDate})` : ''}:* ${title}${colorText ? ` (👕 ${colorText})` : ''}`;
        }).join('\n');

        const text = `🚩 *${mandalName}* 🚩\n📅 *${labels.heading}*\n\n${summaryText}\n\n🔗 ${mandalUrl}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        toast.success('Banner downloaded & WhatsApp link opened!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error(err);
        try {
          const text = `🚩 *${mandalName}* 🚩\n📅 *${labels.heading}*\n🔗 ${mandalUrl}`;
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
          toast.success('WhatsApp link opened!');
        } catch {
          toast.error('Could not share banner. Please use download button.');
        }
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-theme-bg rounded-2xl border border-theme-fg/10 shadow-2xl p-4 sm:p-6 my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-theme-fg/10 mb-3.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-theme-fg/70 hover:text-theme-fg transition-colors bg-transparent border-0 outline-none cursor-pointer"
            aria-label="Close"
            title="Close"
          >
            <X size={22} />
          </button>

          <div className="flex items-center gap-1.5 text-center">
            <Sparkles className="text-amber-500 shrink-0" size={18} />
            <h2 className="text-xs sm:text-sm font-bold text-theme-fg tracking-wide">
              Full {totalDays}-Day Schedule Banner
            </h2>
          </div>

          <div className="w-6" aria-hidden="true" />
        </div>

        {/* Controls Panel: High-Contrast Language & Theme Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {/* Language Selector Bar */}
          <div className="flex items-center justify-between bg-amber-500/10 p-2 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-1 text-xs text-amber-200 font-bold px-1">
              <Globe size={13} className="text-amber-400 shrink-0" />
              <span>Language:</span>
            </div>
            <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-amber-500/30">
              {(['mr', 'en', 'hi'] as BannerLang[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setBannerLang(lang)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    bannerLang === lang
                      ? 'bg-amber-400 text-amber-950 shadow-xs scale-[1.02]'
                      : 'text-amber-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang === 'mr' ? 'मराठी' : lang === 'en' ? 'EN' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector Bar */}
          <div className="flex items-center justify-between bg-amber-500/10 p-2 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-1 text-xs text-amber-200 font-bold px-1">
              <Palette size={13} className="text-amber-400 shrink-0" />
              <span>Theme:</span>
            </div>
            <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-amber-500/30">
              {(Object.keys(bannerThemes) as BannerTheme[]).map((tKey) => (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setBannerTheme(tKey)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    bannerTheme === tKey
                      ? 'bg-amber-400 text-amber-950 shadow-xs scale-[1.02]'
                      : 'text-amber-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {bannerThemes[tKey].name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Canvas Container */}
        <div className="flex justify-center mb-5 overflow-hidden">
          <div
            ref={bannerRef}
            className="w-full max-w-[540px] rounded-2xl p-4 sm:p-5 text-white shadow-2xl relative overflow-hidden transition-all duration-300"
            style={{
              background: currentTheme.bg,
              border: currentTheme.border,
            }}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-saffron-600/15 blur-3xl pointer-events-none" />

            {/* Top Mandal Header */}
            <div className="text-center relative z-10 pb-3 border-b border-amber-500/25">
              {mandalLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mandalLogo} alt={displayedMandalName} className="w-14 h-14 rounded-full mx-auto mb-1.5 border-2 border-amber-400/60 object-cover shadow-lg bg-white p-0.5" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400/50 mx-auto mb-1.5 flex items-center justify-center font-bold text-amber-400 text-xl shadow-md">
                  🚩
                </div>
              )}
              <h3 className="text-sm sm:text-base font-extrabold text-amber-300 tracking-wide uppercase line-clamp-1">{displayedMandalName}</h3>
              <p className="text-[11px] sm:text-xs font-bold text-amber-400/90 mt-0.5 tracking-wide">{labels.heading}</p>
              {mandalCode && <p className="text-[9px] text-amber-200/60 font-semibold tracking-wider mt-0.5">MANDAL CODE: {mandalCode}</p>}
            </div>

            {/* 9-Day Schedule Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3 relative z-10">
              {festivalDays.map((d) => {
                const titleText = resolveText(d.title, bannerLang) || resolveText(d.goddess, bannerLang) || `Day ${d.dayNumber}`;
                const dressCodeTheme = resolveText(d.dressCode?.theme, bannerLang) || d.color || '';
                const hex = d.colorHex || d.dressCode?.colorHex || '#d97706';
                const firstEvent = d.events && d.events[0] ? resolveText(d.events[0].title, bannerLang) : null;
                const eventTime = d.events && d.events[0] ? (d.events[0].time || d.events[0].startTime || '') : '';
                const formattedDate = d.date ? formatLocalizedDate(d.date, bannerLang) : '';

                return (
                  <div key={d.dayNumber} className="bg-black/40 border border-amber-500/20 rounded-xl p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 uppercase tracking-wider">
                        {labels.dayPrefix} {d.dayNumber}
                      </span>
                      {formattedDate && (
                        <span className="text-[9.5px] font-semibold text-amber-300/90 flex items-center gap-1">
                          <Calendar size={10} className="text-amber-400" />
                          {formattedDate}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-bold text-white line-clamp-1">{titleText}</p>

                    {dressCodeTheme && (
                      <div className="flex items-center gap-1 text-[9.5px] font-semibold text-amber-200/90 mt-0.5">
                        <Shirt size={9} className="text-amber-400" />
                        <span className="w-2 h-2 rounded-full border border-white/40" style={{ backgroundColor: hex }} />
                        <span className="truncate max-w-[120px]">{dressCodeTheme}</span>
                      </div>
                    )}

                    {firstEvent && (
                      <p className="text-[9.5px] text-amber-200/70 line-clamp-1 mt-0.5">
                        {eventTime && <strong className="text-amber-400 font-normal">{eventTime}: </strong>}
                        {firstEvent}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer QR & Branding */}
            <div className="pt-2.5 border-t border-amber-500/25 flex items-center justify-between gap-3 relative z-10">
              <div className="flex-1">
                <p className="text-[10px] text-amber-200/70 font-semibold">{labels.scan}</p>
                <p className="text-[9px] text-amber-400 font-mono truncate">{mandalUrl.replace(/^https?:\/\//, '')}</p>
                <p className="text-[8px] text-amber-200/40 mt-0.5">Powered by E-PavtiBook Digital Identity</p>
              </div>
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-md">
                <QRCodeSVG value={mandalUrl} size={42} level="M" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || sharing}
            className="btn-secondary text-xs flex-1 flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] w-full rounded-xl font-semibold transition-all shadow-sm"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Generating Banner...' : 'Download Full Schedule Image'}
          </button>
          <button
            type="button"
            onClick={handleShareBannerImage}
            disabled={downloading || sharing}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white min-h-[44px] transition-all shadow-md w-full"
          >
            {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            {sharing ? 'Sharing Banner...' : 'Share Banner / WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
