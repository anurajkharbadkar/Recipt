-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';

-- Backfill: orgs that already existed before this column did were already
-- onboarded (this column only matters for the new self-serve "pay to
-- activate" signup flow going forward) — mark them ACTIVE so the new
-- pending-payment banner doesn't retroactively nag existing customers.
UPDATE "Organization" SET "subscriptionStatus" = 'ACTIVE';
