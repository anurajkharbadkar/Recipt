'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks the current light/dark theme by reading the `dark`/`light` class
 * on <html> — the same class Sidebar's toggle (and the blocking
 * inline script in layout.tsx that prevents a FOUC on first paint) already
 * set, not a second, independent source of truth. A MutationObserver rather
 * than a shared store/event: the toggle happens to live in Sidebar today,
 * but nothing consuming this hook should need to know that, or need
 * updating if a toggle control gets added somewhere else later.
 *
 * Starts as 'light' unconditionally (matching what the server always
 * renders, since there's no `document` to read at SSR time) and corrects
 * itself client-side in the effect below — reading the real class during
 * render instead would make the client's first render disagree with the
 * server-rendered HTML for anyone whose saved theme is 'dark'.
 */
export function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.classList.contains('dark') ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
