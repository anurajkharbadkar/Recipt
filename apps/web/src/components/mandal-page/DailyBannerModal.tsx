'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, X, Sparkles, Clock, Shirt, CheckCircle2, Calendar } from 'lucide-react';
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
    title: string;
    dressCodeColor?: string | null;
    colorHex?: string | null;
    deityAvatar?: string | null;
    events?: Array<{
      time: string;
      title: string;
      description?: string | null;
      eventType?: string;
    }>;
  };
}

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

  if (!isOpen) return null;

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

  const handleWhatsAppShare = () => {
    const text = `🚩 *${mandalName}* 🚩\n\n📅 *${day.title}*\n👕 *आजचा पोशाख / Color of the Day:* ${day.dressCodeColor || 'Traditional'}\n${day.deityAvatar ? `✨ *अलंकार / संकल्प:* ${day.deityAvatar}\n` : ''}\n📋 *दैनिक वेळापत्रक (Schedule):*\n${(day.events || []).map((e) => `• ${e.time} - ${e.title}`).join('\n')}\n\n🔗 अधिक माहिती व डिजिटल पावतीसाठी लिंकवर क्लिक करा:\n${mandalUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const activeColorHex = day.colorHex || '#d97706';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-theme-bg rounded-2xl border border-theme-fg/10 shadow-2xl p-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-fg/10 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-saffron-500" size={18} />
            <h2 className="text-sm sm:text-base font-bold text-theme-fg">Daily Schedule Banner (WhatsApp Status)</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-theme-fg/50 hover:text-theme-fg hover:bg-theme-fg/5">
            <X size={20} />
          </button>
        </div>

        {/* Banner Canvas Container (9:16 Aspect Ratio) */}
        <div className="flex justify-center mb-5 overflow-hidden">
          <div
            ref={bannerRef}
            className="w-[340px] sm:w-[380px] rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #180800 0%, #2b0c02 40%, #0d0300 100%)',
              border: '2px solid rgba(234, 179, 8, 0.4)',
            }}
          >
            {/* Background Glow Overlay */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: activeColorHex }}
            />

            {/* Top Mandal Header */}
            <div className="text-center relative z-10 pb-4 border-b border-amber-500/20">
              {mandalLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mandalLogo} alt={mandalName} className="w-12 h-12 rounded-full mx-auto mb-2 border border-amber-400/50 object-cover shadow-md" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 mx-auto mb-2 flex items-center justify-center font-bold text-amber-400 text-lg">
                  🚩
                </div>
              )}
              <h3 className="text-base font-extrabold text-amber-300 tracking-wide uppercase line-clamp-1">{mandalName}</h3>
              {mandalCode && <p className="text-[10px] text-amber-200/70 font-semibold tracking-wider">MANDAL CODE: {mandalCode}</p>}
            </div>

            {/* Day Title Badge */}
            <div className="text-center my-4 relative z-10">
              <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest text-amber-950 bg-amber-400 shadow-lg">
                {day.title}
              </span>

              {/* Dress Code & Avatar */}
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1.5 items-center">
                {day.dressCodeColor && (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Shirt size={14} className="text-amber-400" />
                    <span>पोशाख / Color:</span>
                    <span className="flex items-center gap-1 font-bold text-amber-300">
                      <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: activeColorHex }} />
                      {day.dressCodeColor}
                    </span>
                  </div>
                )}
                {day.deityAvatar && (
                  <div className="text-[11px] text-amber-200/90 font-medium">
                    ✨ <strong className="text-amber-300">अलंकार / Avatar:</strong> {day.deityAvatar}
                  </div>
                )}
              </div>
            </div>

            {/* Events Timeline List */}
            <div className="space-y-2.5 my-4 relative z-10">
              <p className="text-[11px] font-bold tracking-wider text-amber-400/80 uppercase border-b border-amber-500/20 pb-1 flex items-center gap-1.5">
                <Clock size={12} /> दैनिक कार्यक्रम (Schedule)
              </p>
              {day.events && day.events.length > 0 ? (
                day.events.slice(0, 5).map((evt, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-xs bg-black/40 p-2 rounded-lg border border-amber-500/15">
                    <span className="font-semibold text-amber-300 shrink-0 text-[11px] min-w-[65px]">{evt.time}</span>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-white text-[11px]">{evt.title}</p>
                      {evt.description && <p className="text-[10px] text-amber-200/60 line-clamp-1">{evt.description}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-amber-200/50 text-center italic py-2">Kakad Aarti & Daily Darshan</p>
              )}
            </div>

            {/* Bottom QR Code & Website URL */}
            <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between gap-3 relative z-10">
              <div className="flex-1">
                <p className="text-[10px] text-amber-200/70 font-semibold">स्कॅन करा किंवा भेट द्या:</p>
                <p className="text-[9px] text-amber-400 font-mono truncate">{mandalUrl.replace(/^https?:\/\//, '')}</p>
                <p className="text-[8px] text-amber-200/40 mt-1">Powered by E-PavtiBook</p>
              </div>
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-md">
                <QRCodeSVG value={mandalUrl} size={48} level="M" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2.5 min-h-[42px]"
          >
            <Download size={15} />
            {downloading ? 'Downloading...' : 'Download Image'}
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white min-h-[42px] transition-colors shadow-sm"
          >
            <Share2 size={15} />
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
