import { useState } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { formatLocalizedDate, getCurrentDate, toDevanagariNumerals } from '@/utils/dateUtils';
import './Visarjan.css';

/**
 * Determine Visarjan status (today, upcoming, completed)
 * @param {string} dateString
 * @returns {'today' | 'upcoming' | 'completed' | null}
 */
function getVisarjanStatus(dateString) {
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

export default function Visarjan() {
  const { visarjan, identity, sponsors } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView({ threshold: 0.08 });
  const [copied, setCopied] = useState(false);

  // If no Visarjan data is configured for this Mandal, cleanly suppress the section
  if (!visarjan) return null;

  const visarjanTitle = getLocalized(visarjan.title) || t('visarjanCeremony');
  const description = visarjan.description ? getLocalized(visarjan.description) : '';
  const formattedDate = formatLocalizedDate(visarjan.date, language);
  const timeFormatted = visarjan.startTime
    ? `${visarjan.startTime}${visarjan.endTime ? ` — ${visarjan.endTime}` : ''}`
    : '';
  const status = getVisarjanStatus(visarjan.date);

  // Assembly Point extraction
  const assemblyName = getLocalized(visarjan.assemblyPoint?.name || visarjan.assemblyPoint);
  const assemblyAddress = visarjan.assemblyPoint?.address
    ? getLocalized(visarjan.assemblyPoint.address)
    : visarjan.assemblyAddress
    ? getLocalized(visarjan.assemblyAddress)
    : '';
  const assemblyMapsUrl = visarjan.assemblyPoint?.mapsUrl || visarjan.assemblyMapsUrl;

  // Final Destination extraction
  const endName = getLocalized(visarjan.endPoint?.name || visarjan.endPoint);
  const endAddress = visarjan.endPoint?.address
    ? getLocalized(visarjan.endPoint.address)
    : visarjan.endAddress
    ? getLocalized(visarjan.endAddress)
    : '';
  const endMapsUrl = visarjan.endPoint?.mapsUrl || visarjan.endMapsUrl;

  // Sponsor resolution
  const sponsor = visarjan.sponsorId ? sponsors?.find(s => s.id === visarjan.sponsorId) : null;
  const sponsorName = sponsor ? getLocalized(sponsor.name) : '';
  const sponsorInitials = sponsor?.initials || (sponsorName ? sponsorName.slice(0, 2) : 'SP');

  // Contact extraction
  const contactObj = typeof visarjan.contact === 'object' && visarjan.contact !== null
    ? visarjan.contact
    : typeof visarjan.contact === 'string'
    ? { phone: visarjan.contact }
    : null;
  const contactName = contactObj?.name ? getLocalized(contactObj.name) : '';
  const phoneClean = contactObj?.phone ? contactObj.phone.replace(/[^\d+]/g, '') : '';
  const whatsappClean = contactObj?.whatsapp ? contactObj.whatsapp.replace(/[^\d]/g, '') : '';

  // Share message preparation
  const mandalName = getLocalized(identity?.name) || '';
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#visarjan`
    : '';

  const shareText = language === 'mr'
    ? `🚩 ${mandalName}\n🌸 ${visarjanTitle}\n📅 दिनांक: ${formattedDate}\n⏰ वेळ: ${timeFormatted}\n📍 प्रस्थान ठिकाण: ${assemblyName}${assemblyAddress ? `, ${assemblyAddress}` : ''}\n🌊 अंतिम ठिकाण: ${endName}\nसर्व भाविकांनी भावपूर्ण विसर्जन सोहळ्यात सहभागी व्हावे!`
    : language === 'hi'
    ? `🚩 ${mandalName}\n🌸 ${visarjanTitle}\n📅 दिनांक: ${formattedDate}\n⏰ समय: ${timeFormatted}\n📍 प्रस्थान स्थल: ${assemblyName}${assemblyAddress ? `, ${assemblyAddress}` : ''}\n🌊 अंतिम स्थल: ${endName}\nसभी श्रद्धालु पावन विसर्जन समारोह में सादर आमंत्रित हैं!`
    : `🚩 ${mandalName}\n🌸 ${visarjanTitle}\n📅 Date: ${formattedDate}\n⏰ Time: ${timeFormatted}\n📍 Starting Point: ${assemblyName}${assemblyAddress ? `, ${assemblyAddress}` : ''}\n🌊 Final Destination: ${endName}\nCordially inviting all devotees to join the sacred farewell procession!`;

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${mandalName} — ${visarjanTitle}`,
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
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch {
      // Fallback to WhatsApp
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const routeStops = Array.isArray(visarjan.route) ? visarjan.route : [];

  return (
    <section id="visarjan" className="visarjan section" aria-labelledby="visarjan-heading">
      <div className="container">
        <div
          ref={ref}
          className={`visarjan__wrapper reveal ${isVisible ? 'reveal--visible' : ''}`}
        >
          {/* Section Header */}
          <div className="visarjan__header">
            <div className="visarjan__eyebrow-row">
              <span className="visarjan__sacred-icon" aria-hidden="true">🚩</span>
              <p className="eyebrow">{t('visarjanCeremony')}</p>
            </div>
            <h2 id="visarjan-heading" className="heading-display visarjan__title">
              {visarjanTitle}
            </h2>
            <p className="visarjan__subtitle">
              {t('visarjanSubtitle')}
            </p>

            {/* Status Indicator Badge */}
            <div className="visarjan__status-row">
              {status === 'today' && (
                <span className="visarjan-status-badge visarjan-status-badge--today">
                  <span className="visarjan-status-badge__dot" aria-hidden="true" />
                  {t('visarjanToday')}
                </span>
              )}
              {status === 'completed' && (
                <span className="visarjan-status-badge visarjan-status-badge--completed">
                  <span aria-hidden="true">✓</span>
                  {t('visarjanCompleted')}
                </span>
              )}
              {status === 'upcoming' && (
                <span className="visarjan-status-badge visarjan-status-badge--upcoming">
                  <span aria-hidden="true">⏳</span>
                  {formattedDate}
                </span>
              )}
            </div>
          </div>

          {/* Optional Description */}
          {description && (
            <div className="visarjan__description-box">
              <p className="visarjan__description-text">{description}</p>
            </div>
          )}

          {/* Editorial Content Grid */}
          <div className="visarjan__content-grid">
            {/* Left Column: Route Timeline */}
            <div className="visarjan__route-col">
              <div className="visarjan__route-card">
                <div className="visarjan__card-header">
                  <div className="visarjan__card-icon-wrap" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="visarjan__card-title">{t('visarjanRoute')}</h3>
                    <p className="visarjan__card-sub">{t('routeStops')}</p>
                  </div>
                </div>

                {/* Ordered Route Timeline */}
                {routeStops.length > 0 ? (
                  <ol className="visarjan__timeline" aria-label={t('visarjanRoute')}>
                    {routeStops.map((stop, idx) => {
                      const stopName = getLocalized(stop.name);
                      const landmark = stop.landmark ? getLocalized(stop.landmark) : '';
                      const isFirst = idx === 0;
                      const isLast = idx === routeStops.length - 1;
                      const orderNum = stop.order || idx + 1;
                      const orderDisplay = language === 'mr' || language === 'hi'
                        ? toDevanagariNumerals(orderNum < 10 ? `0${orderNum}` : `${orderNum}`)
                        : orderNum < 10 ? `0${orderNum}` : `${orderNum}`;

                      return (
                        <li
                          key={idx}
                          className={`visarjan__timeline-stop ${isFirst ? 'visarjan__timeline-stop--start' : ''} ${isLast ? 'visarjan__timeline-stop--end' : ''}`}
                        >
                          {/* Marker & Order Number */}
                          <div className="visarjan__stop-marker-wrap">
                            <span className="visarjan__stop-badge" aria-hidden="true">
                              {orderDisplay}
                            </span>
                            {!isLast && <span className="visarjan__stop-line" aria-hidden="true" />}
                          </div>

                          {/* Stop Details */}
                          <div className="visarjan__stop-content">
                            <div className="visarjan__stop-header">
                              <span className="visarjan__stop-name">{stopName}</span>
                              {isFirst && (
                                <span className="visarjan__stop-tag visarjan__stop-tag--start">
                                  {t('startPointBadge')}
                                </span>
                              )}
                              {isLast && (
                                <span className="visarjan__stop-tag visarjan__stop-tag--end">
                                  {t('endPointBadge')}
                                </span>
                              )}
                            </div>

                            {landmark && (
                              <p className="visarjan__stop-landmark">
                                <span className="visarjan__landmark-icon" aria-hidden="true">📍</span>
                                {landmark}
                              </p>
                            )}

                            {stop.estimatedTime && (
                              <p className="visarjan__stop-time">
                                <span className="visarjan__time-icon" aria-hidden="true">⏰</span>
                                {stop.estimatedTime}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="visarjan__no-route">{t('visarjanRoute')}</p>
                )}
              </div>
            </div>

            {/* Right Column: Key Locations & Important Guidelines */}
            <div className="visarjan__info-col">
              {/* Date & Time Highlight Card */}
              <div className="visarjan__meta-card">
                <div className="visarjan__meta-block">
                  <div className="visarjan__meta-icon-wrap" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span className="visarjan__meta-label">{t('date')}</span>
                    <p className="visarjan__meta-value">{formattedDate}</p>
                  </div>
                </div>

                {timeFormatted && (
                  <div className="visarjan__meta-block">
                    <div className="visarjan__meta-icon-wrap" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <span className="visarjan__meta-label">{t('time')}</span>
                      <p className="visarjan__meta-value">{timeFormatted}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Starting / Assembly Point Card */}
              <div className="visarjan__location-card">
                <div className="visarjan__loc-header">
                  <span className="visarjan__loc-badge visarjan__loc-badge--start">
                    {t('startingPoint')}
                  </span>
                </div>
                <h4 className="visarjan__loc-name">{assemblyName}</h4>
                {assemblyAddress && (
                  <p className="visarjan__loc-address">{assemblyAddress}</p>
                )}
                {assemblyMapsUrl && (
                  <div className="visarjan__maps-cta-row">
                    <a
                      href={assemblyMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="visarjan__maps-link"
                      aria-label={`${t('openStartingPointInMaps')} - ${assemblyName}`}
                    >
                      <span>{t('openStartingPointInMaps')}</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Final Destination Card */}
              <div className="visarjan__location-card visarjan__location-card--end">
                <div className="visarjan__loc-header">
                  <span className="visarjan__loc-badge visarjan__loc-badge--end">
                    {t('finalDestination')}
                  </span>
                </div>
                <h4 className="visarjan__loc-name">{endName}</h4>
                {endAddress && (
                  <p className="visarjan__loc-address">{endAddress}</p>
                )}
                {endMapsUrl && (
                  <div className="visarjan__maps-cta-row">
                    <a
                      href={endMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="visarjan__maps-link"
                      aria-label={`${t('openFinalDestinationInMaps')} - ${endName}`}
                    >
                      <span>{t('openFinalDestinationInMaps')}</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Important Instructions if available */}
              {visarjan.importantInstructions && visarjan.importantInstructions.length > 0 && (
                <div className="visarjan__instructions-card">
                  <h4 className="visarjan__instructions-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>{t('importantInstructions')}</span>
                  </h4>
                  <ul className="visarjan__instructions-list">
                    {visarjan.importantInstructions.map((inst, idx) => (
                      <li key={idx} className="visarjan__instruction-item">
                        <span className="visarjan__instruction-bullet" aria-hidden="true">✦</span>
                        <span>{getLocalized(inst)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer Actions: Contact, Sponsor & Share */}
              <div className="visarjan__footer-actions">
                {/* Contact Lead */}
                {contactObj && (contactObj.phone || contactObj.whatsapp) && (
                  <div className="visarjan__contact-box">
                    <span className="visarjan__contact-eyebrow">{t('contact')}</span>
                    {contactName && (
                      <span className="visarjan__contact-name">{contactName}</span>
                    )}
                    <div className="visarjan__contact-btns">
                      {contactObj.phone && (
                        <a
                          href={`tel:${phoneClean}`}
                          className="visarjan-contact-btn visarjan-contact-btn--call"
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
                          href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(`Namaskar, I am enquiring about Visarjan Procession at ${mandalName}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="visarjan-contact-btn visarjan-contact-btn--wa"
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
                  <div className="visarjan__sponsor-box">
                    <span className="visarjan__sponsor-label">{t('visarjanPartner')}</span>
                    <a href={`#sponsor-${sponsor.id}`} className="visarjan__sponsor-link">
                      <span className="visarjan__sponsor-avatar" aria-hidden="true">
                        {sponsor.logoUrl ? (
                          <img src={sponsor.logoUrl} alt="" />
                        ) : (
                          <span>{sponsorInitials}</span>
                        )}
                      </span>
                      <span className="visarjan__sponsor-name">{sponsorName}</span>
                    </a>
                  </div>
                )}

                {/* Share Button */}
                <div className="visarjan__share-wrap">
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm visarjan__share-btn"
                    onClick={handleShare}
                    aria-label={t('shareVisarjan')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span>{copied ? t('linkCopied') : t('shareVisarjan')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
