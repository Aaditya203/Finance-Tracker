import { prisma } from "../lib/prisma";

const confirmationFlag = "--confirm-clear-financial-records";

async function main() {
  const [database, users, expenses, splits, settlements, bankTransactions, attachments] = await Promise.all([
    prisma.$queryRaw<Array<{ databaseName: string; serverAddress: string | null; serverPort: number | null }>>`
      SELECT current_database() AS "databaseName",
             inet_server_addr()::text AS "serverAddress",
             inet_server_port() AS "serverPort"
    `.then((rows) => rows[0]),
    prisma.user.count(),
    prisma.expense.count(),
    prisma.expenseSplit.count(),
    prisma.settlement.count(),
    prisma.bankTransaction.count(),
    prisma.attachment.count(),
  ]);

  console.log(`Database: ${database.databaseName} at ${database.serverAddress ?? "local socket"}:${database.serverPort ?? "n/a"}`);
  console.log(`Accounts preserved: ${users}`);
  console.log(`Expenses to clear: ${expenses}`);
  console.log(`Expense splits to clear: ${splits}`);
  console.log(`Settlements to clear: ${settlements}`);
  console.log(`Official-bank / parent / teacher transactions to clear: ${bankTransactions}`);
  console.log(`Attachment records to clear (Drive files will remain): ${attachments}`);

  if (!process.argv.includes(confirmationFlag)) {
    console.log(`Inspection only; no rows changed. Re-run with ${confirmationFlag} to perform the confirmed cleanup.`);
    return;
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.attachment.deleteMany();
    const settlementsDeleted = await tx.settlement.deleteMany();
    const splitsDeleted = await tx.expenseSplit.deleteMany();
    const bankTransactionsDeleted = await tx.bankTransaction.deleteMany();
    const expensesDeleted = await tx.expense.deleteMany();
    return {
      settlements: settlementsDeleted.count,
      splits: splitsDeleted.count,
      bankTransactions: bankTransactionsDeleted.count,
      expenses: expensesDeleted.count,
    };
  });

  const [remainingExpenses, remainingSplits, remainingSettlements, remainingBankTransactions, remainingAttachments, remainingUsers] = await Promise.all([
    prisma.expense.count(),
    prisma.expenseSplit.count(),
    prisma.settlement.count(),
    prisma.bankTransaction.count(),
    prisma.attachment.count(),
    prisma.user.count(),
  ]);

  const remaining = [remainingExpenses, remainingSplits, remainingSettlements, remainingBankTransactions, remainingAttachments];
  if (remaining.some((count) => count !== 0) || remainingUsers !== users) {
    throw new Error(`Cleanup verification failed; remaining financial counts: ${remaining.join(", ")}; users before/after: ${users}/${remainingUsers}`);
  }

  console.log(`Deleted: ${deleted.expenses} expenses, ${deleted.splits} splits, ${deleted.settlements} settlements, and ${deleted.bankTransactions} bank/parent/teacher transactions.`);
  console.log("All attachment database records were cleared. Google Drive files and user accounts were preserved.");
  console.log("Verification passed: all financial tables are empty and the user count is unchanged.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Financial record cleanup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
