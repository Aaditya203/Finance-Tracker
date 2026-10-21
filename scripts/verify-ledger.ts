import assert from "node:assert/strict";
import { calculateCompanyCash, calculateExtraFundApplications, calculateLedgerBalances, getSettlementAllowance, splitEqually, suggestPartnerSettlements } from "../lib/finance";

const accounts = [
  { id: "aditya", name: "Aditya Sharma", email: "aditya@example.com" },
  { id: "ujjwal", name: "Ujjwal Kumar Singh", email: "ujjwal@example.com" },
  { id: "vishal", name: "Vishal Kumar Singh", email: "vishal@example.com" },
  { id: "bank", name: "FlexStudy Official", email: "flextudy.official@gmail.com" },
];

const partners = ["aditya", "ujjwal", "vishal"];
const balancesById = (expenses: Parameters<typeof calculateLedgerBalances>[1], settlements: Parameters<typeof calculateLedgerBalances>[2] = []) =>
  Object.fromEntries(calculateLedgerBalances(accounts, expenses, settlements).map((item) => [item.userId, item]));

// Regression for the reported case: Aditya deposits ₹15,000, then the company
// bank pays a ₹12,000 AWS bill. The bank is not a fourth split participant.
const depositAndBankExpense = [
  { id: "deposit-1", paidById: "aditya", amountPaid: 15_000, isExtraFund: true, splits: [{ userId: "bank", amountPaid: 15_000 }] },
  { id: "aws-bill", paidById: "bank", amountPaid: 12_000, isExtraFund: false, splits: splitEqually(12_000, partners) },
];
const firstCase = balancesById(depositAndBankExpense);
assert.equal(Object.keys(firstCase).length, 3, "company bank must not appear as a partner balance");
assert.equal(firstCase.aditya.balance, 0, "company bank must not owe the depositor for unused capital");
assert.equal(firstCase.aditya.extraFunds, 11_000);
assert.equal(firstCase.ujjwal.balance, -4_000);
assert.equal(firstCase.ujjwal.companyDue, 4_000);
assert.equal(firstCase.vishal.balance, -4_000);
assert.equal(firstCase.vishal.companyDue, 4_000);
assert.equal(Object.values(firstCase).reduce((sum, item) => sum + item.companyDue, 0), 8_000);
assert.equal(calculateCompanyCash(accounts, depositAndBankExpense).cashPosition, 3_000);
assert.deepEqual(calculateExtraFundApplications(accounts, depositAndBankExpense), {
  "aws-bill": { aditya: 4_000 },
}, "Aditya's AWS share must be visible as drawn from his ₹15,000 contribution");

// Official-bank expenses can instead be paid entirely from pooled company cash.
// This reduces the bank balance without assigning new liability to partners.
const pooledCashExpenses = [
  { id: "aditya-deposit", paidById: "aditya", amountPaid: 15_000, isExtraFund: true, splits: [{ userId: "bank", amountPaid: 15_000 }] },
  { id: "pooled-aws", paidById: "bank", amountPaid: 1_000, isExtraFund: false, bankFundingMode: "POOLED_BANK" as const, splits: [] },
];
const pooledBalances = balancesById(pooledCashExpenses);
assert.equal(pooledBalances.aditya.extraFunds, 15_000, "pooled spending must not consume a partner's share");
assert.equal(pooledBalances.ujjwal.companyDue, 0, "pooled spending must not create partner dues");
assert.equal(calculateCompanyCash(accounts, pooledCashExpenses, [], [{ type: "CREDIT", amount: 20_000 }, { type: "DEBIT", amount: 2_000 }]).cashPosition, 32_000);
assert.deepEqual(calculateExtraFundApplications(accounts, pooledCashExpenses), {}, "pooled spending must not be attributed to partner contributions");

// ₹18,000 paid personally by Aditya creates a ₹12,000 receivable for Aditya
// and ₹6,000 obligations for each of the other two partners.
const personalExpense = [
  { paidById: "aditya", amountPaid: 18_000, isExtraFund: false, splits: splitEqually(18_000, partners) },
];
const secondCase = balancesById(personalExpense);
assert.equal(secondCase.aditya.balance, 12_000);
assert.equal(secondCase.ujjwal.balance, -6_000);
assert.equal(secondCase.vishal.balance, -6_000);
assert.equal(calculateCompanyCash(accounts, personalExpense).cashPosition, 0);

