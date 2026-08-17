-- Hand-written: `prisma migrate dev` can't auto-cast an enum column with
-- existing data to text (it wants to drop+recreate, which fails/loses data).
-- Postgres enums cast to text natively, so this does it explicitly instead.

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('EXPENSE', 'DONATION');

-- AlterTable: Organization.socialLinks
ALTER TABLE "Organization" ADD COLUMN "socialLinks" JSONB;

-- AlterTable: Expense.category enum -> text (no default previously)
ALTER TABLE "Expense" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

-- AlterTable: Receipt.category enum -> text, re-set default (changing type
-- via USING drops the old typed default; DEFAULT 'GENERAL' needs restating
-- now that the column is plain text instead of the DonationCategory enum).
ALTER TABLE "Receipt" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "Receipt" ALTER COLUMN "category" SET DEFAULT 'GENERAL';

-- DropEnum: no longer referenced by any column now that both are TEXT
DROP TYPE "DonationCategory";
DROP TYPE "ExpenseCategory";

-- CreateTable
CREATE TABLE "CustomCategory" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomCategory_orgId_kind_idx" ON "CustomCategory"("orgId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "CustomCategory_orgId_kind_label_key" ON "CustomCategory"("orgId", "kind", "label");

-- AddForeignKey
ALTER TABLE "CustomCategory" ADD CONSTRAINT "CustomCategory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
