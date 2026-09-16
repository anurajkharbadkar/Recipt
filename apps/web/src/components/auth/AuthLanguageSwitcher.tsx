'use client';

import { useAuthStore } from '@/store/auth.store';

const OPTIONS: { code: 'en' | 'hi' | 'mr'; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
];

/**
 * A compact language toggle for the pre-login screens (Login, Register,
 * Forgot Password). Unlike the landing page's own switcher (local state,
 * scoped to that page), this reads/writes the same `language` in
 * useAuthStore that drives the whole authenticated app — so whatever a
 * visitor picks here is still their language once they're signed in,
 * instead of resetting to the 'mr' default on first login.
 */
export default function AuthLanguageSwitcher() {
  const { language, setLanguage } = useAuthStore();
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-theme-fg/5 border border-theme-fg/10 rounded-full">
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLanguage(o.code)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            language === o.code ? 'bg-saffron-600 text-white shadow-sm' : 'text-theme-fg/60 hover:text-theme-fg'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
