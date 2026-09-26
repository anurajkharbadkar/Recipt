import { useLanguage } from '@/hooks/useLanguage';

/**
 * FestivalDaySponsor
 *
 * Contextual sponsor attribution for the selected festival day.
 * Displays a tasteful, respectful partner recognition badge without turning
 * the day into an advertising banner.
 */
export default function FestivalDaySponsor({ sponsors, mandalSlug }) {
  const { t, getLocalized } = useLanguage();

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <div className="festival-day-sponsors">
      <span className="festival-day-sponsors__label">
        {t('daySponsor')}
      </span>

      <div className="festival-day-sponsors__list">
        {sponsors.map((sp) => {
          const name = getLocalized(sp.name);
          const initials = sp.initials || (name ? name.slice(0, 2) : 'SP');
          const tier = sp.tier ? String(sp.tier).toLowerCase() : 'partner';
          const sponsorUrl = mandalSlug && sp.slug ? `/m/${mandalSlug}/sponsor/${sp.slug}` : '#sponsors';

          return (
            <a
              key={sp.id}
              href={sponsorUrl}
              className={`festival-day-sponsor-badge festival-day-sponsor-badge--${tier}`}
              aria-label={`${name} (${tier} partner)`}
            >
              <span className="festival-day-sponsor-badge__initials" aria-hidden="true">
                {initials}
              </span>
              <span className="festival-day-sponsor-badge__name">{name}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
}
