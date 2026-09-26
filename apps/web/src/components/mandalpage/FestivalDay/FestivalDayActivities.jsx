import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * FestivalDayActivities
 *
 * Renders competitions & cultural programs occurring on the selected day.
 * Includes collapsible rules & registration guidelines.
 */
export default function FestivalDayActivities({ activities }) {
  const { t, getLocalized } = useLanguage();
  const [expandedId, setExpandedId] = useState(null);

  if (!activities || activities.length === 0) {
    return null;
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="festival-day-activities">
      <h4 className="festival-day-activities__heading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
        <span>{t('dayActivities')}</span>
      </h4>

      <div className="festival-day-activities__list">
        {activities.map((act) => {
          const isExpanded = expandedId === act.id;
          const title = getLocalized(act.title);
          const description = getLocalized(act.description);
          const category = getLocalized(act.category) || act.category;
          const time = act.startTime ? `${act.startTime}${act.endTime ? ` — ${act.endTime}` : ''}` : '';
          const venue = getLocalized(act.venue);
          const eligibility = getLocalized(act.eligibility);
          const registration = getLocalized(act.registrationInfo);
          const rules = act.rules || [];

          return (
            <div key={act.id} className="festival-day-activity-card">
              <div className="festival-day-activity-card__header">
                {category && (
                  <span className="festival-day-activity-card__category">{category}</span>
                )}
                <h5 className="festival-day-activity-card__title">{title}</h5>
              </div>

              {description && (
                <p className="festival-day-activity-card__desc">{description}</p>
              )}

              {/* Meta bar */}
              <div className="festival-day-activity-card__meta">
                {time && (
                  <div className="festival-day-activity-card__meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{time}</span>
                  </div>
                )}
                {venue && (
                  <div className="festival-day-activity-card__meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{venue}</span>
                  </div>
                )}
              </div>

              {/* Collapsible Details */}
              {(eligibility || registration || rules.length > 0) && (
                <div className="festival-day-activity-card__expand-wrap">
                  <button
                    type="button"
                    onClick={() => toggleExpand(act.id)}
                    className="festival-day-activity-card__toggle-btn"
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? t('hideDetails') : t('viewDetails')}</span>
                    <svg
                      className={`festival-day-activity-card__chevron ${isExpanded ? 'festival-day-activity-card__chevron--open' : ''}`}
                      width="14"
                      height="14"
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
                  </button>

                  {isExpanded && (
                    <div className="festival-day-activity-card__expanded-content">
                      {eligibility && (
                        <p className="festival-day-activity-card__detail-item">
                          <strong>{t('eligibility') || 'Eligibility'}:</strong> {eligibility}
                        </p>
                      )}
                      {registration && (
                        <p className="festival-day-activity-card__detail-item">
                          <strong>{t('registration') || 'Registration'}:</strong> {registration}
                        </p>
                      )}
                      {rules.length > 0 && (
                        <div className="festival-day-activity-card__rules">
                          <strong className="festival-day-activity-card__rules-heading">
                            {t('rulesHeading') || 'Rules'}:
                          </strong>
                          <ul className="festival-day-activity-card__rules-list">
                            {rules.map((rule, rIdx) => (
                              <li key={rIdx}>{getLocalized(rule)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
