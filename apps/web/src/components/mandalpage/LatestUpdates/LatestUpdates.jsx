import { useState } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { formatLocalizedDate } from '@/utils/dateUtils';
import { useInView } from '@/hooks/useInView';
import './LatestUpdates.css';

export default function LatestUpdates() {
  const { announcements } = useMandal();
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView();
  const [expanded, setExpanded] = useState(false);

  // Filter active announcements and sort newest first
  const activeAnnouncements = announcements?.filter(a => a.active) || [];

  // If no announcements exist, do not show an empty section
  if (activeAnnouncements.length === 0) {
    return null;
  }

  const sortedAnnouncements = [...activeAnnouncements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const initialLimit = 3;
  const visibleAnnouncements = expanded
    ? sortedAnnouncements
    : sortedAnnouncements.slice(0, initialLimit);
  const hasMore = sortedAnnouncements.length > initialLimit;

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgent': return t('urgent');
      case 'important': return t('important');
      case 'normal':
      default: return t('notice');
    }
  };

  return (
    <section id="updates" className="latest-updates section" aria-label={t('latestUpdates')}>
      <div
        ref={ref}
        className={`container latest-updates__container reveal ${isVisible ? 'reveal--visible' : ''}`}
      >
        <div className="latest-updates__header">
          <p className="eyebrow latest-updates__eyebrow">{t('announcements')}</p>
          <h2 className="heading-display heading-display--md latest-updates__heading">
            {t('latestUpdates')}
          </h2>
          <p className="latest-updates__subtitle">
            {t('updatesSubtitle')}
          </p>
        </div>

        {/* Notice Board Cards */}
        <div className="latest-updates__grid" role="list">
          {visibleAnnouncements.map((item) => {
            const priorityLabel = getPriorityLabel(item.priority);
            const dateDisplay = formatLocalizedDate(item.date, language);
            const title = getLocalized(item.title);
            const description = getLocalized(item.description);
            const relatedEvent = item.relatedEventTitle ? getLocalized(item.relatedEventTitle) : '';
            const sponsor = item.sponsorName ? getLocalized(item.sponsorName) : '';

            return (
              <article
                key={item.id}
                className={`updates-card updates-card--${item.priority || 'normal'}`}
                role="listitem"
              >
                <div className="updates-card__meta">
                  <span className={`updates-card__badge updates-card__badge--${item.priority || 'normal'}`}>
                    {item.priority === 'urgent' && <span className="updates-card__pulse" aria-hidden="true" />}
                    {priorityLabel}
                  </span>
                  <time className="updates-card__date" dateTime={item.date}>
                    {dateDisplay}
                  </time>
                </div>

                <h3 className="updates-card__title">
                  {title}
                </h3>

                <p className="updates-card__desc">
                  {description}
                </p>

                {(relatedEvent || sponsor) && (
                  <div className="updates-card__footer">
                    {relatedEvent && (
                      <span className="updates-card__related">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {relatedEvent}
                      </span>
                    )}
                    {sponsor && (
                      <span className="updates-card__sponsor">
                        {t('supportedBy')}: {sponsor}
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* View All / Show Fewer Toggle */}
        {hasMore && (
          <div className="latest-updates__action">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setExpanded(prev => !prev)}
              aria-expanded={expanded}
            >
              {expanded
                ? t('showFewerUpdates')
                : `${t('viewAllUpdates')} (${sortedAnnouncements.length})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
