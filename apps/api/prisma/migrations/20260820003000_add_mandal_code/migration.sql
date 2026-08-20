-- AlterTable: add nullable first — existing orgs need a backfilled value
-- before this can become NOT NULL + UNIQUE.
ALTER TABLE "Organization" ADD COLUMN "mandalCode" TEXT;

-- Backfill: only the seeded demo org exists at the time of this migration.
-- A real deployment with more orgs would need a generated code per row
-- instead of one hardcoded UPDATE — see AuthService.generateMandalCode for
-- the format (6-char, uppercase, ambiguous characters excluded) this should
-- have matched if there were more than one.
UPDATE "Organization" SET "mandalCode" = 'SGMP26' WHERE "mandalCode" IS NULL;

-- AlterTable: now safe to require it.
ALTER TABLE "Organization" ALTER COLUMN "mandalCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_mandalCode_key" ON "Organization"("mandalCode");
