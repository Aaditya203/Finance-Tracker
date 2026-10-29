-- AlterTable: Add teacherShare, taxAmount, extraCharges, and profitAmount to BankTransaction
ALTER TABLE "BankTransaction" ADD COLUMN "teacherShare" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BankTransaction" ADD COLUMN "taxAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BankTransaction" ADD COLUMN "extraCharges" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BankTransaction" ADD COLUMN "profitAmount" INTEGER NOT NULL DEFAULT 0;

-- Backfill profitAmount for existing student transactions (amount - (teacherShare + taxAmount + extraCharges))
UPDATE "BankTransaction"
SET "profitAmount" = "amount" - ("teacherShare" + "taxAmount" + "extraCharges")
WHERE "reason" = 'STUDENT';
