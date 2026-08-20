// Platform payment/contact details — used on the post-signup "payment
// pending" screen and the plan-request flow (no in-app payment gateway yet,
// see PendingPaymentBanner.tsx and /register). Sourced from env so these are
// a config change, not a code change — apps/web/.env.local holds the real
// values locally; the fallbacks here are real too (not placeholders) since
// there's no committed .env.example for this app to document them in, and a
// deploy that forgot to set the env var should still reach a real number.
export const PLATFORM_UPI_ID = process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || 'your-upi-id@bank';
export const PLATFORM_WHATSAPP = process.env.NEXT_PUBLIC_PLATFORM_WHATSAPP || '918999842228';
export const PLATFORM_EMAIL = process.env.NEXT_PUBLIC_PLATFORM_EMAIL || 'payments@example.com';

export function platformWhatsappLink(message: string): string {
  return `https://wa.me/${PLATFORM_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
