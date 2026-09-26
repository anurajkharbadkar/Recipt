import { useState } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { getTodaysEvent, formatLocalizedDate } from '@/utils/dateUtils';
import { useInView } from '@/hooks/useInView';
import DevotionalAttireIcon from '../common/DevotionalAttireIcon';
import './TodaysEvent.css';

export default function TodaysEvent() {
  const { schedule, festival, location, sponsors, dailyDressCodes } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView();
  const [showOtherEvents, setShowOtherEvents] = useState(false);

  // Compute today's event status and data using the reusable helper
  const todayResult = getTodaysEvent(schedule, festival);
  const { status, daysUntilFestival, matchingDay, primaryEvent, otherEvents } = todayResult;

  // Sponsor for primary event if configured
  const eventSponsor = primaryEvent?.sponsorId
    ? sponsors?.find(s => s.id === primaryEvent.sponsorId)
    : null;
  const eventSponsorName = eventSponsor ? getLocalized(eventSponsor.name) : '';

  // Dress code for the day
  const dressCodeEntry = dailyDressCodes?.find(dc => dc.date === matchingDay?.date);
  const dressCodeTheme = dressCodeEntry ? getLocalized(dressCodeEntry.theme) : '';

  // Venue fallback
  const primaryVenue = primaryEvent
    ? (getLocalized(primaryEvent.venue) || getLocalized(location.venue))
    : getLocalized(location.venue);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="today" className="todays-event section" aria-label={t('todayEvent')}>
      <div
        ref={ref}
        className={`container todays-event__container reveal ${isVisible ? 'reveal--visible' : ''}`}
      >
        <div className="todays-event__header">
          <p className="eyebrow todays-event__eyebrow">{t('todayAtMandal')}</p>
          <h2 className="heading-display heading-display--md todays-event__heading">
            {t('todayEvent')}
          </h2>
        </div>

        {/* 1. STATE: DURING FESTIVAL WITH EVENT */}
        {status === 'during' && primaryEvent && matchingDay && (
          <div className="todays-event__card">
            {/* Top Meta Strip */}
            <div className="todays-event__meta">
              <span className="todays-event__badge">{t('todayBadge')}</span>
              <span className="todays-event__date">
                {formatLocalizedDate(matchingDay.date, language)}
              </span>

              <div
                className="todays-event__day-chip"
                style={{
                  backgroundColor: matchingDay.colorHex ? `${matchingDay.colorHex}18` : 'rgba(169, 120, 50, 0.12)',
                  borderColor: matchingDay.colorHex ? `${matchingDay.colorHex}50` : 'rgba(169, 120, 50, 0.3)',
                  color: matchingDay.colorHex || 'var(--color-brass)',
                }}
              >
                <span
                  className="todays-event__chip-dot"
                  style={{ backgroundColor: matchingDay.colorHex || 'var(--color-brass)' }}
                  aria-hidden="true"
                />
                <span>
                  {t('dayBadge')} {String(matchingDay.day).padStart(2, '0')}
                  {matchingDay.goddess && ` • ${getLocalized(matchingDay.goddess)}`}
                </span>
              </div>
            </div>

            {/* Event Title & Category */}
            <div className="todays-event__main-info">
              <h3 className="todays-event__title">
                <span className="todays-event__icon" aria-hidden="true">🌺</span>
                <span>{getLocalized(primaryEvent.title)}</span>
              </h3>

              {/* Time & Venue */}
              <div className="todays-event__details">
                <div className="todays-event__detail-item">
                  <svg
                    className="todays-event__detail-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="todays-event__time">
                    {primaryEvent.time || primaryEvent.startTime}
                    {primaryEvent.endTime ? ` — ${primaryEvent.endTime}` : ''}
                  </span>
                </div>

                {primaryVenue && (
                  <div className="todays-event__detail-item">
                    <svg
                      className="todays-event__detail-icon"
                      width="16"
                      height="16"
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
                    <span className="todays-event__venue">{primaryVenue}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {primaryEvent.description && (
                <p className="todays-event__description">
                  {getLocalized(primaryEvent.description)}
                </p>
              )}

              {/* Dress Code & Sponsor Footer */}
              <div className="todays-event__footer-meta">
                {(dressCodeTheme || matchingDay.color) && (
                  <div className="todays-event__dress-code">
                    <DevotionalAttireIcon size={14} className="todays-event__dress-icon" />
                    <span className="todays-event__meta-label">{t('dressCode')}:</span>
                    <span className="todays-event__meta-value">
                      {dressCodeTheme || matchingDay.color}
                    </span>
                  </div>
                )}

                {eventSponsorName && (
                  <div className="todays-event__sponsor">
                    <span className="todays-event__meta-label">{t('supportedBy')}:</span>
                    <span className="todays-event__meta-value">{eventSponsorName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Multiple events for today */}
            {otherEvents && otherEvents.length > 0 && (
              <div className="todays-event__other-section">
                <button
                  type="button"
                  className="todays-event__toggle-btn"
                  onClick={() => setShowOtherEvents(prev => !prev)}
                  aria-expanded={showOtherEvents}
                >
                  <span>
                    {showOtherEvents ? t('hideOtherEvents') : `${t('todaysOtherEvents')} (${otherEvents.length})`}
                  </span>
                  <svg
                    className={`todays-event__toggle-icon ${showOtherEvents ? 'todays-event__toggle-icon--open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showOtherEvents && (
                  <div className="todays-event__other-list" role="list">
                    {otherEvents.map((evt, idx) => (
                      <div key={evt.id || idx} className="todays-event__other-item" role="listitem">
                        <div className="todays-event__other-header">
                          <h4 className="todays-event__other-title">{getLocalized(evt.title)}</h4>
                          <span className="todays-event__other-time">
                            {evt.time || evt.startTime}
                            {evt.endTime ? ` — ${evt.endTime}` : ''}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="todays-event__other-desc">{getLocalized(evt.description)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action CTA */}
            <div className="todays-event__actions">
              <a
                href="#schedule"
                className="btn btn--secondary btn--sm"
                onClick={(e) => handleNavClick(e, '#schedule')}
              >
                {t('viewFullSchedule')}
              </a>
            </div>
          </div>
        )}

        {/* 2. STATE: DURING FESTIVAL BUT NO EVENT SCHEDULED TODAY */}
        {status === 'no-event' && (
          <div className="todays-event__card todays-event__card--status">
            <div className="todays-event__status-icon" aria-hidden="true">🪔</div>
            <p className="todays-event__status-title">{t('noEventScheduledToday')}</p>
            <div className="todays-event__actions">
              <a
                href="#schedule"
                className="btn btn--secondary btn--sm"
                onClick={(e) => handleNavClick(e, '#schedule')}
              >
                {t('viewFullSchedule')}
              </a>
            </div>
          </div>
        )}

        {/* 3. STATE: PRE-FESTIVAL (FUTURE) */}
        {status === 'before' && (
          <div className="todays-event__card todays-event__card--status">
            <span className="todays-event__badge">{t('festival')}</span>
            <div className="todays-event__countdown">
              <p className="todays-event__countdown-label">{t('festivalBeginsIn')}</p>
              <div className="todays-event__countdown-number">
                <span>{daysUntilFestival}</span>
                <span className="todays-event__countdown-unit">{t('daysRemaining')}</span>
              </div>
            </div>
            <div className="todays-event__actions">
              <a
                href="#schedule"
                className="btn btn--primary btn--sm"
                onClick={(e) => handleNavClick(e, '#schedule')}
              >
                {t('viewSchedule')}
              </a>
            </div>
          </div>
        )}

        {/* 4. STATE: POST-FESTIVAL */}
        {status === 'after' && (
          <div className="todays-event__card todays-event__card--status">
            <div className="todays-event__status-icon" aria-hidden="true">🙏</div>
            <h3 className="todays-event__status-title">{t('festivalConcluded')}</h3>
            <p className="todays-event__status-sub">{t('festivalConcludedSub')}</p>
            <div className="todays-event__actions">
              <a
                href="#gallery"
                className="btn btn--primary btn--sm"
                onClick={(e) => handleNavClick(e, '#gallery')}
              >
                {t('viewFestivalHighlights')}
              </a>
              <a
                href="#schedule"
                className="btn btn--secondary btn--sm"
                onClick={(e) => handleNavClick(e, '#schedule')}
              >
                {t('viewFullSchedule')}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
