import { useState, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatLocalizedDate, toDevanagariNumerals } from '@/utils/dateUtils';

/**
 * FestivalDayShare
 *
 * Compact action button to share the selected festival day.
 * Targets the direct day anchor URL (#day-X).
 */
export default function FestivalDayShare({ day, mandalName }) {
  const { t, getLocalized, language } = useLanguage();
  const [toastVisible, setToastVisible] = useState(false);

  const dayNum = day?.dayNumber || 1;
  const formattedDate = day?.date ? formatLocalizedDate(day.date, language, 'short') : '';
  const dayTitle = getLocalized(day?.title) || getLocalized(day?.goddess) || '';
  const localizedDayNum = (language === 'mr' || language === 'hi')
    ? toDevanagariNumerals(dayNum)
    : dayNum;

  const handleShare = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shareUrl = `${origin}${pathname}#day-${dayNum}`;
    const shareTitle = `${mandalName} — ${t('dayBadge')} ${localizedDayNum}: ${dayTitle}`;
    const shareText = `🚩 ${mandalName}\n✨ ${t('dayBadge')} ${localizedDayNum} (${formattedDate}): ${dayTitle}\n${shareUrl}`;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2500);
      }
    } catch (e) {
      console.error('Failed to copy day share text:', e);
    }
  }, [dayNum, localizedDayNum, formattedDate, dayTitle, mandalName, t]);

  return (
    <div className="festival-day-share">
      <button
        type="button"
        onClick={handleShare}
        className="festival-day-share__btn"
        aria-label={`${t('shareDay')} ${dayNum}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>{t('shareDay')}</span>
      </button>

      {toastVisible && (
        <span className="festival-day-share__toast" role="status" aria-live="polite">
          ✓ {t('dayShared')}
        </span>
      )}
    </div>
  );
}
