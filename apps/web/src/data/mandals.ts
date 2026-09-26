import { demoMandal, demoMandal2 } from './demoMandal';

/**
 * Mandal Registry — maps slugs to Mandal data.
 * In production, this would be replaced by an API call.
 * @type {Record<string, import('../types/mandal.js').Mandal>}
 */
const mandals = {
  [demoMandal.identity.slug]: demoMandal,
  [demoMandal2.identity.slug]: demoMandal2,
};

/**
 * Look up a Mandal by its URL slug.
 * @param {string} slug
 * @returns {import('../types/mandal.js').Mandal | null}
 */
export function getMandal(slug) {
  return mandals[slug] || null;
}

/**
 * Get all available Mandal slugs (for listing/index).
 * @returns {{ slug: string; name: import('../types/language.js').LocalizedText; nameMarathi?: string; city: import('../types/language.js').LocalizedText }[]}
 */
export function getAllMandals() {
  return Object.values(mandals).map(m => ({
    slug: m.identity.slug,
    name: m.identity.name,
    nameMarathi: m.identity.nameMarathi,
    city: m.location.city,
  }));
}

/**
 * Get festival days for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').FestivalDay[]}
 */
export function getFestivalDays(slug) {
  const mandal = getMandal(slug);
  return mandal ? mandal.festivalDays : [];
}

/**
 * Get daily dress codes for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').DressCode[]}
 */
export function getDailyDressCodes(slug) {
  const mandal = getMandal(slug);
  return mandal ? mandal.dailyDressCodes : [];
}

/**
 * Get Bhandara (Mahaprasad) configuration for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').Bhandara | null}
 */
export function getBhandara(slug) {
  const mandal = getMandal(slug);
  return mandal ? mandal.bhandara : null;
}

/**
 * Get Visarjan procession configuration for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').Visarjan | null}
 */
export function getVisarjan(slug) {
  const mandal = getMandal(slug);
  return mandal ? mandal.visarjan : null;
}

/**
 * Get competitions and activities for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').Competition[]}
 */
export function getCompetitions(slug) {
  const mandal = getMandal(slug);
  return mandal ? mandal.competitions : [];
}

/**
 * Get announcements for a Mandal.
 * @param {string} slug
 * @param {boolean} [activeOnly=true]
 * @returns {import('../types/mandal.js').Announcement[]}
 */
export function getAnnouncements(slug, activeOnly = true) {
  const mandal = getMandal(slug);
  if (!mandal) return [];
  return activeOnly ? mandal.announcements.filter(a => a.active) : mandal.announcements;
}

/**
 * Get history for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').MandalHistory | null}
 */
export function getMandalHistory(slug) {
  const mandal = getMandal(slug);
  return mandal ? mandal.history || null : null;
}

/**
 * Get milestones for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').MandalMilestone[]}
 */
export function getMilestones(slug) {
  const mandal = getMandal(slug);
  if (!mandal) return [];
  return (mandal.milestones && mandal.milestones.length > 0)
    ? mandal.milestones
    : (mandal.history?.milestones || []);
}

/**
 * Get community statistics for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').CommunityStats | null}
 */
export function getCommunityStats(slug) {
  const mandal = getMandal(slug);
  if (!mandal) return null;
  return mandal.communityStats || mandal.history?.communityStats || null;
}

/**
 * Get social initiatives for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').SocialInitiative[]}
 */
export function getSocialInitiatives(slug) {
  const mandal = getMandal(slug);
  if (!mandal) return [];
  return (mandal.socialInitiatives && mandal.socialInitiatives.length > 0)
    ? mandal.socialInitiatives
    : (mandal.history?.socialActivities || []);
}

/**
 * Get achievements for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').MandalAchievement[]}
 */
export function getAchievements(slug) {
  const mandal = getMandal(slug);
  if (!mandal) return [];
  return (mandal.achievements && mandal.achievements.length > 0)
    ? mandal.achievements
    : (mandal.history?.achievements || []);
}

/**
 * Get all sponsors for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').Sponsor[]}
 */
export function getSponsors(slug) {
  const mandal = getMandal(slug);
  return mandal ? mandal.sponsors || [] : [];
}

/**
 * Look up a specific sponsor by slug or id.
 * @param {string} mandalSlug
 * @param {string} sponsorSlug
 * @returns {import('../types/mandal.js').Sponsor | null}
 */
export function getSponsorBySlug(mandalSlug, sponsorSlug) {
  const sponsors = getSponsors(mandalSlug);
  return sponsors.find(s => s.slug === sponsorSlug || s.id === sponsorSlug) || null;
}

/**
 * Get donation/support configuration for a Mandal.
 * @param {string} slug
 * @returns {import('../types/mandal.js').DonationConfig | null}
 */
export function getDonation(slug: string) {
  const mandal = getMandal(slug);
  return mandal ? (mandal as any).donation || null : null;
}



