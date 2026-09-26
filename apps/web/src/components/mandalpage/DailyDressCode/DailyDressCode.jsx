import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { getDayState, formatLocalizedDate, toDevanagariNumerals } from '@/utils/dateUtils';
import DevotionalAttireIcon from '../common/DevotionalAttireIcon';
import './DailyDressCode.css';

export default function DailyDressCode() {
  const { dailyDressCodes, schedule } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView({ threshold: 0.08 });

  if (!dailyDressCodes || dailyDressCodes.length === 0) {
    return null;
  }

  // Pre-index colorHex from schedule days if available
  const scheduleDayMap = new Map();
  if (schedule && schedule.length > 0) {
    for (const s of schedule) {
      const num = s.dayNumber ?? s.day;
      scheduleDayMap.set(num, s);
    }
  }

  return (
    <section id="dress-code" className="daily-dress-code section" aria-labelledby="dress-code-heading">
      <div className="container">
        <div
          ref={ref}
          className={`daily-dress-code__wrapper reveal ${isVisible ? 'reveal--visible' : ''}`}
        >
          {/* Header */}
          <div className="daily-dress-code__header">
            <p className="eyebrow daily-dress-code__eyebrow-wrap">
              <DevotionalAttireIcon size={16} className="daily-dress-code__eyebrow-icon" />
              <span>{t('dailyDressCode')}</span>
            </p>
            <h2 id="dress-code-heading" className="heading-display heading-display--lg">
              {t('dailyDressCode')}
            </h2>
            <p className="daily-dress-code__subtitle">
              {t('dressCodeSubtitle')}
            </p>
          </div>

          {/* Grid of Dress Code Days */}
          <div className="daily-dress-code__grid" role="list">
            {dailyDressCodes.map((item) => {
              const dayNum = item.dayNumber;
              const matchingScheduleDay = scheduleDayMap.get(dayNum);
              const colorHex = matchingScheduleDay?.colorHex || '#A97832';
              const goddessName = matchingScheduleDay ? (getLocalized(matchingScheduleDay.goddess) || matchingScheduleDay.goddessMarathi) : '';
              const themeText = getLocalized(item.theme) || '';
              const descText = item.description ? getLocalized(item.description) : '';
              const formattedDate = formatLocalizedDate(item.date, language);
              const dayState = getDayState(item.date);
              const isTodayDay = dayState === 'today';

              const dayNumFormatted = (language === 'mr' || language === 'hi')
                ? toDevanagariNumerals(String(dayNum).padStart(2, '0'))
                : String(dayNum).padStart(2, '0');

              return (
                <div
                  key={dayNum}
                  className={`daily-dress-code__card ${isTodayDay ? 'daily-dress-code__card--today' : ''} ${dayState === 'past' ? 'daily-dress-code__card--past' : ''}`}
                  role="listitem"
                  style={{ '--dress-accent-color': colorHex }}
                >
                  {/* Card Header */}
                  <div className="daily-dress-code__card-top">
                    <div className="daily-dress-code__day-badge">
                      <span className="daily-dress-code__day-label">{t('dayBadge')} {dayNumFormatted}</span>
                      <span className="daily-dress-code__date">{formattedDate}</span>
                    </div>

                    <div className="daily-dress-code__swatch-wrap">
                      {isTodayDay && (
                        <span className="daily-dress-code__today-pill">
                          {t('todayBadge')}
                        </span>
                      )}
                      <span className="daily-dress-code__icon-swatch-box">
                        <DevotionalAttireIcon size={17} className="daily-dress-code__card-attire-icon" />
                        <span
                          className="daily-dress-code__swatch"
                          style={{ backgroundColor: colorHex }}
                          aria-hidden="true"
                          title={themeText}
                        />
                      </span>
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="daily-dress-code__card-body">
                    {goddessName && (
                      <p className="daily-dress-code__goddess">{goddessName}</p>
                    )}
                    <h3 className="daily-dress-code__theme">
                      {themeText}
                    </h3>

                    {descText && (
                      <p className="daily-dress-code__desc">
                        {descText}
                      </p>
                    )}

                    {item.image && (
                      <div className="daily-dress-code__image-wrap">
                        <img src={item.image} alt={themeText} loading="lazy" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
