'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, Mail, Share2, Award, ArrowLeft, Download,
  ExternalLink, MessageCircle, Gift, Sparkles, QrCode, CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';
import { Language, mandalTranslations, supportedLanguages } from './MandalI18n';

interface SponsorProfileViewProps {
  mandalSlug: string;
  mandalName: string;
  mandalLogo?: string;
  sponsor: {
    id: string;
    name: string;
    logoUrl?: string;
    tier?: string;
    category?: string;
    phone?: string;
    email?: string;
    address?: string;
    websiteUrl?: string;
    offerTitle?: string;
    offerDescription?: string;
    offerCode?: string;
    offerValidUntil?: string;
    sponsoredEvents?: string[];
  };
}

export default function SponsorProfileView({
  mandalSlug,
  mandalName,
  mandalLogo,
  sponsor,
}: SponsorProfileViewProps) {
  const [lang, setLang] = useState<Language>('mr');
  const [downloadingCard, setDownloadingCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => mandalTranslations[lang]?.[key] || mandalTranslations.en[key] || key;

  const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://our.epavtibook.com/mandal/${mandalSlug}/sponsor/${sponsor.id}`;
  const mandalHomeUrl = `/mandal/${mandalSlug}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${sponsor.name} • ${mandalName}`,
        text: `${sponsor.name} is an official celebration partner for ${mandalName}. View exclusive festival offers:`,
        url: pageUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(pageUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDownloadShareCard = async () => {
    if (!shareCardRef.current) return;
    try {
      setDownloadingCard(true);
      toast.loading('Generating 9:16 Social Share Card...', { id: 'card-toast' });

      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `${sponsor.name.toLowerCase().replace(/\s+/g, '-')}-sponsor-card.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Share card downloaded successfully!', { id: 'card-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export share card', { id: 'card-toast' });
    } finally {
      setDownloadingCard(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F3EA] text-[#241F1D] pb-16 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#E6DED2] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link
            href={mandalHomeUrl}
            className="flex items-center gap-1.5 text-xs font-bold text-[#7A1830] hover:text-[#4A0D1C] transition-colors"
          >
            <ArrowLeft size={16} /> {t('backToMandal')}
          </Link>

          <span className="text-xs font-bold text-[#A97832] truncate max-w-[180px] sm:max-w-xs">
            🚩 {mandalName}
          </span>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[#F4EDE0] p-1 rounded-xl border border-[#D9CEBC]">
            {supportedLanguages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                  lang === l.code
                    ? 'bg-[#7A1830] text-white shadow-xs'
                    : 'text-[#766E68] hover:text-[#241F1D]'
                }`}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-8">
        
        {/* Sponsor Profile Hero */}
        <div className="bg-[#FFFDF8] border border-[#E6DED2] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Logo */}
            {sponsor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-[#A97832]/40 object-contain p-2 bg-[#FFFDF8] shadow-md shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#A97832]/10 border-2 border-[#A97832]/40 flex items-center justify-center font-bold text-[#A97832] text-4xl shadow-md shrink-0">
                🏅
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#7A1830] text-white text-[11px] font-extrabold uppercase tracking-wider">
                  {sponsor.tier || t('goldSponsor')}
                </span>
                {sponsor.category && (
                  <span className="px-3 py-1 rounded-full bg-[#A97832]/10 border border-[#A97832]/30 text-[#A97832] text-[11px] font-bold">
                    {sponsor.category}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#241F1D] tracking-tight">
                {sponsor.name}
              </h1>

              <p className="text-xs sm:text-sm text-[#766E68] font-semibold">
                🤝 {t('officialCelebrationPartner')} • {mandalName}
              </p>

              {/* Action Bar */}
              <div className="pt-3 flex items-center justify-center sm:justify-start flex-wrap gap-3">
                <button
                  onClick={handleShare}
                  className="px-5 py-2.5 rounded-xl bg-[#7A1830] hover:bg-[#4A0D1C] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
                >
                  <Share2 size={15} /> {t('shareSponsor')}
                </button>

                {sponsor.phone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=91${sponsor.phone}&text=${encodeURIComponent(`Hi ${sponsor.name}, I found your business on ${mandalName} webpage.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Festival Offer & Contact Info */}
          <div className="space-y-6">
            
            {/* Festival Exclusive Offer Card */}
            {(sponsor.offerTitle || sponsor.offerDescription) && (
              <div className="bg-[#FFFDF8] border-2 border-[#A97832]/40 rounded-3xl p-6 space-y-3 shadow-xs bg-gradient-to-br from-[#A97832]/[0.05] via-[#FFFDF8] to-[#FFFDF8]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A97832] text-white text-[11px] font-bold uppercase tracking-wider">
                  <Gift size={13} /> {t('festivalOffer')}
                </span>

                <h3 className="text-lg font-extrabold text-[#241F1D]">
                  {sponsor.offerTitle || 'Festival Special Devotee Discount'}
                </h3>

                {sponsor.offerDescription && (
                  <p className="text-xs text-[#766E68] leading-relaxed">
                    {sponsor.offerDescription}
                  </p>
                )}

                {sponsor.offerCode && (
                  <div className="p-3 rounded-xl bg-[#F4EDE0] border border-dashed border-[#A97832] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#766E68] uppercase">Voucher Code</p>
                      <p className="text-sm font-mono font-extrabold text-[#7A1830]">{sponsor.offerCode}</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#A97832]">Show at store</span>
                  </div>
                )}
              </div>
            )}

            {/* Contact & Address */}
            <div className="bg-[#FFFDF8] border border-[#E6DED2] rounded-3xl p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#241F1D] flex items-center gap-2">
                <MapPin size={16} className="text-[#7A1830]" /> Business Address & Contact
              </h3>

              {sponsor.address && (
                <p className="text-xs text-[#766E68] leading-relaxed">
                  {sponsor.address}
                </p>
              )}

              {sponsor.phone && (
                <p className="text-xs text-[#241F1D] font-semibold flex items-center gap-2">
                  <Phone size={14} className="text-[#A97832]" /> Phone: {sponsor.phone}
                </p>
              )}

              {sponsor.email && (
                <p className="text-xs text-[#241F1D] font-semibold flex items-center gap-2">
                  <Mail size={14} className="text-[#A97832]" /> Email: {sponsor.email}
                </p>
              )}

              {sponsor.websiteUrl && (
                <a
                  href={sponsor.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A1830] hover:underline pt-1"
                >
                  <ExternalLink size={13} /> Visit Official Website
                </a>
              )}
            </div>
          </div>

          {/* Right Column: QR Share Code & 9:16 Social Card Export */}
          <div className="space-y-6">
            
            {/* Dynamic QR Code */}
            <div className="bg-[#FFFDF8] border border-[#E6DED2] rounded-3xl p-6 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#A97832]/10 border border-[#A97832]/30 flex items-center justify-center text-[#A97832] mx-auto">
                <QrCode size={20} />
              </div>
              <h3 className="text-sm font-extrabold text-[#241F1D]">Scan to View Partner Profile</h3>
              <p className="text-[11px] text-[#766E68]">Point your smartphone camera to open and share</p>

              <div className="p-3 bg-white rounded-2xl border border-[#D9CEBC] inline-block shadow-xs">
                <QRCodeSVG value={pageUrl} size={150} level="H" />
              </div>

              <div>
                <button
                  onClick={handleDownloadShareCard}
                  disabled={downloadingCard}
                  className="px-5 py-2.5 rounded-xl bg-[#A97832] hover:bg-[#8A5E22] text-white text-xs font-bold shadow-xs transition-all inline-flex items-center gap-2"
                >
                  <Download size={14} /> Download 9:16 Social Poster
                </button>
              </div>
            </div>

            {/* Hidden 9:16 Social Card (used by html-to-image generator) */}
            <div className="overflow-hidden hidden">
              <div
                ref={shareCardRef}
                className="w-[360px] h-[640px] bg-gradient-to-b from-[#7A1830] via-[#4A0D1C] to-[#241F1D] text-white p-6 flex flex-col justify-between rounded-3xl relative"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/20 pb-3">
                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-widest">
                      🚩 {mandalName}
                    </span>
                    <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-md font-bold">
                      {sponsor.tier || 'SPONSOR'}
                    </span>
                  </div>

                  <div className="mt-8 text-center space-y-3">
                    {sponsor.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sponsor.logoUrl} alt="" className="w-20 h-20 rounded-2xl object-contain mx-auto bg-white p-2 border border-white/40 shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-3xl font-bold mx-auto">
                        🏅
                      </div>
                    )}
                    <h2 className="text-2xl font-extrabold">{sponsor.name}</h2>
                    <p className="text-xs text-amber-200">Official Celebration Partner</p>
                  </div>
                </div>

                <div className="space-y-4 text-center">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                    <p className="text-xs font-bold text-amber-300">Scan to Claim Special Offer</p>
                    <div className="p-2 bg-white rounded-xl inline-block mt-2">
                      <QRCodeSVG value={pageUrl} size={110} level="H" />
                    </div>
                  </div>

                  <p className="text-[10px] text-white/60">
                    Digital Mandal Platform • E-PavtiBook
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
