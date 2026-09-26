'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Mandal, Sponsor } from '@/types/mandal';
import { useLanguage } from '@/hooks/useLanguage';
import MandalNotFound from './MandalNotFound';

import SponsorProfileHero from './Sponsors/SponsorProfileHero';
import SponsorOffer from './Sponsors/SponsorOffer';
import SponsorContact from './Sponsors/SponsorContact';
import SponsorEvents from './Sponsors/SponsorEvents';
import SponsorQRCode from './Sponsors/SponsorQRCode';
import SponsorShareCard from './Sponsors/SponsorShareCard';
import './Sponsors/SponsorProfile.css';
import './mandalpage.css';

interface SponsorProfileProps {
  mandal: Mandal | null;
  sponsor: Sponsor | null;
  mandalSlug: string;
  sponsorSlug: string;
}

export default function SponsorProfile({ mandal, sponsor, mandalSlug, sponsorSlug }: SponsorProfileProps) {
  const { t, getLocalized, language, setLanguage, supportedLanguages } = useLanguage();
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Dynamic SEO Page Title & Meta Description
  useEffect(() => {
    if (mandal && sponsor) {
      const mandalName = getLocalized(mandal.identity.name);
      const sponsorName = getLocalized(sponsor.name);
      const festivalName = getLocalized(mandal.festival.name);
      document.title = `${sponsorName} | ${mandalName} — ${t('celebrationPartners')}`;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `${sponsorName} — ${t('officialCelebrationPartner')} supporting ${mandalName} for ${festivalName}.`
        );
      }
    }
    return () => {
      document.title = "E-PavtiBook — Your Mandal's Digital Home";
    };
  }, [mandal, sponsor, getLocalized, t]);

  // Unified Share Action
  const handleShare = useCallback(async () => {
    if (!mandal || !sponsor) return;
    const mandalName = getLocalized(mandal.identity.name);
    const sponsorName = getLocalized(sponsor.name);
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `${sponsorName} • ${mandalName}`;
    const shareText = `${t('shareSuccessMessage')} ${sponsorName}\n${currentUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Share dismissed');
        }
      }
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
      setShareToast(`${sponsorName}: ${t('linkCopied')}`);
      setTimeout(() => setShareToast(null), 3000);
    } catch {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  }, [mandal, sponsor, getLocalized, t]);

  const handleCopyLink = useCallback(async () => {
    if (!sponsor) return;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(currentUrl);
      setShareToast(t('linkCopied'));
      setTimeout(() => setShareToast(null), 3000);
    } catch {
      // Ignore
    }
  }, [sponsor, t]);

  // Handle Invalid Mandal Slug
  if (!mandal) {
    return <MandalNotFound slug={mandalSlug} />;
  }

  const mandalName = getLocalized(mandal.identity.name);
  const mandalHomeUrl = `/mandal/${mandalSlug}#sponsors`;
  const mandalWebsiteUrl = `/mandal/${mandalSlug}`;

  // Handle Invalid Sponsor Slug
  if (!sponsor) {
    return (
      <div className="sponsor-profile-page">
        <header className="sponsor-profile__header-bar">
          <div className="sponsor-profile__header-inner">
            <Link href={mandalHomeUrl} className="sponsor-profile__back-link">
              ← {t('backToMandal')}
            </Link>
          </div>
        </header>

        <main className="sponsor-profile__main">
          <div className="sponsor-hero__card" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)' }}>
            <h2 className="heading-display heading-display--md" style={{ marginBottom: 'var(--space-sm)' }}>
              {t('partnerNotFound')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)', maxWidth: '440px', margin: '0 auto var(--space-xl)' }}>
              {t('partnerNotFoundDesc')}
            </p>
            <div>
              <Link href={mandalHomeUrl} className="sponsor-profile__btn-back-bottom">
                ← {t('backToMandal')}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const profileUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://epavtibook.com/mandal/${mandalSlug}/sponsor/${sponsor.slug || sponsor.id}`;

  return (
    <div className="sponsor-profile-page">
      {/* Top Sticky Navigation Bar */}
      <header className="sponsor-profile__header-bar">
        <div className="sponsor-profile__header-inner">
          <Link
            href={mandalHomeUrl}
            className="sponsor-profile__back-link"
            title={t('backToMandal')}
            aria-label={t('backToMandal')}
          >
            ← {t('backToMandal')}
          </Link>

          <div className="sponsor-profile__mandal-tag">
            <Link href={mandalWebsiteUrl} className="sponsor-profile__mandal-tag-link">
              {mandalName}
            </Link>
          </div>

          {/* Quick Language Switcher */}
          <div className="sponsor-profile__lang-pills" role="group" aria-label="Language selection">
            {supportedLanguages.map((l: any) => (
              <button
                key={l.code}
                type="button"
                className={`sponsor-profile__lang-btn ${language === l.code ? 'sponsor-profile__lang-btn--active' : ''}`}
                onClick={() => setLanguage(l.code)}
                aria-pressed={language === l.code}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="sponsor-profile__main">
        {/* Profile Hero Section */}
        <SponsorProfileHero
          sponsor={sponsor}
          mandal={mandal}
          onShare={handleShare}
        />

        {/* 2-Column Editorial Grid */}
        <div className="sponsor-profile__editorial-grid">
          {/* Left Column: Offer, Events Supported, Contact */}
          <div className="sponsor-profile__col">
            {sponsor.offer && (
              <SponsorOffer
                offer={sponsor.offer}
                sponsorPhone={sponsor.phone}
                onContact={() => {}}
              />
            )}

            <SponsorEvents
              sponsor={sponsor}
              mandal={mandal}
            />

            <SponsorContact
              sponsor={sponsor}
            />
          </div>

          {/* Right Column: QR Code & 9:16 Social Share Card */}
          <div className="sponsor-profile__col">
            <SponsorQRCode
              url={profileUrl}
              sponsorName={getLocalized(sponsor.name)}
              onShare={handleShare}
              onCopy={handleCopyLink}
            />

            <SponsorShareCard
              sponsor={sponsor}
              mandal={mandal}
              profileUrl={profileUrl}
            />
          </div>
        </div>

        {/* Footer Navigation: Back to Mandal & Growth Loop */}
        <footer className="sponsor-profile__footer-nav">
          <Link href={mandalHomeUrl} className="sponsor-profile__btn-back-bottom">
            ← {t('backToMandal')}
          </Link>

          <p className="sponsor-profile__footer-branding">
            {mandalName} • {t('celebrationPartners')}
            <br />
            <span style={{ opacity: 0.7 }}>Digital Mandal powered by ePavtiBook</span>
          </p>
        </footer>
      </main>

      {/* Floating Share Toast */}
      {shareToast && (
        <div className="sponsor-profile__toast" role="status" aria-live="polite">
          <span>{shareToast}</span>
        </div>
      )}
    </div>
  );
}
