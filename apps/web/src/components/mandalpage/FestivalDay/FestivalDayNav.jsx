import { useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { getDayState, formatLocalizedDate, toDevanagariNumerals } from '@/utils/dateUtils';

/**
 * FestivalDayNav
 *
 * Sticky/scrollable horizontal day navigation for the Day-by-Day Festival experience.
 * Mobile: smooth touch scrolling, active tab auto-centering, 44px min touch targets.
 * Desktop: editorial wrap/scroll bar with clear visual states.
 */
export default function FestivalDayNav({ festivalDays, activeDayNumber, onSelectDay }) {
  const { t, getLocalized, language } = useLanguage();
  const navScrollRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll the active tab into view on selection change
  useEffect(() => {
    if (activeTabRef.current && navScrollRef.current) {
      const container = navScrollRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      // Check if tab is outside viewport horizontally
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [activeDayNumber]);

  return (
    <div
      className="festival-day-nav"
      role="tablist"
      aria-label={t('festivalDayNavigation')}
    >
      <div className="festival-day-nav__scroll" ref={navScrollRef}>
        {festivalDays.map((day) => {
          const dayNum = day.dayNumber;
          const isActive = dayNum === activeDayNumber;
          const dayState = getDayState(day.date); // 'past' | 'today' | 'upcoming'
          const formattedDate = formatLocalizedDate(day.date, language, 'day-month');
          const localizedDayNum = (language === 'mr' || language === 'hi')
            ? toDevanagariNumerals(dayNum)
            : dayNum;

          // Day subtitle / deity
          const deityName = getLocalized(day.goddess) || day.goddessMarathi || '';
          const dayTitle = getLocalized(day.title) || deityName || '';

          // Accessible state label
          const statusText = dayState === 'today'
            ? t('statusToday')
            : dayState === 'past'
            ? t('statusCompleted')
            : t('statusUpcoming');

          const ariaLabel = `${t('dayBadge')} ${localizedDayNum}, ${formattedDate}, ${dayTitle}, ${statusText}${isActive ? ', selected' : ''}`;

          return (
            <button
              key={dayNum}
              ref={isActive ? activeTabRef : null}
              id={`festival-day-tab-${dayNum}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`festival-day-panel-${dayNum}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectDay(dayNum)}
              className={`festival-day-nav__tab ${isActive ? 'festival-day-nav__tab--active' : ''} festival-day-nav__tab--${dayState}`}
              aria-label={ariaLabel}
            >
              {/* Line 1: Day & Title (e.g. दिवस १ - घटस्थापना) */}
              <div className="festival-day-nav__tab-top">
                <span
                  className="festival-day-nav__tab-number"
                  title={`${t('dayBadge')} ${localizedDayNum}${dayTitle ? ` - ${dayTitle}` : ''}`}
                >
                  {t('dayBadge')} {localizedDayNum}{dayTitle ? ` - ${dayTitle}` : ''}
                </span>

                {dayState === 'today' && (
                  <span className="festival-day-nav__tab-badge festival-day-nav__tab-badge--today">
                    <span className="festival-day-nav__pulse-dot" aria-hidden="true" />
                    <span>{t('statusToday')}</span>
                  </span>
                )}

                {dayState === 'past' && (
                  <span className="festival-day-nav__tab-badge festival-day-nav__tab-badge--past">
                    ✓
                  </span>
                )}
              </div>

              {/* Line 2: Color Dot + Date */}
              <div className="festival-day-nav__tab-date-row">
                {day.colorHex && (
                  <span
                    className="festival-day-nav__color-dot"
                    style={{ backgroundColor: day.colorHex }}
                    aria-hidden="true"
                  />
                )}
                <span className="festival-day-nav__tab-date">
                  {formattedDate}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
