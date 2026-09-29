'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

/**
 * Universal Mobile Back Navigation Handler:
 * 1. Native Mobile App (Capacitor / Android WebView / TWA / PWA): Intercepts physical/gesture back button & popstate.
 * 2. Hierarchy & Interception:
 *    a) If a modal/drawer is open -> close it, prevent navigation/exit.
 *    b) If on sub-pages (/receipts/new, /receipts/[id]) -> navigate to section root (/receipts).
 *    c) If on top-level tabs (/receipts, /expenses, /members, /settings) -> navigate to /dashboard.
 *    d) If on root/dashboard (/dashboard, /login, /) -> minimize app safely or prevent exit.
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

        // 2. Backdrop click
        if (activeModal.classList.contains('fixed') && activeModal.classList.contains('inset-0')) {
          activeModal.click();
          return true;
        }

        // 3. Fallback: Escape key
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

    // Helper to lock state on root page so mobile webview doesn't terminate on back
    const pushStateLock = () => {
      try {
        window.history.pushState({ appStateLock: true }, '', window.location.href);
      } catch (e) {
        // ignore
      }
    };

    const handleBackAction = (isPopstate = false) => {
      // 1. Close modal if open
      if (checkAndCloseModal()) {
        if (isPopstate) {
          pushStateLock();
        }
        return true;
      }

      const currentPath = currentPathRef.current || '/dashboard';
      const isRootOrDashboard = currentPath === '/dashboard' || currentPath === '/login' || currentPath === '/';

      if (isRootOrDashboard) {
        if (Capacitor.isNativePlatform()) {
          import('@capacitor/app').then(({ App }) => {
            App.minimizeApp();
          });
        } else if (isPopstate) {
          pushStateLock();
        }
        return true;
      }

      // 2. Parent navigation
      const parentRoute = getParentRoute(currentPath);
      if (parentRoute) {
        router.replace(parentRoute);
      } else {
        router.replace('/dashboard');
      }
      return true;
    };

    // Android Cordova / WebView / TWA native backbutton event
    const handleNativeBackButton = (event: any) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      handleBackAction(false);
    };

    // Mobile Web & PWA popstate event
    const handlePopState = (event: PopStateEvent) => {
      handleBackAction(true);
    };

    document.addEventListener('backbutton', handleNativeBackButton, false);
    window.addEventListener('popstate', handlePopState);

    // Capacitor Native platform App backButton
    let capacitorHandle: any = null;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', (data) => {
          handleBackAction(false);
        }).then((h) => {
          capacitorHandle = h;
        });
      });
    }

    return () => {
      document.removeEventListener('backbutton', handleNativeBackButton, false);
      window.removeEventListener('popstate', handlePopState);
      if (capacitorHandle && typeof capacitorHandle.remove === 'function') {
        capacitorHandle.remove();
      }
    };
  }, [router]);
}