// A separate company-funded bill must not cancel partner-to-partner amounts.
// Aditya pays ₹12,000 personally, Ujjwal pays ₹15,000 personally, then the
// company bank pays ₹9,000 as a partner split. Vishal still owes ₹3,000 to
// Aditya and ₹6,000 to Ujjwal, while each partner separately owes the company
// ₹3,000.
const mixedFundingExpenses = [
  { id: "aditya-personal", paidById: "aditya", amountPaid: 12_000, isExtraFund: false, splits: splitEqually(12_000, partners) },
  { id: "ujjwal-personal", paidById: "ujjwal", amountPaid: 15_000, isExtraFund: false, splits: splitEqually(15_000, partners) },
  { id: "company-bill", paidById: "bank", amountPaid: 9_000, isExtraFund: false, splits: splitEqually(9_000, partners) },
];
const mixedFundingBalances = balancesById(mixedFundingExpenses);
assert.equal(mixedFundingBalances.aditya.balance + mixedFundingBalances.aditya.companyDue, 3_000, "Aditya's partner receivable remains separate from company dues");
assert.equal(mixedFundingBalances.aditya.companyDue, 3_000);
assert.equal(mixedFundingBalances.ujjwal.balance + mixedFundingBalances.ujjwal.companyDue, 6_000, "Ujjwal's partner receivable remains separate from company dues");
assert.equal(mixedFundingBalances.ujjwal.companyDue, 3_000);
assert.equal(mixedFundingBalances.vishal.balance + mixedFundingBalances.vishal.companyDue, -9_000, "Vishal's partner payable remains separate from company dues");
assert.equal(mixedFundingBalances.vishal.companyDue, 3_000);
assert.deepEqual(
  suggestPartnerSettlements(Object.values(mixedFundingBalances)).map(({ fromUserId, toUserId, amount }) => ({ fromUserId, toUserId, amount })),
  [
    { fromUserId: "vishal", toUserId: "aditya", amount: 3_000 },
    { fromUserId: "vishal", toUserId: "ujjwal", amount: 6_000 },
  ],
  "company dues must not net away partner-to-partner settlement amounts"
);

// Partners can repay only their own company-funded share to the bank account.
const bankSettlementAllowed = getSettlementAllowance(
  calculateLedgerBalances(accounts, depositAndBankExpense, []),
  [],
  "ujjwal",
  "bank",
  ["bank"]
);
assert.equal(bankSettlementAllowed, 4_000);
assert.equal(getSettlementAllowance(Object.values(firstCase), [], "aditya", "bank", ["bank"]), 0);
assert.equal(
  getSettlementAllowance(
    calculateLedgerBalances(accounts, depositAndBankExpense, []),
    [{ fromUserId: "ujjwal", toUserId: "bank", amountPaid: 1_500 }],
    "ujjwal",
    "bank",
    ["bank"]
  ),
  2_500,
  "pending repayments reserve the same company debt only once"
);
const companyRepayment = { fromUserId: "ujjwal", toUserId: "bank", amountPaid: 4_000, status: "COMPLETED" };
const afterCompanyRepayment = balancesById(depositAndBankExpense, [companyRepayment]);
assert.equal(afterCompanyRepayment.ujjwal.companyDue, 0);
assert.equal(afterCompanyRepayment.vishal.companyDue, 4_000);
assert.equal(calculateCompanyCash(accounts, depositAndBankExpense, [companyRepayment]).cashPosition, 7_000);

// A completed payment reduces the sender's debt and the recipient's credit;
// a pending settlement must not alter balances.
const settledCase = balancesById(personalExpense, [
  { fromUserId: "ujjwal", toUserId: "aditya", amountPaid: 6_000, status: "COMPLETED" },
  { fromUserId: "vishal", toUserId: "aditya", amountPaid: 6_000, status: "PENDING" },
]);
assert.equal(settledCase.aditya.balance, 6_000);
assert.equal(settledCase.ujjwal.balance, 0);
assert.equal(settledCase.vishal.balance, -6_000);

assert.equal(
  getSettlementAllowance(
    calculateLedgerBalances(accounts, personalExpense, []),
    [{ fromUserId: "ujjwal", toUserId: "aditya", amountPaid: 2_000 }],
    "ujjwal",
    "aditya"
  ),
  4_000
);

// A ₹90,000 personal expense paid by Ujjwal gives each partner a ₹30,000
// share. If Aditya has already paid Ujjwal ₹21,000, only ₹9,000 remains due
// from Aditya; Vishal still owes his own ₹30,000 share.
const ujjwalPersonalExpense = [
  { paidById: "ujjwal", amountPaid: 90_000, isExtraFund: false, splits: splitEqually(90_000, partners) },
];
const afterPartialPayment = balancesById(ujjwalPersonalExpense, [
  { fromUserId: "aditya", toUserId: "ujjwal", amountPaid: 21_000, status: "COMPLETED" },
]);
assert.deepEqual(
  suggestPartnerSettlements(Object.values(afterPartialPayment)).map(({ fromUserId, toUserId, amount }) => ({ fromUserId, toUserId, amount })),
  [
    { fromUserId: "aditya", toUserId: "ujjwal", amount: 9_000 },
    { fromUserId: "vishal", toUserId: "ujjwal", amount: 30_000 },
  ],
  "partner settlements must show the remaining amount owed after prior transfers"
);

// Remainders remain exact: ₹1,000 is split as ₹334, ₹333, ₹333.
assert.deepEqual(splitEqually(1_000, partners).map((split) => split.amountPaid), [334, 333, 333]);

console.log("Ledger verification passed: bank funding, personal expenses, settlements, pending reservations, and split remainders.");
