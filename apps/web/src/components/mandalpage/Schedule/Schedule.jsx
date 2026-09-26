import { useState } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { getDayState, formatLocalizedDate, getFestivalDurationDays, toDevanagariNumerals } from '@/utils/dateUtils';
import { useInView } from '@/hooks/useInView';
import DevotionalAttireIcon from '../common/DevotionalAttireIcon';
import './Schedule.css';

export default function Schedule() {
  const { schedule, festival, sponsors, dailyDressCodes } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView();

  // Find today's day to expand by default; fallback to first day
  const festivalDays = schedule || [];
  const todayEntry = festivalDays.find(day => getDayState(day.date) === 'today');
  const defaultDayId = todayEntry ? (todayEntry.dayNumber ?? todayEntry.day) : (festivalDays[0]?.dayNumber ?? festivalDays[0]?.day ?? 1);

  const [activeDay, setActiveDay] = useState(defaultDayId);

  const toggleDay = (dayId) => {
    setActiveDay(prev => (prev === dayId ? null : dayId));
  };

  const totalDays = getFestivalDurationDays(festival, festivalDays);
  const localizedTotalDays = (language === 'mr' || language === 'hi') ? toDevanagariNumerals(totalDays) : totalDays;

  return (
    <section id="schedule" className="schedule section" aria-labelledby="schedule-heading">
      <div className="container">
        <div
          ref={ref}
          className={`schedule__header reveal ${isVisible ? 'reveal--visible' : ''}`}
        >
          <p className="eyebrow">{t('festivalSchedule')}</p>
          <h2 id="schedule-heading" className="heading-display heading-display--lg">
            {localizedTotalDays} {t('daysOfCelebration')}
          </h2>
          <p className="schedule__subtitle">
            {t('scheduleSubtitle')}
          </p>
        </div>

        <div className="schedule__timeline" role="list">
          {festivalDays.map((day) => {
            const dayNum = day.dayNumber ?? day.day;
            const isActive = activeDay === dayNum;
            const dayState = getDayState(day.date); // 'past' | 'today' | 'upcoming'
            const dressCodeEntry = dailyDressCodes?.find(dc => dc.date === day.date) || day.dressCode;

            return (
              <ScheduleDay
                key={dayNum}
                day={day}
                dayNum={dayNum}
                isActive={isActive}
                dayState={dayState}
                dressCodeEntry={dressCodeEntry}
                sponsors={sponsors}
                onToggle={() => toggleDay(dayNum)}
                t={t}
                getLocalized={getLocalized}
                language={language}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ScheduleDay({
  day,
  dayNum,
  isActive,
  dayState,
  dressCodeEntry,
  sponsors,
  onToggle,
  t,
  getLocalized,
  language
}) {
  const [ref, isVisible] = useInView({ threshold: 0.08 });

  const isTodayDay = dayState === 'today';
  const isPastDay = dayState === 'past';

  const dayClasses = [
    'schedule__day',
    isActive && 'schedule__day--active',
    isTodayDay && 'schedule__day--today',
    isPastDay && 'schedule__day--past',
    dayState === 'upcoming' && 'schedule__day--upcoming',
  ].filter(Boolean).join(' ');

  const goddessName = getLocalized(day.goddess) || day.goddessMarathi || '';
  const formattedDate = formatLocalizedDate(day.date, language);
  const dressCodeTheme = dressCodeEntry ? getLocalized(dressCodeEntry.theme) : (day.color || '');
  const dayNumFormatted = (language === 'mr' || language === 'hi')
    ? toDevanagariNumerals(String(dayNum).padStart(2, '0'))
    : String(dayNum).padStart(2, '0');

  const events = day.events || [];

  return (
    <div
      ref={ref}
      className={`${dayClasses} reveal ${isVisible ? 'reveal--visible' : ''}`}
      role="listitem"
    >
      {/* Timeline Bullet Dot */}
      <div
        className="schedule__day-dot"
        style={day.colorHex ? { '--day-accent-color': day.colorHex } : undefined}
        aria-hidden="true"
      />

      {/* Accessible Day Accordion Header Button */}
      <button
        type="button"
        className="schedule__day-header"
        onClick={onToggle}
        aria-expanded={isActive}
        aria-controls={`schedule-content-${dayNum}`}
        id={`schedule-header-${dayNum}`}
      >
        <div className="schedule__day-number">
          <span className="schedule__day-prefix">{t('dayBadge')} {dayNumFormatted}</span>
          <span className="schedule__day-date">{formattedDate}</span>
        </div>

        <div className="schedule__day-info">
          {goddessName && (
            <p className="schedule__day-goddess-marathi">{goddessName}</p>
          )}
          {/* Show brief summary of events */}
          <p className="schedule__day-summary">
            {events.length === 1
              ? getLocalized(events[0].title)
              : `${events.length} ${t('activities') || 'कार्यक्रम'} • ${events.map(e => getLocalized(e.title)).filter(Boolean).slice(0, 2).join(', ')}`}
          </p>
        </div>

        <div className="schedule__day-meta">
          {isTodayDay && (
            <span className="schedule__today-badge">
              {t('todayBadge')}
            </span>
          )}

          {isPastDay && (
            <span className="schedule__past-badge">
              {t('past')}
            </span>
          )}

          {/* Subtle Dress Code Swatch / Indicator */}
          {dressCodeTheme && (
            <span
              className="schedule__day-dress-pill"
              title={`${t('dressCode')}: ${dressCodeTheme}`}
              aria-label={`${t('dressCode')}: ${dressCodeTheme}`}
            >
              <DevotionalAttireIcon size={13} className="schedule__dress-pill-icon" />
              <span
                className="schedule__color-dot"
                style={{ backgroundColor: day.colorHex || '#A97832' }}
                aria-hidden="true"
              />
              <span className="schedule__dress-name">{dressCodeTheme}</span>
            </span>
          )}

          {/* Chevron */}
          <svg
            className="schedule__day-chevron"
            width="18"
            height="18"
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
        </div>
      </button>

      {/* Accordion Region */}
      <div
        id={`schedule-content-${dayNum}`}
        className="schedule__day-content"
        role="region"
        aria-labelledby={`schedule-header-${dayNum}`}
        hidden={!isActive}
      >
        <div className="schedule__day-body">
          {/* Contextual Dress Code Callout inside the day */}
          {dressCodeTheme && (
            <div className="schedule__contextual-dress">
              <DevotionalAttireIcon size={18} className="schedule__contextual-dress-icon" />
              <div className="schedule__contextual-dress-text">
                <span className="schedule__contextual-dress-label">{t('dressCode')}:</span>
                <span className="schedule__contextual-dress-value">{dressCodeTheme}</span>
                {dressCodeEntry?.description && (
                  <span className="schedule__contextual-dress-desc"> — {getLocalized(dressCodeEntry.description)}</span>
                )}
              </div>
            </div>
          )}

          {/* Events List for this Day */}
          <div className="schedule__events-list">
            {events.map((event, index) => {
              const eventTitle = getLocalized(event.title) || event.titleMarathi || '';
              const eventDesc = getLocalized(event.description);
              const eventVenue = getLocalized(event.venue);
              const participation = event.participationInfo ? getLocalized(event.participationInfo) : '';

              // Event Category
              const categoryRaw = event.eventCategory || event.eventType || '';
              const categoryKey = categoryRaw.toLowerCase();
              const categoryLabel = t(categoryKey) || categoryRaw;

              // Sponsor resolution
              const sponsor = event.sponsorId ? sponsors?.find(s => s.id === event.sponsorId) : null;
              const sponsorName = sponsor ? getLocalized(sponsor.name) : '';
              const sponsorInitials = sponsor?.initials || (sponsorName ? sponsorName.slice(0, 2) : 'SP');

              return (
                <div key={index} className="schedule__event">
                  {/* Event Top Bar: Time & Category */}
                  <div className="schedule__event-header-row">
                    <div className="schedule__event-time-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{event.startTime || event.time}{event.endTime ? ` — ${event.endTime}` : ''}</span>
                    </div>

                    {categoryLabel && (
                      <span className="schedule__event-category-badge">
                        {categoryLabel}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="schedule__event-title">{eventTitle}</h4>

                  {/* Venue */}
                  {eventVenue && (
                    <p className="schedule__event-venue">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{eventVenue}</span>
                    </p>
                  )}

                  {/* Event Image if available (no fake placeholders) */}
                  {event.image && (
                    <div className="schedule__event-image-wrap">
                      <img src={event.image} alt={eventTitle} loading="lazy" />
                    </div>
                  )}

                  {/* Description */}
                  {eventDesc && (
                    <p className="schedule__event-desc">{eventDesc}</p>
                  )}

                  {/* Activities Chips if available */}
                  {event.activities && event.activities.length > 0 && (
                    <div className="schedule__event-activities">
                      <span className="schedule__event-activities-label">{t('activities')}:</span>
                      <div className="schedule__activity-chips">
                        {event.activities.map((act, actIdx) => {
                          const actText = typeof act === 'object' ? getLocalized(act) : act;
                          return (
                            <span key={actIdx} className="schedule__activity-chip">
                              {actText}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Participation Information if available */}
                  {participation && (
                    <div className="schedule__event-participation">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="schedule__participation-label">{t('participation')}:</span>
                      <span className="schedule__participation-val">{participation}</span>
                    </div>
                  )}

                  {/* Sponsor Acknowledgement (subtle, only when configured) */}
                  {sponsor && (
                    <div className="schedule__event-sponsor">
                      <span className="schedule__sponsor-label">{t('supportedBy')}</span>
                      <div className="schedule__sponsor-chip">
                        {sponsor.logoUrl ? (
                          <img src={sponsor.logoUrl} alt={sponsorName} className="schedule__sponsor-logo" />
                        ) : (
                          <span className="schedule__sponsor-avatar" aria-hidden="true">{sponsorInitials}</span>
                        )}
                        <span className="schedule__sponsor-name">{sponsorName}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
