import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * SponsorEvents — Showcases the festival events supported by this partner with direct links back to Mandal page sections
 */
export default function SponsorEvents({ sponsor, mandal }) {
  const { t, getLocalized } = useLanguage();

  const eventAssoc = sponsor.eventAssociation ? getLocalized(sponsor.eventAssociation) : null;
  const eventIds = sponsor.eventIds || (sponsor.eventId ? [sponsor.eventId] : []);

  if (!eventAssoc && eventIds.length === 0) return null;

  const mandalSlug = mandal.identity.slug;

  // Resolve matching events from mandal schedule, bhandara, competitions, visarjan
  const supportedEvents = [];

  if (eventIds.includes('bhandara') || (sponsor.tier === 'silver' && sponsor.slug?.includes('caterers'))) {
    supportedEvents.push({
      id: 'bhandara',
      title: t('bhandara'),
      subtitle: t('bhandaraSubtitle'),
      anchor: `/mandal/${mandalSlug}#bhandara`,
      tag: t('food') || 'Mahaprasad',
    });
  }

  if (eventIds.includes('visarjan') || sponsor.slug?.includes('electricals')) {
    supportedEvents.push({
      id: 'visarjan',
      title: t('visarjan'),
      subtitle: t('visarjanSubtitle'),
      anchor: `/mandal/${mandalSlug}#visarjan`,
      tag: t('procession') || 'Visarjan',
    });
  }

  if (mandal.competitions && mandal.competitions.length > 0) {
    mandal.competitions.forEach(c => {
      if (eventIds.includes(c.id) || (sponsor.slug?.includes('jewellers') && c.id === 'comp-2')) {
        supportedEvents.push({
          id: c.id,
          title: getLocalized(c.title),
          subtitle: getLocalized(c.description),
          anchor: `/mandal/${mandalSlug}#activities`,
          tag: t('competition') || 'Activity',
        });
      }
    });
  }

  return (
    <section className="sponsor-events" aria-labelledby="sponsor-events-heading">
      <div className="sponsor-events__card">
        <h3 id="sponsor-events-heading" className="sponsor-events__title">
          {t('supportingOurCelebration')}
        </h3>

        {/* Primary Event Association Label */}
        {eventAssoc && (
          <div className="sponsor-events__lead-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{eventAssoc}</span>
          </div>
        )}

        {/* Linked festival events if resolved */}
        {supportedEvents.length > 0 && (
          <div className="sponsor-events__list">
            {supportedEvents.map(evt => (
              <Link
                key={evt.id}
                href={evt.anchor}
                className="sponsor-events__item"
              >
                <div className="sponsor-events__item-info">
                  <span className="sponsor-events__item-tag">{evt.tag}</span>
                  <h4 className="sponsor-events__item-title">{evt.title}</h4>
                  {evt.subtitle && (
                    <p className="sponsor-events__item-desc">{evt.subtitle}</p>
                  )}
                </div>
                <div className="sponsor-events__item-arrow" aria-hidden="true">
                  →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
