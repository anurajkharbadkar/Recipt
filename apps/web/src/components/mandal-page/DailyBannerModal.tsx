'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, X, Sparkles, Clock, Shirt, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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

const resolveText = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.mr || val.hi || val.en || '';
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

  if (!isOpen) return null;

  const titleText = resolveText(day.title);
  const dressCodeText = resolveText(day.dressCodeColor);
  const deityAvatarText = resolveText(day.deityAvatar);
  const activeColorHex = day.colorHex || '#d97706';

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(bannerRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${mandalName.replace(/\s+/g, '_')}_Day_${day.dayNumber}_Schedule.png`;
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
      const fileName = `${mandalName.replace(/\s+/g, '_')}_Day_${day.dayNumber}_Banner.png`;
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
          // Fall through to file download + WhatsApp link fallback below
        }
      }

      if (!sharedSuccessfully) {
        // Fallback for desktop / browsers where direct file share is unsupported:
        // 1. Download image poster
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();

        // 2. Open WhatsApp share text
        const text = `🚩 *${mandalName}* 🚩\n\n📅 *${titleText}*\n👕 *आजचा पोशाख / Color:* ${dressCodeText || 'Traditional'}\n${deityAvatarText ? `✨ *अलंकार / Avatar:* ${deityAvatarText}\n` : ''}\n📋 *दैनिक वेळापत्रक (Schedule):*\n${(day.events || []).map((e: any) => `• ${e.time || e.startTime || ''} - ${resolveText(e.title)}`).join('\n')}\n\n🔗 अधिक माहिती व डिजिटल पावती:\n${mandalUrl}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto animate-fade-in" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-lg bg-theme-bg rounded-2xl border border-theme-fg/10 shadow-2xl p-4 sm:p-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-fg/10 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-theme-fg/70 hover:text-theme-fg hover:bg-theme-fg/10 transition-colors flex items-center justify-center shrink-0"
              aria-label="Close modal"
              title="Close"
            >
              <X size={20} />
            </button>
            <Sparkles className="text-saffron-500 shrink-0" size={18} />
            <h2 className="text-xs sm:text-sm font-bold text-theme-fg line-clamp-1">Daily Festival Banner (शेअर करण्यायोग्य इमेज)</h2>
          </div>
        </div>

        {/* Banner Canvas Container (Light Theme 9:16 Poster) */}
        <div className="flex justify-center mb-5 overflow-hidden">
          <div
            ref={bannerRef}
            className="w-[330px] sm:w-[360px] rounded-2xl p-5 shadow-2xl relative overflow-hidden border-2"
            style={{
              background: 'linear-gradient(135deg, #fffdf7 0%, #fff7ed 45%, #fef3c7 100%)',
              borderColor: '#d97706',
              color: '#451a03',
            }}
          >
            {/* Background Glow Overlay */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: activeColorHex }}
            />

            {/* Top Mandal Header */}
            <div className="text-center relative z-10 pb-3 border-b border-amber-600/20">
              {mandalLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mandalLogo} alt={mandalName} className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-amber-500 object-cover shadow-sm bg-white" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border-2 border-amber-500/40 mx-auto mb-2 flex items-center justify-center font-bold text-amber-700 text-lg shadow-xs">
                  🚩
                </div>
              )}
              <h3 className="text-sm sm:text-base font-extrabold text-amber-950 tracking-wide uppercase line-clamp-1">{mandalName}</h3>
              {mandalCode && <p className="text-[10px] text-amber-800 font-bold tracking-wider mt-0.5">MANDAL CODE: {mandalCode}</p>}
            </div>

            {/* Day Title Badge */}
            <div className="text-center my-3 relative z-10">
              <span className="inline-block text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-widest text-white bg-gradient-to-r from-amber-600 to-amber-700 shadow-md">
                {titleText}
              </span>

              {/* Dress Code & Avatar */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-white/80 border border-amber-500/25 shadow-xs flex flex-col gap-1 items-center">
                {dressCodeText && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-950">
                    <Shirt size={14} className="text-amber-600" />
                    <span>पोशाख / Color:</span>
                    <span className="flex items-center gap-1.5 font-bold text-amber-900">
                      <span className="w-3.5 h-3.5 rounded-full border border-amber-900/30 shadow-xs" style={{ backgroundColor: activeColorHex }} />
                      {dressCodeText}
                    </span>
                  </div>
                )}
                {deityAvatarText && (
                  <div className="text-[11px] text-amber-900 font-medium">
                    ✨ <strong className="text-amber-950 font-bold">अलंकार / Avatar:</strong> {deityAvatarText}
                  </div>
                )}
              </div>
            </div>

            {/* Events Timeline List */}
            <div className="space-y-2 my-3 relative z-10">
              <p className="text-[11px] font-bold tracking-wider text-amber-900 uppercase border-b border-amber-600/20 pb-1 flex items-center gap-1.5">
                <Clock size={12} className="text-amber-600" /> दैनिक वेळापत्रक (Schedule)
              </p>
              {day.events && day.events.length > 0 ? (
                day.events.slice(0, 5).map((evt, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-xs bg-white/90 p-2 rounded-lg border border-amber-500/20 shadow-xs">
                    <span className="font-bold text-amber-800 shrink-0 text-[11px] min-w-[65px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{evt.time || evt.startTime || ''}</span>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-amber-950 text-[11px]">{resolveText(evt.title)}</p>
                      {evt.description && <p className="text-[10px] text-amber-800/80 line-clamp-1">{resolveText(evt.description)}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-amber-800/60 text-center italic py-2">Kakad Aarti & Daily Darshan</p>
              )}
            </div>

            {/* Bottom QR Code & Website URL */}
            <div className="pt-2.5 border-t border-amber-600/20 flex items-center justify-between gap-3 relative z-10">
              <div className="flex-1">
                <p className="text-[10px] text-amber-900 font-bold">स्कॅन करा किंवा भेट द्या:</p>
                <p className="text-[9.5px] text-amber-700 font-mono font-bold truncate">{mandalUrl.replace(/^https?:\/\//, '')}</p>
                <p className="text-[8.5px] text-amber-800/60 mt-0.5 font-medium">Powered by E-PavtiBook</p>
              </div>
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-md border border-amber-300">
                <QRCodeSVG value={mandalUrl} size={44} level="M" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading || sharing}
            className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[42px] w-full"
          >
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {downloading ? 'Generating...' : 'Download Image'}
          </button>
          <button
            onClick={handleShareBannerImage}
            disabled={downloading || sharing}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white min-h-[42px] transition-colors shadow-sm w-full"
          >
            {sharing ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
            {sharing ? 'Sharing...' : 'Share Image / WhatsApp'}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary text-xs flex items-center justify-center gap-1 py-2.5 px-3 min-h-[42px] w-full sm:w-auto text-theme-fg/70 hover:text-theme-fg shrink-0"
            aria-label="Close modal"
            title="Close"
          >
            <X size={15} />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}


