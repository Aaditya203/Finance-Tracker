-- AlterTable: Add utrNumber column to BankTransaction
ALTER TABLE "BankTransaction" ADD COLUMN "utrNumber" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "BankTransaction_utrNumber_idx" ON "BankTransaction"("utrNumber");

-- Refresh the 2-day creation limit for existing bank transactions so they can be edited and backfilled with UTR numbers
UPDATE "BankTransaction" SET "createdAt" = CURRENT_TIMESTAMP;
