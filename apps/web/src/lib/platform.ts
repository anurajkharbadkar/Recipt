// Platform payment/contact details — used on the post-signup "payment
// pending" screen since there's no in-app payment gateway yet (see
// PendingPaymentBanner.tsx and /register). Sourced from env so these are a
// config change, not a code change, once real details are available —
// apps/web/.env.local currently holds obvious placeholders.
export const PLATFORM_UPI_ID = process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || 'your-upi-id@bank';
export const PLATFORM_WHATSAPP = process.env.NEXT_PUBLIC_PLATFORM_WHATSAPP || '91XXXXXXXXXX';
export const PLATFORM_EMAIL = process.env.NEXT_PUBLIC_PLATFORM_EMAIL || 'payments@example.com';

export function platformWhatsappLink(message: string): string {
  return `https://wa.me/${PLATFORM_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
