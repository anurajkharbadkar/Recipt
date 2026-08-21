import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Composes conditional class names (via clsx) and then resolves conflicting
 * Tailwind utilities (via tailwind-merge) so the *last* one wins instead of
 * both landing in the DOM and silently fighting on CSS layer/source order —
 * e.g. `cn('px-4', condition && 'px-6')` correctly keeps only px-6, where
 * plain string concatenation would emit both classes and leave the winner
 * up to Tailwind's generated stylesheet order, not the call site's intent.
 *
 * Convention: when a component accepts a `className` prop, pass it *last*
 * so a consumer can always override the component's own defaults.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
