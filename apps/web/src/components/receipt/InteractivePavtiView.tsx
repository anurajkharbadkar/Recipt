'use client';

import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import gsap from 'gsap';
import {
  Receipt,
  ReceiptTemplateSettings,
  resolveReceiptSettings,
  formatAmountInWords,
  formatShareMessage,
  RECEIPT_FIELD_LABELS
} from '@pavti/shared';
import { playSealCrackSound, playTempleBell, playAshirwadChimes } from '@/lib/templeAudio';
import { buildUpiPaymentLink } from '@/lib/upi';
import { donationPaymentApi } from '@/lib/api';
import { launchCashfreeCheckout } from '@/lib/cashfreeCheckout';
import { QRCodeSVG } from 'qrcode.react';
import { shareReceiptViaWhatsApp, shareReceiptGeneric } from '@/lib/whatsappShare';
import { Volume2, VolumeX, Download, Share2, ArrowDown, Sparkles } from 'lucide-react';
// Real static files under public/, not base64 embedded in JS — these were
// briefly wired up as ~140KB + ~34KB base64 string constants imported from
// their own modules, which ships that whole weight in the JS bundle for
// every visitor regardless of whether they ever open a receipt. Extracted
// to actual image files instead, same as every other brand asset.
const ENV_TEXTURE_URL = '/brand/pavti/envelope-texture.jpg';
const GANPATI_IMAGE_URL = 'https://pub-b087a5790d1e4f0f9943ea8e70d1f4ae.r2.dev/defaults/ganpati_portrait.jpg';
const ASHIRVAAD_IMAGE_URL = 'https://pub-b087a5790d1e4f0f9943ea8e70d1f4ae.r2.dev/defaults/bappa_ashirvaad.jpg';

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

// Small deterministic PRNG (not Math.random) so the ambient spark/smoke
// layout is stable across re-renders of the same component instance
// instead of jumping every time React re-renders for an unrelated reason
// (e.g. the sound-mute toggle). Seeded per spark index, not per render.
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
}

/**
 * Bursts a shower of colored "petal" divs outward from a screen point and
 * lets them fall away, then removes themselves. Pure DOM/GSAP — the host
 * element must be an otherwise-empty ref div that React never renders
 * children into, so these manually-appended/removed nodes never collide
 * with React's own reconciliation of that subtree.
 */
