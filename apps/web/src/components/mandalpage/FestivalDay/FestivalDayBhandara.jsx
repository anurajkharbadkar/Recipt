import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * FestivalDayBhandara
 *
 * Day-specific Mahaprasad / Bhandara celebration card.
 * Rendered only when Bhandara date matches the selected day.
 */
export default function FestivalDayBhandara({ bhandara }) {
  const { t, getLocalized } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);

  if (!bhandara) return null;

  const title = getLocalized(bhandara.title) || t('dayBhandara');
  const description = getLocalized(bhandara.description);
  const venue = getLocalized(bhandara.venue);
  const address = getLocalized(bhandara.address);
  const time = bhandara.startTime
    ? `${bhandara.startTime}${bhandara.endTime ? ` — ${bhandara.endTime}` : ''}`
    : '';
  const menuItems = bhandara.menu || [];
  const instructions = bhandara.instructions || [];

  return (
    <div className="festival-day-bhandara-card">
      <div className="festival-day-bhandara-card__header">
        <div className="festival-day-bhandara-card__badge-row">
          <span className="festival-day-bhandara-card__badge">
            <span aria-hidden="true">🍲</span> {t('dayBhandara')}
          </span>
          {time && (
            <span className="festival-day-bhandara-card__time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{time}</span>
            </span>
          )}
        </div>

        <h4 className="festival-day-bhandara-card__title">{title}</h4>
      </div>

      {description && (
        <p className="festival-day-bhandara-card__desc">{description}</p>
      )}

      {/* Venue */}
      {venue && (
        <div className="festival-day-bhandara-card__venue">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{venue}{address ? `, ${address}` : ''}</span>
        </div>
      )}

      {/* Menu Preview */}
      {menuItems.length > 0 && (
        <div className="festival-day-bhandara-card__menu-section">
          <button
            type="button"
            onClick={() => setShowMenu(prev => !prev)}
            className="festival-day-bhandara-card__menu-toggle"
            aria-expanded={showMenu}
          >
            <span>{showMenu ? t('hideDetails') : t('viewMenu')}</span>
            <svg
              className={`festival-day-bhandara-card__chevron ${showMenu ? 'festival-day-bhandara-card__chevron--open' : ''}`}
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

          {showMenu && (
            <div className="festival-day-bhandara-card__menu-grid">
              {menuItems.map((item, idx) => (
                <span key={item.id || idx} className="festival-day-bhandara-card__menu-pill">
                  {getLocalized(item.name || item)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {instructions.length > 0 && (
        <div className="festival-day-bhandara-card__instructions">
          <ul className="festival-day-bhandara-card__instructions-list">
            {instructions.map((inst, iIdx) => (
              <li key={iIdx}>{getLocalized(inst)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
