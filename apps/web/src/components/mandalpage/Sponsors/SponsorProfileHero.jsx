import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * SponsorProfileHero — Premium hero header honoring the celebration partner in context of the Mandal
 */
export default function SponsorProfileHero({ sponsor, mandal, onShare }) {
  const { t, getLocalized } = useLanguage();
  const [logoError, setLogoError] = useState(false);

  const mandalName = getLocalized(mandal.identity.name);
  const sponsorName = getLocalized(sponsor.name);
  const shortDesc = sponsor.shortDescription ? getLocalized(sponsor.shortDescription) : null;
  const fullDesc = sponsor.fullDescription ? getLocalized(sponsor.fullDescription) : (sponsor.description ? getLocalized(sponsor.description) : null);
  const category = sponsor.category ? getLocalized(sponsor.category) : null;
  const initials = sponsor.initials || (sponsorName ? sponsorName.slice(0, 2).toUpperCase() : 'SP');

  const getTierLabel = (tier) => {
    switch (tier) {
      case 'presenting': return t('presentingPartner');
      case 'platinum': return t('platinumPartner');
      case 'gold': return t('goldSponsor');
      case 'silver': return t('silverSponsor');
      case 'community': return t('communityPartner');
      case 'festival': return t('festivalPartner');
      case 'supporter': return t('communitySupporter');
      default: return tier;
    }
  };

  const mandalHomeUrl = `/mandal/${mandal.identity.slug}#sponsors`;

  return (
    <header className="sponsor-hero">
      {/* Top Banner Context: Mandal Identity */}
      <div className="sponsor-hero__mandal-banner">
        <div className="sponsor-hero__mandal-context">
          <Link href={mandalHomeUrl} className="sponsor-hero__mandal-link">
            <span className="sponsor-hero__mandal-dot" aria-hidden="true" />
            <span className="sponsor-hero__mandal-name">{mandalName}</span>
          </Link>
          <span className="sponsor-hero__mandal-sep" aria-hidden="true">•</span>
          <span className="sponsor-hero__official-badge">{t('officialCelebrationPartner')}</span>
        </div>

        {onShare && (
          <button
            type="button"
            className="sponsor-hero__btn-share-top"
            onClick={onShare}
            aria-label={`${t('shareSponsor')}: ${sponsorName}`}
            title={t('shareSponsor')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{t('shareSponsor')}</span>
          </button>
        )}
      </div>

      {/* Main Identity Card */}
      <div className="sponsor-hero__card">
        <div className="sponsor-hero__identity-row">
          {/* Logo / Monogram Container */}
          <div className="sponsor-hero__logo-box">
            {sponsor.logoUrl && !logoError ? (
              <img
                src={sponsor.logoUrl}
                alt={sponsorName}
                className="sponsor-hero__logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="sponsor-hero__monogram" aria-hidden="true">
                {initials}
              </div>
            )}
          </div>

          {/* Partner Details */}
          <div className="sponsor-hero__details">
            <div className="sponsor-hero__meta-pills">
              <span className={`sponsor-hero__tier-pill sponsor-hero__tier-pill--${sponsor.tier}`}>
                {getTierLabel(sponsor.tier)}
              </span>
              {category && (
                <span className="sponsor-hero__category-pill">
                  {category}
                </span>
              )}
            </div>

            <h1 className="heading-display heading-display--lg sponsor-hero__name">
              {sponsorName}
            </h1>

            {shortDesc && (
              <p className="sponsor-hero__short-desc">
                {shortDesc}
              </p>
            )}
          </div>
        </div>

        {/* Extended Description if available */}
        {fullDesc && fullDesc !== shortDesc && (
          <div className="sponsor-hero__full-desc">
            <p>{fullDesc}</p>
          </div>
        )}
      </div>
    </header>
  );
}
