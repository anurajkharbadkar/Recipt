import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for IntersectionObserver-driven reveal animations.
 * Returns [ref, isVisible] — attach ref to the element you want observed.
 *
 * @param {Object} options
 * @param {string} [options.threshold=0.15] - Visibility threshold
 * @param {string} [options.rootMargin='0px 0px -60px 0px'] - Root margin
 * @param {boolean} [options.triggerOnce=true] - Only trigger once
 * @returns {[React.RefObject, boolean]}
 */
export function useInView({
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  triggerOnce = true,
} = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect reduced motion — show everything immediately
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}
