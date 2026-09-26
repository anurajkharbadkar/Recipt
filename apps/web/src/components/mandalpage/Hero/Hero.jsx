import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateRange, getTodaySchedule } from '@/utils/dateUtils';
import './Hero.css';

export default function Hero() {
  const { identity, devi, festival, location, schedule, sponsors } = useMandal();
  const { t, getLocalized } = useLanguage();

  const mandalName = getLocalized(identity.name);
  const tagline = getLocalized(identity.tagline);
  const festivalName = getLocalized(festival.name);
  const dateRange = formatDateRange(festival.startDate, festival.endDate);

  // Address and location resolution
  const address = getLocalized(location.address);
  const city = getLocalized(location.city);
  const venue = getLocalized(location.venue);
  const locationDisplay = address && city
    ? `${address}, ${city}`
    : (address || venue || '');

  // Mandal initials for emblem fallback
  const initials = mandalName ? mandalName.slice(0, 2) : 'मं';

  // Hero visual resolution: Devi image OR Mandal-provided hero image OR festival cover image
  const heroImage = devi?.imageUrl || identity?.heroImageUrl || festival?.coverImageUrl || null;

  // Presenting sponsor resolution (only tier = 'presenting')
  const presentingSponsor = sponsors?.find(s => s.tier === 'presenting');
  const presentingSponsorName = presentingSponsor ? getLocalized(presentingSponsor.name) : '';
  const presentingSponsorInitials = presentingSponsor?.initials || (presentingSponsorName ? presentingSponsorName.slice(0, 2) : 'SP');

  // Today's event preview resolution
  const todaySchedule = getTodaySchedule(schedule);
  const todayEvent = todaySchedule?.events?.find(e => e.eventType === 'Aarti' || (typeof e.title === 'object' && e.title?.en?.toLowerCase().includes('aarti'))) || todaySchedule?.events?.[0];
  const todayEventTitle = todayEvent ? getLocalized(todayEvent.title) : '';
  const todayEventTime = todayEvent?.time || todayEvent?.startTime || '';
  const todayEventVenue = todayEvent ? (getLocalized(todayEvent.venue) || venue) : '';

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header id="home" className="hero" aria-label={mandalName}>
      {/* Anchor alias for #hero backward compatibility */}
      <span id="hero" className="hero__anchor" aria-hidden="true" />

      {/* Ambient background glow */}
      <div className="hero__ambient" aria-hidden="true">
        <div className="hero__ambient-glow hero__ambient-glow--1" />
        <div className="hero__ambient-glow hero__ambient-glow--2" />
        <div className="hero__ambient-pattern" />
      </div>

      <div className="hero__container">
        <div className="hero__layout">
          {/* Identity & Main Content */}
          <div className="hero__content">
            {/* 1. Mandal Logo */}
            <div className="hero__logo-wrapper">
              {identity.logoUrl ? (
                <img
                  src={identity.logoUrl}
                  alt={`${mandalName} Logo`}
                  className="hero__logo-img"
                  width="56"
                  height="56"
                />
              ) : (
                <div className="hero__logo-emblem" aria-hidden="true">
                  <span className="hero__logo-emblem-text">{initials}</span>
                </div>
              )}
            </div>

            {/* 2. Mandal Name (h1 only once on page) */}
            <h1 className="hero__title">
              {mandalName}
            </h1>

            {/* 3. Tagline */}
            {tagline && (
              <p className="hero__tagline">
                {tagline}
              </p>
            )}

            {/* 4 & 5. Festival Name & Dates */}
            <div className="hero__festival-row">
              <span className="hero__festival-name">{festivalName}</span>
              <span className="hero__festival-dot" aria-hidden="true">•</span>
              <span className="hero__festival-dates">{dateRange}</span>
            </div>

            {/* 6. Location */}
            {locationDisplay && (
              <p className="hero__location">
                <svg
                  className="hero__location-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{locationDisplay}</span>
              </p>
            )}

            {/* 7. CTAs */}
            <div className="hero__actions">
              <a
                href="#schedule"
                className="btn btn--hero"
                onClick={(e) => handleNavClick(e, '#schedule')}
              >
                {t('viewSchedule')}
              </a>
              <a
                href="#location"
                className="btn btn--hero-outline"
                onClick={(e) => handleNavClick(e, '#location')}
              >
                {t('visitMandal')}
              </a>
            </div>

            {/* Optional Presenting Sponsor (Mandal > Festival > Sponsor) */}
            {presentingSponsor && (
              <div
                className="hero__sponsor"
                aria-label={`${t('presentingPartner')}: ${presentingSponsorName}`}
              >
                <span className="hero__sponsor-label">{t('presentingPartner')}</span>
                <div className="hero__sponsor-body">
                  {presentingSponsor.logoUrl ? (
                    <img
                      src={presentingSponsor.logoUrl}
                      alt=""
                      className="hero__sponsor-logo"
                      width="28"
                      height="28"
                    />
                  ) : (
                    <span className="hero__sponsor-initials" aria-hidden="true">
                      {presentingSponsorInitials}
                    </span>
                  )}
                  <span className="hero__sponsor-name">{presentingSponsorName}</span>
                </div>
              </div>
            )}
          </div>

          {/* 8. Hero / Devi Visual */}
          <div className="hero__visual">
            <div className="hero__visual-frame">
              {heroImage ? (
                <>
                  <img
                    className="hero__visual-image"
                    src={heroImage}
                    alt={`${mandalName} — ${festivalName}`}
                    loading="eager"
                    fetchPriority="high"
                  />
                  <div className="hero__visual-overlay" aria-hidden="true" />
                </>
              ) : (
                <div className="hero__visual-fallback" aria-hidden="true">
                  <div className="hero__fallback-mandala" />
                  <span className="hero__fallback-symbol">{initials}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 9. Today's Event Preview Strip */}
        {todaySchedule && todayEvent && (
          <div className="hero__today-container">
            <a
              href="#today"
              className="hero__today-strip"
              onClick={(e) => handleNavClick(e, '#today')}
              aria-label={`${t('todayBadge')}: ${todayEventTitle} ${todayEventTime ? `at ${todayEventTime}` : ''} ${todayEventVenue ? `at ${todayEventVenue}` : ''}`}
            >
              <span className="hero__today-badge">{t('todayBadge')}</span>
              <div className="hero__today-info">
                <span className="hero__today-title">{todayEventTitle}</span>
                {todayEventTime && (
                  <>
                    <span className="hero__today-dot" aria-hidden="true">•</span>
                    <span className="hero__today-time">{todayEventTime}</span>
                  </>
                )}
                {todayEventVenue && (
                  <>
                    <span className="hero__today-dot" aria-hidden="true">•</span>
                    <span className="hero__today-venue">{todayEventVenue}</span>
                  </>
                )}
              </div>
              <svg
                className="hero__today-arrow"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
