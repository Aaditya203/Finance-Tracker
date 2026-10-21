type WorkspaceAccount = {
  id?: string;
  name: string;
  email?: string | null;
};

type LedgerExpense = {
  id?: string;
  paidById: string;
  amountPaid: number;
  isExtraFund: boolean;
  bankFundingMode?: "PARTNER_SPLIT" | "POOLED_BANK";
  expenseDate?: Date | string;
  createdAt?: Date | string;
  splits: Array<{ userId: string; amountPaid: number }>;
};

type LedgerSettlement = {
  fromUserId: string;
  toUserId: string;
  amountPaid: number;
  status: string;
};

export type LedgerBalance = {
  userId: string;
  name: string;
  totalPaid: number;
  extraFunds: number;
  totalShare: number;
  moneySpent: number;
  moneyReceived: number;
  companyDue: number;
  balance: number;
};

type LedgerBankTransaction = { type: "CREDIT" | "DEBIT"; amount: number };

/**
 * The company account is a ledger counterparty, never one of the three equal
 * partner shares. Keeping this rule central prevents API and dashboard drift.
 */
export function isCompanyBankAccount(account: WorkspaceAccount) {
  const name = account.name.trim().toLowerCase();
  const email = account.email?.trim().toLowerCase();

  return (
    name === "flextudy" ||
    name === "flextudy bank" ||
    name === "flex study" ||
    name === "flexstudy official" ||
    email === "flextudy.official@gmail.com" ||
    // Kept only so historical data remains readable after the bank account is
    // moved to its official address.
    email === "flextudy6@gmail.com"
  );
}

export function splitEqually(amount: number, partnerIds: string[]) {
  const baseShare = Math.floor(amount / partnerIds.length);
  const remainder = amount % partnerIds.length;

  return partnerIds.map((userId, index) => ({
    userId,
    amountPaid: baseShare + (index < remainder ? 1 : 0),
  }));
}

/**
 * The bank is a cash account, not a partner. Its funded expenses create a
 * partner-specific amount due, deposits cover the depositor's own share, and
 * personal payments remain credits between the three human partners.
 */
export function calculateLedgerBalances(
  accounts: Array<WorkspaceAccount & { id: string }>,
  expenses: LedgerExpense[],
  settlements: LedgerSettlement[]
): LedgerBalance[] {
  const partnerAccounts = accounts.filter((account) => !isCompanyBankAccount(account));
  const bankAccountIds = new Set(
    accounts.filter(isCompanyBankAccount).flatMap((account) => (account.id ? [account.id] : []))
  );
  const balances = new Map<string, LedgerBalance>(
    partnerAccounts.map((account) => [
      account.id,
      {
        userId: account.id,
        name: account.name,
        totalPaid: 0,
        extraFunds: 0,
        totalShare: 0,
        moneySpent: 0,
        moneyReceived: 0,
        companyDue: 0,
        balance: 0,
      },
    ])
  );

  const personalPaid = new Map<string, number>();
  const personalShares = new Map<string, number>();
  const deposits = new Map<string, number>();
  const companyShares = new Map<string, number>();
  const paidToCompany = new Map<string, number>();

  for (const expense of expenses) {
    const payer = balances.get(expense.paidById);

    if (expense.isExtraFund) {
      if (payer) {
        deposits.set(expense.paidById, (deposits.get(expense.paidById) ?? 0) + expense.amountPaid);
        payer.totalPaid += expense.amountPaid;
      }
      continue;
    }

    const isBankPaid = bankAccountIds.has(expense.paidById);
    if (isBankPaid && expense.bankFundingMode === "POOLED_BANK") continue;
    if (payer && !isBankPaid) {
      personalPaid.set(expense.paidById, (personalPaid.get(expense.paidById) ?? 0) + expense.amountPaid);
      payer.totalPaid += expense.amountPaid;
    }

    for (const split of expense.splits) {
      const partner = balances.get(split.userId);
      if (partner) partner.totalShare += split.amountPaid;
      const shares = isBankPaid ? companyShares : personalShares;
      shares.set(split.userId, (shares.get(split.userId) ?? 0) + split.amountPaid);
    }
  }

  for (const settlement of settlements) {
    if (settlement.status !== "COMPLETED") continue;
    const sender = balances.get(settlement.fromUserId);
    const recipient = balances.get(settlement.toUserId);

    if (sender && bankAccountIds.has(settlement.toUserId)) {
      paidToCompany.set(
        settlement.fromUserId,
        (paidToCompany.get(settlement.fromUserId) ?? 0) + settlement.amountPaid
      );
    } else if (sender && recipient) {
      sender.moneySpent += settlement.amountPaid;
      recipient.moneyReceived += settlement.amountPaid;
    }
  }

  return Array.from(balances.values(), (item) => {
    const partnerDeposits = deposits.get(item.userId) ?? 0;
    const partnerCompanyShare = companyShares.get(item.userId) ?? 0;
    const bankPayments = paidToCompany.get(item.userId) ?? 0;
    const companyDue = Math.max(0, partnerCompanyShare - partnerDeposits - bankPayments);

    item.extraFunds = Math.max(0, partnerDeposits - partnerCompanyShare);
    item.companyDue = companyDue;
    item.balance =
      (personalPaid.get(item.userId) ?? 0) -
      (personalShares.get(item.userId) ?? 0) -
      companyDue +
      item.moneySpent -
      item.moneyReceived;

    return item;
  });
}

