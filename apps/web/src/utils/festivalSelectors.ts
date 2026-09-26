import { getDayState } from './dateUtils';

/**
 * festivalSelectors.js
 *
 * Centralized, reusable data selectors for the Day-by-Day Festival Information Architecture.
 * Resolves all day-centric information (events, aarti, dress code, activities, bhandara,
 * visarjan, announcements, sponsors) without duplicating any underlying data.
 */

/**
 * Retrieve normalized festival days list for a Mandal
 * @param {import('../types/mandal.js').Mandal} mandal
 * @returns {Array}
 */
export function getFestivalDays(mandal) {
  if (!mandal) return [];
  const rawDays = mandal.schedule || mandal.festivalDays || [];
  return rawDays.map((day, index) => {
    const dayNumber = Number(day.dayNumber ?? day.day ?? (index + 1));
    return {
      ...day,
      dayNumber,
      events: Array.isArray(day.events) ? day.events : [],
    };
  });
}

/**
 * Find dress code configuration for a specific festival day
 * @param {import('../types/mandal.js').Mandal} mandal
 * @param {object} day
 * @returns {object|null}
 */
export function getDressCodeForDay(mandal, day) {
  if (!mandal || !day) return null;
  const match = mandal.dailyDressCodes?.find(dc =>
    (dc.date && day.date && dc.date === day.date) ||
    (dc.dayNumber != null && dc.dayNumber === day.dayNumber)
  );
  if (match) return match;
  if (day.dressCode) return day.dressCode;
  return null;
}

/**
 * Find competitions / cultural activities scheduled for a specific day
 * @param {import('../types/mandal.js').Mandal} mandal
 * @param {object} day
 * @returns {Array}
 */
export function getActivitiesForDay(mandal, day) {
  if (!mandal?.competitions || !day?.date) return [];
  return mandal.competitions.filter(comp => comp.date === day.date);
}

/**
 * Find Mahaprasad / Bhandara event if scheduled on this day
 * @param {import('../types/mandal.js').Mandal} mandal
 * @param {object} day
 * @returns {object|null}
 */
export function getBhandaraForDay(mandal, day) {
  if (!mandal?.bhandara || !day?.date) return null;
  return mandal.bhandara.date === day.date ? mandal.bhandara : null;
}

/**
 * Find Visarjan procession if scheduled on this day
 * @param {import('../types/mandal.js').Mandal} mandal
 * @param {object} day
 * @returns {object|null}
 */
export function getVisarjanForDay(mandal, day) {
  if (!mandal?.visarjan || !day?.date) return null;
  return mandal.visarjan.date === day.date ? mandal.visarjan : null;
}

/**
 * Find day-specific announcements
 * @param {import('../types/mandal.js').Mandal} mandal
 * @param {object} day
 * @returns {Array}
 */
export function getAnnouncementsForDay(mandal, day) {
  if (!mandal?.announcements || !day?.date) return [];
  return mandal.announcements.filter(a => a.active && a.date === day.date);
}

/**
 * Find celebration partners / sponsors associated with this day, its events,
 * activities, bhandara, or visarjan.
 * @param {import('../types/mandal.js').Mandal} mandal
 * @param {object} day
 * @returns {Array}
 */
export function getSponsorsForDay(mandal, day) {
  if (!mandal?.sponsors || !day) return [];

  const sponsorIds = new Set();

  if (day.sponsorId) sponsorIds.add(day.sponsorId);

  if (Array.isArray(day.events)) {
    day.events.forEach(evt => {
      if (evt.sponsorId) sponsorIds.add(evt.sponsorId);
    });
  }

  const bhandara = getBhandaraForDay(mandal, day);
  if (bhandara?.sponsorId) sponsorIds.add(bhandara.sponsorId);

  const visarjan = getVisarjanForDay(mandal, day);
  if (visarjan?.sponsorId) sponsorIds.add(visarjan.sponsorId);

  const activities = getActivitiesForDay(mandal, day);
  activities.forEach(act => {
    if (act.sponsorId) sponsorIds.add(act.sponsorId);
  });

  if (sponsorIds.size === 0) return [];

  return mandal.sponsors.filter(s => sponsorIds.has(s.id));
}

/**
 * Get the day matching Today's date, or null if outside festival
 * @param {Array} festivalDays
 * @returns {object|null}
 */
export function getTodayFestivalDay(festivalDays) {
  if (!Array.isArray(festivalDays)) return null;
  return festivalDays.find(d => getDayState(d.date) === 'today') || null;
}

/**
 * Parse URL hash to find which day number should be activated
 * Supports:
 * - #day-3 or #m-day-3 -> Day 3
 * - #bhandara -> Day containing Bhandara
 * - #visarjan -> Day containing Visarjan
 * - #activities -> First day containing an activity
 *
 * @param {string} hash
 * @param {Array} festivalDays
 * @param {import('../types/mandal.js').Mandal} mandal
 * @returns {number|null}
 */
export function parseDayFromHash(hash, festivalDays, mandal) {
  if (!hash || !Array.isArray(festivalDays) || festivalDays.length === 0) return null;

  const cleanHash = hash.replace(/^#/, '').toLowerCase();

  // Match #day-X or #m-day-X
  const dayMatch = cleanHash.match(/^(?:m-)?day-(\d+)$/i);
  if (dayMatch) {
    const targetNum = parseInt(dayMatch[1], 10);
    const exists = festivalDays.some(d => d.dayNumber === targetNum);
    if (exists) return targetNum;
  }

  // Anchor backward compatibility: #bhandara
  if (cleanHash === 'bhandara' && mandal?.bhandara?.date) {
    const match = festivalDays.find(d => d.date === mandal.bhandara.date);
    if (match) return match.dayNumber;
  }

  // Anchor backward compatibility: #visarjan
  if (cleanHash === 'visarjan' && mandal?.visarjan?.date) {
    const match = festivalDays.find(d => d.date === mandal.visarjan.date);
    if (match) return match.dayNumber;
  }

  // Anchor backward compatibility: #activities
  if (cleanHash === 'activities' && mandal?.competitions?.length > 0) {
    const firstComp = mandal.competitions[0];
    if (firstComp?.date) {
      const match = festivalDays.find(d => d.date === firstComp.date);
      if (match) return match.dayNumber;
    }
  }

  return null;
}

export { getDayState };
