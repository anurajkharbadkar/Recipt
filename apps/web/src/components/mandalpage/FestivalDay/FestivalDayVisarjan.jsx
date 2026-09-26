import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * FestivalDayVisarjan
 *
 * Day-specific Visarjan procession card.
 * Rendered only on the day when Visarjan is scheduled.
 */
export default function FestivalDayVisarjan({ visarjan }) {
  const { t, getLocalized } = useLanguage();
  const [showRoute, setShowRoute] = useState(false);

  if (!visarjan) return null;

  const title = getLocalized(visarjan.title) || t('dayVisarjan');
  const description = getLocalized(visarjan.description);
  const time = visarjan.startTime
    ? `${visarjan.startTime}${visarjan.endTime ? ` — ${visarjan.endTime}` : ''}`
    : '';

  const assemblyName = getLocalized(visarjan.assemblyPoint?.name || visarjan.assemblyPoint);
  const endName = getLocalized(visarjan.endPoint?.name || visarjan.endPoint);
  const routeStops = visarjan.route || [];
  const instructions = visarjan.importantInstructions || [];

  return (
    <div className="festival-day-visarjan-card">
      <div className="festival-day-visarjan-card__header">
        <div className="festival-day-visarjan-card__badge-row">
          <span className="festival-day-visarjan-card__badge">
            <span aria-hidden="true">🚩</span> {t('dayVisarjan')}
          </span>
          {time && (
            <span className="festival-day-visarjan-card__time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{time}</span>
            </span>
          )}
        </div>

        <h4 className="festival-day-visarjan-card__title">{title}</h4>
      </div>

      {description && (
        <p className="festival-day-visarjan-card__desc">{description}</p>
      )}

      {/* Assembly & End Points */}
      <div className="festival-day-visarjan-card__points">
        {assemblyName && (
          <div className="festival-day-visarjan-card__point">
            <span className="festival-day-visarjan-card__point-label">
              {t('startingPoint') || 'Assembly'}:
            </span>
            <span className="festival-day-visarjan-card__point-value">{assemblyName}</span>
          </div>
        )}
        {endName && (
          <div className="festival-day-visarjan-card__point">
            <span className="festival-day-visarjan-card__point-label">
              {t('finalDestination') || 'Destination'}:
            </span>
            <span className="festival-day-visarjan-card__point-value">{endName}</span>
          </div>
        )}
      </div>

      {/* Collapsible Route Stops */}
      {routeStops.length > 0 && (
        <div className="festival-day-visarjan-card__route-section">
          <button
            type="button"
            onClick={() => setShowRoute(prev => !prev)}
            className="festival-day-visarjan-card__route-toggle"
            aria-expanded={showRoute}
          >
            <span>{showRoute ? t('hideDetails') : t('viewRoute')}</span>
            <svg
              className={`festival-day-visarjan-card__chevron ${showRoute ? 'festival-day-visarjan-card__chevron--open' : ''}`}
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

          {showRoute && (
            <div className="festival-day-visarjan-card__route-stops">
              <ol className="festival-day-visarjan-card__stops-list">
                {routeStops.map((stop, sIdx) => (
                  <li key={stop.id || sIdx} className="festival-day-visarjan-card__stop-item">
                    <span className="festival-day-visarjan-card__stop-name">
                      {getLocalized(stop.name)}
                    </span>
                    {stop.estimatedTime && (
                      <span className="festival-day-visarjan-card__stop-time">
                        {stop.estimatedTime}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Important instructions */}
      {instructions.length > 0 && (
        <div className="festival-day-visarjan-card__instructions">
          <ul className="festival-day-visarjan-card__instructions-list">
            {instructions.map((inst, iIdx) => (
              <li key={iIdx}>{getLocalized(inst)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
