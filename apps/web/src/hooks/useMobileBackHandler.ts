'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Smart mobile back navigation handler:
 * Prevents mobile back button from accidentally exiting the PWA / Mobile app
 * when navigating deep inside modules.
 */
export function useMobileBackHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If modal state exists, let modal handle closing
      if (e.state?.modalOpen) return;

      // Smart parent fallback map for mobile routes
      if (pathname?.startsWith('/receipts/')) {
        router.push('/receipts');
      } else if (pathname?.startsWith('/campaigns/')) {
        router.push('/campaigns');
      } else if (pathname === '/receipts' || pathname === '/expenses' || pathname === '/members' || pathname === '/settings' || pathname === '/reports') {
        router.push('/dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router]);
}
