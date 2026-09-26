import { useState, useCallback } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import FeaturedSponsor from './FeaturedSponsor';
import SponsorCard from './SponsorCard';
import './Sponsors.css';

export default function Sponsors() {
  const mandal = useMandal();
  const { sponsors, identity, sponsorOfTheDay } = mandal;
  const { t, getLocalized } = useLanguage();
  const [ref, isVisible] = useInView();
  const [shareToast, setShareToast] = useState(null);

  // Sharing action
  const handleShare = useCallback(async (sponsor) => {
    const mandalName = getLocalized(identity.name);
    const sponsorName = getLocalized(sponsor.name);
    const sponsorSlug = sponsor.slug || sponsor.id;
    const url = `${window.location.origin}/m/${identity.slug}/sponsor/${sponsorSlug}`;
    const shareTitle = `${mandalName} • ${sponsorName}`;
    const shareText = `${sponsorName} — ${t('celebrationPartners')} supporting ${mandalName}.\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share dismissed');
        }
      }
    }

    // Fallback: clipboard copy
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(`${sponsorName}: ${t('linkCopied')}`);
      setTimeout(() => setShareToast(null), 3000);
    } catch {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  }, [identity, getLocalized, t]);

  // Clean empty state: if no sponsors configured, hide section
  if (!sponsors || sponsors.length === 0) return null;

  const mandalSlug = identity.slug;

  // Presenting Partner (Primary featured)
  const presentingPartner = sponsors.find(s => s.tier === 'presenting');

  // Resolved Sponsor of the Day (only if explicitly configured and different from presenting)
  const resolvedSotd = sponsorOfTheDay
    ? (typeof sponsorOfTheDay === 'string'
        ? sponsors.find(s => s.id === sponsorOfTheDay)
        : sponsorOfTheDay)
    : null;

  // Group remaining sponsors into structured tiers
  // Exclude presenting partner from standard list so it's not redundantly duplicated
  const otherSponsors = sponsors.filter(s => s.id !== presentingPartner?.id);

  const platinumPartners = otherSponsors.filter(s => s.tier === 'platinum');
  const goldPartners = otherSponsors.filter(s => s.tier === 'gold');
  const silverPartners = otherSponsors.filter(s => s.tier === 'silver');
  const communityPartners = otherSponsors.filter(s => s.tier === 'community');
  const festivalPartners = otherSponsors.filter(s => s.tier === 'festival' || s.tier === 'supporter');

  return (
    <section id="sponsors" className="sponsors section" aria-label={t('celebrationPartners')}>
      <div ref={ref} className={`container reveal ${isVisible ? 'reveal--visible' : ''}`}>
        
        {/* Section Header */}
        <header className="sponsors__header">
          <p className="eyebrow sponsors__eyebrow">{t('ourSupporters')}</p>
          <h2 className="heading-display heading-display--lg sponsors__title">
            {t('celebrationPartners')}
          </h2>
          <p className="sponsors__subtitle">
            {t('celebrationPartnersSubtitle')}
          </p>
        </header>

        {/* Optional Sponsor of the Day Highlight */}
        {resolvedSotd && (
          <aside className="sponsors__sotd-banner" aria-label={t('todaysCelebrationPartner')}>
            <span className="sponsors__sotd-badge">
              ✦ {t('todaysCelebrationPartner')}
            </span>
            <span className="sponsors__sotd-name">
              {getLocalized(resolvedSotd.name)}
            </span>
            {resolvedSotd.description && (
              <span className="sponsors__sotd-desc">
                — {getLocalized(resolvedSotd.description)}
              </span>
            )}
          </aside>
        )}

        {/* Presenting Partner (Honored Featured Block) */}
        {presentingPartner && (
          <div className="sponsors__presenting-wrapper">
            <FeaturedSponsor
              sponsor={presentingPartner}
              mandalSlug={mandalSlug}
              onShare={handleShare}
            />
          </div>
        )}

        {/* Tier Groups — Only tiers containing sponsors are rendered */}
        <div className="sponsors__tiers-container">
          
          {/* Platinum Partners */}
          {platinumPartners.length > 0 && (
            <div className="sponsors__tier-group">
              <div className="sponsors__tier-heading-wrap">
                <span className="sponsors__tier-line" aria-hidden="true" />
                <h3 className="sponsors__tier-heading sponsors__tier-heading--platinum">
                  {t('platinumPartner')}
                </h3>
                <span className="sponsors__tier-line" aria-hidden="true" />
              </div>
              <div className="sponsors__grid">
                {platinumPartners.map(sponsor => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    mandalSlug={mandalSlug}
                    onShare={handleShare}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Gold Partners */}
          {goldPartners.length > 0 && (
            <div className="sponsors__tier-group">
              <div className="sponsors__tier-heading-wrap">
                <span className="sponsors__tier-line" aria-hidden="true" />
                <h3 className="sponsors__tier-heading sponsors__tier-heading--gold">
                  {t('goldSponsor')}
                </h3>
                <span className="sponsors__tier-line" aria-hidden="true" />
              </div>
              <div className="sponsors__grid">
                {goldPartners.map(sponsor => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    mandalSlug={mandalSlug}
                    onShare={handleShare}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Silver Partners */}
          {silverPartners.length > 0 && (
            <div className="sponsors__tier-group">
              <div className="sponsors__tier-heading-wrap">
                <span className="sponsors__tier-line" aria-hidden="true" />
                <h3 className="sponsors__tier-heading sponsors__tier-heading--silver">
                  {t('silverSponsor')}
                </h3>
                <span className="sponsors__tier-line" aria-hidden="true" />
              </div>
              <div className="sponsors__grid">
                {silverPartners.map(sponsor => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    mandalSlug={mandalSlug}
                    onShare={handleShare}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Community Partners */}
          {communityPartners.length > 0 && (
            <div className="sponsors__tier-group">
              <div className="sponsors__tier-heading-wrap">
                <span className="sponsors__tier-line" aria-hidden="true" />
                <h3 className="sponsors__tier-heading sponsors__tier-heading--community">
                  {t('communityPartner')}
                </h3>
                <span className="sponsors__tier-line" aria-hidden="true" />
              </div>
              <div className="sponsors__grid">
                {communityPartners.map(sponsor => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    mandalSlug={mandalSlug}
                    onShare={handleShare}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Festival Supporters & Local Partners */}
          {festivalPartners.length > 0 && (
            <div className="sponsors__tier-group">
              <div className="sponsors__tier-heading-wrap">
                <span className="sponsors__tier-line" aria-hidden="true" />
                <h3 className="sponsors__tier-heading sponsors__tier-heading--festival">
                  {t('festivalPartner')}
                </h3>
                <span className="sponsors__tier-line" aria-hidden="true" />
              </div>
              <div className="sponsors__grid">
                {festivalPartners.map(sponsor => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    mandalSlug={mandalSlug}
                    onShare={handleShare}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Toast Notification */}
        {shareToast && (
          <div className="sponsors__toast" role="status" aria-live="polite">
            <span>{shareToast}</span>
          </div>
        )}

      </div>
    </section>
  );
}
