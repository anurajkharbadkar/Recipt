-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "donorClaimedPaidAt" TIMESTAMP(3);
