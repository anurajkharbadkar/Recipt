'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

/**
 * Universal Mobile Back Navigation Handler:
 * 1. Native Mobile App (Capacitor): Intercepts physical/gesture back button via @capacitor/app.
 * 2. Mobile Web / PWA: Uses synthetic history state trapping to prevent accidental app exit.
 * 3. Routing Order:
 *    a) Close open modals, drawers, or dialogs without leaving the current page.
 *    b) Sub-pages (/receipts/new, /receipts/[id], /campaigns/[id]) -> navigate to parent section (/receipts, /campaigns).
 *    c) Top-level dashboard tabs (/receipts, /expenses, /members, /settings, /reports, /mandal-page, /profile, /subscription) -> navigate to /dashboard.
 *    d) Dashboard (/dashboard) -> Minimizes native app safely or prevents browser domain exit.
 */
export function useMobileBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  // Helper to check for open modals/dialogs and close them gracefully
  const checkAndCloseModal = (): boolean => {
    if (typeof document === 'undefined') return false;

    // Check for open dialogs or modal containers
    const modalSelector = '[role="dialog"], .modal-open, [data-modal="open"], .fixed.inset-0.z-50';
    const activeModal = document.querySelector(modalSelector);
    if (activeModal) {
      // Look for close button inside modal
      const closeBtn = activeModal.querySelector<HTMLElement>(
        'button[aria-label*="close" i], button[aria-label*="Close" i], .modal-close, button:has(svg.lucide-x)'
      );
      if (closeBtn) {
        closeBtn.click();
        return true;
      }
      // Trigger Escape key event as fallback
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true });
      document.dispatchEvent(escEvent);
      return true;
    }
    return false;
  };

  // Helper to determine parent route fallback for mobile back press
  const getParentRoute = (path: string): string | null => {
    if (!path) return null;
    if (path.startsWith('/receipts/')) return '/receipts';
    if (path.startsWith('/campaigns/')) return '/campaigns';
    if (path.startsWith('/mandal/') && path.includes('/sponsor/')) {
      const parts = path.split('/sponsor/')[0];
      return parts || '/dashboard';
    }
    const dashboardSubRoutes = [
      '/receipts',
      '/expenses',
      '/members',
      '/settings',
      '/reports',
      '/mandal-page',
      '/profile',
      '/subscription',
      '/collectors',
    ];
    if (dashboardSubRoutes.includes(path)) {
      return '/dashboard';
    }
    return null;
  };

  // 1. CAPACITOR NATIVE MOBILE APP BACK BUTTON LISTENER
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let listenerHandle: any = null;

    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', (event) => {
          // Priority A: Close open modal
          if (checkAndCloseModal()) {
            return;
          }

          const currentPath = currentPathRef.current || '/dashboard';
          const parentRoute = getParentRoute(currentPath);

          if (parentRoute) {
            router.push(parentRoute);
          } else if (currentPath === '/dashboard' || currentPath === '/login' || currentPath === '/') {
            // On root screen in native app, minimize app instead of quitting/crashing
            App.minimizeApp();
          } else if (event.canGoBack) {
            window.history.back();
          } else {
            router.push('/dashboard');
          }
        }).then((handle) => {
          listenerHandle = handle;
        });
      });
    }

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [router]);

  // 2. MOBILE WEB BROWSER & PWA HISTORY TRAP
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trapKey = `app_trap_${pathname}_${Date.now()}`;
    try {
      window.history.pushState({ trap: trapKey }, '', window.location.href);
    } catch {
      // Ignore pushState errors
    }

    const handlePopState = () => {
      // Priority A: Close modal if open
      if (checkAndCloseModal()) {
        window.history.pushState({ trap: trapKey }, '', window.location.href);
        return;
      }

      const currentPath = currentPathRef.current || '/dashboard';
      const parentRoute = getParentRoute(currentPath);

      if (parentRoute) {
        router.push(parentRoute);
        window.history.pushState({ trap: trapKey }, '', window.location.href);
      } else if (currentPath === '/dashboard') {
        // Keep user on dashboard safely
        window.history.pushState({ trap: trapKey }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router]);
}
