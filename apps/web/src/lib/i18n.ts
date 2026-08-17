import { useAuthStore } from '@/store/auth.store';
import en from '@/i18n/messages/en.json';
import hi from '@/i18n/messages/hi.json';
import mr from '@/i18n/messages/mr.json';

const MESSAGES = { en, hi, mr };

/**
 * Shared micro-copy (Save/Cancel/Delete/Loading/...) used across every page —
 * single source of truth instead of each page retyping its own EN/HI/MR
 * ternaries for the same handful of words. Page-specific copy still uses the
 * local `labels` object pattern (see dashboard/page.tsx) since that content
 * doesn't repeat across pages the way this does.
 */
export function useCommonLabels() {
  const language = useAuthStore((s) => s.language);
  return MESSAGES[language]?.common || MESSAGES.en.common;
}
