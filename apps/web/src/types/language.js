/**
 * Multilingual Type Definitions
 * Supports Marathi (mr), Hindi (hi), and English (en)
 */

/**
 * @typedef {'mr' | 'hi' | 'en'} LanguageCode
 */

/**
 * @typedef {Object} LocalizedText
 * @property {string} mr - Marathi content
 * @property {string} hi - Hindi content
 * @property {string} en - English content
 */

/**
 * @typedef {Object} OptionalLocalizedText
 * @property {string} [mr] - Optional Marathi content
 * @property {string} [hi] - Optional Hindi content
 * @property {string} [en] - Optional English content
 */

/**
 * @typedef {Object} SupportedLanguage
 * @property {LanguageCode} code
 * @property {string} label
 * @property {string} shortLabel
 */

export default {};
