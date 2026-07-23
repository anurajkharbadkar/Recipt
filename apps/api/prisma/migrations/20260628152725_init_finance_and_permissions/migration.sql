-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('DONATION', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PAID', 'PENDING', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DonationCategory" ADD VALUE 'SPONSOR';
ALTER TYPE "DonationCategory" ADD VALUE 'COMMITTEE_MEMBER';
ALTER TYPE "DonationCategory" ADD VALUE 'MEMBERSHIP_FEE';
ALTER TYPE "DonationCategory" ADD VALUE 'STALL_CHARGE';
ALTER TYPE "DonationCategory" ADD VALUE 'EVENT_REGISTRATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExpenseCategory" ADD VALUE 'DJ_SOUND';
ALTER TYPE "ExpenseCategory" ADD VALUE 'LIGHTING';
ALTER TYPE "ExpenseCategory" ADD VALUE 'SECURITY';
ALTER TYPE "ExpenseCategory" ADD VALUE 'STAGE';
ALTER TYPE "ExpenseCategory" ADD VALUE 'ELECTRICITY';
ALTER TYPE "ExpenseCategory" ADD VALUE 'PERMISSIONS';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "beneficiaryPhone" TEXT,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "paidTo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "receiptTemplateSettings" JSONB;

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "collectionType" "CollectionType" NOT NULL DEFAULT 'DONATION',
ADD COLUMN     "contributorType" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "status" "ReceiptStatus" NOT NULL DEFAULT 'PAID',
ADD COLUMN     "supportingDocUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissionsOverride" JSONB;

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_orgId_role_module_key" ON "RolePermission"("orgId", "role", "module");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
