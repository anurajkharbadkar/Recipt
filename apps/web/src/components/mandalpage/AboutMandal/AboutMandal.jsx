import { useState } from 'react';
import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useInView } from '@/hooks/useInView';
import { toDevanagariNumerals } from '@/utils/dateUtils';
import './AboutMandal.css';

/**
 * Icons for social initiatives and achievements
 */
function InitiativeIcon({ type }) {
  switch (type) {
    case 'health':
    case 'heart':
      return (
        <svg className="story-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'education':
    case 'book':
      return (
        <svg className="story-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'environment':
    case 'leaf':
      return (
        <svg className="story-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    default:
      return (
        <svg className="story-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
  }
}

function AwardMedalIcon() {
  return (
    <svg className="story-icon story-icon--award" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export default function AboutMandal() {
  const mandal = useMandal();
  const { identity, history: mandalHistory } = mandal;
  const { t, getLocalized, language } = useLanguage();
  const [ref, isVisible] = useInView();
  const [aboutImgError, setAboutImgError] = useState(false);
  const [milestoneImgErrors, setMilestoneImgErrors] = useState({});

  if (mandalHistory?.enabled === false || mandalHistory?.showHistory === false) {
    return null;
  }

  const mandalName = getLocalized(identity?.name);
  const tagline = getLocalized(identity?.tagline);
  
  // Safe extraction supporting both top-level and history-level models
  const establishedYear = mandal.establishedYear || identity?.established || mandalHistory?.establishmentYear;
  const historyText = getLocalized(mandalHistory?.description) || getLocalized(identity?.description);
  
  const milestones = (mandal.milestones && mandal.milestones.length > 0)
    ? mandal.milestones
    : (mandalHistory?.milestones || []);

  const rawCommunityStats = mandal.communityStats || mandalHistory?.communityStats || null;
  
  const socialInitiatives = (mandal.socialInitiatives && mandal.socialInitiatives.length > 0)
    ? mandal.socialInitiatives
    : (mandalHistory?.socialActivities || []);

  const achievements = (mandal.achievements && mandal.achievements.length > 0)
    ? mandal.achievements
    : (mandalHistory?.achievements || []);

  const customSections = mandal.customSections || [];

  // Format numbers for MR/HI vs EN
  const formatYear = (yr) => {
    if (!yr) return '';
    return (language === 'mr' || language === 'hi') ? toDevanagariNumerals(yr) : String(yr);
  };

  const formatStat = (num, hasPlus = true) => {
    if (num === undefined || num === null) return '';
    const localizedNum = (language === 'mr' || language === 'hi') ? toDevanagariNumerals(num) : String(num);
    return hasPlus ? `${localizedNum}+` : localizedNum;
  };

  // Milestone category label resolver
  const getCategoryLabel = (category) => {
    if (!category) return null;
    const catLower = String(category).toLowerCase();
    const map = {
      foundation: t('categoryFoundation'),
      festival: t('categoryFestival'),
      community: t('categoryCommunity'),
      social: t('categorySocial'),
      cultural: t('categoryCultural'),
      achievement: t('categoryAchievement'),
      health: t('categoryHealth'),
      education: t('categoryEducation'),
      environment: t('categoryEnvironment'),
    };
    return map[catLower] || category;
  };

  // Check if we have valid community stats to render and if stats display is enabled
  const hasStats = rawCommunityStats && rawCommunityStats.showStats !== false && Object.values(rawCommunityStats).some(v => typeof v === 'number');

  return (
    <section id="story" className="story-section section" aria-label={t('ourStory')}>
      {/* Stable secondary anchor for backwards compatibility */}
      <span id="about" className="story-anchor-shim" aria-hidden="true" />

      <div ref={ref} className={`container reveal ${isVisible ? 'reveal--visible' : ''}`}>
        
        {/* ==================================================
            1. OUR STORY — Narrative & Archival Legacy
            ================================================== */}
        <article className="story-narrative-card">
          <div className="story-narrative-inner">
            <div className="story-narrative-content">
              {/* Header Badges */}
              <div className="story-header-badges">
                <span className="eyebrow story-eyebrow">{t('ourStory')}</span>
                {establishedYear && (
                  <span className="story-established-badge" aria-label={`${t('mandalEstablished')}: ${establishedYear}`}>
                    <span className="story-badge-dot" aria-hidden="true" />
                    {establishedYear} {t('establishedIn')}
                  </span>
                )}
              </div>

              <h2 className="heading-display heading-display--md story-title">
                {mandalName}
              </h2>

              {tagline && (
                <p className="story-tagline">
                  {tagline}
                </p>
              )}

              {/* Archival Editorial Narrative */}
              {historyText && (
                <div className="story-editorial-body">
                  <p className="story-lead-paragraph">
                    {historyText}
                  </p>
                </div>
              )}
            </div>

            {/* Archival Image if supplied */}
            {identity?.aboutImageUrl && !aboutImgError && (
              <div className="story-image-column">
                <div className="story-image-frame">
                  <img
                    className="story-image"
                    src={identity.aboutImageUrl}
                    alt={`${mandalName} legacy`}
                    loading="lazy"
                    onError={() => setAboutImgError(true)}
                  />
                  {establishedYear && (
                    <div className="story-image-caption">
                      <span>{t('mandalEstablished')} • {formatYear(establishedYear)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* ==================================================
            2. OUR JOURNEY — Milestones Timeline
            ================================================== */}
        {milestones.length > 0 && (
          <section className="story-block story-block--timeline" aria-labelledby="journey-heading">
            <div className="story-block-header">
              <span className="eyebrow story-eyebrow">{t('ourJourney')}</span>
              <h3 id="journey-heading" className="heading-display heading-display--sm story-block-title">
                {t('milestones')}
              </h3>
              <p className="story-block-subtitle">
                {t('milestonesSubtitle')}
              </p>
            </div>

            <ol className="story-timeline" aria-label={t('ourJourney')}>
              {milestones.map((milestone, idx) => {
                const milestoneTitle = getLocalized(milestone.title);
                const milestoneDesc = getLocalized(milestone.description);
                const categoryLabel = getCategoryLabel(milestone.category);

                return (
                  <li key={milestone.id || `m-${idx}`} className="story-timeline-item">
                    {/* Connecting Spine Dot */}
                    <div className="story-timeline-marker" aria-hidden="true">
                      <span className="story-marker-dot" />
                    </div>

                    <div className="story-timeline-card">
                      <header className="story-timeline-header">
                        <div className="story-timeline-meta">
                          <span className="story-year-pill">
                            {formatYear(milestone.year)}
                          </span>
                          {categoryLabel && (
                            <span className="story-category-tag">
                              {categoryLabel}
                            </span>
                          )}
                        </div>
                        <h4 className="story-milestone-title">
                          {milestoneTitle}
                        </h4>
                      </header>

                      {milestoneDesc && (
                        <p className="story-milestone-desc">
                          {milestoneDesc}
                        </p>
                      )}

                      {milestone.image && !milestoneImgErrors[milestone.id || idx] && (
                        <div className="story-milestone-image-wrapper">
                          <img
                            src={milestone.image}
                            alt={`${milestoneTitle} (${milestone.year})`}
                            className="story-milestone-image"
                            loading="lazy"
                            onError={() => setMilestoneImgErrors(prev => ({ ...prev, [milestone.id || idx]: true }))}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* ==================================================
            3. OUR COMMUNITY — Structured Numeric Statistics
            ================================================== */}
        {hasStats && (
          <section className="story-block story-block--community" aria-labelledby="community-heading">
            <div className="story-block-header">
              <span className="eyebrow story-eyebrow">{t('ourCommunity')}</span>
              <h3 id="community-heading" className="heading-display heading-display--sm story-block-title">
                {t('ourCommunity')}
              </h3>
              <p className="story-block-subtitle">
                {t('communitySubtitle')}
              </p>
            </div>

            <div className="story-stats-grid" role="list" aria-label={t('ourCommunity')}>
              {rawCommunityStats.families !== undefined && (
                <div className="story-stat-card" role="listitem">
                  <span className="story-stat-number">{formatStat(rawCommunityStats.families)}</span>
                  <span className="story-stat-label">{t('communityFamilies')}</span>
                </div>
              )}

              {rawCommunityStats.volunteers !== undefined && (
                <div className="story-stat-card" role="listitem">
                  <span className="story-stat-number">{formatStat(rawCommunityStats.volunteers)}</span>
                  <span className="story-stat-label">{t('activeVolunteers')}</span>
                </div>
              )}

              {rawCommunityStats.yearsActive !== undefined && (
                <div className="story-stat-card" role="listitem">
                  <span className="story-stat-number">{formatStat(rawCommunityStats.yearsActive, false)}</span>
                  <span className="story-stat-label">{t('yearsActive')}</span>
                </div>
              )}

              {rawCommunityStats.socialInitiatives !== undefined && (
                <div className="story-stat-card" role="listitem">
                  <span className="story-stat-number">{formatStat(rawCommunityStats.socialInitiatives)}</span>
                  <span className="story-stat-label">{t('socialInitiativesCount')}</span>
                </div>
              )}

              {rawCommunityStats.culturalPrograms !== undefined && (
                <div className="story-stat-card" role="listitem">
                  <span className="story-stat-number">{formatStat(rawCommunityStats.culturalPrograms)}</span>
                  <span className="story-stat-label">{t('culturalProgramsCount')}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================================================
            4. COMMUNITY INITIATIVES — Social Contributions
            ================================================== */}
        {socialInitiatives.length > 0 && (
          <section className="story-block story-block--initiatives" aria-labelledby="initiatives-heading">
            <div className="story-block-header">
              <span className="eyebrow story-eyebrow">{t('communityInitiatives')}</span>
              <h3 id="initiatives-heading" className="heading-display heading-display--sm story-block-title">
                {t('communityInitiatives')}
              </h3>
              <p className="story-block-subtitle">
                {t('initiativesSubtitle')}
              </p>
            </div>

            <div className="story-initiatives-grid">
              {socialInitiatives.map((item, idx) => {
                const initTitle = getLocalized(item.title);
                const initDesc = getLocalized(item.description);
                const categoryLabel = getCategoryLabel(item.category);

                return (
                  <article key={item.id || `si-${idx}`} className="story-initiative-card">
                    <div className="story-initiative-top">
                      <div className="story-initiative-icon-wrap" aria-hidden="true">
                        <InitiativeIcon type={item.icon || item.category} />
                      </div>
                      {categoryLabel && (
                        <span className="story-category-tag">
                          {categoryLabel}
                        </span>
                      )}
                    </div>
                    <h4 className="story-initiative-title">
                      {initTitle}
                    </h4>
                    {initDesc && (
                      <p className="story-initiative-desc">
                        {initDesc}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================================================
            5. ACHIEVEMENTS & RECOGNITION
            ================================================== */}
        {achievements.length > 0 && (
          <section className="story-block story-block--achievements" aria-labelledby="achievements-heading">
            <div className="story-block-header">
              <span className="eyebrow story-eyebrow">{t('achievementsHeading')}</span>
              <h3 id="achievements-heading" className="heading-display heading-display--sm story-block-title">
                {t('achievementsHeading')}
              </h3>
              <p className="story-block-subtitle">
                {t('achievementsSubtitle')}
              </p>
            </div>

            <div className="story-achievements-grid">
              {achievements.map((ach, idx) => {
                const achTitle = getLocalized(ach.title);
                const achDesc = ach.description ? getLocalized(ach.description) : null;
                const conferredBy = ach.conferredBy ? getLocalized(ach.conferredBy) : null;

                return (
                  <article key={ach.id || `ach-${idx}`} className="story-achievement-card">
                    <div className="story-achievement-header">
                      <AwardMedalIcon />
                      {ach.year && (
                        <span className="story-year-pill story-year-pill--brass">
                          {formatYear(ach.year)}
                        </span>
                      )}
                    </div>
                    <h4 className="story-achievement-title">
                      {achTitle}
                    </h4>
                    {achDesc && (
                      <p className="story-achievement-desc">
                        {achDesc}
                      </p>
                    )}
                    {conferredBy && (
                      <div className="story-achievement-conferred">
                        <span className="story-conferred-label">{t('conferredBy')}:</span>
                        <span className="story-conferred-name">{conferredBy}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================================================
            6. DYNAMIC CUSTOM WEBPAGE SECTIONS
            ================================================== */}
        {customSections.map((sec, secIdx) => {
          if (sec.enabled === false) return null;
          const secTitle = getLocalized(sec.title);
          const secSubtitle = sec.subtitle ? getLocalized(sec.subtitle) : null;
          const items = sec.items || [];
          if (!secTitle && items.length === 0) return null;

          return (
            <section key={sec.id || `csec-${secIdx}`} className="story-block story-block--custom" aria-label={secTitle}>
              <div className="story-block-header">
                <span className="eyebrow story-eyebrow">{secTitle}</span>
                <h3 className="heading-display heading-display--sm story-block-title">
                  {secTitle}
                </h3>
                {secSubtitle && (
                  <p className="story-block-subtitle">
                    {secSubtitle}
                  </p>
                )}
              </div>

              {sec.layout === 'timeline' ? (
                <ol className="story-timeline" aria-label={secTitle}>
                  {items.map((item, iIdx) => {
                    const itemTitle = getLocalized(item.title);
                    const itemDesc = item.description ? getLocalized(item.description) : null;
                    const itemTag = item.tag ? getLocalized(item.tag) : null;

                    return (
                      <li key={item.id || `item-${iIdx}`} className="story-timeline-item">
                        <div className="story-timeline-marker" aria-hidden="true">
                          <span className="story-marker-dot" />
                        </div>
                        <div className="story-timeline-card">
                          <header className="story-timeline-header">
                            <div className="story-timeline-meta">
                              {item.year && (
                                <span className="story-year-pill">
                                  {formatYear(item.year)}
                                </span>
                              )}
                              {itemTag && (
                                <span className="story-category-tag">
                                  {itemTag}
                                </span>
                              )}
                            </div>
                            <h4 className="story-milestone-title">{itemTitle}</h4>
                          </header>
                          {itemDesc && <p className="story-milestone-desc">{itemDesc}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : sec.layout === 'stats' ? (
                <div className="story-stats-grid" role="list">
                  {items.map((item, iIdx) => (
                    <div key={item.id || `item-${iIdx}`} className="story-stat-card" role="listitem">
                      <span className="story-stat-number">{item.value || (item.year ? formatStat(item.year, false) : '')}</span>
                      <span className="story-stat-label">{getLocalized(item.title)}</span>
                    </div>
                  ))}
                </div>
              ) : sec.layout === 'text' ? (
                <article className="story-narrative-card">
                  <div className="story-narrative-inner">
                    <div className="story-narrative-content space-y-3">
                      {items.map((item, iIdx) => (
                        <div key={item.id || `item-${iIdx}`}>
                          {item.title && <h4 className="font-bold text-theme-fg text-base">{getLocalized(item.title)}</h4>}
                          {item.description && <p className="story-lead-paragraph mt-1">{getLocalized(item.description)}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ) : (
                <div className="story-initiatives-grid">
                  {items.map((item, iIdx) => {
                    const itemTitle = getLocalized(item.title);
                    const itemDesc = item.description ? getLocalized(item.description) : null;
                    const itemTag = item.tag ? getLocalized(item.tag) : null;

                    return (
                      <article key={item.id || `item-${iIdx}`} className="story-initiative-card">
                        <div className="story-initiative-top">
                          <div className="story-initiative-icon-wrap" aria-hidden="true">
                            <InitiativeIcon type={item.icon || 'community'} />
                          </div>
                          {itemTag && (
                            <span className="story-category-tag">
                              {itemTag}
                            </span>
                          )}
                          {item.year && (
                            <span className="story-year-pill story-year-pill--brass">
                              {formatYear(item.year)}
                            </span>
                          )}
                        </div>
                        <h4 className="story-initiative-title">{itemTitle}</h4>
                        {itemDesc && <p className="story-initiative-desc">{itemDesc}</p>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

      </div>
    </section>
  );
}
