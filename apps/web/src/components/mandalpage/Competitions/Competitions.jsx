import { useState, useMemo } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { formatLocalizedDate, getCurrentDate } from '@/utils/dateUtils';
import './Competitions.css';

/**
 * Determine status (today, upcoming, completed) based on preview/current date.
 * @param {string} dateString
 * @returns {'today' | 'upcoming' | 'completed' | null}
 */
function getActivityStatus(dateString) {
  if (!dateString) return null;
  const current = getCurrentDate();
  const currentMidnight = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const target = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  if (targetMidnight === currentMidnight) {
    return 'today';
  } else if (targetMidnight < currentMidnight) {
    return 'completed';
  } else {
    return 'upcoming';
  }
}

export default function Competitions() {
  const { competitions, identity, sponsors } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView({ threshold: 0.08 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedRules, setExpandedRules] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // If no competitions or activities are configured, suppress the section entirely
  if (!competitions || !Array.isArray(competitions) || competitions.length === 0) {
    return null;
  }

  // Derive unique categories for optional filter tabs
  const categories = useMemo(() => {
    const cats = new Set();
    competitions.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [competitions]);

  // Filtered activities list
  const filteredActivities = useMemo(() => {
    if (selectedCategory === 'all') return competitions;
    return competitions.filter(c => c.category === selectedCategory);
  }, [competitions, selectedCategory]);

  const toggleRules = (id) => {
    setExpandedRules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const mandalName = getLocalized(identity?.name) || '';

  // Handle sharing an individual activity
  const handleShareActivity = async (comp) => {
    const title = getLocalized(comp.title);
    const dateFormatted = comp.date ? formatLocalizedDate(comp.date, language) : '';
    const timeFormatted = comp.startTime ? `${comp.startTime}${comp.endTime ? ` — ${comp.endTime}` : ''}` : '';
    const venueFormatted = comp.venue ? getLocalized(comp.venue) : '';
    const eligibilityFormatted = comp.eligibility ? getLocalized(comp.eligibility) : '';
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#activities`
      : '';

    const shareText = language === 'mr'
      ? `🚩 ${mandalName}\n🏆 ${title}\n📅 दिनांक: ${dateFormatted}\n⏰ वेळ: ${timeFormatted}\n📍 स्थळ: ${venueFormatted}${eligibilityFormatted ? `\n👥 पात्रता: ${eligibilityFormatted}` : ''}\nअधिक माहितीसाठी अवश्य सहभागी व्हा!`
      : language === 'hi'
      ? `🚩 ${mandalName}\n🏆 ${title}\n📅 दिनांक: ${dateFormatted}\n⏰ समय: ${timeFormatted}\n📍 स्थान: ${venueFormatted}${eligibilityFormatted ? `\n👥 पात्रता: ${eligibilityFormatted}` : ''}\nअधिक जानकारी हेतु अवश्य भाग लें!`
      : `🚩 ${mandalName}\n🏆 ${title}\n📅 Date: ${dateFormatted}\n⏰ Time: ${timeFormatted}\n📍 Venue: ${venueFormatted}${eligibilityFormatted ? `\n👥 Eligibility: ${eligibilityFormatted}` : ''}\nCordially inviting all to participate!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${mandalName} — ${title}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopiedId(comp.id);
        setTimeout(() => setCopiedId(null), 2500);
        return;
      }
    } catch {
      // Fallback to WhatsApp
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="activities" className="competitions section" aria-labelledby="activities-heading">
      <div className="container">
        <div
          ref={ref}
          className={`competitions__wrapper reveal ${isVisible ? 'reveal--visible' : ''}`}
        >
          {/* Header */}
          <div className="competitions__header">
            <div className="competitions__eyebrow-row">
              <span className="competitions__sacred-icon" aria-hidden="true">🏆</span>
              <p className="eyebrow">{t('competitions')}</p>
            </div>
            <h2 id="activities-heading" className="heading-display competitions__title">
              {t('activitiesHeading')}
            </h2>
            <p className="competitions__subtitle">
              {t('activitiesSubtitle')}
            </p>
          </div>

          {/* Optional Category Filter Pills */}
          {categories.length > 1 && (
            <div
              className="competitions__filter-bar"
              role="tablist"
              aria-label={t('competitions')}
            >
              <button
                type="button"
                role="tab"
                id="tab-all"
                aria-selected={selectedCategory === 'all'}
                aria-controls="activities-grid"
                className={`competitions__filter-btn ${selectedCategory === 'all' ? 'competitions__filter-btn--active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                {t('allActivities')}
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  id={`tab-${cat}`}
                  aria-selected={selectedCategory === cat}
                  aria-controls="activities-grid"
                  className={`competitions__filter-btn ${selectedCategory === cat ? 'competitions__filter-btn--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {t(cat) || cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Activities Grid */}
          <div id="activities-grid" className="competitions__grid" role="region" aria-live="polite">
            {filteredActivities.map(comp => {
              const title = getLocalized(comp.title);
              const description = getLocalized(comp.description);
              const venue = comp.venue ? getLocalized(comp.venue) : '';
              const dateFormatted = comp.date ? formatLocalizedDate(comp.date, language) : '';
              const timeRange = comp.startTime ? `${comp.startTime}${comp.endTime ? ` — ${comp.endTime}` : ''}` : '';
              const eligibility = comp.eligibility ? getLocalized(comp.eligibility) : '';
              const registrationInfo = comp.registrationInfo ? getLocalized(comp.registrationInfo) : '';
              const status = getActivityStatus(comp.date);
              const isRulesOpen = !!expandedRules[comp.id];
              const isCopied = copiedId === comp.id;

              // Sponsor resolution
              const sponsor = comp.sponsorId ? sponsors?.find(s => s.id === comp.sponsorId) : null;
              const sponsorName = sponsor ? getLocalized(sponsor.name) : '';
              const sponsorInitials = sponsor?.initials || (sponsorName ? sponsorName.slice(0, 2) : 'SP');

              // Contact parsing
              const contactObj = typeof comp.contact === 'object' && comp.contact !== null
                ? comp.contact
                : typeof comp.contact === 'string'
                ? { phone: comp.contact }
                : null;
              const contactName = contactObj?.name ? getLocalized(contactObj.name) : '';
              const phoneClean = contactObj?.phone ? contactObj.phone.replace(/[^\d+]/g, '') : '';
              const whatsappClean = contactObj?.whatsapp ? contactObj.whatsapp.replace(/[^\d]/g, '') : '';

              const isFeatured = comp.isFeatured === true;

              return (
                <article
                  key={comp.id}
                  className={`competition-card ${isFeatured ? 'competition-card--featured' : ''}`}
                  aria-labelledby={`comp-title-${comp.id}`}
                >
                  {/* Optional Card Image Banner */}
                  {comp.image && (
                    <div className="competition-card__image-wrap">
                      <img src={comp.image} alt={title} loading="lazy" />
                    </div>
                  )}

                  <div className="competition-card__content">
                    {/* Badges Bar */}
                    <div className="competition-card__badges">
                      {isFeatured && (
                        <span className="competition-badge competition-badge--featured">
                          <span aria-hidden="true">⭐</span> {t('featuredActivity')}
                        </span>
                      )}

                      {status === 'today' && (
                        <span className="competition-badge competition-badge--today">
                          <span className="competition-badge__dot" aria-hidden="true" /> {t('today')}
                        </span>
                      )}

                      {status === 'upcoming' && (
                        <span className="competition-badge competition-badge--upcoming">
                          <span className="competition-badge__circle" aria-hidden="true" /> {t('upcoming')}
                        </span>
                      )}

                      {status === 'completed' && (
                        <span className="competition-badge competition-badge--completed">
                          <span aria-hidden="true">✓</span> {t('completed')}
                        </span>
                      )}

                      {comp.category && (
                        <span className="competition-badge competition-badge--category">
                          {t(comp.category) || comp.category}
                        </span>
                      )}

                      {comp.registrationRequired && (
                        <span className="competition-badge competition-badge--reg">
                          <span aria-hidden="true">📝</span> {t('registrationRequired')}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 id={`comp-title-${comp.id}`} className="competition-card__title">
                      {title}
                    </h3>

                    {/* Description */}
                    {description && (
                      <p className="competition-card__desc">
                        {description}
                      </p>
                    )}

                    {/* Key Metadata (Date, Time, Venue) */}
                    <div className="competition-card__meta-list">
                      {dateFormatted && (
                        <div className="competition-card__meta-row">
                          <span className="competition-card__meta-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </span>
                          <span className="competition-card__meta-text">
                            <strong>{t('date')}:</strong> {dateFormatted}
                          </span>
                        </div>
                      )}

                      {timeRange && (
                        <div className="competition-card__meta-row">
                          <span className="competition-card__meta-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </span>
                          <span className="competition-card__meta-text">
                            <strong>{t('time')}:</strong> {timeRange}
                          </span>
                        </div>
                      )}

                      {venue && (
                        <div className="competition-card__meta-row">
                          <span className="competition-card__meta-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </span>
                          <span className="competition-card__meta-text">
                            <strong>{t('venue')}:</strong> {venue}
                          </span>
                        </div>
                      )}

                      {eligibility && (
                        <div className="competition-card__meta-row">
                          <span className="competition-card__meta-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </span>
                          <span className="competition-card__meta-text">
                            <strong>{t('eligibility')}:</strong> {eligibility}
                          </span>
                        </div>
                      )}

                      {registrationInfo && (
                        <div className="competition-card__meta-row competition-card__meta-row--reg">
                          <span className="competition-card__meta-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </span>
                          <span className="competition-card__meta-text">
                            <strong>{t('registration')}:</strong> {registrationInfo}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* External Registration Link if Available */}
                    {comp.registrationUrl && (
                      <div className="competition-card__reg-cta-wrap">
                        <a
                          href={comp.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--primary btn--sm competition-card__reg-cta"
                        >
                          <span>{t('registerNow')}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        </a>
                      </div>
                    )}

                    {/* Rules Accordion / Disclosure */}
                    {comp.rules && comp.rules.length > 0 && (
                      <div className="competition-card__rules-section">
                        <button
                          type="button"
                          className="competition-card__rules-toggle"
                          aria-expanded={isRulesOpen}
                          aria-controls={`rules-${comp.id}`}
                          onClick={() => toggleRules(comp.id)}
                        >
                          <span className="competition-card__rules-toggle-label">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            {isRulesOpen ? t('hideRules') : t('viewRules')}
                          </span>
                          <span className="competition-card__rules-toggle-symbol" aria-hidden="true">
                            {isRulesOpen ? '−' : '+'}
                          </span>
                        </button>

                        {isRulesOpen && (
                          <div
                            id={`rules-${comp.id}`}
                            className="competition-card__rules-content"
                          >
                            <h4 className="competition-card__rules-heading">
                              {t('rulesHeading')}
                            </h4>
                            <ol className="competition-card__rules-list">
                              {comp.rules.map((rule, rIdx) => (
                                <li key={rIdx} className="competition-card__rule-item">
                                  <span>{getLocalized(rule)}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Actions: Contact, Sponsor & Share */}
                    <div className="competition-card__footer">
                      {/* Left: Contact Coordinator / Desk */}
                      <div className="competition-card__footer-left">
                        {contactObj && (contactObj.phone || contactObj.whatsapp) && (
                          <div className="competition-card__contact-wrap">
                            {contactName && (
                              <span className="competition-card__contact-name">
                                {contactName}
                              </span>
                            )}
                            <div className="competition-card__contact-actions">
                              {contactObj.phone && (
                                <a
                                  href={`tel:${phoneClean}`}
                                  className="competition-contact-btn competition-contact-btn--call"
                                  aria-label={`${t('callNow')}: ${contactObj.phone}`}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                  <span>{t('callNow')}</span>
                                </a>
                              )}

                              {contactObj.whatsapp && (
                                <a
                                  href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(`Namaskar, I am enquiring about ${title} at ${mandalName}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="competition-contact-btn competition-contact-btn--wa"
                                  aria-label={`${t('whatsapp')}: ${contactObj.whatsapp}`}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  <span>{t('whatsapp')}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sponsor Partner */}
                        {sponsor && (
                          <div className="competition-card__sponsor-row">
                            <span className="competition-card__sponsor-label">
                              {t('supportedBy')}
                            </span>
                            <a
                              href={`#sponsor-${sponsor.id}`}
                              className="competition-card__sponsor-badge"
                            >
                              <span className="competition-card__sponsor-avatar" aria-hidden="true">
                                {sponsor.logoUrl ? (
                                  <img src={sponsor.logoUrl} alt="" />
                                ) : (
                                  <span>{sponsorInitials}</span>
                                )}
                              </span>
                              <span className="competition-card__sponsor-name">
                                {sponsorName}
                              </span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right: Share Button */}
                      <div className="competition-card__footer-right">
                        <button
                          type="button"
                          className="competition-card__share-btn"
                          onClick={() => handleShareActivity(comp)}
                          aria-label={`${t('shareActivity')} — ${title}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                          <span>{isCopied ? t('linkCopied') : t('shareActivity')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
