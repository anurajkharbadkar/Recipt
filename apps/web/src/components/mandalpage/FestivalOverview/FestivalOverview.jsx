import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import {
  getFestivalDurationDays,
  formatLocalizedDateRange,
  formatLocalizedDate,
  toDevanagariNumerals,
  getTodaysEvent,
} from '@/utils/dateUtils';
import './FestivalOverview.css';

/**
 * FestivalOverview
 *
 * Compact Festival Intro / Quick Info section.
 * Answers:
 * 1. What is this festival?
 * 2. When is it?
 * 3. Where is it?
 * 4. How many days?
 *
 * Includes contextual "Today's Celebration" banner when festival is live,
 * with a direct action to jump into that day's schedule.
 */
export default function FestivalOverview() {
  const { festival, schedule, location } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView({ threshold: 0.1 });

  if (!festival) return null;

  const festivalName = getLocalized(festival.name) || festival.nameMarathi || 'नवरात्रोत्सव';
  const festivalDesc = getLocalized(festival.description);
  const festivalTheme = getLocalized(festival.theme);
  const venue = getLocalized(location?.venue);
  const address = getLocalized(location?.address);
  const totalDays = getFestivalDurationDays(festival, schedule);
  const localizedDays = (language === 'mr' || language === 'hi') ? toDevanagariNumerals(totalDays) : totalDays;
  const dateRangeStr = formatLocalizedDateRange(festival.startDate, festival.endDate, language);

  // Today's celebration check
  const todayResult = getTodaysEvent(schedule, festival);
  const isLiveToday = todayResult?.status === 'during' && Boolean(todayResult?.matchingDay);
  const todayDayNum = todayResult?.matchingDay?.dayNumber ?? todayResult?.matchingDay?.day;
  const localizedTodayDayNum = (language === 'mr' || language === 'hi')
    ? toDevanagariNumerals(todayDayNum)
    : todayDayNum;
  const todayEventTitle = todayResult?.primaryEvent ? getLocalized(todayResult.primaryEvent.title) : '';
  const todayDateFormatted = todayResult?.matchingDay?.date
    ? formatLocalizedDate(todayResult.matchingDay.date, language, 'day-month')
    : '';

  const handleJumpToToday = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.hash = `#day-${todayDayNum}`;
      const scheduleEl = document.querySelector('#schedule');
      if (scheduleEl) {
        scheduleEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleExploreSchedule = (e) => {
    e.preventDefault();
    const el = document.querySelector('#schedule');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="festival" className="festival-overview section" aria-labelledby="festival-overview-heading">
      <div className="container">
        <div
          ref={ref}
          className={`festival-overview__container reveal ${isVisible ? 'reveal--visible' : ''}`}
        >
          {/* Header */}
          <div className="festival-overview__header">
            <div className="festival-overview__badge-row">
              <span className="festival-overview__eyebrow">{t('festivalOverview')}</span>
              {festival.year && (
                <span className="festival-overview__year-badge">
                  {(language === 'mr' || language === 'hi') ? toDevanagariNumerals(festival.year) : festival.year}
                </span>
              )}
            </div>

            <h2 id="festival-overview-heading" className="heading-display festival-overview__title">
              {festivalName}
            </h2>

            {/* Key Highlight Pill */}
            <div className="festival-overview__meta-bar">
              <div className="festival-overview__meta-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="festival-overview__meta-text">{dateRangeStr}</span>
              </div>

              <div className="festival-overview__meta-divider" aria-hidden="true">•</div>

              <div className="festival-overview__meta-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="festival-overview__meta-highlight">
                  {localizedDays} {t('daysOfCelebration')}
                </span>
              </div>
            </div>

            {/* Theme Display if available */}
            {festivalTheme && (
              <div className="festival-overview__theme-banner" role="note" aria-label={t('festivalTheme')}>
                <span className="festival-overview__theme-label">{t('festivalTheme')}:</span>
                <span className="festival-overview__theme-val">"{festivalTheme}"</span>
              </div>
            )}

            {/* Festival Description */}
            {festivalDesc && (
              <p className="festival-overview__desc">
                {festivalDesc}
              </p>
            )}

            {/* Live Today Compact Highlight Banner (Section 19) */}
            {isLiveToday && (
              <div className="festival-overview__today-banner">
                <div className="festival-overview__today-meta">
                  <span className="festival-overview__today-badge">
                    <span className="festival-overview__pulse-dot" aria-hidden="true" />
                    <span>{t('statusToday')}</span>
                  </span>
                  <span className="festival-overview__today-day">
                    {t('dayBadge')} {localizedTodayDayNum} • {todayDateFormatted}
                  </span>
                </div>
                {todayEventTitle && (
                  <p className="festival-overview__today-event">{todayEventTitle}</p>
                )}
                <a
                  href={`#day-${todayDayNum}`}
                  onClick={handleJumpToToday}
                  className="festival-overview__today-cta"
                >
                  <span>{t('viewTodaySchedule')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="festival-overview__grid">
            <div className="festival-overview__card">
              <div className="festival-overview__card-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="festival-overview__card-content">
                <span className="festival-overview__card-eyebrow">{t('celebration')}</span>
                <h3 className="festival-overview__card-title">
                  {localizedDays} {t('daysCount') || 'Days'}
                </h3>
                <p className="festival-overview__card-sub">
                  {t('daysOfCelebration')}
                </p>
              </div>
            </div>

            <div className="festival-overview__card">
              <div className="festival-overview__card-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="festival-overview__card-content">
                <span className="festival-overview__card-eyebrow">{t('celebrations')}</span>
                <h3 className="festival-overview__card-title">
                  {dateRangeStr}
                </h3>
                <p className="festival-overview__card-sub">
                  {festival.year ? `${(language === 'mr' || language === 'hi') ? toDevanagariNumerals(festival.year) : festival.year}` : ''}
                </p>
              </div>
            </div>

            <div className="festival-overview__card">
              <div className="festival-overview__card-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="festival-overview__card-content">
                <span className="festival-overview__card-eyebrow">{t('location')}</span>
                <h3 className="festival-overview__card-title">
                  {venue}
                </h3>
                {address && (
                  <p className="festival-overview__card-sub">
                    {address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="festival-overview__action-row">
            <a
              href="#schedule"
              onClick={handleExploreSchedule}
              className="btn btn--primary festival-overview__explore-btn"
            >
              <span>{t('exploreFestivalDays')}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
