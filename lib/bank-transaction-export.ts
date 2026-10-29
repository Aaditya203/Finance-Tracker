import type { BankTransactionRecord } from "@/types";

const columns = [
  "Transaction ID",
  "Receipt / Invoice Number",
  "UTR Number",
  "Transaction Date",
  "Counterparty Name",
  "Transaction Type",
  "Reason",
  "Student ID",
  "Teacher ID",
  "Amount (INR)",
  "Note",
  "Recorded By",
  "Recorded At",
  "Attachment File Names",
  "Attachment URLs",
];

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  // Prevent spreadsheet formula execution from imported names, notes, IDs, etc.
  const safeText = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export function buildBankTransactionsCsv(transactions: BankTransactionRecord[]) {
  const rows = transactions.map((transaction) => [
    transaction.id,
    transaction.invoiceNumber,
    transaction.utrNumber || "",
    transaction.transactionDate.slice(0, 10),
    transaction.counterpartyName,
    transaction.type === "CREDIT" ? "Credit · received" : "Debit · paid",
    transaction.reason,
    transaction.studentId,
    transaction.teacherId,
    transaction.amount,
    transaction.note,
    transaction.createdBy.name,
    transaction.createdAt,
    transaction.attachments?.map((attachment) => attachment.fileName).join(" | "),
    transaction.attachments?.map((attachment) => attachment.fileUrl).join(" | "),
  ]);

  // UTF-8 BOM helps Excel recognize names and notes containing Indian scripts.
  return `\uFEFF${[columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}
