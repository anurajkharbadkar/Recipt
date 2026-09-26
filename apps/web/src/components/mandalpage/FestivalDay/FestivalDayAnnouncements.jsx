import { useLanguage } from '@/hooks/useLanguage';

/**
 * FestivalDayAnnouncements
 *
 * Renders date-aware notices and official announcements belonging to the selected day.
 */
export default function FestivalDayAnnouncements({ announcements }) {
  const { t, getLocalized } = useLanguage();

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgent': return t('urgent');
      case 'important': return t('important');
      default: return t('notice');
    }
  };

  return (
    <div className="festival-day-announcements">
      <h4 className="festival-day-announcements__heading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>{t('dayNotice')}</span>
      </h4>

      <div className="festival-day-announcements__list">
        {announcements.map((item) => {
          const priorityLabel = getPriorityLabel(item.priority);
          const title = getLocalized(item.title);
          const description = getLocalized(item.description);

          return (
            <div
              key={item.id}
              className={`festival-day-announcement-card festival-day-announcement-card--${item.priority || 'normal'}`}
            >
              <div className="festival-day-announcement-card__top">
                <span className={`festival-day-announcement-card__badge festival-day-announcement-card__badge--${item.priority || 'normal'}`}>
                  {priorityLabel}
                </span>
                <h5 className="festival-day-announcement-card__title">{title}</h5>
              </div>

              {description && (
                <p className="festival-day-announcement-card__desc">{description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
