import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * SponsorCard — Individual celebration partner profile card
 */
export default function SponsorCard({ sponsor, mandalSlug, onShare }) {
  const { t, getLocalized } = useLanguage();
  const [logoError, setLogoError] = useState(false);

  const sponsorName = getLocalized(sponsor.name);
  const sponsorDesc = sponsor.description ? getLocalized(sponsor.description) : null;
  const category = sponsor.category ? getLocalized(sponsor.category) : null;
  const eventAssoc = sponsor.eventAssociation ? getLocalized(sponsor.eventAssociation) : null;
  const offer = sponsor.offer;
  const offerBadge = offer?.badge ? getLocalized(offer.badge) : t('festivalOfferAvailable');
  const offerTitle = offer?.title ? getLocalized(offer.title) : null;

  const initials = sponsor.initials || (sponsorName ? sponsorName.slice(0, 2).toUpperCase() : 'SP');
  const sponsorSlug = sponsor.slug || sponsor.id;
  const profileUrl = `/mandal/${mandalSlug}/sponsor/${sponsorSlug}`;

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

  return (
    <article className={`sponsor-card sponsor-card--${sponsor.tier}`} id={`sponsor-${sponsor.id}`}>
      {/* Top Header: Logo + Tier Meta */}
      <div className="sponsor-card__header">
        <div className={`sponsor-card__logo-wrap sponsor-card__logo-wrap--${sponsor.tier}`}>
          {sponsor.logoUrl && !logoError ? (
            <img
              src={sponsor.logoUrl}
              alt={sponsorName}
              className="sponsor-card__logo"
              loading="lazy"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="sponsor-card__initials" aria-hidden="true">
              {initials}
            </span>
          )}
        </div>

        <div className="sponsor-card__meta">
          <span className={`sponsor-card__tier-pill sponsor-card__tier-pill--${sponsor.tier}`}>
            {getTierLabel(sponsor.tier)}
          </span>
          {category && (
            <span className="sponsor-card__category">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* Sponsor Name & Bio */}
      <div className="sponsor-card__body">
        <h4 className="sponsor-card__name">
          {sponsorName}
        </h4>

        {sponsorDesc && (
          <p className="sponsor-card__description">
            {sponsorDesc}
          </p>
        )}

        {/* Event Association Badge */}
        {eventAssoc && (
          <div className="sponsor-card__event-assoc" title={`${t('supportingEvent')}: ${eventAssoc}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{eventAssoc}</span>
          </div>
        )}

        {/* Subtle Offer Indicator */}
        {offer && (
          <div className="sponsor-card__offer-pill" title={offerTitle || offerBadge}>
            <span className="sponsor-card__offer-dot" aria-hidden="true" />
            <span className="sponsor-card__offer-text">{offerBadge}</span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <footer className="sponsor-card__actions">
        <Link
          href={profileUrl}
          className="sponsor-card__btn-view"
          aria-label={`${t('viewPartner')}: ${sponsorName}`}
        >
          <span>{t('viewPartner')}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {onShare && (
          <button
            type="button"
            className="sponsor-card__btn-share"
            onClick={() => onShare(sponsor)}
            aria-label={`${t('sharePartner')}: ${sponsorName}`}
            title={t('sharePartner')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        )}
      </footer>
    </article>
  );
}
