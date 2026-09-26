import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * SponsorOffer — Dedicated Festival Offer highlight block
 */
export default function SponsorOffer({ offer, sponsorPhone, onContact }) {
  const { t, getLocalized } = useLanguage();
  const [copiedCode, setCopiedCode] = useState(false);

  if (!offer) return null;

  const title = offer.title ? getLocalized(offer.title) : null;
  const description = offer.description ? getLocalized(offer.description) : null;
  const badge = offer.badge ? getLocalized(offer.badge) : t('festivalOffer');
  const discount = offer.discount || null;
  const code = offer.code || null;
  const validUntil = offer.validUntil || null;
  const terms = offer.terms ? (typeof offer.terms === 'object' ? getLocalized(offer.terms) : offer.terms) : null;

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <section className="sponsor-offer" aria-labelledby="sponsor-offer-title">
      <div className="sponsor-offer__card">
        {/* Top Eyebrow */}
        <div className="sponsor-offer__top">
          <span className="sponsor-offer__badge">
            ★ {badge}
          </span>
          {discount && (
            <span className="sponsor-offer__discount-tag">
              {discount}
            </span>
          )}
        </div>

        {/* Offer Title */}
        {title && (
          <h3 id="sponsor-offer-title" className="sponsor-offer__title">
            {title}
          </h3>
        )}

        {/* Description */}
        {description && (
          <p className="sponsor-offer__desc">
            {description}
          </p>
        )}

        {/* Code & Validity Meta */}
        <div className="sponsor-offer__meta-row">
          {code && (
            <div className="sponsor-offer__code-wrap">
              <span className="sponsor-offer__code-label">{t('offerCode')}:</span>
              <button
                type="button"
                className="sponsor-offer__code-btn"
                onClick={handleCopyCode}
                title="Click to copy promo code"
                aria-label={`Copy code ${code}`}
              >
                <code>{code}</code>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              {copiedCode && (
                <span className="sponsor-offer__copied-hint" role="status" aria-live="polite">
                  ✓ {t('linkCopied')}
                </span>
              )}
            </div>
          )}

          {validUntil && (
            <div className="sponsor-offer__valid-wrap">
              <span className="sponsor-offer__valid-label">{t('offerValidUntil')}:</span>
              <span className="sponsor-offer__valid-val">{validUntil}</span>
            </div>
          )}
        </div>

        {/* Terms */}
        {terms && (
          <p className="sponsor-offer__terms">
            * {t('offerTerms')}: {terms}
          </p>
        )}

        {/* CTA */}
        {sponsorPhone && (
          <div className="sponsor-offer__actions">
            <a
              href={`tel:${sponsorPhone}`}
              className="sponsor-offer__btn-claim"
              onClick={onContact}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{t('contactSponsor')}</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
