'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * URL-driven list state (page, search, filters) — every list page
 * (receipts, campaigns, expenses, ...) used to hold this in local
 * `useState`, which meant a refresh, a shared link, or the browser
 * back/forward buttons all silently lost whatever the user had filtered
 * or paginated to. This centralizes reading/writing those values against
 * `searchParams` instead, so the URL is the actual source of truth.
 *
 * `setParams` uses `router.replace` (not `push`) so adjusting a filter or
 * typing in a search box doesn't pollute browser history with one entry
 * per keystroke — only real navigation (clicking a link) should do that.
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string, fallback = ''): string => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  const getNumber = useCallback(
    (key: string, fallback: number): number => {
      const raw = searchParams.get(key);
      const n = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(n) && n > 0 ? n : fallback;
    },
    [searchParams],
  );

  /**
   * Merges `updates` into the current URL params. A value of `''`/`undefined`/
   * `null` removes that key entirely (an empty filter shouldn't show up as
   * `?search=` in the address bar). By default also drops `page` — a filter
   * or search change resetting back to page 1 the way every list page's own
   * `setPage(1)`-on-every-filter-change already did, just centralized; pass
   * `resetPage: false` for a change that shouldn't (e.g. the page-change
   * click itself, which sets `page` directly).
   */
  const setParams = useCallback(
    (
      updates: Record<string, string | number | undefined | null>,
      opts: { resetPage?: boolean } = {},
    ) => {
      const { resetPage = true } = opts;
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === '') params.delete(key);
        else params.set(key, String(value));
      }
      if (resetPage && !('page' in updates)) params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { searchParams, get, getNumber, setParams };
}
