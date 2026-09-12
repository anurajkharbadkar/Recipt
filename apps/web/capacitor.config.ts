import type { CapacitorConfig } from '@capacitor/cli';

// Remote-URL wrapper, not a bundled static build — this app is a real
// server-rendered Next.js site (auth, live data, PDF/image generation,
// the Cashfree payment redirect flow) that a static `next export` can't
// serve at all. Same architecture as the Android TWA path: the "app" is a
// thin native shell around the live site, so every web deploy is
// instantly what both stores' users see — nothing to resubmit for a
// normal content/bugfix change, only for native-shell changes themselves
// (icons, splash, permissions, added native plugins).
const config: CapacitorConfig = {
  appId: 'com.epavtibook.app',
  appName: 'E-PavtiBook',
  webDir: 'public', // unused in server.url mode, but required by the CLI
  server: {
    // TEMPORARY: our.epavtibook.com is currently returning Vercel's
    // DEPLOYMENT_DISABLED (custom domain likely attached to the wrong/an
    // old Vercel project — see the 2026-09-11 investigation). Pointed at
    // the working project URL directly so app testing isn't blocked on
    // that being sorted out. Switch this back to
    // 'https://our.epavtibook.com' before any real store submission —
    // shipping a live app pointed at a raw *.vercel.app URL is not
    // something to publish; this is a testing-only stand-in.
    url: 'https://recipt-web-wheat.vercel.app',
    cleartext: false,
  },
  android: {
    // Matches manifest.json's theme_color — the native splash/status bar
    // background before the web content paints.
    backgroundColor: '#502000',
  },
  ios: {
    backgroundColor: '#502000',
    // The webview otherwise renders under the notch/home-indicator safe
    // areas; Next.js's own layout doesn't account for that (it was never
    // built for a native shell), so this keeps content clear of both.
    contentInset: 'automatic',
  },
};

export default config;
