import assert from "node:assert/strict";
import { buildBankTransactionsCsv } from "../lib/bank-transaction-export";
import type { BankTransactionRecord } from "../types";

const sample: BankTransactionRecord = {
  id: "txn-1",
  invoiceNumber: "REC-001",
  utrNumber: "UTR20260830001",
  transactionDate: "2026-08-30T00:00:00.000Z",
  counterpartyName: "=HYPERLINK(\"https://example.com\",\"Parent\")",
  type: "CREDIT",
  reason: "STUDENT",
  studentId: "STU-009",
  teacherId: null,
  amount: 12_500,
  teacherShare: 6_000,
  taxAmount: 500,
  extraCharges: 200,
  profitAmount: 5_800,
  note: "Payment, received \"online\"\r\nverified",
  createdAt: "2026-08-30T10:15:00.000Z",
  createdBy: { id: "bank", name: "Flextudy Official" },
  attachments: [{
    id: "attachment-1",
    fileName: "receipt.pdf",
    mimeType: "application/pdf",
    fileUrl: "https://drive.example/receipt.pdf",
    createdAt: "2026-08-30T10:15:00.000Z",
  }],
};

const csv = buildBankTransactionsCsv([sample]);
assert.ok(csv.startsWith("\uFEFF"), "CSV should include the UTF-8 BOM for Excel");
assert.ok(csv.includes("\"Transaction ID\",\"Receipt / Invoice Number\",\"UTR Number\""), "CSV should include stable column headers");
assert.ok(csv.includes("\"UTR20260830001\""), "UTR number should be included in the export");
assert.ok(csv.includes("\"'=HYPERLINK("), "formula-like text must be escaped before opening in a spreadsheet");
assert.ok(csv.includes("\"Payment, received \"\"online\"\"\r\nverified\""), "commas, quotes, and line breaks should stay within one CSV cell");
assert.ok(csv.includes("\"12500\""), "amounts should be included in the export");
assert.ok(csv.includes("\"receipt.pdf\""), "attachment filenames should be included");
assert.ok(csv.includes("\"https://drive.example/receipt.pdf\""), "attachment URLs should be included");

console.log("Bank transaction export verification passed: headers, Excel encoding, escaping, amounts, and attachments.");
