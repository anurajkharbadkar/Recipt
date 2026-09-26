/**
 * E-PavtiBook — Date Utilities
 *
 * Provides date helpers for schedule/event detection.
 *
 * PREVIEW DATE SYSTEM:
 * During development, set VITE_PREVIEW_DATE in .env to simulate a specific date.
 * Example: VITE_PREVIEW_DATE=2026-10-17
 * In production, this env var should be unset — the real date is used.
 */

/**
 * Get the "current" date — either the preview date (dev) or real today.
 * @returns {Date}
 */
export function getCurrentDate() {
  const previewDate = typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_PREVIEW_DATE || process.env.VITE_PREVIEW_DATE) : null;
  if (previewDate) {
    const parsed = new Date(previewDate + 'T00:00:00');
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

/**
 * Check if a given ISO date string matches the current (or preview) date.
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isToday(dateString) {
  const today = getCurrentDate();
  const target = new Date(dateString + 'T00:00:00');
  return (
    today.getFullYear() === target.getFullYear() &&
    today.getMonth() === target.getMonth() &&
    today.getDate() === target.getDate()
  );
}

/**
 * Format a date for display.
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @param {'short'|'long'|'day-month'} format
 * @returns {string}
 */
export function formatDate(dateString, format = 'short') {
  const date = new Date(dateString + 'T00:00:00');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  switch (format) {
    case 'long':
      return `${day} ${months[month]} ${year}`;
    case 'day-month':
      return `${day} ${monthsShort[month].toUpperCase()}`;
    case 'short':
    default:
      return `${day} ${monthsShort[month]}`;
  }
}

/**
 * Format a date range (e.g. "11 — 19 October 2026")
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} — ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} — ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
}

/**
 * Find the schedule day that matches today (or preview date).
 * @param {import('../types/mandal.js').FestivalDay[]} schedule
 * @returns {import('../types/mandal.js').FestivalDay|null}
 */
export function getTodaySchedule(schedule) {
  if (!schedule || !schedule.length) return null;
  return schedule.find(day => isToday(day.date)) || null;
}

/**
 * Convert Western Arabic numerals (0-9) to Devanagari numerals (०-९).
 * @param {string|number} input
 * @returns {string}
 */
export function toDevanagariNumerals(input) {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(input).replace(/[0-9]/g, d => devanagariDigits[Number(d)]);
}

/**
 * Format a date string into localized representation (Marathi, Hindi, English).
 * Example for 2026-10-17:
 * - mr: १७ ऑक्टोबर २०२६
 * - hi: १७ अक्टूबर २०२६
 * - en: 17 October 2026
 *
 * @param {string} dateString - YYYY-MM-DD
 * @param {'mr'|'hi'|'en'} [language='en']
 * @returns {string}
 */
export function formatLocalizedDate(dateString, language = 'en') {
  if (!dateString) return '';
  const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate();
  const year = date.getFullYear();

  const marathiMonths = [
    'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
    'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
  ];
  const hindiMonths = [
    'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];
  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (language === 'mr') {
    return `${toDevanagariNumerals(day)} ${marathiMonths[date.getMonth()]} ${toDevanagariNumerals(year)}`;
  }
  if (language === 'hi') {
    return `${toDevanagariNumerals(day)} ${hindiMonths[date.getMonth()]} ${toDevanagariNumerals(year)}`;
  }
  return `${day} ${englishMonths[date.getMonth()]} ${year}`;
}

/**
 * Reusable helper to get today's event and festival status.
 *
 * Compares current/preview date with festival dates:
 * - 'before': before festival starts -> returns daysUntilFestival
 * - 'during': within festival dates -> returns matchingDay, primaryEvent, otherEvents, allEvents
 * - 'after': after festival ends
 * - 'no-event': within festival dates but no event scheduled for this specific day
 *
 * @param {import('../types/mandal.js').FestivalDay[]} schedule
 * @param {import('../types/mandal.js').Festival} festival
 * @param {Date} [currentDate=getCurrentDate()]
 * @param {string} [timezone]
 * @returns {{
 *   status: 'before' | 'during' | 'after' | 'no-event';
 *   daysUntilFestival: number;
 *   matchingDay: import('../types/mandal.js').FestivalDay | null;
 *   primaryEvent: import('../types/mandal.js').FestivalDayEvent | null;
 *   otherEvents: import('../types/mandal.js').FestivalDayEvent[];
 *   allEvents: import('../types/mandal.js').FestivalDayEvent[];
 * }}
 */
export function getTodaysEvent(schedule, festival, currentDate = getCurrentDate(), _timezone) {
  if (!festival || !festival.startDate || !festival.endDate) {
    return {
      status: 'no-event',
      daysUntilFestival: 0,
      matchingDay: null,
      primaryEvent: null,
      otherEvents: [],
      allEvents: []
    };
  }

  // Parse local midnight
  const now = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  const startParts = festival.startDate.split('-').map(Number);
  const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);

  const endParts = festival.endDate.split('-').map(Number);
  const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  // 1. Before Festival: now < startDate
  if (now.getTime() < startDate.getTime()) {
    const diffMs = startDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: 'before',
      daysUntilFestival: Math.max(1, daysUntil),
      matchingDay: null,
      primaryEvent: null,
      otherEvents: [],
      allEvents: []
    };
  }

  // 2. After Festival: now > endDate
  if (now.getTime() > endDate.getTime()) {
    return {
      status: 'after',
      daysUntilFestival: 0,
      matchingDay: null,
      primaryEvent: null,
      otherEvents: [],
      allEvents: []
    };
  }

  // 3. During Festival: look for schedule matching today
  if (!schedule || !schedule.length) {
    return {
      status: 'no-event',
      daysUntilFestival: 0,
      matchingDay: null,
      primaryEvent: null,
      otherEvents: [],
      allEvents: []
    };
  }

  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayIso = `${y}-${m}-${d}`;

  const matchingDay = schedule.find(day => day.date === todayIso) || null;

  if (!matchingDay || !matchingDay.events || matchingDay.events.length === 0) {
    return {
      status: 'no-event',
      daysUntilFestival: 0,
      matchingDay: null,
      primaryEvent: null,
      otherEvents: [],
      allEvents: []
    };
  }

  const events = matchingDay.events;
  const primaryEvent = events.find(e =>
    e.eventType === 'Aarti' ||
    (typeof e.title === 'object' && e.title?.en?.toLowerCase().includes('aarti'))
  ) || events[0];

  const otherEvents = events.filter(e => e !== primaryEvent);

  return {
    status: 'during',
    daysUntilFestival: 0,
    matchingDay,
    primaryEvent,
    otherEvents,
    allEvents: events
  };
}

