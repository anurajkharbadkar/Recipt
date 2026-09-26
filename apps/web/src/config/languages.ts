/**
 * Centralized Language Configuration
 * E-PavtiBook Mandal Website
 */

/** @type {import('../types/language.js').SupportedLanguage[]} */
export const SUPPORTED_LANGUAGES = [
  {
    code: 'mr',
    label: 'मराठी',
    shortLabel: 'MR',
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    shortLabel: 'HI',
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
  },
];

/** @type {import('../types/language.js').LanguageCode} */
export const DEFAULT_LANGUAGE = 'mr';

/** @type {import('../types/language.js').LanguageCode} */
export const FALLBACK_LANGUAGE = 'mr';

export const LANGUAGE_STORAGE_KEY = 'epavtibook_mandal_lang';

/**
 * Validates if the given code is a supported language
 * @param {string} code
 * @returns {code is import('../types/language.js').LanguageCode}
 */
export function isSupportedLanguage(code) {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}
