'use client';

import { useTheme } from '@/hooks/useTheme';

// The E-Pavti brand mark — a receipt book with a perforated tear-line down
// its stub. Two real, designed assets (not a hand-recreated SVG — two
// earlier SVG attempts both drifted from the source design):
//  - logo-mark-288.png: the maroon rounded-square badge, self-contained on
//    any background — used in dark theme, where a badge-less glyph in the
//    icon's own dark maroon/gold colors would have poor contrast.
//  - logo-mark-light.png: the same glyph without the badge, for light
//    theme, where callers' own containers (rounded corners, shadows) read
//    as the "badge" instead.
// Picks between them by reading the live theme (useTheme), not a fixed
// default, so every place this renders — sidebar, topbar, login, register,
// landing nav/footer, receipt verification — follows the user's actual
// light/dark toggle instead of freezing on whichever variant shipped first.
const SOURCES: Record<'light' | 'dark', string> = {
  light: '/brand/logo-mark-light.png',
  dark: '/brand/logo-mark-288.png',
};

interface LogoMarkProps {
  size?: number;
  className?: string;
  /**
   * Skips the live-theme read and always uses this variant. For a spot
   * whose background is hardcoded regardless of the site's own light/dark
   * toggle (e.g. the landing page's always-dark footer band) — the
   * badge-less light glyph would go low-contrast against a background it
   * was never designed to sit on. Same reason BrandLogo (in page.tsx) takes
   * its own explicit `dark` prop instead of reading site theme.
   */
  forceTheme?: 'light' | 'dark';
}

export default function LogoMark({ size = 24, className = '', forceTheme }: LogoMarkProps) {
  const liveTheme = useTheme();
  const theme = forceTheme ?? liveTheme;
  return (
    <img
      src={SOURCES[theme]}
      alt="E-Pavti"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