/**
 * Determine lifecycle state for a given date relative to current/preview date.
 * Returns 'today' if the date matches today, 'past' if in the past, 'upcoming' if in the future.
 *
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {'past' | 'today' | 'upcoming'}
 */
export function getDayState(dateString) {
  if (!dateString) return 'upcoming';
  const current = getCurrentDate();
  const todayIso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
  if (dateString === todayIso) return 'today';
  if (dateString < todayIso) return 'past';
  return 'upcoming';
}

/**
 * Calculate total festival days dynamically from festival data or dates.
 * Never hard-codes 9 or 10.
 *
 * @param {import('../types/mandal.js').Festival} [festival]
 * @param {import('../types/mandal.js').FestivalDay[]} [schedule]
 * @returns {number}
 */
export function getFestivalDurationDays(festival, schedule) {
  if (festival?.totalDays && Number(festival.totalDays) > 0) {
    return Number(festival.totalDays);
  }
  if (schedule && schedule.length > 0) {
    return schedule.length;
  }
  if (festival?.startDate && festival?.endDate) {
    const start = new Date(festival.startDate + 'T00:00:00');
    const end = new Date(festival.endDate + 'T00:00:00');
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 0) return diffDays;
  }
  return 9;
}

/**
 * Format a date range into localized string (e.g. "११ — १९ ऑक्टोबर २०२६" / "11 — 19 October 2026")
 *
 * @param {string} startDate
 * @param {string} endDate
 * @param {'mr'|'hi'|'en'} [language='en']
 * @returns {string}
 */
export function formatLocalizedDateRange(startDate, endDate, language = 'en') {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00');
  const end = new Date(endDate.includes('T') ? endDate : endDate + 'T00:00:00');

  const marathiMonths = [
    'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
    'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
  ];
  const hindiMonths = [
    'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];
  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const sDay = start.getDate();
  const eDay = end.getDate();
  const year = end.getFullYear();

  if (language === 'mr') {
    return `${toDevanagariNumerals(sDay)} — ${toDevanagariNumerals(eDay)} ${marathiMonths[end.getMonth()]} ${toDevanagariNumerals(year)}`;
  }
  if (language === 'hi') {
    return `${toDevanagariNumerals(sDay)} — ${toDevanagariNumerals(eDay)} ${hindiMonths[end.getMonth()]} ${toDevanagariNumerals(year)}`;
  }
  return `${sDay} — ${eDay} ${englishMonths[end.getMonth()]} ${year}`;
}

