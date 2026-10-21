CREATE TYPE "BankTransactionType" AS ENUM ('CREDIT', 'DEBIT');

CREATE TYPE "BankTransactionReason" AS ENUM (
  'STUDENT',
  'TEACHER',
  'EMPLOYEE',
  'DIRECTOR_LOAN_REPAYMENT',
  'OTHER'
);

CREATE TYPE "BankExpenseFundingMode" AS ENUM ('PARTNER_SPLIT', 'POOLED_BANK');

ALTER TABLE "Expense"
  ADD COLUMN "bankFundingMode" "BankExpenseFundingMode" NOT NULL DEFAULT 'PARTNER_SPLIT';

CREATE TABLE "BankTransaction" (
  "id" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "transactionDate" TIMESTAMP(3) NOT NULL,
  "counterpartyName" TEXT NOT NULL,
  "type" "BankTransactionType" NOT NULL,
  "reason" "BankTransactionReason" NOT NULL,
  "studentId" TEXT,
  "teacherId" TEXT,
  "amount" INTEGER NOT NULL,
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BankTransaction_invoiceNumber_key" ON "BankTransaction"("invoiceNumber");
CREATE INDEX "BankTransaction_transactionDate_idx" ON "BankTransaction"("transactionDate");
CREATE INDEX "BankTransaction_type_reason_idx" ON "BankTransaction"("type", "reason");
CREATE INDEX "BankTransaction_createdById_idx" ON "BankTransaction"("createdById");

ALTER TABLE "Attachment" ADD COLUMN "bankTransactionId" TEXT;
CREATE INDEX "Attachment_bankTransactionId_idx" ON "Attachment"("bankTransactionId");

ALTER TABLE "BankTransaction"
  ADD CONSTRAINT "BankTransaction_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_bankTransactionId_fkey"
  FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
