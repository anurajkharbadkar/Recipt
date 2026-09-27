'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Receipt, amountToWords, Language, RECEIPT_CATEGORIES_LABELS, PAYMENT_MODE_LABELS } from '@pavti/shared';
import { Sparkles, Share2, Copy, ArrowRight, Volume2, VolumeX, FileCheck, CheckCircle2, QrCode, CreditCard, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { receiptsApi } from '@/lib/api';
import ReceiptPreview from './ReceiptPreview';
import { DEFAULT_MANDAL_LOGO, DEFAULT_DARSHAN_PHOTO } from '@/lib/defaultPavtiImages';

interface InteractivePavtiViewProps {
  receipt?: any;
  language?: 'mr' | 'hi' | 'en';
  onSwitchToStandard?: () => void;
  defaultMuted?: boolean;
  embedded?: boolean;
}

export default function InteractivePavtiView({
  receipt,
  language = 'mr',
  onSwitchToStandard,
  embedded = false,
}: InteractivePavtiViewProps) {
  const [curtainOpened, setCurtainOpened] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [claimedPaid, setClaimedPaid] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | undefined>(receipt?.status);

  // Status flags
  const isPaid = receipt?.status === 'PAID' || !receipt?.status;
  const isPending = receipt?.status === 'PENDING';
  const isVoided = receipt?.isVoided || receipt?.status === 'CANCELLED';
  const isClaimed = !!receipt?.donorClaimedPaidAt || claimedPaid;

  // Dynamic values with fallbacks
  const donorName = receipt?.donorNameMarathi || receipt?.donorName || 'राजेंद्र देशमुख';
  const amount = receipt?.amount || 501;
  const langEnum = language === 'hi' ? Language.HI : language === 'en' ? Language.EN : Language.MR;
  const amountWords = receipt?.amountInWords || amountToWords(amount, langEnum) || 'पाचशे एक रुपये फक्त';
  const receiptNumber = receipt?.receiptNumber || 'NAV-2026-0042';
  const dateStr = receipt?.createdAt 
    ? new Date(receipt.createdAt).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '२७ सप्टें २०२६';

  const mandalName = receipt?.campaign?.organization?.nameMarathi 
    || receipt?.campaign?.organization?.name 
    || receipt?.organization?.nameMarathi 
    || receipt?.organization?.name 
    || 'श्री नवदुर्गा उत्सव मंडळ';

  const mandalLogo = receipt?.campaign?.organization?.logoUrl || receipt?.organization?.logoUrl || DEFAULT_MANDAL_LOGO;
  const upiId = receipt?.campaign?.organization?.upiId 
    || receipt?.organization?.upiId 
    || receipt?.campaign?.organization?.bankAccountNumber 
    || 'mandal@upi';

  const festivalTitle = receipt?.campaign?.nameMarathi || receipt?.campaign?.name || 'शुभ नवरात्रोत्सव';
  const collectorName = receipt?.collector?.nameMarathi || receipt?.collector?.name || 'अधिकृत प्रतिनिधी';
  
  const categoryLabel = receipt?.category 
    ? (RECEIPT_CATEGORIES_LABELS[receipt.category]?.[language] || receipt.category)
    : 'सामान्य देणगी';
    
  const paymentModeLabel = receipt?.paymentMode
    ? (PAYMENT_MODE_LABELS[receipt.paymentMode]?.[language] || receipt.paymentMode)
    : 'UPI';

  const blessingMessage = receipt?.organization?.blessingMessage || 'देवी मातेचा कृपाप्रसाद आपल्यावर व आपल्या कुटुंबावर सदैव राहो. सुख, समृद्धी, शांती आणि उत्तम आरोग्य लाभो हीच प्रार्थना!';
  const customDarshanUrl = receipt?.campaign?.organization?.customDarshanUrl || receipt?.organization?.customDarshanUrl || DEFAULT_DARSHAN_PHOTO;

  // Construct complete receipt object for standard ReceiptPreview component
  const orgObj = receipt?.campaign?.organization || receipt?.organization || {};
  const effectiveReceipt = {
    id: receipt?.id || 'preview-1',
    receiptNumber: receiptNumber,
    createdAt: receipt?.createdAt || new Date().toISOString(),
    donorName: donorName,
    donorAddress: receipt?.donorAddress,
    amount: amount,
    amountInWords: amountWords,
    category: categoryLabel,
    paymentMode: paymentModeLabel,
    status: receipt?.status || 'PAID',
    isVoided: isVoided,
    collector: receipt?.collector || { name: collectorName },
    area: receipt?.area,
    notes: receipt?.notes,
    campaign: receipt?.campaign || {
      name: festivalTitle,
      organization: {
        name: mandalName,
        nameMarathi: mandalName,
        logoUrl: mandalLogo,
        receiptTemplateSettings: orgObj?.receiptTemplateSettings || {
          headerTagline: '॥ श्री दुर्गे नमः ॥',
          footerNote: blessingMessage,
          theme: 'traditional',
          language: language,
        },
      },
    },
  };

  // Auto-open curtain and show celebration toast when status changes from PENDING -> PAID
  useEffect(() => {
    if (receipt?.status === 'PAID' && prevStatusRef.current === 'PENDING') {
      toast.success('🎉 भरणा यशस्वीरित्या जमा झाला! (Payment Confirmed!)', { duration: 5000 });
      setCurtainOpened(true);
    }
    prevStatusRef.current = receipt?.status;
  }, [receipt?.status]);

  // Track scroll position to set active slide dot
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const height = el.clientHeight;
      if (height > 0) {
        const slide = Math.round(el.scrollTop / height);
        setActiveSlide(slide);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: index * el.clientHeight,
      behavior: 'smooth',
    });
  };

  const handleOpenCurtain = () => {
    setCurtainOpened(true);
  };

  // Direct UPI Payment Link (opens GPay / PhonePe / Paytm / BHIM)
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(mandalName)}&am=${amount}&tn=${encodeURIComponent(`Receipt-${receiptNumber}`)}&cu=INR`;

  const handlePayViaUpi = () => {
    window.location.href = upiPayUrl;
  };

  const handleClaimPaid = async () => {
    if (!receipt?.id || isClaiming || isClaimed) return;
    setIsClaiming(true);
    try {
      await receiptsApi.claimPaid(receipt.id);
      setClaimedPaid(true);
      toast.success('पेमेंटच्या दाव्याची नोंद झाली! प्रतिनिधी लवकरच पडताळणी करतील.');
    } catch (err) {
      toast.error('दावा नोंदवता आला नाही. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleShareWhatsapp = () => {
    const shareText = `🙏 *${mandalName}* - अधिकृत डिजिटल पावती\n\nआदरणीय ${donorName} जी,\nआपल्या ₹${amount.toLocaleString('en-IN')} च्या देणगीची पावती (क्र. ${receiptNumber}) प्राप्त झाली आहे.\n\n🔗 *डिजिटल पावती व दर्शन:* ${typeof window !== 'undefined' ? window.location.href : ''}\n\n✨ ${blessingMessage}\n\n— *${mandalName}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('पावतीची लिंक कॉपी झाली!');
    }
  };

  return (
    <div className={`relative w-full ${embedded ? 'h-full' : 'h-screen h-[100dvh]'} bg-[#062114] font-sans overflow-hidden select-none`}>
      <style>{`
        :root {
          --maroon-deep: #3d0c14;
          --maroon: #5c0f1e;
          --emerald-deep: #062114;
          --emerald: #0e422c;
          --emerald-light: #16583d;
          --gold: #d4af37;
          --gold-light: #fce8a9;
          --gold-dim: #785b14;
          --ivory: #f6f2e9;
          --ivory-warm: #ded5c2;
          --ink: #2a1810;
        }

        .pavti-container {
          width: 100%;
          height: 100vh;
          height: 100dvh;
          overflow-y: scroll;
          overflow-x: hidden;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .pavti-container::-webkit-scrollbar { display: none; }

        .slide {
          position: relative;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        /* Dots Navigation */
        .nav-dots {
          position: fixed;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 200;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nav-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(252, 232, 169, 0.35);
          border: 1px solid rgba(212, 175, 55, 0.5);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .nav-dot.active {
          background: #fce8a9;
          transform: scale(1.4);
          box-shadow: 0 0 10px rgba(252, 232, 169, 0.8);
        }

        /* SLIDE 1 STAGE & CURTAIN */
        #slide1 { background: #3d0c14; }

        .stage {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: calc(16vw + 10px) 24px 28px;
          overflow: hidden;
          text-align: center;
          z-index: 10;
          background:
            radial-gradient(circle at 50% 46%, rgba(212,175,55,0.30), transparent 52%),
            radial-gradient(circle at 50% 112%, rgba(255,122,24,0.34), transparent 55%),
            linear-gradient(180deg, #2a0710 0%, #4a0f1a 48%, #1f0508 100%);
        }

        .toran {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: auto;
          max-height: clamp(48px, 8vh, 68px);
          z-index: 3;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));
          pointer-events: none;
        }

        .spark {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #fce8a9;
          box-shadow: 0 0 8px 2px rgba(252,232,169,0.8);
          opacity: 0;
          animation: twinkle 3.4s ease-in-out infinite;
          animation-delay: var(--d);
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50%      { opacity: 1; transform: scale(1); }
        }

        .reveal {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(10px, 2vh, 18px);
          opacity: 0;
          transform: scale(0.94) translateY(16px);
          will-change: opacity, transform;
          transition: opacity 1.6s ease 0.6s, transform 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s;
        }
        .curtain-viewport.opened ~ .stage .reveal {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        .fest {
          font-family: serif;
          font-weight: 600;
          font-size: clamp(1.35rem, 6vw, 1.8rem);
          line-height: 1.2;
          color: #fce8a9;
          text-shadow: 0 0 18px rgba(255,170,40,0.55);
        }

        .logo-wrap {
          --w: min(65vw, 36vh, 280px);
          position: relative;
          width: var(--w);
          margin: calc(var(--w) * 0.1) 0;
        }

        .halo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 132%;
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          overflow: visible;
          pointer-events: none;
        }
        .halo .ringA { transform-origin: 100px 100px; animation: spin 80s linear infinite reverse; }
        .halo .ringB { transform-origin: 100px 100px; animation: spin 120s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .mandal-logo {
          position: relative;
          z-index: 1;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 50%;
          overflow: hidden;
          background: #110306;
          box-shadow:
            0 0 0 2px rgba(252,232,169,0.35),
            0 0 40px rgba(255,170,40,0.45),
            0 0 90px rgba(212,175,55,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mandal-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .scroll-btn {
          margin-top: clamp(2px, 1vh, 8px);
          padding: 12px 32px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #3d0c14;
          background: linear-gradient(135deg, #f6de8d, #d4af37 55%, #a8801d);
          border: 1px solid #fce8a9;
          border-radius: 99px;
          cursor: pointer;
          box-shadow: 0 6px 22px rgba(212,175,55,0.35), 0 0 0 4px rgba(212,175,55,0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .scroll-btn:hover {
          transform: scale(1.04);
        }

        .curtain-viewport:not(.opened) { background: #031009; }

        .velvet-rib::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 4.2s cubic-bezier(0.45, 0, 0.2, 1);
        }
        .curtain-viewport.opened .velvet-rib::before { opacity: 0.3; }

        .curtain-viewport {
          position: absolute;
          inset: 0;
          z-index: 50;
          overflow: hidden;
          perspective: 1200px;
          perspective-origin: 50% 50%;
          cursor: pointer;
        }

        .curtain-half {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50.5%;
          display: flex;
          transition: transform 3.8s cubic-bezier(0.45, 0, 0.2, 1);
          will-change: transform;
        }

        .curtain-left { left: 0; transform-origin: left center; }
        .curtain-right { right: 0; transform-origin: right center; flex-direction: row-reverse; }

        .velvet-rib {
          flex: 1;
          height: 100%;
          position: relative;
          background:
            repeating-linear-gradient(
              to right,
              rgba(255, 230, 150, 0.12) 0px,
              rgba(255, 230, 150, 0.12) 1px,
              transparent 1px,
              transparent 12px
            ),
            linear-gradient(
              90deg,
              #020b06 0%, #072418 20%, #0e422c 50%,
              #16583d 62%, #0b3824 80%, #031009 100%
            );
          box-shadow: -4px 0 10px rgba(0, 0, 0, 0.65);
          transition: transform 3.8s cubic-bezier(0.45, 0, 0.2, 1);
          transform-origin: center center;
          will-change: transform;
        }

        .curtain-left .velvet-rib:last-child::after,
        .curtain-right .velvet-rib:last-child::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 5px;
          background: repeating-linear-gradient(180deg, #fce8a9 0px, #d4af37 8px, #785b14 16px, #d4af37 24px);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
        }
        .curtain-left .velvet-rib:last-child::after { right: 0; }
        .curtain-right .velvet-rib:last-child::after { left: 0; }

        .tap-hint {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 60;
          background: rgba(3, 17, 10, 0.88);
          border: 1px solid rgba(212, 175, 55, 0.8);
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.35);
          padding: 14px 32px;
          border-radius: 99px;
          color: #fce8a9;
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: 2px;
          pointer-events: none;
          transition: opacity 0.5s ease;
          animation: pulseHint 2.4s infinite ease-in-out;
        }

        @keyframes pulseHint {
          0%, 100% { opacity: 0.95; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.05); }
        }

        .curtain-viewport.opened .curtain-left { transform: translateX(-68%) scaleX(0.4) skewY(-2.5deg); }
        .curtain-viewport.opened .curtain-right { transform: translateX(68%) scaleX(0.4) skewY(2.5deg); }
        .curtain-viewport.opened .curtain-left .velvet-rib { transform: rotateY(-36deg) scaleZ(1.3); }
        .curtain-viewport.opened .curtain-right .velvet-rib { transform: rotateY(36deg) scaleZ(1.3); }
        .curtain-viewport.opened .tap-hint { opacity: 0; animation: none; }
        .curtain-viewport.opened { pointer-events: none; }

        /* SLIDE 2 — DARSHAN PHOTO */
        #slide2 {
          background:
            radial-gradient(circle at 50% 38%, rgba(212,175,55,0.20), transparent 56%),
            radial-gradient(circle at 50% 108%, rgba(255,122,24,0.28), transparent 55%),
            linear-gradient(180deg, #2a0710 0%, #3d0c14 55%, #1f0508 100%);
          padding: 28px 24px;
          gap: clamp(12px, 2.4vh, 22px);
        }

        .darshan {
          --w: min(74vw, 42vh, 290px);
          width: calc(var(--w) + 12px);
          padding: 6px;
          border-radius: calc(var(--w) / 2 + 6px) calc(var(--w) / 2 + 6px) 18px 18px;
          background: linear-gradient(160deg, #fce8a9, #d4af37 45%, #785b14 75%, #d4af37);
          box-shadow:
            0 0 0 1px rgba(252,232,169,0.35),
            0 0 60px rgba(212,175,55,0.28),
            0 26px 50px rgba(0,0,0,0.6);
        }
        .darshan-inner {
          width: 100%;
          aspect-ratio: 1082 / 1397;
          overflow: hidden;
          border: 2px solid #3d0c14;
          border-radius: calc(var(--w) / 2) calc(var(--w) / 2) 12px 12px;
          background: #0d0204;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .darshan-inner img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .jai-line {
          font-family: serif;
          font-weight: 500;
          font-size: clamp(1.4rem, 6vw, 1.8rem);
          line-height: 1.3;
          text-align: center;
          color: #fce8a9;
          text-shadow: 0 0 18px rgba(255,170,40,0.45);
        }
        .darshan-sub {
          margin-top: calc(-1 * clamp(6px, 1.4vh, 14px));
          font-size: 0.95rem;
          text-align: center;
          color: #ded5c2;
        }

        .swipe-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: rgba(246,242,233,0.7);
        }

        /* SLIDE 3 — RECEIPT (PAVTI) */
        #slide3 {
          background:
            radial-gradient(circle at 50% 0%, rgba(212,175,55,0.16), transparent 55%),
            linear-gradient(180deg, #3d0c14 0%, #230508 100%);
          padding: 20px 24px;
        }

        .receipt-card {
          position: relative;
          width: min(100%, 340px);
          background: #f6f2e9;
          color: #2a1810;
          border-radius: 8px;
          padding: clamp(14px, 2.2vh, 22px) 20px clamp(12px, 2vh, 18px);
          box-shadow: 0 0 0 1px rgba(212,175,55,0.5), 0 26px 60px rgba(0,0,0,0.55);
        }
        .receipt-card::before {
          content: '';
          position: absolute;
          inset: 5px;
          border: 1px solid rgba(92,15,30,0.35);
          border-radius: 5px;
          pointer-events: none;
        }

        .rc-jai {
          text-align: center;
          font-size: 0.82rem;
          font-weight: 700;
          color: #5c0f1e;
          letter-spacing: 0.5px;
        }

        .rc-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0 10px;
          padding-bottom: 10px;
          border-bottom: 1.5px solid #5c0f1e;
        }
        .rc-mark {
          width: 48px;
          height: 48px;
          flex: none;
          object-fit: cover;
          border-radius: 50%;
          background: #110306;
          border: 1px solid #d4af37;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rc-title {
          font-family: serif;
          font-weight: 600;
          font-size: 1.15rem;
          line-height: 1.25;
          color: #5c0f1e;
        }
        .rc-kind {
          margin-top: 2px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #2a1810;
        }

        .rc-rows {
          display: flex;
          flex-direction: column;
          gap: clamp(6px, 1.3vh, 10px);
        }
        .rc-row dt {
          font-size: 0.72rem;
          line-height: 1.2;
          color: rgba(42,24,16,0.65);
        }
        .rc-row dd {
          min-height: 1.4em;
          padding-bottom: 2px;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.3;
          border-bottom: 1px dotted rgba(92,15,30,0.4);
          overflow-wrap: anywhere;
        }
        .rc-row.two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .rc-row.amount {
          padding: 6px 10px;
          background: rgba(212,175,55,0.16);
          border-left: 3px solid #d4af37;
          border-radius: 4px;
        }
        .rc-row.amount dd {
          min-height: 0;
          padding-bottom: 0;
          border: none;
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1.15;
          color: #5c0f1e;
        }

        .rc-foot {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: clamp(10px, 2vh, 18px);
          min-height: 60px;
        }
        .rc-seal {
          width: 62px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 50%;
          border: 2px solid rgba(139,20,32,0.75);
          box-shadow: inset 0 0 0 4px #f6f2e9, inset 0 0 0 5px rgba(139,20,32,0.5);
          color: rgba(139,20,32,0.85);
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 1.25;
          transform: rotate(-12deg);
        }
        .rc-seal.paid {
          border-color: #047857;
          color: #047857;
          box-shadow: inset 0 0 0 4px #f6f2e9, inset 0 0 0 5px rgba(4,120,87,0.4);
        }
        .rc-sign {
          min-width: 120px;
          padding-top: 4px;
          text-align: center;
          font-size: 0.72rem;
          color: rgba(42,24,16,0.7);
          border-top: 1px solid rgba(42,24,16,0.55);
        }

        /* SLIDE 4 — ASHIRVAD & ACTIONS */
        #slide4 {
          background:
            radial-gradient(circle at 50% 0%, rgba(212,175,55,0.14), transparent 50%),
            linear-gradient(180deg, #062114 0%, #08160f 100%);
          padding: 32px 24px;
        }

        .blessing {
          width: min(100%, 320px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .blessing h3 {
          font-family: serif;
          font-weight: 500;
          font-size: clamp(2.1rem, 10vw, 2.8rem);
          line-height: 1.15;
          color: #fce8a9;
        }
        .bl-rule {
          width: 64px;
          height: 1px;
          margin: clamp(10px, 2vh, 18px) auto;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
        }
        .bl-thanks {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #f6f2e9;
        }
        .bl-thanks b {
          font-weight: 700;
          color: #fce8a9;
        }
        .bl-text {
          margin-top: clamp(8px, 1.6vh, 14px);
          font-size: 0.95rem;
          line-height: 1.75;
          color: #ded5c2;
        }
        .bl-close {
          margin-top: clamp(12px, 2.4vh, 20px);
          font-family: serif;
          font-size: 1.4rem;
          color: #d4af37;
        }
        .bl-from {
          margin-top: 4px;
          font-size: 0.85rem;
          color: rgba(222,213,194,0.85);
          font-weight: 600;
        }

        .corner-motif {
          position: absolute;
          width: 42px;
          height: 42px;
          border: 1.5px solid rgba(212,175,55,0.4);
          opacity: 0.7;
          pointer-events: none;
        }
        .corner-motif.tl { top: 20px; left: 20px; border-right: none; border-bottom: none; border-top-left-radius: 10px; }
        .corner-motif.tr { top: 20px; right: 20px; border-left: none; border-bottom: none; border-top-right-radius: 10px; }
        .corner-motif.bl { bottom: 20px; left: 20px; border-right: none; border-top: none; border-bottom-left-radius: 10px; }
        .corner-motif.br { bottom: 20px; right: 20px; border-left: none; border-top: none; border-bottom-right-radius: 10px; }
      `}</style>

      {/* Side Navigation Dots */}
      <div className="nav-dots">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            onClick={() => scrollToSlide(idx)}
            className={`nav-dot ${activeSlide === idx ? 'active' : ''}`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Live Payment Status Floating Banner for Pending Receipts */}
      {isPending && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm bg-gradient-to-r from-amber-950/90 via-[#4a0f1a]/95 to-amber-950/90 border border-amber-500/50 backdrop-blur-md rounded-2xl p-2.5 shadow-2xl text-amber-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">⏳ भरणा प्रलंबित (Payment Pending)</p>
              <p className="text-[10px] text-amber-200/70 truncate">पेमेंटची नोंद तपासली जात आहे...</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePayViaUpi}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-bold rounded-xl shrink-0 shadow-md flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <CreditCard size={13} />
            <span>UPI पेमेंट</span>
          </button>
        </div>
      )}

      {/* Main Snap Scroll Container */}
      <div className="pavti-container" ref={containerRef}>
        
        {/* ===================== SLIDE 1: CURTAIN REVEAL ===================== */}
        <section className="slide" id="slide1">
          <div 
            className={`curtain-viewport ${curtainOpened ? 'opened' : ''}`}
            onClick={handleOpenCurtain}
          >
            <div className="curtain-half curtain-left">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="velvet-rib" />
              ))}
            </div>
            <div className="curtain-half curtain-right">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="velvet-rib" />
              ))}
            </div>
            <div className="tap-hint">
              {isPending ? 'पेमेंट व दर्शन • TOUCH TO OPEN' : 'उघडा • TOUCH TO OPEN'}
            </div>
          </div>

          <main className="stage">
            {/* Hanging Marigold Toran SVG - Full Original Detail */}
            <svg className="toran" viewBox="0 0 400 64" aria-hidden="true">
              <defs>
                <linearGradient id="gRod" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#fce8a9" />
                  <stop offset="1" stopColor="#a8801d" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="400" height="4" fill="url(#gRod)" />
              <path d="M0 4 Q50 58 100 4" fill="none" stroke="#d4af37" strokeWidth="1" />
              <path d="M100 4 Q150 58 200 4" fill="none" stroke="#d4af37" strokeWidth="1" />
              <path d="M200 4 Q250 58 300 4" fill="none" stroke="#d4af37" strokeWidth="1" />
              <path d="M300 4 Q350 58 400 4" fill="none" stroke="#d4af37" strokeWidth="1" />
              <line x1="0" y1="4" x2="0" y2="22" stroke="#d4af37" strokeWidth="1" />
              <line x1="100" y1="4" x2="100" y2="34" stroke="#d4af37" strokeWidth="1" />
              <line x1="200" y1="4" x2="200" y2="48" stroke="#d4af37" strokeWidth="1" />
              <line x1="300" y1="4" x2="300" y2="34" stroke="#d4af37" strokeWidth="1" />
              <line x1="400" y1="4" x2="400" y2="22" stroke="#d4af37" strokeWidth="1" />
              
              {/* Mango Leaves (Aambya chi paane) */}
              <ellipse cx="4.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 4.5 8.7)" />
              <ellipse cx="13.6" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 13.6 16.7)" />
              <ellipse cx="22.7" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 22.7 23.0)" />
              <ellipse cx="31.8" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 31.8 27.4)" />
              <ellipse cx="40.9" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 40.9 30.1)" />
              <ellipse cx="50.0" cy="36.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 50.0 31.0)" />
              <ellipse cx="59.1" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 59.1 30.1)" />
              <ellipse cx="68.2" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 68.2 27.4)" />
              <ellipse cx="77.3" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 77.3 23.0)" />
              <ellipse cx="86.4" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 86.4 16.7)" />
              <ellipse cx="95.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 95.5 8.7)" />
              <ellipse cx="104.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 104.5 8.7)" />
              <ellipse cx="113.6" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 113.6 16.7)" />
              <ellipse cx="122.7" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 122.7 23.0)" />
              <ellipse cx="131.8" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 131.8 27.4)" />
              <ellipse cx="140.9" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 140.9 30.1)" />
              <ellipse cx="150.0" cy="36.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 150.0 31.0)" />
              <ellipse cx="159.1" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 159.1 30.1)" />
              <ellipse cx="168.2" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 168.2 27.4)" />
              <ellipse cx="177.3" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 177.3 23.0)" />
              <ellipse cx="186.4" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 186.4 16.7)" />
              <ellipse cx="195.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 195.5 8.7)" />
              <ellipse cx="204.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 204.5 8.7)" />
              <ellipse cx="213.6" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 213.6 16.7)" />
              <ellipse cx="222.7" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 222.7 23.0)" />
              <ellipse cx="231.8" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 231.8 27.4)" />
              <ellipse cx="240.9" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 240.9 30.1)" />
              <ellipse cx="250.0" cy="36.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 250.0 31.0)" />
              <ellipse cx="259.1" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 259.1 30.1)" />
              <ellipse cx="268.2" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 268.2 27.4)" />
              <ellipse cx="277.3" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 277.3 23.0)" />
              <ellipse cx="286.4" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 286.4 16.7)" />
              <ellipse cx="295.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 295.5 8.7)" />
              <ellipse cx="304.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 304.5 8.7)" />
              <ellipse cx="313.6" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 313.6 16.7)" />
              <ellipse cx="322.7" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 322.7 23.0)" />
              <ellipse cx="331.8" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 331.8 27.4)" />
              <ellipse cx="340.9" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 340.9 30.1)" />
              <ellipse cx="350.0" cy="36.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 350.0 31.0)" />
              <ellipse cx="359.1" cy="35.6" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 359.1 30.1)" />
              <ellipse cx="368.2" cy="32.9" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 368.2 27.4)" />
              <ellipse cx="377.3" cy="28.5" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 377.3 23.0)" />
              <ellipse cx="386.4" cy="22.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(-22 386.4 16.7)" />
              <ellipse cx="395.5" cy="14.2" rx="2.3" ry="6" fill="#1f7a4d" transform="rotate(22 395.5 8.7)" />

              {/* Concentric Marigold Flowers (Zendu che phool) */}
              <circle cx="4.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="4.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="4.5" cy="8.7" r="1.3" fill="#c2410c" />
              <circle cx="13.6" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="13.6" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="13.6" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="22.7" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="22.7" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="22.7" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="31.8" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="31.8" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="31.8" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="40.9" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="40.9" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="40.9" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="50.0" cy="31.0" r="5" fill="#ffb703" />
              <circle cx="50.0" cy="31.0" r="3.3" fill="#f77f00" />
              <circle cx="50.0" cy="31.0" r="1.3" fill="#c2410c" />
              <circle cx="59.1" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="59.1" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="59.1" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="68.2" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="68.2" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="68.2" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="77.3" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="77.3" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="77.3" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="86.4" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="86.4" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="86.4" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="95.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="95.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="95.5" cy="8.7" r="1.3" fill="#c2410c" />
              <circle cx="104.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="104.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="104.5" cy="8.7" r="1.3" fill="#c2410c" />
              <circle cx="113.6" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="113.6" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="113.6" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="122.7" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="122.7" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="122.7" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="131.8" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="131.8" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="131.8" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="140.9" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="140.9" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="140.9" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="150.0" cy="31.0" r="5" fill="#ffb703" />
              <circle cx="150.0" cy="31.0" r="3.3" fill="#f77f00" />
              <circle cx="150.0" cy="31.0" r="1.3" fill="#c2410c" />
              <circle cx="159.1" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="159.1" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="159.1" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="168.2" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="168.2" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="168.2" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="177.3" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="177.3" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="177.3" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="186.4" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="186.4" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="186.4" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="195.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="195.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="195.5" cy="8.7" r="1.3" fill="#c2410c" />
              <circle cx="204.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="204.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="204.5" cy="8.7" r="1.3" fill="#c2410c" />
              <circle cx="213.6" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="213.6" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="213.6" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="222.7" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="222.7" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="222.7" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="231.8" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="231.8" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="231.8" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="240.9" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="240.9" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="240.9" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="250.0" cy="31.0" r="5" fill="#ffb703" />
              <circle cx="250.0" cy="31.0" r="3.3" fill="#f77f00" />
              <circle cx="250.0" cy="31.0" r="1.3" fill="#c2410c" />
              <circle cx="259.1" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="259.1" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="259.1" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="268.2" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="268.2" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="268.2" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="277.3" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="277.3" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="277.3" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="286.4" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="286.4" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="286.4" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="295.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="295.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="295.5" cy="8.7" r="1.3" fill="#c2410c" />
              <circle cx="304.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="304.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="304.5" cy="8.7" r="1.3" fill="#c2410c" />
              <circle cx="313.6" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="313.6" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="313.6" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="322.7" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="322.7" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="322.7" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="331.8" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="331.8" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="331.8" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="340.9" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="340.9" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="340.9" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="350.0" cy="31.0" r="5" fill="#ffb703" />
              <circle cx="350.0" cy="31.0" r="3.3" fill="#f77f00" />
              <circle cx="350.0" cy="31.0" r="1.3" fill="#c2410c" />
              <circle cx="359.1" cy="30.1" r="5" fill="#f77f00" />
              <circle cx="359.1" cy="30.1" r="3.3" fill="#ffb703" />
              <circle cx="359.1" cy="30.1" r="1.3" fill="#c2410c" />
              <circle cx="368.2" cy="27.4" r="5" fill="#ffb703" />
              <circle cx="368.2" cy="27.4" r="3.3" fill="#f77f00" />
              <circle cx="368.2" cy="27.4" r="1.3" fill="#c2410c" />
              <circle cx="377.3" cy="23.0" r="5" fill="#f77f00" />
              <circle cx="377.3" cy="23.0" r="3.3" fill="#ffb703" />
              <circle cx="377.3" cy="23.0" r="1.3" fill="#c2410c" />
              <circle cx="386.4" cy="16.7" r="5" fill="#ffb703" />
              <circle cx="386.4" cy="16.7" r="3.3" fill="#f77f00" />
              <circle cx="386.4" cy="16.7" r="1.3" fill="#c2410c" />
              <circle cx="395.5" cy="8.7" r="5" fill="#f77f00" />
              <circle cx="395.5" cy="8.7" r="3.3" fill="#ffb703" />
              <circle cx="395.5" cy="8.7" r="1.3" fill="#c2410c" />

              {/* Vertical hanging flower tassels */}
              <circle cx="0" cy="9" r="4.2" fill="#f77f00" />
              <circle cx="0" cy="9" r="2.6" fill="#ffb703" />
              <circle cx="0" cy="16.2" r="4.0" fill="#ffb703" />
              <circle cx="0" cy="16.2" r="2.5" fill="#f77f00" />
              <circle cx="0" cy="27" r="3.4" fill="#d4af37" stroke="#785b14" strokeWidth="0.6" />
              <circle cx="-1" cy="26" r="1" fill="#fce8a9" />

              <circle cx="100" cy="9" r="4.2" fill="#f77f00" />
              <circle cx="100" cy="9" r="2.6" fill="#ffb703" />
              <circle cx="100" cy="16.2" r="4.0" fill="#ffb703" />
              <circle cx="100" cy="16.2" r="2.5" fill="#f77f00" />
              <circle cx="100" cy="23.4" r="3.9" fill="#f77f00" />
              <circle cx="100" cy="23.4" r="2.4" fill="#ffb703" />
              <circle cx="100" cy="30.6" r="3.8" fill="#ffb703" />
              <circle cx="100" cy="30.6" r="2.3" fill="#f77f00" />
              <circle cx="100" cy="39" r="3.4" fill="#d4af37" stroke="#785b14" strokeWidth="0.6" />
              <circle cx="99" cy="38" r="1" fill="#fce8a9" />

              <circle cx="200" cy="9" r="4.2" fill="#f77f00" />
              <circle cx="200" cy="9" r="2.6" fill="#ffb703" />
              <circle cx="200" cy="16.2" r="4.0" fill="#ffb703" />
              <circle cx="200" cy="16.2" r="2.5" fill="#f77f00" />
              <circle cx="200" cy="23.4" r="3.9" fill="#f77f00" />
              <circle cx="200" cy="23.4" r="2.4" fill="#ffb703" />
              <circle cx="200" cy="30.6" r="3.8" fill="#ffb703" />
              <circle cx="200" cy="30.6" r="2.3" fill="#f77f00" />
              <circle cx="200" cy="37.8" r="3.6" fill="#f77f00" />
              <circle cx="200" cy="37.8" r="2.2" fill="#ffb703" />
              <circle cx="200" cy="45.0" r="3.5" fill="#ffb703" />
              <circle cx="200" cy="45.0" r="2.1" fill="#f77f00" />
              <circle cx="200" cy="53" r="3.4" fill="#d4af37" stroke="#785b14" strokeWidth="0.6" />
              <circle cx="199" cy="52" r="1" fill="#fce8a9" />

              <circle cx="300" cy="9" r="4.2" fill="#f77f00" />
              <circle cx="300" cy="9" r="2.6" fill="#ffb703" />
              <circle cx="300" cy="16.2" r="4.0" fill="#ffb703" />
              <circle cx="300" cy="16.2" r="2.5" fill="#f77f00" />
              <circle cx="300" cy="23.4" r="3.9" fill="#f77f00" />
              <circle cx="300" cy="23.4" r="2.4" fill="#ffb703" />
              <circle cx="300" cy="30.6" r="3.8" fill="#ffb703" />
              <circle cx="300" cy="30.6" r="2.3" fill="#f77f00" />
              <circle cx="300" cy="39" r="3.4" fill="#d4af37" stroke="#785b14" strokeWidth="0.6" />
              <circle cx="299" cy="38" r="1" fill="#fce8a9" />

              <circle cx="400" cy="9" r="4.2" fill="#f77f00" />
              <circle cx="400" cy="9" r="2.6" fill="#ffb703" />
              <circle cx="400" cy="16.2" r="4.0" fill="#ffb703" />
              <circle cx="400" cy="16.2" r="2.5" fill="#f77f00" />
              <circle cx="400" cy="27" r="3.4" fill="#d4af37" stroke="#785b14" strokeWidth="0.6" />
              <circle cx="399" cy="26" r="1" fill="#fce8a9" />
            </svg>

            {/* Twinkling sparks */}
            <i className="spark" style={{ '--x': '12%', '--y': '24%', '--d': '0s' } as any} />
            <i className="spark" style={{ '--x': '86%', '--y': '30%', '--d': '.8s' } as any} />
            <i className="spark" style={{ '--x': '20%', '--y': '58%', '--d': '1.6s' } as any} />
            <i className="spark" style={{ '--x': '80%', '--y': '64%', '--d': '2.2s' } as any} />
            <i className="spark" style={{ '--x': '8%', '--y': '82%', '--d': '.4s' } as any} />
            <i className="spark" style={{ '--x': '90%', '--y': '88%', '--d': '1.2s' } as any} />

            <div className="reveal">
              <p className="fest">🪔 {festivalTitle} 🪔</p>

              <div className="logo-wrap">
                <svg className="halo" viewBox="0 0 200 200" aria-hidden="true">
                  <defs>
                    <radialGradient id="gHalo">
                      <stop offset=".62" stopColor="#ffb703" stopOpacity="0" />
                      <stop offset="1" stopColor="#ffb703" stopOpacity=".18" />
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="99" fill="url(#gHalo)" />
                  <g className="ringB">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <path key={i} transform={`rotate(${i * 22.5} 100 100)`} d="M100 36 C113 25 112 12 100 2 C88 12 87 25 100 36Z" fill="rgba(212,175,55,.16)" stroke="#fce8a9" strokeWidth=".8" />
                    ))}
                  </g>
                  <g className="ringA">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <path key={i} transform={`rotate(${i * 22.5 + 11.25} 100 100)`} d="M100 40 C108 32 107 22 100 14 C93 22 92 32 100 40Z" fill="rgba(247,127,0,.30)" stroke="#e9c15a" strokeWidth=".7" />
                    ))}
                  </g>
                </svg>

                <div className="mandal-logo">
                  {mandalLogo ? (
                    <img src={mandalLogo} alt={mandalName} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-600 via-amber-800 to-red-950 flex flex-col items-center justify-center p-4 text-center">
                      <Sparkles className="w-10 h-10 text-amber-300 mb-1" />
                      <span className="text-[11px] font-bold text-amber-100 leading-tight">{mandalName}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-[#ded5c2] max-w-xs leading-snug">
                {mandalName}
              </p>

              <button 
                type="button" 
                onClick={() => scrollToSlide(1)}
                className="scroll-btn flex items-center gap-2"
              >
                <span>दर्शनासाठी खाली सरकवा</span>
                <span className="animate-bounce">↓</span>
              </button>
            </div>
          </main>
        </section>

        {/* ===================== SLIDE 2: SACRED DARSHAN ===================== */}
        <section className="slide" id="slide2">
          <div className="darshan">
            <div className="darshan-inner">
              {customDarshanUrl ? (
                <img src={customDarshanUrl} alt="श्री दर्शन" />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-[#4a0f1a] via-[#2a0710] to-[#140205] flex flex-col items-center justify-center p-6 text-center text-amber-200">
                  <div className="w-20 h-20 rounded-full border-2 border-amber-400/50 flex items-center justify-center mb-3 bg-amber-500/10">
                    <Sparkles className="w-10 h-10 text-amber-300" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-amber-100">॥ श्री दुर्गामाता दर्शन ॥</h4>
                  <p className="text-xs text-amber-200/60 mt-1">पावन दर्शन आणि आशीर्वाद</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <h2 className="jai-line">॥ श्री महालक्ष्मी प्रसन्न ॥</h2>
            <p className="darshan-sub">{mandalName}</p>
          </div>

          <div 
            onClick={() => scrollToSlide(2)}
            className="swipe-hint cursor-pointer hover:opacity-100 transition-opacity"
          >
            <span>पावती पाहण्यासाठी वर सरकवा</span>
            <span className="animate-bounce">↓</span>
          </div>
        </section>

        {/* ===================== SLIDE 3: OFFICIAL RECEIPT CARD ===================== */}
        <section className="slide overflow-y-auto py-6" id="slide3">
          <div className="w-full max-w-[380px] mx-auto px-4 flex flex-col items-center my-auto">
            {/* Standard Actual Pavti Component */}
            <ReceiptPreview receipt={effectiveReceipt} language={language} />

            {/* PENDING PAYMENT CALL-TO-ACTION */}
            {isPending && (
              <div className="w-full mt-3 p-3 bg-amber-950/80 border border-amber-500/50 rounded-2xl space-y-2 text-center shadow-xl">
                <p className="text-xs font-bold text-amber-200 flex items-center justify-center gap-1.5">
                  <CreditCard size={14} className="text-amber-400" />
                  <span>UPI द्वारे थेट ऑनलाईन भरणा करा</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePayViaUpi}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <QrCode size={13} />
                    <span>GPay / PhonePe / Paytm</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClaimPaid}
                    disabled={isClaiming || isClaimed}
                    className="py-2 px-3 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 disabled:opacity-60 transition-colors shrink-0"
                  >
                    {isClaimed ? (
                      <><Check size={12} className="text-emerald-400" /> दावा नोंदवला</>
                    ) : (
                      'मी भरणा केला'
                    )}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="button"
              onClick={() => scrollToSlide(3)}
              className="mt-4 text-xs font-semibold text-amber-200/90 hover:text-amber-100 flex items-center gap-1 bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full border border-amber-500/30 shadow-lg transition-all"
            >
              <span>आशीर्वाद व शेअर पर्याय</span>
              <span className="animate-bounce">↓</span>
            </button>
          </div>
        </section>

        {/* ===================== SLIDE 4: BLESSING & ACTIONS ===================== */}
        <section className="slide" id="slide4">
          <div className="corner-motif tl" />
          <div className="corner-motif tr" />
          <div className="corner-motif bl" />
          <div className="corner-motif br" />

          <div className="blessing space-y-3">
            <h3>॥ शुभ आशीर्वाद ॥</h3>
            <div className="bl-rule" />

            <div className="bl-thanks">
              सस्नेह नमस्कार <b>{donorName}</b> जी,
            </div>

            <p className="bl-text">
              {blessingMessage}
            </p>

            <div className="bl-close">
              मनःपूर्वक धन्यवाद! 🙏
            </div>
            <div className="bl-from">
              — {mandalName}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 w-full space-y-2.5 max-w-xs mx-auto">
              {isPending && (
                <button
                  type="button"
                  onClick={handlePayViaUpi}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all hover:scale-[1.02]"
                >
                  <CreditCard size={16} />
                  <span>₹{amount} चा ऑनलाईन भरणा करा (Pay Now)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShareWhatsapp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02]"
              >
                <Share2 size={16} />
                <span>व्हॉट्सॲपवर शेअर करा (Share)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Copy size={14} />
                <span>पावतीची लिंक कॉपी करा (Copy Link)</span>
              </button>

              {onSwitchToStandard && (
                <button
                  type="button"
                  onClick={onSwitchToStandard}
                  className="w-full py-2 px-4 rounded-xl text-amber-200/60 hover:text-amber-100 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileCheck size={14} />
                  <span>साधी पावती पहा (Standard Receipt View)</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
