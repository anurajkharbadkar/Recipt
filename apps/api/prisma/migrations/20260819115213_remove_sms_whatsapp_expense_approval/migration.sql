-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_approvedById_fkey";

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "isApproved";

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "smsError",
DROP COLUMN "smsSent",
DROP COLUMN "whatsappError",
DROP COLUMN "whatsappSent";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "otpCode",
DROP COLUMN "otpExpiry";

