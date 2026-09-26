import { useLanguage } from '@/hooks/useLanguage';
import { getDayState, formatLocalizedDate, toDevanagariNumerals } from '@/utils/dateUtils';

/**
 * FestivalDayHeader
 *
 * Editorial header for the selected festival day:
 * - Day number badge (DAY 01)
 * - Full formatted date
 * - Primary Day Title & Deity association
 * - State badge (Today, Completed, Upcoming)
 * - Localized Day Summary description
 */
export default function FestivalDayHeader({ day }) {
  const { t, getLocalized, language } = useLanguage();

  if (!day) return null;

  const dayNum = day.dayNumber;
  const dayState = getDayState(day.date);
  const formattedDate = formatLocalizedDate(day.date, language, 'long');
  const localizedDayNum = (language === 'mr' || language === 'hi')
    ? toDevanagariNumerals(dayNum)
    : String(dayNum).padStart(2, '0');

  const title = getLocalized(day.title);
  const goddessName = getLocalized(day.goddess) || day.goddessMarathi || '';
  const theme = getLocalized(day.theme);
  const description = getLocalized(day.description);

  return (
    <div className="festival-day-header">
      {/* Top Meta Strip */}
      <div className="festival-day-header__meta-strip">
        <span className="festival-day-header__day-badge">
          {t('dayBadge')} {localizedDayNum}
        </span>

        <span className="festival-day-header__date">
          {formattedDate}
        </span>

        {dayState === 'today' && (
          <span className="festival-day-header__status-badge festival-day-header__status-badge--today">
            <span className="festival-day-header__pulse-dot" aria-hidden="true" />
            <span>{t('statusToday')}</span>
          </span>
        )}

        {dayState === 'past' && (
          <span className="festival-day-header__status-badge festival-day-header__status-badge--past">
            ✓ {t('statusCompleted')}
          </span>
        )}
      </div>

      {/* Main Title */}
      <h3 className="festival-day-header__title heading-display heading-display--md">
        {title || goddessName}
      </h3>

      {/* Deity / Sacred Association */}
      {goddessName && title && title !== goddessName && (
        <p className="festival-day-header__deity">
          <span className="festival-day-header__deity-icon" aria-hidden="true">🚩</span>
          <span>{goddessName}</span>
          {theme && <span className="festival-day-header__theme">• {theme}</span>}
        </p>
      )}

      {/* Day Summary */}
      {description && (
        <p className="festival-day-header__summary">
          {description}
        </p>
      )}
    </div>
  );
}
