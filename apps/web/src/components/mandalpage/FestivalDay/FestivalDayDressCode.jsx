import { useLanguage } from '@/hooks/useLanguage';
import DevotionalAttireIcon from '../common/DevotionalAttireIcon';

/**
 * FestivalDayDressCode
 *
 * Day-specific dress code card.
 * If no dress code is configured for this day, cleanly suppresses rendering.
 */
export default function FestivalDayDressCode({ dressCode, day }) {
  const { t, getLocalized } = useLanguage();

  if (!dressCode && !day?.color) {
    return null;
  }

  const themeText = dressCode?.theme ? getLocalized(dressCode.theme) : (day?.color || '');
  const descText = dressCode?.description ? getLocalized(dressCode.description) : '';
  const colorHex = day?.colorHex || '#A97832';

  return (
    <div className="festival-day-dresscode">
      <div className="festival-day-dresscode__header">
        <div className="festival-day-dresscode__icon-wrap" aria-hidden="true">
          <DevotionalAttireIcon size={18} />
        </div>
        <span className="festival-day-dresscode__label">{t('dressCode')}</span>
      </div>

      <div className="festival-day-dresscode__body">
        <div className="festival-day-dresscode__color-pill">
          <span
            className="festival-day-dresscode__swatch"
            style={{ backgroundColor: colorHex }}
            aria-hidden="true"
          />
          <span className="festival-day-dresscode__theme">{themeText}</span>
        </div>

        {descText && (
          <p className="festival-day-dresscode__desc">{descText}</p>
        )}
      </div>
    </div>
  );
}
