import { useState, useMemo } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { formatLocalizedDate } from '@/utils/dateUtils';
import './Bhandara.css';

export default function Bhandara() {
  const { bhandara, identity, sponsors } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView({ threshold: 0.08 });
  const [copied, setCopied] = useState(false);

  // If no Bhandara is configured for this Mandal, cleanly suppress the section
  if (!bhandara) return null;

  const bhandaraTitle = getLocalized(bhandara.title) || t('bhandara');
  const bhandaraDesc = bhandara.description ? getLocalized(bhandara.description) : '';
  const venue = getLocalized(bhandara.venue);
  const address = bhandara.address ? getLocalized(bhandara.address) : '';
  const landmark = bhandara.landmark ? getLocalized(bhandara.landmark) : '';
  const formattedDate = formatLocalizedDate(bhandara.date, language);
  const timeRange = bhandara.startTime
    ? `${bhandara.startTime}${bhandara.endTime ? ` — ${bhandara.endTime}` : ''}`
    : '';

  // Menu grouped by category
  const menuGroups = useMemo(() => {
    if (!bhandara.menu || bhandara.menu.length === 0) return [];
    const groupsMap = new Map();
    for (const item of bhandara.menu) {
      const catName = item.category ? getLocalized(item.category) : t('food') || 'Mahaprasad';
      if (!groupsMap.has(catName)) {
        groupsMap.set(catName, []);
      }
      groupsMap.get(catName).push(item);
    }
    return Array.from(groupsMap.entries()).map(([category, items]) => ({
      category,
      items
    }));
  }, [bhandara.menu, getLocalized, t]);

  // Sponsor resolution
  const sponsor = bhandara.sponsorId ? sponsors?.find(s => s.id === bhandara.sponsorId) : null;
  const sponsorName = sponsor ? getLocalized(sponsor.name) : '';
  const sponsorInitials = sponsor?.initials || (sponsorName ? sponsorName.slice(0, 2) : 'SP');

  // Share message preparation
  const mandalName = getLocalized(identity?.name) || '';
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#bhandara`
    : '';

  const shareText = language === 'mr'
    ? `🚩 ${mandalName} — ${bhandaraTitle}\n📅 दिनांक: ${formattedDate}\n⏰ वेळ: ${timeRange}\n📍 स्थळ: ${venue}${address ? `, ${address}` : ''}\nसर्व भाविकांचे सस्नेह स्वागत आहे!`
    : language === 'hi'
    ? `🚩 ${mandalName} — ${bhandaraTitle}\n📅 दिनांक: ${formattedDate}\n⏰ समय: ${timeRange}\n📍 स्थान: ${venue}${address ? `, ${address}` : ''}\nसभी श्रद्धालुओं का सप्रेम स्वागत है!`
    : `🚩 ${mandalName} — ${bhandaraTitle}\n📅 Date: ${formattedDate}\n⏰ Time: ${timeRange}\n📍 Venue: ${venue}${address ? `, ${address}` : ''}\nCordially inviting all devotees and families!`;

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${mandalName} — ${bhandaraTitle}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Clipboard fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch {
      // Fallback to WhatsApp link
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="bhandara" className="bhandara section" aria-labelledby="bhandara-heading">
      <div className="container">
        <div
          ref={ref}
          className={`bhandara__wrapper reveal ${isVisible ? 'reveal--visible' : ''}`}
        >
          {/* Section Header */}
          <div className="bhandara__header">
            <div className="bhandara__eyebrow-row">
              <span className="bhandara__sacred-icon" aria-hidden="true">🪔</span>
              <p className="eyebrow">{t('bhandara')}</p>
            </div>
            <h2 id="bhandara-heading" className="heading-display bhandara__title">
              {bhandaraTitle}
            </h2>
            <p className="bhandara__subtitle">
              {t('bhandaraSubtitle')}
            </p>
          </div>

          {/* Optional Featured Image */}
          {bhandara.image && (
            <div className="bhandara__banner">
              <img src={bhandara.image} alt={bhandaraTitle} loading="lazy" />
              <div className="bhandara__banner-overlay" aria-hidden="true" />
            </div>
          )}

          {/* Editorial Two-Column Layout */}
          <div className="bhandara__content-grid">
            {/* Left Column: Event Details & Guidelines */}
            <div className="bhandara__info-col">
              {/* Description */}
              {bhandaraDesc && (
                <div className="bhandara__description-box">
                  <p className="bhandara__description-text">{bhandaraDesc}</p>
                </div>
              )}

              {/* Date & Time Highlight Card */}
              <div className="bhandara__meta-card">
                <div className="bhandara__meta-block">
                  <div className="bhandara__meta-icon-wrap" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span className="bhandara__meta-label">{t('date')}</span>
                    <p className="bhandara__meta-value">{formattedDate}</p>
                  </div>
                </div>

                {timeRange && (
                  <div className="bhandara__meta-block">
                    <div className="bhandara__meta-icon-wrap" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <span className="bhandara__meta-label">{t('time')}</span>
                      <p className="bhandara__meta-value">{timeRange}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Venue & Location Card */}
              <div className="bhandara__venue-card">
                <div className="bhandara__venue-header">
                  <div className="bhandara__meta-icon-wrap" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <span className="bhandara__meta-label">{t('venue')}</span>
                    <h3 className="bhandara__venue-name">{venue}</h3>
                  </div>
                </div>

                {address && (
                  <p className="bhandara__venue-address">{address}</p>
                )}

                {landmark && (
                  <p className="bhandara__venue-landmark">
                    <span className="bhandara__landmark-label">{t('landmark')}:</span> {landmark}
                  </p>
                )}

                {bhandara.mapsUrl && (
                  <div className="bhandara__maps-row">
                    <a
                      href={bhandara.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bhandara__maps-link"
                      aria-label={`${t('viewOnMaps')} - ${venue}`}
                    >
                      <span>{t('viewOnMaps')}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Important Instructions if available */}
              {bhandara.instructions && bhandara.instructions.length > 0 && (
                <div className="bhandara__instructions-box">
                  <h4 className="bhandara__instructions-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>{t('importantInstructions')}</span>
                  </h4>
                  <ul className="bhandara__instructions-list">
                    {bhandara.instructions.map((inst, idx) => (
                      <li key={idx} className="bhandara__instruction-item">
                        <span className="bhandara__instruction-bullet" aria-hidden="true">✦</span>
                        <span>{getLocalized(inst)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sponsor & Share Bar */}
              <div className="bhandara__footer-actions">
                {/* Sponsor if configured */}
                {sponsor && (
                  <div className="bhandara__partner-box">
                    <span className="bhandara__partner-eyebrow">{t('bhandaraPartner')}</span>
                    <div className="bhandara__partner-info">
                      <div className="bhandara__partner-logo" aria-hidden="true">
                        {sponsor.logoUrl ? (
                          <img src={sponsor.logoUrl} alt={sponsorName} />
                        ) : (
                          <span>{sponsorInitials}</span>
                        )}
                      </div>
                      <div className="bhandara__partner-name-wrap">
                        <span className="bhandara__partner-name">{sponsorName}</span>
                        <a href={`#sponsor-${sponsor.id}`} className="bhandara__partner-link">
                          {t('viewPartner')} →
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Share Button */}
                <div className="bhandara__share-wrap">
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm bhandara__share-btn"
                    onClick={handleShare}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span>{copied ? t('linkCopied') : t('shareBhandara')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Structured Mahaprasad Menu */}
            <div className="bhandara__menu-col">
              <div className="bhandara__menu-card">
                <div className="bhandara__menu-header">
                  <div className="bhandara__menu-icon-wrap" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="bhandara__menu-title">{t('bhandaraMenu')}</h3>
                    <p className="bhandara__menu-sub">{t('food')}</p>
                  </div>
                </div>

                {menuGroups.length > 0 ? (
                  <div className="bhandara__menu-groups">
                    {menuGroups.map((group, gIdx) => (
                      <div key={gIdx} className="bhandara__menu-group">
                        <div className="bhandara__group-title-row">
                          <h4 className="bhandara__group-title">{group.category}</h4>
                          <span className="bhandara__group-line" aria-hidden="true" />
                        </div>
                        <ul className="bhandara__group-items">
                          {group.items.map((item) => (
                            <li key={item.id} className="bhandara__menu-item">
                              <span className="bhandara__item-dot" aria-hidden="true" />
                              <span className="bhandara__item-name">{getLocalized(item.name)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="bhandara__no-menu">{t('food')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
