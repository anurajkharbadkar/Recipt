// Cashfree's Payment Gateway API version this integration was built and
// tested against (handover doc section 8). Used only as a fallback default
// — set CASHFREE_API_VERSION explicitly in .env so an upgrade is a config
// change, not a code change.
export const CASHFREE_DEFAULT_API_VERSION = '2025-01-01';

// Our own order-id prefix. Cashfree order_id must be unique per order and
// is never reused (handover doc section 14) — DP_SB_/DP_PROD_ in the doc's
// examples map to sandbox/live here via CASHFREE_ENV.
export const CASHFREE_ORDER_ID_PREFIX = 'DP';

// Distinguishes a real donation's order id (DP_RCT_...) from the sandbox
// test page's (DP_TEST_...) at a glance in Cashfree's own dashboard/logs —
// same env/credentials either way, just different traffic to tell apart.
export const CASHFREE_DONATION_ORDER_ID_PREFIX = `${CASHFREE_ORDER_ID_PREFIX}_RCT`;

// A Mandal paying its own E-PavtiBook subscription fee — a plain, non-split
// order (the org is the actual merchant here, not an intermediary), unlike
// CASHFREE_DONATION_ORDER_ID_PREFIX's EasySplit flow. This prefix is also
// how PaymentsService.applyCashfreeWebhook tells a subscription payment
// apart from a donation one, to know whether to activate the org on
// success (2026-08-21 payments architecture decision — see lib/upi.ts on
// the web side for why donations moved off Cashfree entirely).
export const CASHFREE_SUBSCRIPTION_ORDER_ID_PREFIX = `${CASHFREE_ORDER_ID_PREFIX}_SUB`;
