'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

/**
 * Universal Mobile Back Navigation Handler:
 * 1. Native Mobile App (Capacitor / Android WebView / TWA): Intercepts physical/gesture back button via backbutton event & @capacitor/app.
 * 2. Mobile Web / PWA: Uses popstate event handling to prevent accidental app exit and handle modal closing.
 * 3. Routing Hierarchy:
 *    a) Close open modals, drawers, or dialogs without leaving the current page.
 *    b) Sub-pages (/receipts/new, /receipts/[id], /campaigns/[id]) -> navigate to parent section (/receipts, /campaigns).
 *    c) Top-level dashboard tabs (/receipts, /expenses, /members, /settings, /reports, /mandal-page, /profile, /subscription) -> navigate to /dashboard.
 *    d) Dashboard (/dashboard) -> Minimizes native app safely or stays on dashboard.
 */
export function useMobileBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  // Helper to check for open modals/dialogs/drawers and close them gracefully
  const checkAndCloseModal = (): boolean => {
    if (typeof document === 'undefined') return false;

    try {
      const modalSelectors = [
        '[role="dialog"]',
        '[aria-modal="true"]',
        '.modal-open',
        '[data-modal="open"]',
        '.fixed.inset-0.z-50',
        '.fixed.inset-0.z-40',
        '.fixed.inset-0.bg-black\\/75',
        '.fixed.inset-0.bg-black\\/80',
        '.fixed.inset-0.bg-black\\/60',
        '.lightbox',
        '.modal',
      ];

      let activeModal: HTMLElement | null = null;
      for (const selector of modalSelectors) {
        const found = document.querySelector<HTMLElement>(selector);
        if (found && found.offsetWidth > 0 && found.offsetHeight > 0) {
          const style = window.getComputedStyle(found);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            activeModal = found;
            break;
          }
        }
      }

      if (activeModal) {
        // 1. Look for close buttons inside or associated with the active modal
        const buttons = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a'));
        const closeBtn = buttons.find((btn) => {
          if (btn.offsetWidth === 0 || btn.offsetHeight === 0) return false;
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          const title = (btn.getAttribute('title') || '').toLowerCase();
          const isModalCloseClass = btn.classList.contains('modal-close') || btn.classList.contains('close-btn');
          const hasXIcon = Boolean(btn.querySelector('svg.lucide-x, svg.lucide-arrow-left, svg[data-icon="x"]'));
          const isInside = activeModal!.contains(btn);
          const isMobileToggle = ariaLabel.includes('toggle menu');

          return (
            (isInside || isMobileToggle) &&
            (ariaLabel.includes('close') ||
              ariaLabel.includes('back') ||
              ariaLabel.includes('toggle menu') ||
              title.includes('close') ||
              title.includes('back') ||
              isModalCloseClass ||
              hasXIcon)
          );
        });

        if (closeBtn) {
          closeBtn.click();
          return true;
        }

        // 2. If activeModal is a backdrop overlay with click listener, click it!
        if (activeModal.classList.contains('fixed') && activeModal.classList.contains('inset-0')) {
          activeModal.click();
          return true;
        }

        // 3. Fallback: Trigger Escape key event
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(escEvent);
        activeModal.dispatchEvent(escEvent);
        return true;
      }
    } catch (err) {
      console.warn('Error inside checkAndCloseModal:', err);
    }
    return false;
  };

  // Helper to determine parent route fallback for mobile back press
  const getParentRoute = (path: string): string | null => {
    if (!path) return null;
    if (path.startsWith('/receipts/')) return '/receipts';
    if (path.startsWith('/campaigns/')) return '/campaigns';
    if (path.includes('/sponsor/')) {
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUniversalBack = (event?: any) => {
      // Priority A: Close modal if open
      if (checkAndCloseModal()) {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        return;
      }

      const currentPath = currentPathRef.current || '/dashboard';
      const isRootOrDashboard = currentPath === '/dashboard' || currentPath === '/login' || currentPath === '/';

      if (isRootOrDashboard) {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        if (Capacitor.isNativePlatform()) {
          import('@capacitor/app').then(({ App }) => {
            App.minimizeApp();
          });
        }
        return;
      }

      // Sub-pages or top-level tabs: Use history back or replace to parent route without creating infinite push loops
      const parentRoute = getParentRoute(currentPath);

      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      if (window.history.length > 1) {
        router.back();
      } else if (parentRoute) {
        router.replace(parentRoute);
      } else {
        router.replace('/dashboard');
      }
    };

    // 1. Android WebView / Cordova / TWA native backbutton event
    document.addEventListener('backbutton', handleUniversalBack, false);

    // 2. Mobile Web & PWA popstate event
    window.addEventListener('popstate', handleUniversalBack);

    // 3. Capacitor Native platform App backButton
    let capacitorHandle: any = null;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', (data) => {
          handleUniversalBack(data);
        }).then((h) => {
          capacitorHandle = h;
        });
      });
    }

    return () => {
      document.removeEventListener('backbutton', handleUniversalBack, false);
      window.removeEventListener('popstate', handleUniversalBack);
      if (capacitorHandle && typeof capacitorHandle.remove === 'function') {
        capacitorHandle.remove();
      }
    };
  }, [router]);
}

