import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * FeaturedSponsor — Honored Presenting Partner block
 */
export default function FeaturedSponsor({ sponsor, mandalSlug, onShare }) {
  const { t, getLocalized } = useLanguage();
  const [logoError, setLogoError] = useState(false);

  const sponsorName = getLocalized(sponsor.name);
  const sponsorDesc = sponsor.description ? getLocalized(sponsor.description) : null;
  const category = sponsor.category ? getLocalized(sponsor.category) : null;
  const eventAssoc = sponsor.eventAssociation ? getLocalized(sponsor.eventAssociation) : null;
  const offer = sponsor.offer;
  const offerTitle = offer?.title ? getLocalized(offer.title) : null;
  const offerBadge = offer?.badge ? getLocalized(offer.badge) : t('festivalOfferAvailable');

  const initials = sponsor.initials || (sponsorName ? sponsorName.slice(0, 2).toUpperCase() : 'ST');
  const sponsorSlug = sponsor.slug || sponsor.id;
  const profileUrl = `/mandal/${mandalSlug}/sponsor/${sponsorSlug}`;


  return (
    <article className="featured-sponsor" id={`sponsor-${sponsor.id}`}>
      <div className="featured-sponsor__inner">
        {/* Top Header Eyebrow */}
        <div className="featured-sponsor__top">
          <span className="featured-sponsor__badge">
            ★ {t('honoredPartner')}
          </span>
          <span className="featured-sponsor__tier-pill">
            {t('presentingPartner')}
          </span>
        </div>

        <div className="featured-sponsor__content-grid">
          {/* Logo / Monogram Frame */}
          <div className="featured-sponsor__logo-col">
            <div className="featured-sponsor__logo-wrap">
              {sponsor.logoUrl && !logoError ? (
                <img
                  src={sponsor.logoUrl}
                  alt={sponsorName}
                  className="featured-sponsor__logo"
                  loading="eager"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="featured-sponsor__monogram" aria-hidden="true">
                  <span>{initials}</span>
                </div>
              )}
            </div>
          </div>

          {/* Partner Editorial Details */}
          <div className="featured-sponsor__details-col">
            <div className="featured-sponsor__title-wrap">
              <h3 className="heading-display heading-display--md featured-sponsor__name">
                {sponsorName}
              </h3>
              {category && (
                <span className="featured-sponsor__category">
                  {category}
                </span>
              )}
            </div>

            {sponsorDesc && (
              <p className="featured-sponsor__description">
                {sponsorDesc}
              </p>
            )}

            {/* Event Association */}
            {eventAssoc && (
              <div className="featured-sponsor__assoc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{eventAssoc}</span>
              </div>
            )}

            {/* Offer Indicator */}
            {offer && (
              <div className="featured-sponsor__offer" title={offerTitle || offerBadge}>
                <span className="featured-sponsor__offer-tag">{offerBadge}</span>
                {offerTitle && (
                  <span className="featured-sponsor__offer-title">{offerTitle}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="featured-sponsor__actions">
              <Link
                href={profileUrl}
                className="featured-sponsor__btn-view"
                aria-label={`${t('viewPartner')}: ${sponsorName}`}
              >
                <span>{t('viewPartner')}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              {onShare && (
                <button
                  type="button"
                  className="featured-sponsor__btn-share"
                  onClick={() => onShare(sponsor)}
                  aria-label={`${t('sharePartner')}: ${sponsorName}`}
                  title={t('sharePartner')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>{t('sharePartner')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
