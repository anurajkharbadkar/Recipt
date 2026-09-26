import { useCallback, useRef } from 'react';

/**
 * Hook for locking/unlocking body scroll (mobile menu, lightbox).
 * Preserves scroll position and prevents background scrolling.
 *
 * @returns {{ lockScroll: () => void, unlockScroll: () => void }}
 */
export function useScrollLock() {
  const scrollPositionRef = useRef(0);

  const lockScroll = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
    document.body.style.setProperty('--scroll-top', `-${scrollPositionRef.current}px`);
    document.body.classList.add('scroll-locked');
  }, []);

  const unlockScroll = useCallback(() => {
    document.body.classList.remove('scroll-locked');
    document.body.style.removeProperty('--scroll-top');
    window.scrollTo(0, scrollPositionRef.current);
  }, []);

  return { lockScroll, unlockScroll };
}