export type PartnerSettlementSuggestion = {
  fromUserId: string;
  from: string;
  toUserId: string;
  to: string;
  amount: number;
};

/**
 * Match partner-to-partner credits and debts into a short, actionable transfer
 * list. Company dues are intentionally excluded: they are owed to the bank,
 * not to another partner. Pending partner transfers reserve their amount.
 */
export function suggestPartnerSettlements(
  balances: Array<Pick<LedgerBalance, "userId" | "name" | "balance" | "companyDue">>,
  settlements: Array<Pick<LedgerSettlement, "fromUserId" | "toUserId" | "amountPaid" | "status">> = []
): PartnerSettlementSuggestion[] {
  const positions = new Map(balances.map((partner) => [partner.userId, partner.balance + partner.companyDue]));
  for (const settlement of settlements) {
    if (settlement.status !== "PENDING" || !positions.has(settlement.fromUserId) || !positions.has(settlement.toUserId)) continue;
    positions.set(settlement.fromUserId, (positions.get(settlement.fromUserId) ?? 0) + settlement.amountPaid);
    positions.set(settlement.toUserId, (positions.get(settlement.toUserId) ?? 0) - settlement.amountPaid);
  }

  const debtors = balances
    .map(({ userId, name }) => ({ userId, name, remaining: Math.max(0, -(positions.get(userId) ?? 0)) }))
    .filter((partner) => partner.remaining > 0)
    .sort((left, right) => left.name.localeCompare(right.name));
  const creditors = balances
    .map(({ userId, name }) => ({ userId, name, remaining: Math.max(0, positions.get(userId) ?? 0) }))
    .filter((partner) => partner.remaining > 0)
    .sort((left, right) => left.name.localeCompare(right.name));

  const suggestions: PartnerSettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.remaining, creditor.remaining);
    if (amount > 0) suggestions.push({ fromUserId: debtor.userId, from: debtor.name, toUserId: creditor.userId, to: creditor.name, amount });
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }
  return suggestions;
}

/** Company cash is independent from personal out-of-pocket expenses. */
export function calculateCompanyCash(
  accounts: Array<WorkspaceAccount & { id: string }>,
  expenses: LedgerExpense[],
  settlements: LedgerSettlement[] = [],
  bankTransactions: LedgerBankTransaction[] = []
) {
  const bankAccountIds = new Set(
    accounts.filter(isCompanyBankAccount).flatMap((account) => (account.id ? [account.id] : []))
  );

  let deposited = 0;
  let bankPaidExpenses = 0;
  let settlementsReceived = 0;
  let settlementsSent = 0;
  let otherCredits = 0;
  let otherDebits = 0;

  for (const expense of expenses) {
    if (expense.isExtraFund) {
      deposited += expense.amountPaid;
    } else if (bankAccountIds.has(expense.paidById)) {
      bankPaidExpenses += expense.amountPaid;
    }
  }

  for (const settlement of settlements) {
    if (settlement.status !== "COMPLETED") continue;
    if (bankAccountIds.has(settlement.toUserId)) settlementsReceived += settlement.amountPaid;
    if (bankAccountIds.has(settlement.fromUserId)) settlementsSent += settlement.amountPaid;
  }

  for (const transaction of bankTransactions) {
    if (transaction.type === "CREDIT") otherCredits += transaction.amount;
    else otherDebits += transaction.amount;
  }

  return {
    deposited,
    bankPaidExpenses,
    settlementsReceived,
    settlementsSent,
    otherCredits,
    otherDebits,
    cashPosition: deposited - bankPaidExpenses + settlementsReceived - settlementsSent + otherCredits - otherDebits,
  };
}