function burstPetals(
  layer: HTMLElement,
  originX: number,
  originY: number,
  opts: { count: number; colors: string[]; angleMin: number; angleMax: number; minDist: number; maxDist: number }
) {
  const { count, colors, angleMin, angleMax, minDist, maxDist } = opts;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'burst-petal';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = `${originX}px`;
    p.style.top = `${originY}px`;
    layer.appendChild(p);

    const deg = angleMin + Math.random() * (angleMax - angleMin);
    const rad = (deg * Math.PI) / 180;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const burstX = Math.cos(rad) * dist;
    const burstY = Math.sin(rad) * dist;
    const rot = Math.random() * 480 - 240;
    const scale = 0.55 + Math.random() * 0.7;
    const dur = 1.5 + Math.random() * 1.1;

    gsap
      .timeline({ onComplete: () => p.remove() })
      .fromTo(
        p,
        { scale: 0.1, opacity: 1, x: 0, y: 0, rotate: 0 },
        { x: burstX, y: burstY, scale, rotate: rot, duration: dur * 0.4, ease: 'power4.out' }
      )
      .to(p, {
        y: burstY + 160 + Math.random() * 120,
        x: burstX + (Math.random() * 70 - 35),
        opacity: 0,
        rotate: rot + 160,
        duration: dur * 0.6,
        ease: 'sine.inOut',
      });
  }
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
  const revealedRef = useRef<Set<number>>(new Set());
  const activeTimelinesRef = useRef<gsap.core.Timeline[]>([]);

  // Envelope slide refs (slide 0)
  const sealRef = useRef<HTMLDivElement>(null);
  const sealLeftRef = useRef<HTMLDivElement>(null);
  const sealRightRef = useRef<HTMLDivElement>(null);
  const glowBurstRef = useRef<HTMLDivElement>(null);
  const glowBurstOuterRef = useRef<HTMLDivElement>(null);
  const envFlapRef = useRef<HTMLDivElement>(null);
  const insideGlowRef = useRef<HTMLDivElement>(null);
  const insideLetterRef = useRef<HTMLDivElement>(null);

  // Ganpati/darshan slide refs (slide 1)
  const darshanWrapRef = useRef<HTMLDivElement>(null);
  const chakraRef = useRef<HTMLDivElement>(null);
  const diyaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ganpatiPetalLayerRef = useRef<HTMLDivElement>(null);

  // Receipt slide refs (slide 2)
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const receiptPetalLayerRef = useRef<HTMLDivElement>(null);

  // Blessing slide refs (slide 3)
  const blessHandRef = useRef<HTMLDivElement>(null);
  const blessDividerRef = useRef<HTMLDivElement>(null);
  const blessMsgRef = useRef<HTMLParagraphElement>(null);
  const blessClosingRef = useRef<HTMLDivElement>(null);
  const blessSubRef = useRef<HTMLParagraphElement>(null);
  const blessBtnRef = useRef<HTMLButtonElement>(null);

  // Unique ids for this instance's SVG <defs>/<use> — two of these could in
  // theory render on the same page at once (e.g. a settings-page preview
  // next to a real receipt), and duplicate SVG element ids silently break
  // <use href="#..."> resolution in that case.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

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

  // Ambient floating sparks on the envelope slide — stable per mount, not
  // re-randomized on every render (see seededRandom above).
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: 6 + seededRandom(i * 3 + 1) * 88,
        top: 18 + seededRandom(i * 7 + 2) * 62,
        dur: 4 + seededRandom(i * 5 + 3) * 4,
        delay: seededRandom(i * 11 + 4) * 5,
      })),
    []
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

  // Open Envelope Trigger — a real GSAP timeline (seal crack → halves fly
  // apart → golden light burst → flap unfolds in 3D → letter rises) rather
  // than a single CSS class toggle, matching the reference design's
  // sequenced reveal instead of one flat fade.
  const handleOpenEnvelope = () => {
    if (isEnvelopeOpen) return;
    setIsEnvelopeOpen(true);

    if (!isSoundMuted) {
      playSealCrackSound();
    }

    const tl = gsap.timeline();
    activeTimelinesRef.current.push(tl);

    tl.to(sealRef.current, { scale: 1.08, duration: 0.14, ease: 'power1.out' }, 0)
      .to(sealRef.current, { scale: 0, opacity: 0, duration: 0.32, ease: 'back.in(2.4)' }, 0.14)
      .set([sealLeftRef.current, sealRightRef.current], { opacity: 1 }, 0.16)
      .to(sealLeftRef.current, { x: -30, y: -16, rotate: -55, opacity: 0, duration: 0.75, ease: 'power2.in' }, 0.2)
      .to(sealRightRef.current, { x: 30, y: -16, rotate: 55, opacity: 0, duration: 0.75, ease: 'power2.in' }, 0.2)
      .to(glowBurstOuterRef.current, { scale: 12, opacity: 0.55, duration: 0.75, ease: 'power1.out' }, 0.3)
      .to(glowBurstRef.current, { scale: 9, opacity: 0.95, duration: 0.6, ease: 'power1.out' }, 0.32)
      .to(glowBurstRef.current, { opacity: 0, duration: 0.6 }, 0.8)
      .to(glowBurstOuterRef.current, { opacity: 0, duration: 0.7 }, 0.85)
      .to(envFlapRef.current, {
        rotateX: -180,
        duration: 1.15,
        ease: 'power2.inOut',
        transformPerspective: 1000,
        onUpdate: function() {
          if (this.progress() > 0.4 && envFlapRef.current) {
            envFlapRef.current.style.zIndex = '0';
          }
        }
      }, 0.5)
      .to(insideGlowRef.current, { opacity: 0.85, duration: 0.5, ease: 'power1.out' }, 0.95)
      .to(insideGlowRef.current, { opacity: 0, duration: 0.65, ease: 'power1.in' }, 1.55)
      // yPercent, not a fixed px y — see .inside-letter's own comment. -68%
      // of the letter's own height clears envelope-pocket's slanted edge
      // and settles the letter just above the whole card, regardless of
      // how big the envelope itself actually rendered.
      .to(insideLetterRef.current, { opacity: 1, yPercent: -68, scale: 1.03, zIndex: 10, duration: 0.85, ease: 'elastic.out(1,0.65)' }, 1.2)
      .call(() => goToSlide(1), undefined, 2.3);
  };

  // Ganpati/darshan slide: chakra + diyas fade-in, temple bell, and a
  // one-shot flower shower (pushpa vrishti) — fires once, the first time
  // the slide is actually reached, not on every scroll back to it.
  const revealGanpatiSlide = () => {
    if (revealedRef.current.has(1)) return;
    revealedRef.current.add(1);

    // Softened from the first pass — gentler starting offsets, no springy
    // overshoot on the diyas, and more overlap between the three so nothing
    // arrives as a separate hard "beat"; the flower burst is delayed a beat
    // and thinned out so it drifts in after the darshan settles instead of
    // detonating at the same instant.
    const tl = gsap.timeline();
    activeTimelinesRef.current.push(tl);
    tl.fromTo(darshanWrapRef.current, { opacity: 0, y: 24, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: 'power2.out' })
      .fromTo(chakraRef.current, { opacity: 0, scale: 0.75 }, { opacity: 0.85, scale: 1, duration: 1.9, ease: 'power2.out' }, '-=1.4')
      .fromTo(
        diyaRefs.current.filter(Boolean),
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 1.3, stagger: 0.25, ease: 'power2.out' },
        '-=1.3'
      );

    if (!isSoundMuted) playTempleBell();

    const layer = ganpatiPetalLayerRef.current;
    const slideEl = slidesRef.current[1];
    if (layer && slideEl) {
      const rect = slideEl.getBoundingClientRect();
      window.setTimeout(() => {
        burstPetals(layer, rect.width / 2, rect.height * 0.4, {
          count: 20,
          colors: ['#ff9f43', '#ee5253', '#fabca1', '#e2883f', '#f5b942', '#ffffff'],
          angleMin: 0,
          angleMax: 360,
          minDist: 50,
          maxDist: 220,
        });
      }, 450);
    }
  };

  // Receipt slide: card settles in, the mandal stamp seats with a bounce,
  // then a flower blast fires from the card's two top corners.
  const revealReceiptSlide = () => {
    if (revealedRef.current.has(2)) return;
    revealedRef.current.add(2);

    const layer = receiptPetalLayerRef.current;
    const card = receiptCardRef.current;
    const slideEl = slidesRef.current[2];
    if (layer && card && slideEl) {
      const cardRect = card.getBoundingClientRect();
      const slideRect = slideEl.getBoundingClientRect();
      const leftX = cardRect.left - slideRect.left + 16;
      const rightX = cardRect.right - slideRect.left - 16;
      const topY = cardRect.top - slideRect.top + 16;
      const colors = ['#e2883f', '#ff7700', '#e91e63', '#ffc107', '#ffffff', '#f48fb1'];
      window.setTimeout(() => {
        burstPetals(layer, leftX, topY, { count: 18, colors, angleMin: -85, angleMax: 20, minDist: 90, maxDist: 220 });
        burstPetals(layer, rightX, topY, { count: 18, colors, angleMin: -200, angleMax: -95, minDist: 90, maxDist: 220 });
      }, 250);
    }
  };

  // Blessing slide: staged reveal of the ashirwad icon, divider, message
  // and closing chant, ending on the share CTA — plus the existing temple
  // chime that already played here.
  const revealBlessingSlide = () => {
    if (!revealedRef.current.has(3)) {
      revealedRef.current.add(3);
      const tl = gsap.timeline({ delay: 0.15 });
      activeTimelinesRef.current.push(tl);
      tl.fromTo(blessHandRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' })
        .fromTo(blessDividerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(blessMsgRef.current, { opacity: 0 }, { opacity: 1, duration: 0.9 }, '-=0.2')
        .fromTo(blessClosingRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3')
        .fromTo(blessSubRef.current, { opacity: 0 }, { opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(blessBtnRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
    }
    if (!isSoundMuted) playAshirwadChimes();
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
        if (activeIdx === 1) revealGanpatiSlide();
        if (activeIdx === 2) revealReceiptSlide();
        if (activeIdx === 3) revealBlessingSlide();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, isSoundMuted]);

  // Cashfree Production Online Payment Order State
  const [cashfreeOrder, setCashfreeOrder] = useState<{
    paymentSessionId?: string;
    qr: string | null;
    intent: { default?: string; gpay?: string; phonepe?: string; paytm?: string; bhim?: string; web?: string } | null;
  } | null>(null);
  const [cashfreeLoading, setCashfreeLoading] = useState(false);
  const [showDirectUpi, setShowDirectUpi] = useState(false);

  useEffect(() => {
    if (isUnpaid && org.paymentEnabled) {
      setCashfreeLoading(true);
      donationPaymentApi
        .createOrder(receipt.id)
        .then((res) => {
          setCashfreeOrder(res);
        })
        .catch((err) => {
          console.warn('Cashfree online donation order creation skipped/unavailable:', err);
        })
        .finally(() => {
          setCashfreeLoading(false);
        });
    }
  }, [isUnpaid, org.paymentEnabled, receipt.id]);

  // Kill any in-flight timelines on unmount (e.g. navigating away from the
  // receipt page mid-animation) rather than letting them tick against
  // detached refs.
  useEffect(() => {
    return () => {
      activeTimelinesRef.current.forEach((tl) => tl.kill());
    };
  }, []);

  // WhatsApp Share Handler (Direct to Donor's WhatsApp Number)
  const handleShareWhatsApp = () => {
    shareReceiptViaWhatsApp({
      donorPhone: receipt.donorPhone || '',
      donorName: receipt.donorName,
      amount: receipt.amount,
      receiptNumber: receipt.receiptNumber,
      receiptId: receipt.id,
      category: receipt.category,
      createdAt: receipt.createdAt,
      status: receipt.status,
      organization: org as any,
      language,
    });
  };

  // Generic OS Share Handler (Triggers Native Share Picker for other apps)
  const handleShareGeneric = () => {
    shareReceiptGeneric({
      donorPhone: receipt.donorPhone || '',
      donorName: receipt.donorName,
      amount: receipt.amount,
      receiptNumber: receipt.receiptNumber,
      receiptId: receipt.id,
      category: receipt.category,
      createdAt: receipt.createdAt,
      status: receipt.status,
      organization: org as any,
      language,
    });
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
          --font-display: var(--font-cormorant), 'Cormorant Garamond', serif;
          --font-devotional: var(--font-yatra), serif;
          --font-eyebrow: var(--font-tiro), var(--font-cormorant), serif;
          --env-texture: url('${ENV_TEXTURE_URL}');
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
          /* Every fluid size below this point (envelope, chakra, darshan
             frame, receipt card, etc.) is expressed in cq* units, not vw/vh
             — those measure the real browser viewport, which is correct on
             the real full-page receipt view but badly wrong for the
             landing-page's embedded phone-frame demo, where this slide is a
             ~340×580 box inside a much wider desktop page: vw-sized
             elements were rendering at their full viewport-relative size
             and overflowing straight out of that small frame. container-type
             makes this slide itself the sizing reference instead, which is
             correct in both places since it already gets its own explicit
             100vw/100vh (real) or 100%/100% (.embedded) size either way. */
          container-type: size;
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

        /* ============ Slide 1: Royal Envelope ============ */
        .envelope-slide {
          background: radial-gradient(ellipse at 50% 30%, rgba(216, 168, 80, 0.14), transparent 55%),
                      repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0 2px, transparent 2px 7px),
                      linear-gradient(160deg, var(--maroon) 0%, var(--maroon-deep) 60%, #150304 100%);
        }
        .envelope-slide::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.5) 100%);
        }

        /* Drifting incense-smoke wisps behind the envelope */
        .smoke-wisp {
          position: absolute;
          z-index: 1;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(34px);
          opacity: 0.16;
        }
        .smoke-a { width: 300px; height: 380px; left: 6%; top: 10%; background: radial-gradient(ellipse, rgba(230, 190, 120, 0.5), transparent 70%); animation: smokeDriftA 16s ease-in-out infinite; }
        .smoke-b { width: 270px; height: 340px; right: 5%; bottom: 5%; background: radial-gradient(ellipse, rgba(200, 140, 90, 0.45), transparent 70%); animation: smokeDriftB 19s ease-in-out infinite; }
        @keyframes smokeDriftA { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(26px, -20px) scale(1.08); } }
        @keyframes smokeDriftB { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-22px, 18px) scale(1.06); } }

        /* Floating golden sparks */
        .ambient-spark {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--gold-light);
          box-shadow: 0 0 6px 1px rgba(244, 221, 154, 0.8);
          z-index: 2;
          pointer-events: none;
          animation: sparkTwinkle var(--dur) ease-in-out var(--delay) infinite;
        }
        @keyframes sparkTwinkle {
          0%, 100% { opacity: 0; transform: translateY(0); }
          50% { opacity: 0.9; transform: translateY(-30px); }
        }

        .envelope-stage-wrap {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .envelope-back-glow {
          position: absolute;
          width: min(440px, 100cqw);
          height: min(440px, 100cqw);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(244, 221, 154, 0.26), rgba(244, 221, 154, 0.05) 45%, transparent 72%);
          animation: backGlowPulse 4.2s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }
        @keyframes backGlowPulse { 0%, 100% { transform: scale(1); opacity: 0.75; } 50% { transform: scale(1.1); opacity: 1; } }

        .envelope-wrap {
          perspective: 1900px;
          width: min(500px, 92cqw);
          height: min(253px, 46cqw);
          position: relative;
          z-index: 5;
        }
        .envelope-box {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          filter: drop-shadow(0 26px 40px rgba(8, 2, 2, 0.6));
        }
        /* Back panel — exact luxury gold-embossed paper texture from reference marathi-3 */
        .envelope-back {
          position: absolute;
          inset: 0;
          border-radius: 7px;
          z-index: 1;
          background:
            linear-gradient(155deg, rgba(92, 18, 32, .06), rgba(0, 0, 0, .1) 60%, rgba(0, 0, 0, .18) 100%),
            var(--env-texture) 0 0 / 100% 100% no-repeat;
          border: 1.5px solid transparent;
          background-clip: padding-box;
          box-shadow: 0 0 0 1.5px rgba(201, 162, 74, .9), inset 0 0 0 1px rgba(120, 80, 20, .35);
        }
        .envelope-back::before {
          content: '';
          position: absolute;
          inset: 9px;
          border: 1px solid rgba(120, 80, 20, .5);
          border-radius: 3px;
        }
        .envelope-back::after {
          content: '';
          position: absolute;
          inset: 9px;
          border-radius: 3px;
          pointer-events: none;
          background-image: radial-gradient(circle at 4px 4px, rgba(150, 105, 35, .4) 1.1px, transparent 1.6px);
          background-size: 100% 16px, 16px 100%;
          background-position: top left, top left;
          background-repeat: repeat-x, repeat-y;
          opacity: 0.25;
        }

        .inside-glow {
          position: absolute;
          inset: 6% 8% 0 8%;
          top: 2%;
          height: 58%;
          z-index: 2;
          border-radius: 4px;
          background: radial-gradient(ellipse at 50% 0%, rgba(255, 224, 150, 0.9), rgba(255, 190, 90, 0.25) 55%, transparent 80%);
          opacity: 0;
          pointer-events: none;
        }

        /* Front pocket — V-notched fold with texture aligned seamlessly to back layer to prevent mid-tear appearance */
        .envelope-pocket {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 62%;
          z-index: 3;
          clip-path: polygon(0 100%, 100% 100%, 100% 4%, 50% 16%, 0 4%);
          background:
            linear-gradient(200deg, rgba(255, 240, 210, 0.08), rgba(0, 0, 0, 0.12) 100%),
            var(--env-texture) 0 100% / 100% calc(100% / 0.62) no-repeat;
          border-radius: 0 0 7px 7px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .25);
        }

        /* Rising letter inside envelope */
        .inside-letter {
          position: absolute;
          left: 8%;
          right: 8%;
          top: 34%;
          height: 40%;
          z-index: 2;
          background: linear-gradient(170deg, var(--parchment), var(--parchment-dark));
          border-radius: 4px;
          box-shadow: 0 -4px 18px rgba(0,0,0,0.2);
          opacity: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 8px 12px;
          border: 1px solid rgba(120, 80, 20, 0.3);
          overflow: hidden;
        }
        .inside-letter p:first-child {
          font-family: var(--font-devotional);
          font-size: 0.85rem;
          color: var(--maroon);
        }
        .inside-letter p:last-child {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 0.72rem;
          color: #5a4322;
          margin-top: 3px;
        }

        /* Envelope flap with polygon clip-path and flourish motifs */
        .envelope-flap {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 60%;
          z-index: 5;
          transform-origin: top center;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          clip-path: polygon(0 0, 100% 0, 50% 80%);
          background:
            linear-gradient(200deg, rgba(255, 255, 255, .08), rgba(0, 0, 0, .08) 60%, rgba(0, 0, 0, .14) 100%),
            var(--env-texture) 0 0 / 100% calc(100% / 0.60) no-repeat;
          border-radius: 7px 7px 0 0;
          box-shadow: inset 0 -8px 16px rgba(90, 55, 10, .2), 0 0 0 1.5px rgba(201, 162, 74, .7);
        }
        .envelope-flap::after {
          content: '';
          position: absolute;
          inset: 0;
          clip-path: inherit;
          pointer-events: none;
          background: repeating-linear-gradient(70deg, rgba(255, 255, 255, .05) 0 2px, transparent 2px 8px);
        }
        .envelope-flap .flourish { position: absolute; top: 14%; left: 50%; transform: translateX(-50%); width: 120px; opacity: 0.35; }
        .envelope-flap .corner-motif { position: absolute; width: 22px; height: 22px; opacity: 0.4; }
        .envelope-flap .cm-l { top: 8%; left: 10%; }
        .envelope-flap .cm-r { top: 8%; right: 10%; transform: scaleX(-1); }

        /* Seal & seal halfs */
        .wax-seal {
          position: absolute;
          top: 48%;
          left: 50%;
          width: 66px;
          height: 66px;
          margin: -33px 0 0 -33px;
          z-index: 9;
          border-radius: 50%;
          background: transparent;
          box-shadow: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-size: 1.55rem;
          font-family: var(--font-devotional);
          text-shadow: none;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        .wax-seal:hover { transform: scale(1.07); }

        .seal-ring {
          position: absolute;
          top: 48%;
          left: 50%;
          width: 66px;
          height: 66px;
          margin: -33px 0 0 -33px;
          z-index: 8;
          border-radius: 50%;
          border: 1.4px solid var(--gold-light);
          opacity: 0;
          pointer-events: none;
        }
        .wax-seal:not(.opened) ~ .seal-ring { animation: ringPulse 2.6s ease-out infinite; }
        .seal-ring.r2 { animation-delay: 1.3s; }
        @keyframes ringPulse { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.55); opacity: 0; } }

        .seal-half {
          position: absolute;
          top: 48%;
          width: 35px;
          height: 66px;
          margin-top: -33px;
          z-index: 10;
          background: transparent;
          box-shadow: none;
          opacity: 0;
          pointer-events: none;
        }
        .seal-half.left { left: calc(50% - 33px); border-radius: 33px 0 0 33px; }
        .seal-half.right { left: calc(50% - 2px); border-radius: 0 33px 33px 0; }

        .glow-burst, .glow-burst-outer {
          position: absolute;
          top: 48%;
          left: 50%;
          width: 20px;
          height: 20px;
          margin: -10px 0 0 -10px;
          border-radius: 50%;
          opacity: 0;
          pointer-events: none;
        }
        .glow-burst { background: radial-gradient(circle, rgba(255, 232, 180, 0.98), rgba(255, 195, 100, 0.4) 42%, transparent 72%); z-index: 7; }
        .glow-burst-outer { background: radial-gradient(circle, rgba(255, 210, 140, 0.55), transparent 70%); z-index: 6; }

        .open-hint {
          position: absolute;
          bottom: 10%;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          color: var(--gold-light);
          opacity: 0.9;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          z-index: 20;
          animation: bobArrow 2.4s ease-in-out infinite;
        }

        /* ============ Slide 2: Divine Ganpati Darshan ============ */
        .ganpati-slide {
          background: radial-gradient(circle at 50% 38%, rgba(226, 136, 63, 0.22), transparent 55%),
                      radial-gradient(circle at 50% 45%, #46141b 0%, var(--maroon-black) 75%);
        }

        /* Suryachakra — rotating golden ring behind the darshan portrait */
        .divine-chakra {
          position: absolute;
          top: 38%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(420px, 92cqw);
          height: min(420px, 92cqw);
          pointer-events: none;
          z-index: 1;
          filter: drop-shadow(0 0 20px rgba(244, 221, 154, 0.55));
        }
        .chakra-outer-ring { transform-origin: 250px 250px; animation: chakraSpinCW 32s linear infinite; }
        .chakra-inner-ring { transform-origin: 250px 250px; animation: chakraSpinCCW 24s linear infinite; }
        .chakra-hub { transform-origin: 250px 250px; animation: chakraPulseGlow 3.5s ease-in-out infinite alternate; }
        @keyframes chakraSpinCW { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes chakraSpinCCW { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .upload-hint {
          position: absolute;
          top: 3.8%;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 6;
          font-family: var(--font-eyebrow), serif;
          font-size: clamp(0.76rem, 2.1vw, 0.92rem);
          color: var(--gold-light);
          letter-spacing: 0.02em;
          opacity: 0.85;
          text-shadow: 0 0 10px rgba(244, 221, 154, 0.4);
          pointer-events: none;
        }

        .darshan-idol-wrap {
          position: relative;
          width: min(240px, 62cqw);
          height: min(240px, 62cqw);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
        }
        .darshan-aura {
          position: absolute;
          width: 130%;
          height: 130%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(244, 221, 154, 0.35) 0%, rgba(226, 136, 63, 0.15) 50%, transparent 70%);
          animation: auraPulse 3.5s ease-in-out infinite;
        }
        @keyframes auraPulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.12); opacity: 1; } }
        .darshan-frame {
          padding: 7px;
          border-radius: 52% 52% 14px 14px / 34% 34% 14px 14px;
          background: linear-gradient(135deg, #ffe599 0%, #c9a24a 35%, #8a6a2a 70%, #f4dd9a 100%);
          box-shadow: 0 20px 46px rgba(0, 0, 0, 0.6), 0 0 40px rgba(244, 221, 154, 0.45), inset 0 0 10px rgba(255, 255, 255, 0.5);
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
        }
        .darshan-frame-inner { padding: 3px; border-radius: inherit; background: linear-gradient(160deg, #2b0e08, #160504); height: 100%; }
        .darshan-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: inherit;
          -webkit-mask-image: radial-gradient(ellipse 92% 96% at 50% 42%, #000 62%, transparent 96%);
          mask-image: radial-gradient(ellipse 92% 96% at 50% 42%, #000 62%, transparent 96%);
        }

        /* Dual flanking brass diyas */
        .ganpati-stage {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(14px, 5cqw, 30px);
        }
        .brass-diya { position: relative; display: flex; flex-direction: column; align-items: center; opacity: 0; }
        .diya-chain { width: 2px; height: clamp(36px, 8cqh, 60px); background: linear-gradient(180deg, rgba(201, 162, 74, 0.3), rgba(244, 221, 154, 0.8), #8a6a2a); }
        .diya-bowl {
          position: relative;
          width: 26px;
          height: 15px;
          background: linear-gradient(160deg, #ffe599, #c9a24a 50%, #5a431c 100%);
          border-radius: 0 0 13px 13px;
          border: 1px solid var(--gold-light);
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.6), 0 0 10px rgba(244, 221, 154, 0.35);
          display: flex;
          justify-content: center;
        }
        .diya-flame { position: absolute; top: -11px; width: 6px; height: 13px; border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%; background: radial-gradient(circle at 50% 70%, #fff2b8, #f5b942 55%, #e2883f 90%); animation: flameFlicker 1.4s ease-in-out infinite alternate; }
        @keyframes flameFlicker { 0% { transform: scaleY(1) rotate(-2deg); } 100% { transform: scaleY(1.15) rotate(3deg); } }
        .diya-glow { position: absolute; bottom: -8px; width: 42px; height: 42px; border-radius: 50%; background: radial-gradient(circle, rgba(245, 185, 66, 0.42), transparent 70%); animation: diyaGlowPulse 2s ease-in-out infinite alternate; }
        @keyframes diyaGlowPulse { 0% { opacity: 0.55; transform: scale(0.9); } 100% { opacity: 0.9; transform: scale(1.12); } }
        .incense-smoke { position: absolute; bottom: 12px; width: 10px; height: 26px; background: radial-gradient(ellipse, rgba(244, 221, 154, 0.4), transparent 70%); border-radius: 50%; filter: blur(4px); animation: smokeRise 3.4s ease-out infinite; }
        .incense-smoke.s2 { animation-delay: 1.7s; width: 13px; height: 34px; }
        @keyframes smokeRise { 0% { transform: translateY(0) scaleX(0.8); opacity: 0; } 30% { opacity: 0.42; } 100% { transform: translateY(-56px) scaleX(1.7) translateX(10px); opacity: 0; } }

        /* Continuous ambient petal drift (separate from the one-shot burst) */
        .flower-petal { position: absolute; top: -20px; width: 12px; height: 16px; background: linear-gradient(135deg, #f5a623, #d0021b); border-radius: 0 60% 0 60%; opacity: 0.75; pointer-events: none; animation: petalFall linear infinite; }
        @keyframes petalFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.8; } 100% { transform: translateY(105cqh) rotate(360deg); opacity: 0.1; } }

        /* One-shot burst particles (pushpa vrishti / receipt flower blast) */
        .burst-petal { position: absolute; width: 13px; height: 16px; border-radius: 50% 0 50% 50%; pointer-events: none; z-index: 40; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); }

        /* ============ Slide 3: Authentic Digital Pavti ============ */
        .receipt-slide {
          background: linear-gradient(160deg, #2b110b 0%, #170704 100%);
        }
        .authentic-card {
          position: relative;
          width: min(440px, 92cqw);
          max-height: 86cqh;
          overflow-y: auto;
          background: var(--parchment);
          color: var(--ink);
          border-radius: 8px;
          padding: 24px 20px 24px 28px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.65);
          border: 2px solid var(--gold);
          z-index: 3;
        }
        .authentic-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2.5px;
          background-image: radial-gradient(circle, var(--maroon-black) 2.5px, transparent 2.6px);
          background-size: 14px 14px;
          background-position: left center;
          background-repeat: repeat-y;
          z-index: 4;
        }
        .card-inner-frame { border: 1px solid rgba(150, 110, 40, 0.4); padding: 16px; border-radius: 4px; position: relative; }
        .card-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--font-devotional);
          font-size: 11rem;
          color: var(--maroon);
          opacity: 0.045;
          pointer-events: none;
          z-index: 0;
          user-select: none;
        }
        .authentic-card > * { position: relative; z-index: 1; }
        .om-mark { font-family: var(--font-devotional); font-size: 1.4rem; color: var(--maroon); line-height: 1; margin-bottom: 2px; }

        /* ============ Slide 4: Divine Ashirwad ============ */
        .blessing-slide {
          background: radial-gradient(circle at 50% 40%, #451712 0%, #2b0a0c 55%, #1a0405 100%);
        }
        .divine-rays {
          position: absolute;
          width: 160cqmax;
          height: 160cqmax;
          background: repeating-conic-gradient(from 0deg, rgba(244, 221, 154, 0.05) 0deg 6deg, transparent 6deg 14deg);
          animation: raysSpin 90s linear infinite;
          z-index: 0;
        }
        .royal-lattice {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.5;
          background-image: radial-gradient(circle, rgba(244, 221, 154, 0.16) 0.6px, transparent 0.6px);
          background-size: 26px 26px;
          -webkit-mask-image: radial-gradient(circle at 50% 38%, #000 0%, transparent 72%);
          mask-image: radial-gradient(circle at 50% 38%, #000 0%, transparent 72%);
        }
        .royal-vignette { position: absolute; inset: 0; z-index: 1; pointer-events: none; box-shadow: inset 0 0 90px 30px rgba(10, 2, 3, 0.75); }
        @keyframes raysSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .bless-icon-wrap { position: relative; width: 110px; height: 110px; opacity: 0; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; }
        .bless-palm-img {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          background-color: rgba(244, 221, 154, .08);
          filter: saturate(1.1) drop-shadow(0 0 25px rgba(244, 221, 154, 0.65));
          -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 68%, transparent 98%);
          mask-image: radial-gradient(circle at 50% 50%, #000 68%, transparent 98%);
          position: relative;
          z-index: 2;
        }
        .bless-palm-halo {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, rgba(244, 221, 154, 0.35), rgba(226, 136, 63, 0.15) 50%, transparent 75%);
          pointer-events: none;
          z-index: 1;
          animation: pulseHalo 3.6s ease-in-out infinite;
        }
        @keyframes pulseHalo { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 1; } }
        .bless-glow-ring { position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; transform: translate(-50%, -50%); border-radius: 50%; border: 1.4px solid rgba(244, 221, 154, 0.75); pointer-events: none; z-index: 1; animation: blessRingPulse 2.6s ease-out infinite; }
        .bless-glow-ring.r2 { animation-delay: 1.3s; }
        @keyframes blessRingPulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }

        .royal-divider { display: flex; align-items: center; gap: 10px; width: min(200px, 50cqw); margin: 6px 0; opacity: 0; }
        .royal-divider span { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent); }
        .royal-divider .gem { width: 7px; height: 7px; transform: rotate(45deg); background: linear-gradient(135deg, var(--gold-light), var(--gold)); box-shadow: 0 0 8px rgba(244, 221, 154, 0.7); flex: none; }

        .bless-message { font-family: var(--font-display); font-style: italic; font-size: clamp(1.05rem, 2.6cqw, 1.35rem); color: var(--parchment); line-height: 1.55; opacity: 0; }

        .closing-chant-wrap { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 16px; opacity: 0; }
        .closing-flourish { width: 30px; height: 11px; opacity: 0.8; }
        .closing-flourish.flip { transform: scaleX(-1); }
        .closing-chant {
          font-family: var(--font-devotional);
          font-size: 1.3rem;
          background: linear-gradient(180deg, var(--gold-light) 20%, var(--gold) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          white-space: nowrap;
          text-shadow: 0 0 20px rgba(244, 221, 154, 0.3);
        }
        .bless-sub { font-family: var(--font-eyebrow); font-size: 0.68rem; letter-spacing: 0.1em; color: var(--saffron); margin-top: 6px; opacity: 0; }

        .royal-share-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 26px;
          padding: 11px 24px;
          border-radius: 30px;
          border: 1.3px solid var(--gold-light);
          outline: 1px solid rgba(201, 162, 74, 0.35);
          outline-offset: 3px;
          background: transparent;
          color: var(--gold-light);
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          opacity: 0;
          transition: all 0.25s ease;
        }
        .royal-share-btn:hover { background: var(--gold-light); color: var(--maroon-black); }

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

        /* Elements this file continuously animates should get their own
           compositing layer — cheap insurance against jank on the mid-range
           phones most donors are actually opening this on. */
        .divine-chakra, .brass-diya, .darshan-frame, .envelope-box, .envelope-flap, .envelope-pocket, .inside-glow,
        .wax-seal, .seal-half, .glow-burst, .glow-burst-outer, .ambient-spark,
        .smoke-wisp, .flower-petal, .burst-petal, .bless-icon-wrap, .bless-glow-ring {
          will-change: transform, opacity;
          backface-visibility: hidden;
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

          <div className="smoke-wisp smoke-a" />
          <div className="smoke-wisp smoke-b" />
          {sparks.map((s, i) => (
            <div
              key={i}
              className="ambient-spark"
              style={{ left: `${s.left}%`, top: `${s.top}%`, ['--dur' as any]: `${s.dur}s`, ['--delay' as any]: `${s.delay}s` }}
            />
          ))}

          {/* 3D Envelope Component */}
          <div className="envelope-stage-wrap">
            <div className="envelope-back-glow" />
            <div className="envelope-wrap">
              <div className="envelope-box">
                {/* Layer order matters here — it's what makes this read as a
                    real envelope: the back panel, a light flash, the letter
                    (tucked inside, hidden below the pocket's V-cut until it
                    rises), then the front pocket sitting in front of it, and
                    finally the flap on top of everything. */}
                <div className="envelope-back" />
                <div ref={insideGlowRef} className="inside-glow" />
                <div ref={insideLetterRef} className="inside-letter">
                  <p>|| श्री गणेशाय नमः ||</p>
                  <p>{receipt.donorName} जी, आपली देणगी यशस्वीरीत्या प्राप्त झाली आहे</p>
                </div>
                <div className="envelope-pocket" />

                {/* Envelope Flap — exact motifs and flourish from marathi-3 */}
                <div ref={envFlapRef} className="envelope-flap">
                  <svg className="corner-motif cm-l" viewBox="0 0 24 24" fill="none" stroke="#7a5222" strokeWidth="1"><path d="M2 12c4 0 6-6 10-6M2 12c4 0 6 6 10 6"/><circle cx="12" cy="12" r="2"/></svg>
                  <svg className="corner-motif cm-r" viewBox="0 0 24 24" fill="none" stroke="#7a5222" strokeWidth="1"><path d="M2 12c4 0 6-6 10-6M2 12c4 0 6 6 10 6"/><circle cx="12" cy="12" r="2"/></svg>
                  <svg className="flourish" viewBox="0 0 120 20" fill="none" stroke="#7a5222" strokeWidth="1">
                    <path d="M4 10 Q30 2 58 10 Q30 12 4 10 Z"/>
                    <path d="M116 10 Q90 2 62 10 Q90 12 116 10 Z"/>
                    <circle cx="60" cy="10" r="1.6" fill="#7a5222"/>
                  </svg>
                </div>

                {/* Envelope Seal — Om seal matching marathi-3 envelope */}
                <div ref={glowBurstOuterRef} className="glow-burst-outer" />
                <div ref={glowBurstRef} className="glow-burst" />
                <div className="seal-ring r1" />
                <div className="seal-ring r2" />
                <div
                  ref={sealRef}
                  className={`wax-seal ${isEnvelopeOpen ? 'opened' : ''}`}
                  onClick={handleOpenEnvelope}
                  role="button"
                  tabIndex={0}
                  title="पावती उघडण्यासाठी येथे स्पर्श करा"
                >
                  ॐ
                </div>
                <div ref={sealLeftRef} className="seal-half left" />
                <div ref={sealRightRef} className="seal-half right" />
              </div>
            </div>
          </div>

          {/* Hint to Open */}
          {!isEnvelopeOpen ? (
            <div className="open-hint cursor-pointer" onClick={handleOpenEnvelope}>
              <span className="text-xs font-devanagari tracking-wide text-amber-200/90">उघडण्यासाठी मुद्रेला स्पर्श करा</span>
              <ArrowDown size={14} className="text-amber-300 animate-bounce mt-0.5" />
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

          <div className="upload-hint">आपल्या मंडळाच्या मूर्तीचा फोटो लावा.</div>

          {/* Layer the one-shot flower burst is appended into — kept empty
              of React-rendered children so the manual DOM nodes never
              collide with reconciliation. */}
          <div ref={ganpatiPetalLayerRef} className="absolute inset-0 z-30 pointer-events-none overflow-hidden" />

          {/* Continuous ambient petal drift */}
          {[10, 25, 45, 65, 80, 92].map((leftPct, i) => (
            <div
              key={i}
              className="flower-petal"
              style={{ left: `${leftPct}%`, animationDuration: `${5 + (i % 4)}s`, animationDelay: `${i * 0.7}s` }}
            />
          ))}

          {/* Rotating suryachakra */}
          <div ref={chakraRef} className="divine-chakra">
            <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <defs>
                <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff4c2" />
                  <stop offset="30%" stopColor="#f4dd9a" />
                  <stop offset="70%" stopColor="#c9a24a" />
                  <stop offset="100%" stopColor="#7a5b1e" />
                </linearGradient>
                <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffe699" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#e2883f" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#2d0a0c" stopOpacity="0" />
                </radialGradient>
                <path id={`${uid}-petal`} d="M 250,140 C 240,175 236,205 250,225 C 264,205 260,175 250,140 Z" fill={`url(#${uid}-grad)`} stroke="#ffe699" strokeWidth="0.8" />
                <path id={`${uid}-ray`} d="M 250,20 L 258,110 L 250,102 L 242,110 Z" fill={`url(#${uid}-grad)`} stroke="#fff2b3" strokeWidth="0.5" />
              </defs>

              <circle cx="250" cy="250" r="235" fill={`url(#${uid}-glow)`} />

              <g className="chakra-outer-ring">
                <circle cx="250" cy="250" r="208" fill="none" stroke={`url(#${uid}-grad)`} strokeWidth="2.5" />
                {Array.from({ length: 24 }, (_, i) => (
                  <use key={i} href={`#${uid}-ray`} transform={`rotate(${i * 15} 250 250)`} opacity={i % 2 === 0 ? 1 : 0.75} />
                ))}
              </g>

              <g className="chakra-inner-ring">
                <circle cx="250" cy="250" r="148" fill="none" stroke={`url(#${uid}-grad)`} strokeWidth="2" />
                {Array.from({ length: 16 }, (_, i) => (
                  <use key={i} href={`#${uid}-petal`} transform={`rotate(${i * 22.5} 250 250)`} />
                ))}
              </g>

              <g className="chakra-hub">
                <circle cx="250" cy="250" r="78" fill={`url(#${uid}-grad)`} opacity="0.9" />
                <circle cx="250" cy="250" r="72" fill="#36090c" />
                <circle cx="250" cy="250" r="64" fill={`url(#${uid}-grad)`} opacity="0.45" />
                <polygon points="250,208 261,239 292,250 261,261 250,292 239,261 208,250 239,239" fill={`url(#${uid}-grad)`} />
              </g>
            </svg>
          </div>

          <div className="flex flex-col items-center text-center z-10 px-4 max-w-sm">
            {/* Sacred Tagline */}
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-amber-300/90 uppercase mb-3" style={{ fontFamily: 'var(--font-eyebrow)' }}>
              {settings.headerTagline || "|| श्री गणेशाय नमः ||"}
            </p>

            {/* Ganesha Darshan Idol + flanking diyas */}
            <div className="ganpati-stage my-1">
              <div ref={(el) => { diyaRefs.current[0] = el; }} className="brass-diya">
                <div className="diya-chain" />
                <div className="diya-bowl"><div className="diya-flame" /></div>
                <div className="diya-glow" />
                <div className="incense-smoke" />
                <div className="incense-smoke s2" />
              </div>

              <div ref={darshanWrapRef} className="darshan-idol-wrap">
                <div className="darshan-aura" />
                <div className="darshan-frame">
                  <div className="darshan-frame-inner">
                    <img src={customDarshan || GANPATI_IMAGE_URL} alt="Shree Ganesh Darshan" className="darshan-img" />
                  </div>
                </div>
              </div>

              <div ref={(el) => { diyaRefs.current[1] = el; }} className="brass-diya">
                <div className="diya-chain" />
                <div className="diya-bowl"><div className="diya-flame" /></div>
                <div className="diya-glow" />
                <div className="incense-smoke" />
                <div className="incense-smoke s2" />
              </div>
            </div>

            {/* Devotional Chanting Subtitle */}
            <h2 className="text-xl sm:text-2xl font-bold text-amber-100 mt-3 tracking-wide drop-shadow-md" style={{ fontFamily: 'var(--font-devotional)' }}>
              गणपती बाप्पा मोरया
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
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
          <div ref={receiptPetalLayerRef} className="absolute inset-0 z-30 pointer-events-none overflow-hidden" />

          <div ref={receiptCardRef} className="authentic-card">
            <div className="card-inner-frame">
              <span className="card-watermark">ॐ</span>

              {/* Mandal Header */}
              <div className="text-center pb-3 border-b-2 border-amber-700/40 mb-3">
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt="Mandal Logo"
                    className="w-12 h-12 object-contain mx-auto mb-1.5 rounded-full border border-amber-600/30"
                  />
                ) : (
                  <div className="om-mark">ॐ</div>
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
                <p className="text-2xl font-extrabold text-[#5c1220] tracking-tight mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  ₹ {receipt.amount.toLocaleString('en-IN')}
                </p>
                <p className="text-[0.72rem] text-amber-950 font-medium italic mt-0.5">
                  अक्षरी: {amountInWords}
                </p>
              </div>

              {/* Online Payment Section for Unpaid Receipts */}
              {isUnpaid && (
                <div className="my-2.5 p-3 bg-white/75 border border-amber-700/30 rounded-xl flex flex-col items-center gap-2 shadow-sm">
                  {/* Cashfree Verified Online Payment Gateway (Primary Flow) */}
                  {org.paymentEnabled && cashfreeOrder ? (
                    <div className="w-full text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-[0.68rem]">
                        <Sparkles size={12} className="text-amber-500 animate-pulse" />
                        <span>ऑनलाइन वर्गणी द्या (Cashfree Auto-Verified)</span>
                      </div>

                      {/* Primary Official Cashfree Web Checkout Button */}
                      {cashfreeOrder.paymentSessionId && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => launchCashfreeCheckout(cashfreeOrder.paymentSessionId!)}
                            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-800 to-amber-900 hover:from-emerald-700 hover:to-amber-800 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Sparkles size={14} className="text-amber-300 animate-pulse" />
                            <span>कॅशफ्री ऑनलाईन वर्गणी द्या (GPay, PhonePe, Paytm, UPI QR)</span>
                          </button>
                        </div>
                      )}

                      {/* Cashfree S2S Embedded Dynamic QR Code (When S2S Active) */}
                      {cashfreeOrder.qr ? (
                        <div className="p-2 bg-white rounded-lg inline-block border border-amber-900/10 shadow-sm mx-auto">
                          <img
                            src={cashfreeOrder.qr.startsWith('data:') ? cashfreeOrder.qr : `data:image/png;base64,${cashfreeOrder.qr}`}
                            alt="Cashfree Dynamic UPI QR"
                            className="w-24 h-24 object-contain mx-auto"
                          />
                          <p className="text-[0.58rem] text-emerald-800 font-medium mt-1">स्कॅन करून ऑनलाईन भरणा करा</p>
                        </div>
                      ) : null}

                      {/* Cashfree S2S Embedded Intent App Buttons (When S2S Active) */}
                      {cashfreeOrder.intent && (
                        <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                          {cashfreeOrder.intent.gpay && (
                            <button
                              type="button"
                              onClick={() => { window.location.href = cashfreeOrder.intent!.gpay || cashfreeOrder.intent!.default!; }}
                              className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[0.62rem] font-bold shadow-sm"
                            >
                              GPay
                            </button>
                          )}
                          {cashfreeOrder.intent.phonepe && (
                            <button
                              type="button"
                              onClick={() => { window.location.href = cashfreeOrder.intent!.phonepe || cashfreeOrder.intent!.default!; }}
                              className="px-2.5 py-1 rounded bg-purple-800 hover:bg-purple-700 text-white text-[0.62rem] font-bold shadow-sm"
                            >
                              PhonePe
                            </button>
                          )}
                          {cashfreeOrder.intent.paytm && (
                            <button
                              type="button"
                              onClick={() => { window.location.href = cashfreeOrder.intent!.paytm || cashfreeOrder.intent!.default!; }}
                              className="px-2.5 py-1 rounded bg-sky-800 hover:bg-sky-700 text-white text-[0.62rem] font-bold shadow-sm"
                            >
                              Paytm
                            </button>
                          )}
                          {(cashfreeOrder.intent.web || cashfreeOrder.intent.default) && (
                            <button
                              type="button"
                              onClick={() => { window.location.href = cashfreeOrder.intent!.web || cashfreeOrder.intent!.default!; }}
                              className="px-2.5 py-1 rounded bg-amber-900 hover:bg-amber-800 text-amber-100 text-[0.62rem] font-bold shadow-sm"
                            >
                              Direct Pay
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : cashfreeLoading ? (
                    <div className="py-2 text-center text-[0.65rem] text-amber-900/60 flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <span>कॅशफ्री पेमेंट लोड होत आहे...</span>
                    </div>
                  ) : null}

                  {/* Optional Direct Mandal VPA UPI Link (Manual Verification Mode) */}
                  {org.upiId && (
                    <div className="w-full pt-1 border-t border-amber-700/15 text-center">
                      {!showDirectUpi ? (
                        <button
                          type="button"
                          onClick={() => setShowDirectUpi(true)}
                          className="text-[0.6rem] text-amber-900/70 hover:text-amber-900 underline font-medium"
                        >
                          थेट मॅन्युअल UPI QR (Direct VPA - Manual Verification)
                        </button>
                      ) : (
                        <div className="space-y-1 pt-1">
                          <span className="text-[0.58rem] text-amber-900 font-bold block">
                            Direct Mandal VPA (Requires Manual Verification by Treasurer)
                          </span>
                          <div className="p-1.5 bg-white rounded-md inline-block">
                            <QRCodeSVG
                              value={buildUpiPaymentLink({
                                upiId: org.upiId,
                                payeeName: org.name || 'Mandal',
                                amount: receipt.amount,
                                note: receipt.receiptNumber,
                              })}
                              size={88}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowDirectUpi(false)}
                            className="text-[0.55rem] text-amber-900/50 hover:underline block mx-auto"
                          >
                            Hide Direct QR
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between items-end pt-2 mt-2">
                <div className="text-center w-24">
                  <div className="border-t border-amber-950/40 pt-1">
                    <span className="text-[0.62rem] text-amber-900 block font-medium">संग्राहक / Collector</span>
                    <span className="text-[0.65rem] font-semibold text-[#5c1220] truncate block">
                      {receipt.collector?.name || "कार्यकर्ता"}
                    </span>
                  </div>
                </div>

                <div className="text-center w-24">
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
                  className="flex-1 py-1.5 px-2.5 bg-[#5c1220] text-amber-100 rounded text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#7c1a2c] transition-colors"
                >
                  <Download size={13} />
                  <span>प्रिंट / सेव्ह</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-1.5 px-2.5 bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 hover:bg-emerald-600 transition-colors"
                >
                  <Share2 size={13} />
                  <span>व्हॉट्सअॅप</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareGeneric}
                  className="py-1.5 px-2.5 bg-amber-900/60 text-amber-200 border border-amber-600/30 rounded text-xs font-semibold flex items-center justify-center gap-1 hover:bg-amber-800/80 transition-colors"
                >
                  <Share2 size={13} />
                  <span>इतर</span>
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
          <div className="royal-lattice" />
          <div className="royal-vignette" />
          <div className="frame-corner fc-tl" />
          <div className="frame-corner fc-tr" />
          <div className="frame-corner fc-bl" />
          <div className="frame-corner fc-br" />

          <div className="flex flex-col items-center text-center z-10 px-6 max-w-md">
            {/* Divine Ashirwad Icon / Palm */}
            <div ref={blessHandRef} className="bless-icon-wrap">
              <div
                className="bless-palm-img"
                role="img"
                aria-label="श्री गणपती आशीर्वाद हस्त"
                style={{ backgroundImage: `url(${ASHIRVAAD_IMAGE_URL})` }}
              />
              <div className="bless-palm-halo" />
              <div className="bless-glow-ring r1" />
              <div className="bless-glow-ring r2" />
            </div>

            <p className="text-xs font-bold text-amber-300 tracking-widest uppercase">
              श्रींचे शुभाशीर्वाद
            </p>

            <div ref={blessDividerRef} className="royal-divider">
              <span /><i className="gem" /><span />
            </div>

            {/* Personalized Blessing Quote */}
            <p ref={blessMsgRef} className="bless-message mt-1">
              "{settings.blessingMessage || "गणपती बाप्पा आपल्या सर्व मनोकामना पूर्ण करोत आणि आपल्या घरात सुख, समृद्धी आणि आरोग्य लाभो!"}"
            </p>

            <div ref={blessClosingRef} className="closing-chant-wrap">
              <svg className="closing-flourish" viewBox="0 0 44 16" fill="none"><path d="M2 8 Q16 1 42 8" stroke="#c9a24a" strokeWidth="1" /></svg>
              <span className="closing-chant">गणपती बाप्पा मोरया</span>
              <svg className="closing-flourish flip" viewBox="0 0 44 16" fill="none"><path d="M2 8 Q16 1 42 8" stroke="#c9a24a" strokeWidth="1" /></svg>
            </div>
            <p ref={blessSubRef} className="bless-sub">मंगलमूर्ती मोरया</p>

            <p className="text-xs text-amber-200/80 mt-3">
              - {org.nameMarathi || org.name}
            </p>

            {/* Action Buttons */}
            <div className="mt-5 w-full space-y-2.5">
              <button
                ref={blessBtnRef}
                type="button"
                onClick={handleShareWhatsApp}
                className="royal-share-btn w-full justify-center bg-emerald-700 hover:bg-emerald-600 text-white"
              >
                <Share2 size={16} />
                <span>ही पावती व्हॉट्सअॅपवर पाठवा</span>
              </button>

              <button
                type="button"
                onClick={handleShareGeneric}
                className="w-full py-2.5 px-4 rounded-full bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow"
              >
                <Share2 size={14} />
                <span>इतर अॅप्सवर शेअर करा (Other Apps)</span>
              </button>

              <button
                type="button"
                onClick={() => goToSlide(2)}
                className="text-xs text-amber-300/80 hover:text-amber-200 underline pt-1 block mx-auto"
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
