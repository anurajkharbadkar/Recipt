/**
 * DevotionalAttireIcon
 *
 * Dedicated SVG icon representing traditional Indian festive & devotional attire
 * (Traditional Kurta with mandarin collar and draped Uttariya / Angavastram / Dupatta).
 * Replaces generic western dress emojis with an authentic cultural symbol.
 */
export default function DevotionalAttireIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`devotional-attire-icon ${className}`.trim()}
      aria-hidden="true"
    >
      {/* Traditional Kurta / Bandhgala Festive Silhouette */}
      <path d="M6.5 4.5h11l3 4.5-3 1.5V20.5h-11V10.5l-3-1.5 3-4.5z" />
      {/* Traditional Collar Neckline */}
      <path d="M10 4.5c0 1.2 1 2 2 2s2-.8 2-2" />
      {/* Central Button Placket */}
      <line x1="12" y1="6.5" x2="12" y2="12.5" />
      <circle cx="12" cy="8.5" r="0.6" fill="currentColor" />
      <circle cx="12" cy="11" r="0.6" fill="currentColor" />
      {/* Draped Sacred Uttariya / Angavastram Hem */}
      <path d="M7.5 7c2 3 5.5 4.5 9 5v7.5" strokeWidth="1.4" strokeDasharray="1.5 1.5" />
    </svg>
  );
}