/**
 * Attribute company-paid partner shares to the source that covered them.
 * Completed repayments to the company are assigned first; partner deposits
 * then cover the remaining shares. This gives transaction history a clear,
 * deterministic line such as "₹4,000 of your contribution applied".
 */
export function calculateExtraFundApplications(
  accounts: Array<WorkspaceAccount & { id: string }>,
  expenses: LedgerExpense[],
  settlements: LedgerSettlement[] = []
): Record<string, Record<string, number>> {
  const bankAccountIds = new Set(
    accounts.filter(isCompanyBankAccount).flatMap((account) => (account.id ? [account.id] : []))
  );
  const depositsByPartner = new Map<string, number>();
  const repaymentsByPartner = new Map<string, number>();
  const expenseShares = new Map<string, Array<{ expenseId: string; userId: string; amountPaid: number; date: number }>>();

  for (const expense of expenses) {
    if (expense.isExtraFund) {
      if (!bankAccountIds.has(expense.paidById)) {
        depositsByPartner.set(expense.paidById, (depositsByPartner.get(expense.paidById) ?? 0) + expense.amountPaid);
      }
      continue;
    }

    if (!expense.id || !bankAccountIds.has(expense.paidById) || expense.bankFundingMode === "POOLED_BANK") continue;
    for (const split of expense.splits) {
      const shares = expenseShares.get(split.userId) ?? [];
      shares.push({
        expenseId: expense.id,
        userId: split.userId,
        amountPaid: split.amountPaid,
        date: new Date(expense.expenseDate ?? expense.createdAt ?? 0).getTime(),
      });
      expenseShares.set(split.userId, shares);
    }
  }

  for (const settlement of settlements) {
    if (settlement.status !== "COMPLETED" || !bankAccountIds.has(settlement.toUserId)) continue;
    repaymentsByPartner.set(
      settlement.fromUserId,
      (repaymentsByPartner.get(settlement.fromUserId) ?? 0) + settlement.amountPaid
    );
  }

  const applications: Record<string, Record<string, number>> = {};
  for (const [userId, shares] of expenseShares) {
    shares.sort((left, right) => left.date - right.date || left.expenseId.localeCompare(right.expenseId));
    let repaymentsLeft = repaymentsByPartner.get(userId) ?? 0;
    let contributionLeft = depositsByPartner.get(userId) ?? 0;
    for (const share of shares) {
      const repaid = Math.min(repaymentsLeft, share.amountPaid);
      repaymentsLeft -= repaid;
      const contributionApplied = Math.min(contributionLeft, share.amountPaid - repaid);
      contributionLeft -= contributionApplied;
      if (contributionApplied > 0) {
        applications[share.expenseId] ??= {};
        applications[share.expenseId][userId] = contributionApplied;
      }
    }
  }

  return applications;
}

/**
 * Pending settlement records reserve part of a debt/credit so the same amount
 * cannot be promised twice before either recipient confirms it.
 */
export function getSettlementAllowance(
  balances: LedgerBalance[],
  pendingSettlements: Array<Pick<LedgerSettlement, "fromUserId" | "toUserId" | "amountPaid">>,
  fromUserId: string,
  toUserId: string,
  bankAccountIds: string[] = []
) {
  const sender = balances.find((balance) => balance.userId === fromUserId);
  const recipient = balances.find((balance) => balance.userId === toUserId);

  if (bankAccountIds.includes(fromUserId)) return 0;

  if (bankAccountIds.includes(toUserId)) {
    const alreadyReservedForCompany = pendingSettlements
      .filter((settlement) => settlement.fromUserId === fromUserId && bankAccountIds.includes(settlement.toUserId))
      .reduce((total, settlement) => total + settlement.amountPaid, 0);
    return Math.max(0, (sender?.companyDue ?? 0) - alreadyReservedForCompany);
  }

  const reservedBySender = pendingSettlements
    .filter((settlement) => settlement.fromUserId === fromUserId)
    .reduce((total, settlement) => total + settlement.amountPaid, 0);
  const reservedForRecipient = pendingSettlements
    .filter((settlement) => settlement.toUserId === toUserId)
    .reduce((total, settlement) => total + settlement.amountPaid, 0);

  const availableToPay = Math.max(0, -(sender?.balance ?? 0) - reservedBySender);
  const availableToReceive = Math.max(0, (recipient?.balance ?? 0) - reservedForRecipient);

  return Math.min(availableToPay, availableToReceive);
}
