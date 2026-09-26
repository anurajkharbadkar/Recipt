import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * SponsorShareCard — 9:16 vertical format visual card for WhatsApp Status, Instagram Story, and Facebook Story
 */
export default function SponsorShareCard({ sponsor, mandal, profileUrl }) {
  const { t, getLocalized } = useLanguage();
  const [logoError, setLogoError] = useState(false);
  const [qrSvg, setQrSvg] = useState('');

  const mandalName = getLocalized(mandal.identity.name);
  const festivalName = getLocalized(mandal.festival.name);
  const sponsorName = getLocalized(sponsor.name);
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

  useEffect(() => {
    if (!profileUrl) return;
    QRCode.toString(profileUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#241F1D',
        light: '#FFFFFF',
      },
      width: 120,
    })
      .then(svg => setQrSvg(svg))
      .catch(err => console.error('Failed to generate card QR:', err));
  }, [profileUrl]);

  return (
    <section className="sponsor-share-card-wrapper" aria-labelledby="share-card-heading">
      <div className="sponsor-share-card-header">
        <h3 id="share-card-heading" className="sponsor-share-card-heading">
          {t('socialShareCard')}
        </h3>
        <p className="sponsor-share-card-subheading">
          {t('socialShareCardSubtitle')}
        </p>
        <span className="sponsor-share-card-ratio-tag">
          {t('previewFormatNotice')}
        </span>
      </div>

      <div className="sponsor-share-card-container">
        {/* 9:16 Vertical Creative */}
        <article className={`sponsor-share-card sponsor-share-card--${sponsor.tier}`}>
          {/* Decorative Corner Filigrees */}
          <span className="sponsor-share-card__corner sponsor-share-card__corner--tl" aria-hidden="true" />
          <span className="sponsor-share-card__corner sponsor-share-card__corner--tr" aria-hidden="true" />
          <span className="sponsor-share-card__corner sponsor-share-card__corner--bl" aria-hidden="true" />
          <span className="sponsor-share-card__corner sponsor-share-card__corner--br" aria-hidden="true" />

          {/* Top Section: Proud to Support + Mandal Branding */}
          <div className="sponsor-share-card__top">
            <span className="sponsor-share-card__proud-badge">
              ★ {t('proudToSupport')}
            </span>

            <div className="sponsor-share-card__mandal-wrap">
              {mandal.identity.logoUrl ? (
                <img
                  src={mandal.identity.logoUrl}
                  alt={mandalName}
                  className="sponsor-share-card__mandal-logo"
                />
              ) : (
                <div className="sponsor-share-card__mandal-icon" aria-hidden="true">
                  ॐ
                </div>
              )}
              <div className="sponsor-share-card__mandal-info">
                <h4 className="sponsor-share-card__mandal-name">
                  {mandalName}
                </h4>
                <p className="sponsor-share-card__festival-name">
                  {festivalName}
                </p>
              </div>
            </div>
          </div>

          <div className="sponsor-share-card__divider" aria-hidden="true">
            <span>✦</span>
          </div>

          {/* Center Section: Prominent Sponsor Branding */}
          <div className="sponsor-share-card__center">
            <div className="sponsor-share-card__sponsor-logo-box">
              {sponsor.logoUrl && !logoError ? (
                <img
                  src={sponsor.logoUrl}
                  alt={sponsorName}
                  className="sponsor-share-card__sponsor-logo"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="sponsor-share-card__monogram" aria-hidden="true">
                  {initials}
                </div>
              )}
            </div>

            <div className="sponsor-share-card__sponsor-text">
              <span className={`sponsor-share-card__tier-pill sponsor-share-card__tier-pill--${sponsor.tier}`}>
                {getTierLabel(sponsor.tier)}
              </span>

              <h2 className="sponsor-share-card__sponsor-name">
                {sponsorName}
              </h2>

              {category && (
                <p className="sponsor-share-card__category">
                  {category}
                </p>
              )}
            </div>
          </div>

          {/* Emotional Statement */}
          <div className="sponsor-share-card__statement">
            <p className="sponsor-share-card__quote">
              "{t('supportingOurTradition')}"
            </p>
          </div>

          {/* Bottom Section: QR Scan & URL */}
          <div className="sponsor-share-card__bottom">
            <div className="sponsor-share-card__qr-col">
              {qrSvg && (
                <div
                  className="sponsor-share-card__qr"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  role="img"
                  aria-label={t('scanToView')}
                />
              )}
              <div className="sponsor-share-card__qr-meta">
                <span className="sponsor-share-card__qr-label">
                  {t('scanToView')}
                </span>
                <span className="sponsor-share-card__profile-hint">
                  {mandal.identity.slug} / {sponsor.slug || sponsor.id}
                </span>
              </div>
            </div>

            <div className="sponsor-share-card__epavti-subtle">
              <span>Digital Mandal • ePavtiBook</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
