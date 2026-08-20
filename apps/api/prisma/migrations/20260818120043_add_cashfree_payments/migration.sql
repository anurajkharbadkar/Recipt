-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CASHFREE', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('ORDER_CREATED', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "SplitStatus" AS ENUM ('NOT_APPLICABLE', 'SPLIT_PENDING', 'SPLIT_SUCCESS', 'SPLIT_FAILED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('SETTLEMENT_PENDING', 'SETTLED');

-- CreateEnum
CREATE TYPE "CashfreeVendorStatus" AS ENUM ('NOT_STARTED', 'DETAILS_SUBMITTED', 'VENDOR_CREATED', 'BANK_VALIDATION', 'KYC_REVIEW', 'ACTIVE', 'ACTION_REQUIRED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "cashfreeVendorId" TEXT,
ADD COLUMN     "cashfreeVendorStatus" "CashfreeVendorStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "paymentEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "receiptId" TEXT,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'CASHFREE',
    "orderId" TEXT NOT NULL,
    "cashfreeOrderId" TEXT,
    "cashfreePaymentId" TEXT,
    "cashfreeSplitId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "platformFeePaise" INTEGER NOT NULL DEFAULT 0,
    "mandalAmountPaise" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "donorName" TEXT NOT NULL,
    "donorPhone" TEXT NOT NULL,
    "donorEmail" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'ORDER_CREATED',
    "splitStatus" "SplitStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "settlementStatus" "SettlementStatus",
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'CASHFREE',
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "paymentId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptId_key" ON "Payment"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_cashfreeOrderId_key" ON "Payment"("cashfreeOrderId");

-- CreateIndex
CREATE INDEX "Payment_orgId_idx" ON "Payment"("orgId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_paymentId_idx" ON "PaymentWebhookEvent"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_eventId_key" ON "PaymentWebhookEvent"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
