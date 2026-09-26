/**
 * Multilingual Type Definitions
 * Supports Marathi (mr), Hindi (hi), and English (en)
 */

export type LanguageCode = 'mr' | 'hi' | 'en';

export type LocalizedText = {
  mr: string;
  hi: string;
  en: string;
};

export type OptionalLocalizedText = {
  mr?: string;
  hi?: string;
  en?: string;
};

export type SupportedLanguage = {
  code: LanguageCode;
  label: string;
  shortLabel: string;
};

export default {};
