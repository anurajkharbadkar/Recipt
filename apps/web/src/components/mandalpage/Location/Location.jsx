import { useState, useCallback } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { formatDateRange, getTodaysEvent } from '@/utils/dateUtils';
import './Location.css';

/**
 * Location Component (Step 15)
 *
 * Refined "Visit the Mandal" destination experience:
 * - Structured address presentation (Venue, Street Address, City, State, Landmark)
 * - Dominant "Open in Google Maps" action with safe coordinate / address fallback
 * - Copy Address & Share Location actions with live feedback toast
 * - Contextual Festival Dates and "Visiting Today?" highlight linked to #today
 * - Verified Contact channels (Call, WhatsApp, Email, Website)
 * - Follow the Mandal social links
 * - Full multilingual support (mr, hi, en) and mobile-first 44px touch targets
 */
export default function Location() {
  const { identity, festival, schedule, location, contact, social } = useMandal();
  const { t, getLocalized } = useLanguage();
  const [ref, isVisible] = useInView();
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const mandalName = getLocalized(identity?.name);
  const initials = mandalName ? mandalName.slice(0, 2) : 'मं';

  const venue = getLocalized(location?.venue || location?.venueName);
  const address = getLocalized(location?.address);
  const landmark = getLocalized(location?.landmark);
  const city = getLocalized(location?.city);
  const state = getLocalized(location?.state);
  const pincode = location?.pincode ? String(location.pincode) : '';

  // Safe Maps URL resolution
  let mapsUrl = location?.mapsUrl;
  if (mapsUrl === '#' || mapsUrl === '') {
    mapsUrl = null;
  }
  if (!mapsUrl) {
    const lat = location?.latitude ?? location?.lat;
    const lng = location?.longitude ?? location?.lng;
    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else if (venue || address) {
      const query = [venue, address, city, state].filter(Boolean).join(', ');
      if (query.trim()) {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      }
    }
  }

  // Address text for clipboard copying
  const addressCopyText = [
    mandalName,
    venue,
    address,
    landmark ? `${t('landmarkLabel')}: ${landmark}` : '',
    [city, state, pincode].filter(Boolean).join(', ')
  ].filter(Boolean).join('\n');

  const handleCopyAddress = async () => {
    if (!addressCopyText) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(addressCopyText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = addressCopyText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast(t('addressCopied'));
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleShareLocation = async () => {
    const shareTitle = `${mandalName} — ${t('visitTheMandal')}`;
    const destinationUrl = mapsUrl || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#location` : '');
    const shareText = `${mandalName}\n${venue ? venue + '\n' : ''}${address ? address + '\n' : ''}${landmark ? `${t('landmarkLabel')}: ${landmark}\n` : ''}${destinationUrl ? `${t('directions')}: ${destinationUrl}` : ''}`;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: destinationUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        showToast(t('locationCopied'));
      }
    } catch (err) {
      console.error('Share fallback error:', err);
    }
  };

  // Today's event check
  const todayResult = getTodaysEvent(schedule, festival);
  const hasTodayEvent = todayResult?.status === 'during' && Boolean(todayResult?.primaryEvent);
  const todayEvent = todayResult?.primaryEvent;
  const todayEventTitle = todayEvent ? getLocalized(todayEvent.title) : '';
  const todayEventTime = todayEvent ? (todayEvent.time || todayEvent.startTime) : '';

  const handleTodayScroll = (e) => {
    e.preventDefault();
    const el = document.querySelector('#today');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Festival dates
  const festivalDates = (festival?.startDate && festival?.endDate)
    ? formatDateRange(festival.startDate, festival.endDate)
    : null;

  // Contact channels
  const hasPhone = Boolean(contact?.phone);
  const hasWhatsapp = Boolean(contact?.whatsapp);
  const hasEmail = Boolean(contact?.email);
  const hasWebsite = Boolean(contact?.website);
  const hasContact = hasPhone || hasWhatsapp || hasEmail || hasWebsite;

  // Social links
  const hasInstagram = Boolean(social?.instagram);
  const hasFacebook = Boolean(social?.facebook);
  const hasYoutube = Boolean(social?.youtube);
  const hasTwitter = Boolean(social?.twitter);
  const hasSocial = hasInstagram || hasFacebook || hasYoutube || hasTwitter;

  const hasLocation = Boolean(venue || address || landmark || mapsUrl);

  // If nothing is configured at all, do not render broken UI
  if (!hasLocation && !hasContact && !hasSocial) {
    return null;
  }

  return (
    <section id="location" className="location-section section" aria-label={t('visitTheMandal')}>
      <div ref={ref} className={`container reveal ${isVisible ? 'reveal--visible' : ''}`}>
        {/* Section Header */}
        <div className="location__header">
          <p className="eyebrow location__eyebrow">{t('directions')}</p>
          <h2 className="heading-display heading-display--lg location__title">
            {t('visitTheMandal')}
          </h2>
          <p className="location__subtitle">
            {t('visitSubtitle')}
          </p>
        </div>

        {/* Content Layout Grid */}
        <div className="location__grid">
          {/* Primary Column: Location Card & Context */}
          <div className="location__primary-col">
            <div className="location-card">
              {/* Mandal identity header */}
              <div className="location-card__identity">
                <span className="location-card__emblem" aria-hidden="true">{initials}</span>
                <div className="location-card__identity-meta">
                  <h3 className="location-card__mandal-name">{mandalName}</h3>
                  {festivalDates && (
                    <span className="location-card__festival-dates">
                      {t('celebrations')}: {festivalDates}
                    </span>
                  )}
                </div>
              </div>

              {/* Structured Address Block */}
              <div className="location-card__address-group">
                {venue && (
                  <div className="location-card__field location-card__field--venue">
                    <span className="location-card__field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </span>
                    <div className="location-card__field-content">
                      <span className="location-card__field-label">{t('venue')}</span>
                      <p className="location-card__venue-text">{venue}</p>
                    </div>
                  </div>
                )}

                {address && (
                  <div className="location-card__field location-card__field--address">
                    <span className="location-card__field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div className="location-card__field-content">
                      <span className="location-card__field-label">{t('address')}</span>
                      <p className="location-card__address-text">{address}</p>
                      {(city || state) && (
                        <p className="location-card__city-text">
                          {[city, state, pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {landmark && (
                  <div className="location-card__landmark">
                    <div className="location-card__landmark-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      <span>{t('landmarkLabel')}</span>
                    </div>
                    <p className="location-card__landmark-text">{landmark}</p>
                  </div>
                )}
              </div>

              {/* Primary Map Action */}
              {mapsUrl && (
                <div className="location-card__primary-cta">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary location-card__btn-maps"
                    aria-label={`${t('openInGoogleMaps')} - ${venue || mandalName}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    <span>{t('openInGoogleMaps')}</span>
                    <svg className="location-card__external-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Action Buttons Row: Copy Address & Share Location */}
              <div className="location-card__actions-row">
                {addressCopyText && (
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="btn btn--outline location-card__btn-action"
                    aria-label={t('copyAddress')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{t('copyAddress')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShareLocation}
                  className="btn btn--outline location-card__btn-action"
                  aria-label={t('shareLocation')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>{t('shareLocation')}</span>
                </button>
              </div>

              {/* Live Toast Confirmation */}
              {toastMessage && (
                <div className="location__toast" role="status" aria-live="polite">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{toastMessage}</span>
                </div>
              )}
            </div>

            {/* Contextual Visiting Today Block (If Active Event Exists) */}
            {hasTodayEvent && (
              <div className="location-today">
                <div className="location-today__header">
                  <span className="location-today__badge">{t('visitingToday')}</span>
                  {todayEventTime && (
                    <span className="location-today__time">{todayEventTime}</span>
                  )}
                </div>
                <p className="location-today__title">{todayEventTitle}</p>
                <a
                  href="#today"
                  onClick={handleTodayScroll}
                  className="location-today__link"
                >
                  <span>{t('viewTodaysEvent')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Secondary Column: Contact & Social Presence */}
          <div className="location__secondary-col">
            {/* Contact Card */}
            {hasContact && (
              <div className="location-contact-card">
                <div className="location-contact-card__header">
                  <h3 className="location-contact-card__title">{t('contactTheMandal')}</h3>
                  <p className="location-contact-card__subtitle">{t('contactSubtitle')}</p>
                </div>

                <div className="location-contact-card__channels">
                  {hasPhone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                      className="location-contact-channel"
                      aria-label={`${t('call')}: ${contact.phone}`}
                    >
                      <div className="location-contact-channel__icon location-contact-channel__icon--call" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div className="location-contact-channel__text">
                        <span className="location-contact-channel__label">{t('call')}</span>
                        <span className="location-contact-channel__value">{contact.phone}</span>
                      </div>
                    </a>
                  )}

                  {hasWhatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="location-contact-channel"
                      aria-label={`${t('whatsapp')}: ${contact.whatsapp}`}
                    >
                      <div className="location-contact-channel__icon location-contact-channel__icon--whatsapp" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      </div>
                      <div className="location-contact-channel__text">
                        <span className="location-contact-channel__label">{t('whatsapp')}</span>
                        <span className="location-contact-channel__value">{contact.whatsapp}</span>
                      </div>
                    </a>
                  )}

                  {hasEmail && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="location-contact-channel"
                      aria-label={`${t('email')}: ${contact.email}`}
                    >
                      <div className="location-contact-channel__icon location-contact-channel__icon--email" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div className="location-contact-channel__text">
                        <span className="location-contact-channel__label">{t('email')}</span>
                        <span className="location-contact-channel__value">{contact.email}</span>
                      </div>
                    </a>
                  )}

                  {hasWebsite && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="location-contact-channel"
                      aria-label={`${t('website')}: ${contact.website}`}
                    >
                      <div className="location-contact-channel__icon location-contact-channel__icon--website" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </div>
                      <div className="location-contact-channel__text">
                        <span className="location-contact-channel__label">{t('website')}</span>
                        <span className="location-contact-channel__value">{contact.website.replace(/^https?:\/\//, '')}</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Social Presence Card */}
            {hasSocial && (
              <div className="location-social-card">
                <h3 className="location-social-card__title">{t('followTheMandal')}</h3>
                <div className="location-social-card__links">
                  {hasInstagram && (
                    <a
                      href={social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="location-social-btn location-social-btn--instagram"
                      aria-label="Instagram"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                      <span>Instagram</span>
                    </a>
                  )}

                  {hasFacebook && (
                    <a
                      href={social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="location-social-btn location-social-btn--facebook"
                      aria-label="Facebook"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                      <span>Facebook</span>
                    </a>
                  )}

                  {hasYoutube && (
                    <a
                      href={social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="location-social-btn location-social-btn--youtube"
                      aria-label="YouTube"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                      </svg>
                      <span>YouTube</span>
                    </a>
                  )}

                  {hasTwitter && (
                    <a
                      href={social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="location-social-btn location-social-btn--twitter"
                      aria-label="X / Twitter"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                      </svg>
                      <span>X</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
