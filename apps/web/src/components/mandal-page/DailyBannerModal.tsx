'use client';

import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, X, Sparkles, Clock, Shirt, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

type BannerLang = 'mr' | 'en' | 'hi';

interface DailyBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandalName: string;
  mandalLogo?: string | null;
  mandalCode?: string | null;
  mandalUrl: string;
  day: {
    dayNumber: number;
    title: any;
    dressCodeColor?: any;
    colorHex?: string | null;
    deityAvatar?: any;
    events?: Array<{
      time?: string;
      startTime?: string;
      title: any;
      description?: any;
      eventType?: string;
    }>;
  };
}

const resolveText = (val: any, lang: BannerLang = 'mr'): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val[lang] || val.mr || val.hi || val.en || '';
  }
  return String(val);
};

export default function DailyBannerModal({
  isOpen,
  onClose,
  mandalName,
  mandalLogo,
  mandalCode,
  mandalUrl,
  day,
}: DailyBannerModalProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [bannerLang, setBannerLang] = useState<BannerLang>('mr');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleText = resolveText(day.title, bannerLang);
  const dressCodeText = resolveText(day.dressCodeColor, bannerLang);
  const deityAvatarText = resolveText(day.deityAvatar, bannerLang);
  const activeColorHex = day.colorHex || '#d97706';

  // Language dictionary for static labels inside poster
  const labels = {
    mr: {
      dressCode: 'पोशाख / Color',
      avatar: 'अलंकार / Avatar',
      schedule: 'दैनिक वेळापत्रक (Schedule)',
      scan: 'स्कॅन करा किंवा भेट द्या:',
      fallback: 'काकड आरती व दैनंदिन दर्शन',
    },
    en: {
      dressCode: 'Dress Code / Color',
      avatar: 'Avatar / Theme',
      schedule: 'Daily Schedule',
      scan: 'Scan or Visit:',
      fallback: 'Kakad Aarti & Daily Darshan',
    },
    hi: {
      dressCode: 'पोशाक / Color',
      avatar: 'अलंकार / Avatar',
      schedule: 'दैनिक समयसारणी (Schedule)',
      scan: 'स्कैन करें या विजिट करें:',
      fallback: 'काकड़ आरती एवं दैनिक दर्शन',
    },
  }[bannerLang];

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(bannerRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${mandalName.replace(/\s+/g, '_')}_Day_${day.dayNumber}_Schedule_${bannerLang.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Daily Bulletin Banner downloaded successfully!');
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
      const fileName = `${mandalName.replace(/\s+/g, '_')}_Day_${day.dayNumber}_Banner_${bannerLang.toUpperCase()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      let sharedSuccessfully = false;

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${mandalName} - Day ${day.dayNumber}`,
            text: `🚩 ${mandalName}\n✨ ${titleText}\n${mandalUrl}`,
            files: [file],
          });
          toast.success('Banner image shared!');
          sharedSuccessfully = true;
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            return;
          }
        }
      }

      if (!sharedSuccessfully) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();

        const text = `🚩 *${mandalName}* 🚩\n\n📅 *${titleText}*\n👕 *${labels.dressCode}:* ${dressCodeText || 'Traditional'}\n${deityAvatarText ? `✨ *${labels.avatar}:* ${deityAvatarText}\n` : ''}\n📋 *${labels.schedule}:*\n${(day.events || []).map((e: any) => `• ${e.time || e.startTime || ''} - ${resolveText(e.title, bannerLang)}`).join('\n')}\n\n🔗 ${mandalUrl}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        toast.success('Banner downloaded & WhatsApp link opened!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error(err);
        try {
          const text = `🚩 *${mandalName}* 🚩\n\n📅 *${titleText}*\n🔗 ${mandalUrl}`;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-theme-bg rounded-2xl border border-theme-fg/10 shadow-2xl p-4 sm:p-6 my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-theme-fg/10 mb-3.5">
          {/* Close button top left: no background, no label, just X icon */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-theme-fg/70 hover:text-theme-fg transition-colors bg-transparent border-0 outline-none cursor-pointer focus:outline-none"
            aria-label="Close"
            title="Close"
          >
            <X size={22} />
          </button>

          <div className="flex items-center gap-1.5 text-center">
            <Sparkles className="text-amber-500 shrink-0" size={17} />
            <h2 className="text-xs sm:text-sm font-bold text-theme-fg tracking-wide">Daily Festival Banner</h2>
          </div>

          {/* Spacer to keep title centered */}
          <div className="w-6" aria-hidden="true" />
        </div>

        {/* Language Selector Bar */}
        <div className="flex items-center justify-between bg-theme-fg/5 p-2 rounded-xl mb-4 border border-theme-fg/10">
          <div className="flex items-center gap-1.5 text-xs text-theme-fg/70 font-semibold px-1">
            <Globe size={14} className="text-amber-500 shrink-0" />
            <span>Language:</span>
          </div>
          <div className="flex items-center gap-1 bg-theme-bg p-1 rounded-lg border border-theme-fg/10">
            <button
              type="button"
              onClick={() => setBannerLang('mr')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                bannerLang === 'mr'
                  ? 'bg-amber-500 text-amber-950 shadow-xs'
                  : 'text-theme-fg/60 hover:text-theme-fg hover:bg-theme-fg/5'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setBannerLang('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                bannerLang === 'en'
                  ? 'bg-amber-500 text-amber-950 shadow-xs'
                  : 'text-theme-fg/60 hover:text-theme-fg hover:bg-theme-fg/5'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setBannerLang('hi')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                bannerLang === 'hi'
                  ? 'bg-amber-500 text-amber-950 shadow-xs'
                  : 'text-theme-fg/60 hover:text-theme-fg hover:bg-theme-fg/5'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        {/* Banner Canvas Container (9:16 Aspect Ratio) */}
        <div className="flex justify-center mb-5 overflow-hidden">
          <div
            ref={bannerRef}
            className="w-[330px] sm:w-[360px] rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #120500 0%, #2b0c02 40%, #0d0300 100%)',
              border: '2px solid rgba(245, 158, 11, 0.45)',
            }}
          >
            {/* Background Glow Overlay */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: activeColorHex }}
            />

            {/* Top Mandal Header */}
            <div className="text-center relative z-10 pb-3 border-b border-amber-500/20">
              {mandalLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mandalLogo} alt={mandalName} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-amber-400/60 object-cover shadow-lg bg-white p-0.5" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/50 mx-auto mb-2 flex items-center justify-center font-bold text-amber-400 text-2xl shadow-md">
                  🚩
                </div>
              )}
              <h3 className="text-sm sm:text-base font-extrabold text-amber-300 tracking-wide uppercase line-clamp-1">{mandalName}</h3>
              {mandalCode && <p className="text-[10px] text-amber-200/70 font-semibold tracking-wider">MANDAL CODE: {mandalCode}</p>}
            </div>

            {/* Day Title Badge */}
            <div className="text-center my-3 relative z-10">
              <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest text-amber-950 bg-amber-400 shadow-lg">
                {titleText}
              </span>

              {/* Dress Code & Avatar */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1 items-center">
                {dressCodeText && (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Shirt size={13} className="text-amber-400" />
                    <span>{labels.dressCode}:</span>
                    <span className="flex items-center gap-1 font-bold text-amber-300">
                      <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: activeColorHex }} />
                      {dressCodeText}
                    </span>
                  </div>
                )}
                {deityAvatarText && (
                  <div className="text-[11px] text-amber-200/90 font-medium">
                    ✨ <strong className="text-amber-300">{labels.avatar}:</strong> {deityAvatarText}
                  </div>
                )}
              </div>
            </div>

            {/* Events Timeline List */}
            <div className="space-y-2 my-3 relative z-10">
              <p className="text-[11px] font-bold tracking-wider text-amber-400/80 uppercase border-b border-amber-500/20 pb-1 flex items-center gap-1.5">
                <Clock size={12} /> {labels.schedule}
              </p>
              {day.events && day.events.length > 0 ? (
                day.events.slice(0, 5).map((evt, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-xs bg-black/40 p-2 rounded-lg border border-amber-500/15">
                    <span className="font-semibold text-amber-300 shrink-0 text-[11px] min-w-[65px]">{evt.time || evt.startTime || ''}</span>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-white text-[11px]">{resolveText(evt.title, bannerLang)}</p>
                      {evt.description && <p className="text-[10px] text-amber-200/60 line-clamp-1">{resolveText(evt.description, bannerLang)}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-amber-200/50 text-center italic py-2">{labels.fallback}</p>
              )}
            </div>

            {/* Bottom QR Code & Website URL */}
            <div className="pt-2.5 border-t border-amber-500/20 flex items-center justify-between gap-3 relative z-10">
              <div className="flex-1">
                <p className="text-[10px] text-amber-200/70 font-semibold">{labels.scan}</p>
                <p className="text-[9px] text-amber-400 font-mono truncate">{mandalUrl.replace(/^https?:\/\//, '')}</p>
                <p className="text-[8px] text-amber-200/40 mt-0.5">Powered by E-PavtiBook</p>
              </div>
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-md">
                <QRCodeSVG value={mandalUrl} size={44} level="M" />
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
            {downloading ? 'Generating...' : 'Download Image'}
          </button>
          <button
            type="button"
            onClick={handleShareBannerImage}
            disabled={downloading || sharing}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white min-h-[44px] transition-all shadow-md w-full"
          >
            {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            {sharing ? 'Sharing...' : 'Share Image / WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
