'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  ReceiptTemplateSettings,
  resolveReceiptSettings,
  formatAmountInWords,
  formatShareMessage,
  RECEIPT_FIELD_LABELS
} from '@pavti/shared';
import { playSealCrackSound, playTempleBell, playAshirwadChimes } from '@/lib/templeAudio';
import { Volume2, VolumeX, Download, Share2, ArrowDown, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface InteractivePavtiViewProps {
  receipt: Receipt;
  language?: 'mr' | 'hi' | 'en';
  onSwitchToStandard?: () => void;
  /** Start with sound muted — callers that embed the view (e.g. landing page demo) should set this true. */
  defaultMuted?: boolean;
  /**
   * The real use of this component (/receipt/[id]) wants a full-screen
   * takeover — position: fixed, 100vw/100vh — regardless of whatever page
   * structure happens to surround it. That breaks completely when embedded
   * in a small, sized container instead (e.g. the landing page's phone-
   * frame demo): `position: fixed` still computes relative to the browser
   * viewport, not the parent box, so the widget renders as a full-viewport
   * overlay and the parent's `overflow: hidden` clips away everything
   * except whichever fixed-positioned element (the mute button, in
   * practice) happens to land inside the small visible rectangle — the
   * rest is silently cropped out. Set this to have the widget instead fill
   * its actual parent (position: relative, 100%/100%) — see the
   * .embedded CSS overrides below. Confirmed live on the landing page's
   * hero demo (2026-08-22).
   */
  embedded?: boolean;
}

export default function InteractivePavtiView({
  receipt,
  language = 'mr',
  onSwitchToStandard,
  defaultMuted = false,
  embedded = false,
}: InteractivePavtiViewProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(defaultMuted);

  const appContainerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<(HTMLElement | null)[]>([]);

  const org: any = (receipt as any).organization || (receipt as any).campaign?.organization || {};
  const campaign: any = (receipt as any).campaign || {};
  const settings: ReceiptTemplateSettings = resolveReceiptSettings(org?.receiptTemplateSettings, language);
  
  const isLandscapeTemplate = settings.interactiveTemplate === 'GANESHA_LANDSCAPE_GOLD';
  const customDarshan = settings.customDarshanUrl;
  // Same field labels as the single-page pavti (ReceiptPreview.tsx) and the
  // PDF — the "Digital Pavti" slide below used to keep its own hardcoded
  // bilingual labels and had drifted: a phone-number field the basic pavti
  // never shows, and "देणगी प्रकार" (donation category) mislabeling the
  // payment-mode value. One label source now, so all three stay in sync.
  const l = RECEIPT_FIELD_LABELS[language] || RECEIPT_FIELD_LABELS.mr;
  const isInternal = (receipt as any).collectionType === 'INTERNAL';
  const isUnpaid = receipt.status === 'PENDING';
  const donorArea = (receipt as any).area;

  // Format amount in Devanagari words
  const amountInWords = formatAmountInWords(receipt.amount, language);
  const formattedDate = new Date(receipt.createdAt).toLocaleDateString(
    language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
    { day: '2-digit', month: 'long', year: 'numeric' }
  );

  // Scroll to slide helper
  const goToSlide = (slideIndex: number) => {
    if (slideIndex < 0 || slideIndex > 3) return;
    setCurrentSlide(slideIndex);
    const target = slidesRef.current[slideIndex];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open Envelope Trigger
  const handleOpenEnvelope = () => {
    if (isEnvelopeOpen) return;
    setIsEnvelopeOpen(true);

    if (!isSoundMuted) {
      playSealCrackSound();
    }

    // Move to Slide 1 (Darshan) after animation completes
    setTimeout(() => {
      goToSlide(1);
    }, 2200);
  };

  // Handle slide visibility on scroll
  useEffect(() => {
    const container = appContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPos = container.scrollTop;
      // The container's own height, not window.innerHeight — each slide is
      // sized to fill its parent (100% in embedded mode, which happens to
      // equal the full viewport in the real full-page use since .app-shell
      // itself is 100vh there), so this is the correct measure in both
      // modes rather than assuming the container always equals the window.
      const height = container.clientHeight;
      const activeIdx = Math.round(scrollPos / height);
      if (activeIdx !== currentSlide && activeIdx >= 0 && activeIdx <= 3) {
        setCurrentSlide(activeIdx);
        if (activeIdx === 3 && !isSoundMuted) {
          playAshirwadChimes();
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentSlide, isSoundMuted]);

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    const receiptUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = formatShareMessage(settings.shareMessage, {
      donorName: receipt.donorName,
      amount: receipt.amount,
      receiptNumber: receipt.receiptNumber,
      date: formattedDate,
      organizationName: org.nameMarathi || org.name,
      campaignName: campaign.nameMarathi || campaign.name,
      receiptUrl,
    });

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`interactive-pavti-root ${isLandscapeTemplate ? 'theme-landscape' : 'theme-portrait'} ${embedded ? 'embedded' : ''}`}>
      <style jsx global>{`
        .interactive-pavti-root {
          --maroon: #5c1220;
          --maroon-deep: #33090f;
          --maroon-black: #210608;
          --gold: #c9a24a;
          --gold-light: #f4dd9a;
          --gold-pale: #ecd8a3;
          --saffron: #e2883f;
          /* Kept close to white with just a whisper of warmth — matches the
             single-page pavti's paper tone (ReceiptPreview.tsx) so the two
             pavti designs read as the same product, not two different apps. */
          --parchment: #fbf8f2;
          --parchment-dark: #f3ede0;
          --bronze: #2a160d;
          --ink: #2b160c;
          font-family: 'Noto Sans Devanagari', 'Segoe UI', serif;
          background: var(--maroon-black);
          color: var(--parchment);
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: 50;
        }

        .theme-landscape {
          --maroon: #4a151b;
          --maroon-deep: #290b0e;
          --maroon-black: #170406;
          --gold: #d4af37;
          --gold-light: #fbeea8;
        }

        /* See the embedded prop's own comment above — fills the actual
           parent box instead of taking over the whole viewport. Every
           other rule in this file keyed to 100vw/100vh or position: fixed
           needs its own .embedded override here too, not just the root. */
        .interactive-pavti-root.embedded {
          position: relative;
          inset: auto;
          width: 100%;
          height: 100%;
        }
        .interactive-pavti-root.embedded .app-shell,
        .interactive-pavti-root.embedded .pavti-slide {
          width: 100%;
          height: 100%;
        }
        .interactive-pavti-root.embedded .nav-dots,
        .interactive-pavti-root.embedded .top-action-bar {
          position: absolute;
        }

        .app-shell {
          width: 100vw;
          height: 100vh;
          overflow-y: scroll;
          overflow-x: hidden;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
        }

        .app-shell.locked {
          overflow: hidden;
        }

        .app-shell::-webkit-scrollbar {
          display: none;
        }

        .pavti-slide {
          position: relative;
          width: 100vw;
          height: 100vh;
          scroll-snap-align: start;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* Frame Corner Accents */
        .frame-corner {
          position: absolute;
          width: 48px;
          height: 48px;
          opacity: 0.55;
          pointer-events: none;
          border: 1.5px solid var(--gold);
          z-index: 10;
        }
        .fc-tl { top: 16px; left: 16px; border-right: none; border-bottom: none; }
        .fc-tr { top: 16px; right: 16px; border-left: none; border-bottom: none; }
        .fc-bl { bottom: 16px; left: 16px; border-right: none; border-top: none; }
        .fc-br { bottom: 16px; right: 16px; border-left: none; border-top: none; }

        /* Floating Nav Dots */
        .nav-dots {
          position: fixed;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 60;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .nav-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1.3px solid var(--gold-light);
          background: transparent;
          cursor: pointer;
          transition: all 0.35s ease;
        }
        .nav-dot.active {
          background: var(--gold-light);
          box-shadow: 0 0 8px var(--gold-light);
          transform: scale(1.3);
        }

        /* Top Action Bar */
        .top-action-bar {
          position: fixed;
          top: 18px;
          left: 18px;
          right: 18px;
          z-index: 70;
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: none;
        }
        .top-action-btn {
          pointer-events: auto;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid var(--gold);
          color: var(--gold-light);
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .top-action-btn:hover {
          background: var(--gold);
          color: var(--maroon-black);
        }

        /* Slide 1: Envelope */
        .envelope-slide {
          background: radial-gradient(ellipse at 50% 30%, rgba(216, 168, 80, 0.14), transparent 55%),
                      linear-gradient(160deg, var(--maroon) 0%, var(--maroon-deep) 60%, #150304 100%);
        }
        .envelope-wrap {
          perspective: 1900px;
          width: min(380px, 86vw);
          height: min(250px, 56vw);
          position: relative;
          z-index: 5;
        }
        .envelope-box {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          filter: drop-shadow(0 24px 38px rgba(8, 2, 2, 0.7));
        }
        .envelope-body {
          position: absolute;
          inset: 0;
          border-radius: 8px;
          background: linear-gradient(145deg, #7c1a2c, #480c16 65%, #2a050c);
          border: 1.5px solid rgba(244, 221, 154, 0.4);
          overflow: hidden;
        }
        .envelope-flap {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 52%;
          background: linear-gradient(180deg, #8a1e32 0%, #601120 100%);
          clip-path: polygon(0 0, 100% 0, 50% 100%);
          transform-origin: top center;
          transition: transform 1.1s cubic-bezier(0.4, 0, 0.2, 1);
          border-top: 1.5px solid rgba(244, 221, 154, 0.5);
          z-index: 8;
        }
        .envelope-flap.open {
          transform: rotateX(-175deg);
        }

        /* Wax Seal */
        .wax-seal {
          position: absolute;
          top: 48%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #e6a832, #b87814 60%, #6d4107);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff8dc;
          font-size: 1.8rem;
          font-weight: bold;
          cursor: pointer;
          z-index: 15;
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 215, 0, 0.4);
        }
        .wax-seal:hover {
          transform: translate(-50%, -50%) scale(1.08);
          box-shadow: 0 0 20px rgba(244, 221, 154, 0.8);
        }
        .wax-seal.cracked {
          animation: sealCrack 0.5s forwards;
        }
        @keyframes sealCrack {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15) rotate(10deg); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(0); opacity: 0; pointer-events: none; }
        }

        /* Inside Rising Letter */
        .inside-letter {
          position: absolute;
          inset: 12px;
          background: var(--parchment);
          color: var(--maroon);
          border-radius: 4px;
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 0.85rem;
          font-weight: 600;
          transform: translateY(0);
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.8s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 4;
        }
        .inside-letter.rise {
          transform: translateY(-45px);
        }

        /* Slide 2: Darshan */
        .ganpati-slide {
          background: radial-gradient(circle at 50% 45%, #46141b 0%, var(--maroon-black) 75%);
        }
        .darshan-idol-wrap {
          position: relative;
          width: min(280px, 72vw);
          height: min(280px, 72vw);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .darshan-aura {
          position: absolute;
          width: 130%;
          height: 130%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(244, 221, 154, 0.35) 0%, rgba(226, 136, 63, 0.15) 50%, transparent 70%);
          animation: auraPulse 3.5s ease-in-out infinite;
        }
        @keyframes auraPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        .darshan-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
          border: 3px solid var(--gold);
          box-shadow: 0 0 35px rgba(244, 221, 154, 0.6);
          position: relative;
          z-index: 2;
        }

        /* Diya Flame */
        .diya-flame-box {
          position: relative;
          width: 14px;
          height: 28px;
          margin: 12px auto 0;
        }
        .flame-particle {
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
          background: radial-gradient(circle at 50% 70%, #fff2b8, #f5b942 55%, #e2883f 90%);
          animation: flameFlicker 1.4s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 10px #f5b942);
        }
        @keyframes flameFlicker {
          0% { transform: scaleY(1) rotate(-2deg); }
          100% { transform: scaleY(1.15) rotate(3deg); }
        }

        /* Falling Flower Petals */
        .flower-petal {
          position: absolute;
          top: -20px;
          width: 12px;
          height: 16px;
          background: linear-gradient(135deg, #f5a623, #d0021b);
          border-radius: 0 60% 0 60%;
          opacity: 0.75;
          pointer-events: none;
          animation: petalFall linear infinite;
        }
        @keyframes petalFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0.1; }
        }

        /* Slide 3: Receipt Card */
        .receipt-slide {
          background: linear-gradient(160deg, #2b110b 0%, #170704 100%);
        }
        .authentic-card {
          width: min(440px, 92vw);
          max-height: 86vh;
          overflow-y: auto;
          background: var(--parchment);
          color: var(--ink);
          border-radius: 8px;
          padding: 24px 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.65);
          border: 2px solid var(--gold);
          position: relative;
        }
        .card-inner-frame {
          border: 1px solid rgba(150, 110, 40, 0.4);
          padding: 16px;
          border-radius: 4px;
          position: relative;
        }

        /* Slide 4: Blessing */
        .blessing-slide {
          background: radial-gradient(circle at 50% 45%, #3d1310 0%, #150304 75%);
        }
        .divine-rays {
          position: absolute;
          width: 140vmax;
          height: 140vmax;
          background: repeating-conic-gradient(from 0deg, rgba(244, 221, 154, 0.04) 0deg 6deg, transparent 6deg 14deg);
          animation: raysSpin 80s linear infinite;
          pointer-events: none;
        }
        @keyframes raysSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Down Cue Indicator */
        .down-cue-box {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--gold-light);
          opacity: 0.8;
          cursor: pointer;
          animation: bobArrow 2s ease-in-out infinite;
          z-index: 20;
        }
        @keyframes bobArrow {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>

      {/* Top Floating Controls */}
      <div className="top-action-bar">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="top-action-btn"
            title={isSoundMuted ? "ध्वनी चालू करा (Unmute)" : "ध्वनी बंद करा (Mute)"}
          >
            {isSoundMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="animate-pulse text-amber-300" />}
            <span>{isSoundMuted ? "म्यूट" : "ध्वनी"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchToStandard && (
            <button
              type="button"
              onClick={onSwitchToStandard}
              className="top-action-btn"
            >
              <span>सामान्य पावती (Standard View)</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Navigation Dots */}
      <div className="nav-dots">
        {[0, 1, 2, 3].map((idx) => (
          <button
            key={idx}
            type="button"
            className={`nav-dot ${currentSlide === idx ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Main Slides Container */}
      <div ref={appContainerRef} className={`app-shell ${!isEnvelopeOpen ? 'locked' : ''}`}>
        
        {/* ========================================================================= */}
        {/* SLIDE 1: ROYAL ENVELOPE (शाही पाकीट) */}
        {/* ========================================================================= */}
        <section ref={(el) => { slidesRef.current[0] = el; }} className="pavti-slide envelope-slide">
          <div className="frame-corner fc-tl" />
          <div className="frame-corner fc-tr" />
          <div className="frame-corner fc-bl" />
          <div className="frame-corner fc-br" />

          {/* Title Header */}
          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 text-center z-10 w-[90%] max-w-md">
            <p className="text-[0.72rem] tracking-widest text-amber-300/90 font-medium uppercase">
              {org.nameMarathi || org.name || "श्री गणेश मंडळ"}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-amber-100 mt-1 drop-shadow-md">
              एक पवित्र पावती तुमची वाट पाहत आहे
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto mt-3 opacity-80" />
          </div>

          {/* 3D Envelope Component */}
          <div className="envelope-wrap">
            <div className="envelope-box">
              <div className="envelope-body">
                {/* Inside Letter that rises */}
                <div className={`inside-letter ${isEnvelopeOpen ? 'rise' : ''}`}>
                  <p className="font-bold text-sm tracking-wide text-[#5c1220]">
                    || श्री गणेशाय नमः ||
                  </p>
                  <p className="text-xs text-amber-900 mt-1 font-medium">
                    {receipt.donorName} जी, आपले सहकार्य प्राप्त झाले आहे
                  </p>
                </div>
              </div>

              {/* Envelope Flap */}
              <div className={`envelope-flap ${isEnvelopeOpen ? 'open' : ''}`} />

              {/* Wax Seal */}
              <div
                className={`wax-seal ${isEnvelopeOpen ? 'cracked' : ''}`}
                onClick={handleOpenEnvelope}
                role="button"
                tabIndex={0}
                title="पावती उघडण्यासाठी येथे स्पर्श करा"
              >
                <span>ॐ</span>
              </div>
            </div>
          </div>

          {/* Hint to Open */}
          {!isEnvelopeOpen ? (
            <div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-amber-200/90 text-xs flex flex-col items-center gap-1.5 cursor-pointer animate-bounce z-20"
              onClick={handleOpenEnvelope}
            >
              <span>उघडण्यासाठी मुद्रेला (ॐ) स्पर्श करा</span>
              <Sparkles size={16} className="text-amber-300" />
            </div>
          ) : (
            <div className="down-cue-box" onClick={() => goToSlide(1)}>
              <span className="text-[0.65rem] tracking-widest uppercase">दर्शन</span>
              <ArrowDown size={14} />
            </div>
          )}
        </section>


        {/* ========================================================================= */}
        {/* SLIDE 2: DIVINE GANPATI DARSHAN (श्री गणेश दर्शन) */}
        {/* ========================================================================= */}
        <section ref={(el) => { slidesRef.current[1] = el; }} className="pavti-slide ganpati-slide">
          <div className="frame-corner fc-tl" />
          <div className="frame-corner fc-tr" />
          <div className="frame-corner fc-bl" />
          <div className="frame-corner fc-br" />

          {/* Decorative Falling Petals */}
          {[10, 25, 45, 65, 80, 92].map((leftPct, i) => (
            <div
              key={i}
              className="flower-petal"
              style={{
                left: `${leftPct}%`,
                animationDuration: `${5 + (i % 4)}s`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}

          <div className="flex flex-col items-center text-center z-10 px-4 max-w-sm">
            {/* Sacred Tagline */}
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-amber-300/90 uppercase mb-4">
              {settings.headerTagline || "|| श्री गणेशाय नमः ||"}
            </p>

            {/* Ganesha Darshan Idol Artwork */}
            <div className="darshan-idol-wrap my-2">
              <div className="darshan-aura" />
              <img
                src={customDarshan || "https://images.unsplash.com/photo-1567591370504-8b6540c4a4e1?w=600&auto=format&fit=crop&q=80"}
                alt="Shree Ganesh Darshan"
                className="darshan-img"
              />
            </div>

            {/* Flickering Diya Flame */}
            <div className="diya-flame-box">
              <div className="flame-particle" />
            </div>

            {/* Devotional Chanting Subtitle */}
            <h2 className="text-xl sm:text-2xl font-bold text-amber-100 mt-4 tracking-wide drop-shadow-md font-serif">
              गणपती बाप्पा मोरया
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 italic mt-1">
              मंगलमूर्ती मोरया
            </p>
          </div>

          {/* Scroll cue to Slide 3 */}
          <div className="down-cue-box" onClick={() => goToSlide(2)}>
            <span className="text-[0.65rem] tracking-widest uppercase">पावती पहा</span>
            <ArrowDown size={14} />
          </div>
        </section>


        {/* ========================================================================= */}
        {/* SLIDE 3: AUTHENTIC DIGITAL PAVTI (अधिकृत डिजिटल पावती) */}
        {/* ========================================================================= */}
        <section ref={(el) => { slidesRef.current[2] = el; }} className="pavti-slide receipt-slide">
          <div className="authentic-card">
            <div className="card-inner-frame">
              
              {/* Mandal Header */}
              <div className="text-center pb-3 border-b-2 border-amber-700/40 mb-3">
                {org.logoUrl && (
                  <img
                    src={org.logoUrl}
                    alt="Mandal Logo"
                    className="w-12 h-12 object-contain mx-auto mb-1.5 rounded-full border border-amber-600/30"
                  />
                )}
                {settings.headerTagline && (
                  <p className="text-xs font-bold text-amber-900 tracking-wider">
                    {settings.headerTagline}
                  </p>
                )}
                <h2 className="text-base sm:text-lg font-bold text-[#5c1220] leading-tight mt-0.5">
                  {org.name || "श्री गणेश मंडळ, पुणे"}
                </h2>
                {org.nameMarathi && (
                  <p className="text-xs text-amber-900/70 font-devanagari mt-0.5">{org.nameMarathi}</p>
                )}
              </div>

              {/* Receipt Title & Meta */}
              <div className="flex justify-between items-center text-xs pb-2 border-b border-amber-600/20 text-amber-950 font-medium">
                <div>
                  <span className="text-amber-800 text-[0.65rem] block">
                    {isInternal ? l.internalReceipt : (settings.receiptTitle || l.receipt)} {l.no}
                  </span>
                  <span className="font-bold font-mono text-[#5c1220]">{receipt.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-800 text-[0.65rem] block">Date</span>
                  <span className="font-semibold">{formattedDate}</span>
                </div>
              </div>

              {/* Donor Details — same field set as the single-page pavti: name,
                  address (if any), category/mode/status, collector's area (if
                  any), notes (if any). Mobile number was dropped (the basic
                  pavti never showed it) and the mislabeled "देणगी प्रकार" row
                  is now a correctly-labeled category/mode/status trio. */}
              <div className="py-2.5 space-y-1.5 text-xs text-amber-950">
                <div>
                  <span className="text-amber-800/80 text-[0.65rem] block">{l.donor}</span>
                  <p className="font-bold text-sm text-[#2b160c]">
                    {settings.donorPrefix ? `${settings.donorPrefix} ` : ''}{receipt.donorName}
                  </p>
                </div>

                {receipt.donorAddress && (
                  <div>
                    <span className="text-amber-800/80 text-[0.65rem] block">{l.address}</span>
                    <span className="font-semibold">{receipt.donorAddress}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-amber-800/80 text-[0.65rem] block">{l.category}</span>
                    <span className="font-semibold">{receipt.category}</span>
                  </div>
                  <div>
                    <span className="text-amber-800/80 text-[0.65rem] block">{l.mode}</span>
                    <span className="font-semibold">{receipt.paymentMode}</span>
                  </div>
                  <div>
                    <span className="text-amber-800/80 text-[0.65rem] block">Status</span>
                    <span className={`font-semibold ${isUnpaid ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {isUnpaid ? l.unpaid : l.paid}
                    </span>
                  </div>
                </div>

                {campaign.name && (
                  <div className="pt-1">
                    <span className="text-amber-800/80 text-[0.65rem] block">उत्सव / मोहीम:</span>
                    <span className="font-semibold text-amber-900">{campaign.name}</span>
                  </div>
                )}

                {donorArea?.name && (
                  <div className="pt-1">
                    <span className="text-amber-800/80 text-[0.65rem] block">{l.area}</span>
                    <span className="font-semibold">{donorArea.name}</span>
                  </div>
                )}

                {receipt.notes && (
                  <div className="pt-1">
                    <span className="text-amber-800/80 text-[0.65rem] block">{l.notes}</span>
                    <span className="font-semibold italic">{receipt.notes}</span>
                  </div>
                )}
              </div>

              {/* Highlighted Amount Box */}
              <div className="my-2.5 p-2.5 bg-amber-500/10 border border-dashed border-amber-700/50 rounded text-center">
                <span className="text-[0.65rem] text-amber-900 font-bold uppercase tracking-wider block">
                  प्राप्त देणगी रक्कम / Amount Received
                </span>
                <p className="text-2xl font-extrabold text-[#5c1220] font-serif tracking-tight mt-0.5">
                  ₹ {receipt.amount.toLocaleString('en-IN')}
                </p>
                <p className="text-[0.72rem] text-amber-950 font-medium italic mt-0.5">
                  अक्षरी: {amountInWords}
                </p>
              </div>

              {/* Signatures & Dynamic Mandal Stamp */}
              <div className="flex justify-between items-end pt-2 mt-2">
                <div className="text-center w-28">
                  <div className="border-t border-amber-950/40 pt-1">
                    <span className="text-[0.62rem] text-amber-900 block font-medium">संग्राहक / Collector</span>
                    <span className="text-[0.65rem] font-semibold text-[#5c1220] truncate block">
                      {receipt.collector?.name || "कार्यकर्ता"}
                    </span>
                  </div>
                </div>

                <div className="text-center w-28">
                  <div className="border-t border-amber-950/40 pt-1">
                    <span className="text-[0.62rem] text-amber-900 block font-medium">खजिनदार / अध्यक्ष</span>
                    <span className="text-[0.65rem] font-semibold text-[#5c1220] block">अधिकृत स्वाक्षरी</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-center text-[0.65rem] text-amber-900/80 italic mt-3 pt-2 border-t border-amber-600/20">
                {settings.footerNote || "आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! 🙏"}
              </p>

              {/* Action Buttons inside Receipt */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-amber-700/20">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-1.5 px-3 bg-[#5c1220] text-amber-100 rounded text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#7c1a2c] transition-colors"
                >
                  <Download size={13} />
                  <span>प्रिंट / सेव्ह</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-1.5 px-3 bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-colors"
                >
                  <Share2 size={13} />
                  <span>व्हॉट्सअॅप</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scroll cue to Slide 4 */}
          <div className="down-cue-box" onClick={() => goToSlide(3)}>
            <span className="text-[0.65rem] tracking-widest uppercase">आशीर्वाद</span>
            <ArrowDown size={14} />
          </div>
        </section>


        {/* ========================================================================= */}
        {/* SLIDE 4: DIVINE ASHIRWAD & SOCIAL SHARE (आशीर्वाद व शुभेच्छा) */}
        {/* ========================================================================= */}
        <section ref={(el) => { slidesRef.current[3] = el; }} className="pavti-slide blessing-slide">
          <div className="divine-rays" />
          <div className="frame-corner fc-tl" />
          <div className="frame-corner fc-tr" />
          <div className="frame-corner fc-bl" />
          <div className="frame-corner fc-br" />

          <div className="flex flex-col items-center text-center z-10 px-6 max-w-md">
            {/* Divine Ashirwad Icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 border-2 border-amber-200">
              <span className="text-3xl">🙏</span>
            </div>

            <p className="text-xs font-bold text-amber-300 tracking-widest uppercase">
              श्रींचे शुभाशीर्वाद
            </p>

            {/* Personalized Blessing Quote */}
            <h3 className="text-lg sm:text-xl font-semibold text-amber-100 mt-2 font-serif leading-relaxed">
              "{settings.blessingMessage || "गणपती बाप्पा आपल्या सर्व मनोकामना पूर्ण करोत आणि आपल्या घरात सुख, समृद्धी आणि आरोग्य लाभो!"}"
            </h3>

            <div className="w-12 h-0.5 bg-amber-400/50 mx-auto my-3" />

            <p className="text-xs text-amber-200/80">
              - {org.nameMarathi || org.name}
            </p>

            {/* Big WhatsApp Share CTA Button */}
            <div className="mt-8 w-full space-y-3">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Share2 size={16} />
                <span>ही पावती व्हॉट्सअॅपवर शेअर करा</span>
              </button>

              <button
                type="button"
                onClick={() => goToSlide(2)}
                className="text-xs text-amber-300/80 hover:text-amber-200 underline pt-2 block mx-auto"
              >
                पुन्हा पावती पहा (View Receipt Again)
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
