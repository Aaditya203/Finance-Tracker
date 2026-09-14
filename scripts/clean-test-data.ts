import { prisma } from "../lib/prisma";

async function cleanTestData() {
  console.log("⚠️ Starting database test data cleanup...");

  // Deletion order respects foreign key constraints:
  // 1. Attachments (onDelete Cascade in schema, but explicitly deleted for safety)
  // 2. ExpenseSplits (onDelete Cascade in schema)
  // 3. Settlements
  // 4. Expenses

  const deletedAttachments = await prisma.attachment.deleteMany({});
  console.log(`Deleted ${deletedAttachments.count} test attachments.`);

  const deletedSplits = await prisma.expenseSplit.deleteMany({});
  console.log(`Deleted ${deletedSplits.count} test expense splits.`);

  const deletedSettlements = await prisma.settlement.deleteMany({});
  console.log(`Deleted ${deletedSettlements.count} test settlements.`);

  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`Deleted ${deletedExpenses.count} test expenses.`);

  console.log("✅ Cleanup complete. Partner User accounts preserved.");
}

cleanTestData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Cleanup failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
