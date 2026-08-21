import { SetMetadata } from '@nestjs/common';

export const SKIP_SUBSCRIPTION_GATE_KEY = 'skipSubscriptionGate';

/**
 * Exempts a route from RolesGuard's PENDING_PAYMENT write-block. Exactly
 * one route needs this today — SubscriptionPaymentController's own order-
 * creation endpoint, which is itself a write and would otherwise be
 * blocked by the exact gate it exists to let someone through.
 */
export const SkipSubscriptionGate = () => SetMetadata(SKIP_SUBSCRIPTION_GATE_KEY, true);
