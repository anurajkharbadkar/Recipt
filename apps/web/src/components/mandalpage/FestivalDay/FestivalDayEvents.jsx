import { useLanguage } from '@/hooks/useLanguage';

/**
 * FestivalDayEvents
 *
 * Renders the timeline of events for the selected day:
 * - Aarti highlights
 * - Event title, time, venue, description
 */
export default function FestivalDayEvents({ events }) {
  const { t, getLocalized } = useLanguage();

  if (!events || events.length === 0) {
    return (
      <div className="festival-day-events festival-day-events--empty">
        <p className="festival-day-events__empty-text">{t('noEventsForDay')}</p>
      </div>
    );
  }

  return (
    <div className="festival-day-events">
      <h4 className="festival-day-events__heading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{t('dayEvents')}</span>
      </h4>

      <div className="festival-day-events__list">
        {events.map((evt, idx) => {
          const eventTitle = getLocalized(evt.title) || evt.titleMarathi || '';
          const time = evt.time || evt.startTime || '';
          const endTime = evt.endTime ? ` — ${evt.endTime}` : '';
          const timeDisplay = `${time}${endTime}`;
          const venue = getLocalized(evt.venue);
          const description = getLocalized(evt.description);
          const isAarti = evt.eventType?.toLowerCase() === 'aarti' ||
            (typeof eventTitle === 'string' && eventTitle.toLowerCase().includes('aarti')) ||
            (typeof eventTitle === 'string' && eventTitle.includes('आरती'));

          return (
            <div
              key={evt.id || idx}
              className={`festival-day-event ${isAarti ? 'festival-day-event--aarti' : ''}`}
            >
              <div className="festival-day-event__time-col">
                <span className="festival-day-event__time">{timeDisplay}</span>
                {isAarti && (
                  <span className="festival-day-event__aarti-badge" aria-label="Aarti">
                    🪔 Aarti
                  </span>
                )}
              </div>

              <div className="festival-day-event__content-col">
                <h5 className="festival-day-event__title">{eventTitle}</h5>
                {venue && (
                  <p className="festival-day-event__venue">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{venue}</span>
                  </p>
                )}
                {description && (
                  <p className="festival-day-event__desc">{description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
