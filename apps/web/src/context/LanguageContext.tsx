'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from '@/config/languages';
import { translations } from '@/i18n/translations';

export const LanguageContext = createContext<any>(null);


/**
 * Safely retrieves stored language from localStorage or falls back to DEFAULT_LANGUAGE
 * @returns {import('../types/language.js').LanguageCode}
 */
function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && isSupportedLanguage(saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read language preference from localStorage:', e);
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: string }) {
  const [language, setLanguageState] = useState(() => {
    if (initialLanguage && isSupportedLanguage(initialLanguage)) {
      return initialLanguage;
    }
    return getInitialLanguage();
  });

  const setLanguage = useCallback((newLang) => {
    const validLang = isSupportedLanguage(newLang) ? newLang : FALLBACK_LANGUAGE;
    setLanguageState(validLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, validLang);
    } catch (e) {
      console.warn('Failed to save language preference to localStorage:', e);
    }
  }, []);

  // Sync document language attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  /**
   * Translate a static UI label
   * @param {string} key
   * @param {string} [fallback]
   * @returns {string}
   */
  const t = useCallback((key, fallback = '') => {
    const langDictionary = translations[language] || translations[FALLBACK_LANGUAGE];
    if (langDictionary && key in langDictionary) {
      return langDictionary[key];
    }
    // Fall back to Marathi if missing in current language
    const defaultDictionary = translations[FALLBACK_LANGUAGE];
    if (defaultDictionary && key in defaultDictionary) {
      return defaultDictionary[key];
    }
    return fallback || key;
  }, [language]);

  /**
   * Helper to retrieve localized text from a Mandal entity field.
   * Supports:
   * 1. LocalizedText object: { mr: '...', hi: '...', en: '...' }
   * 2. Plain string (legacy/fallback): '...'
   * 3. Null / undefined safe
   *
   * @param {any} value
   * @param {string} [fallbackValue]
   * @returns {string}
   */
  const getLocalized = useCallback((value, fallbackValue = '') => {
    if (!value) return fallbackValue || '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // 1. Direct selected language match
      if (value[language]) return value[language];
      // 2. Fallback to Marathi
      if (value.mr) return value.mr;
      // 3. Fallback to English
      if (value.en) return value.en;
      // 4. Empty string / fallback value
      return fallbackValue || '';
    }
    return fallbackValue || '';
  }, [language]);

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const value = {
    language,
    setLanguage,
    t,
    getLocalized,
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

const defaultContext = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string, fallback = '') => translations[DEFAULT_LANGUAGE]?.[key] || fallback || key,
  getLocalized: (value: any, fallbackValue = '') => {
    if (!value) return fallbackValue || '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value[DEFAULT_LANGUAGE] || value.mr || value.hi || value.en || fallbackValue || '';
    }
    return fallbackValue || '';
  },
  supportedLanguages: SUPPORTED_LANGUAGES,
  currentLanguage: SUPPORTED_LANGUAGES[0],
};

/**
 * Hook to access language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  return context || defaultContext;
}

