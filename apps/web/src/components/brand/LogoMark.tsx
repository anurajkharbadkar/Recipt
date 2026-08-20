// The e-Pavti brand mark — a receipt book with a perforated tear-line down
// its stub, on its own maroon rounded-square badge. This renders the actual
// designed asset (apps/web/public/brand/logo-mark-288.png, exported from the
// brand concept) rather than a hand-recreated SVG — two earlier SVG
// attempts both drifted from the source design, so this is deliberately
// just an <img> of the real file. The image already carries its own
// background/corners/colors, so callers don't need to wrap it in a
// bg-gradient-brand box the way the old icon-on-colored-box pattern did —
// just size it.
interface LogoMarkProps {
  size?: number;
  className?: string;
}

export default function LogoMark({ size = 24, className = '' }: LogoMarkProps) {
  return (
    <img
      src="/brand/logo-mark-288.png"
      alt="e-Pavti"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
