'use client';

import { useEffect } from 'react';

/**
 * PwaInstallTracker
 *
 * Automatically listens for browser PWA installation events
 * and logs telemetry to /api/telemetry/download
 */
export default function PwaInstallTracker() {
  useEffect(() => {
    const handleAppInstalled = () => {
      try {
        fetch('/api/telemetry/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'pwa_install' }),
        }).catch((err) => console.error('PWA install log error:', err));
      } catch (err) {
        console.error('PWA install tracker error:', err);
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
