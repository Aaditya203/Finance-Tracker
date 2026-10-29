"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DashboardRecentExpense } from "@/types";
import { DetailedExpense } from "@/components/dashboard/expense-details-modal";
import { Receipt, Paperclip, ChevronRight, Tag, Wallet } from "lucide-react";
import { isCompanyBankAccount } from "@/lib/finance";

interface RecentTransactionsProps {
  expenses?: DashboardRecentExpense[];
  onSelectExpense: (expense: DetailedExpense) => void;
  isLoading?: boolean;
}

export function RecentTransactions({
  expenses,
  onSelectExpense,
  isLoading,
}: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <Card variant="paper" className="p-5 border border-[var(--color-parchment-shadow)] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-parchment-shadow)]/60 pb-3">
          <div className="h-5 w-40 bg-[var(--color-parchment-shadow)]/50 rounded animate-pulse" />
          <div className="h-4 w-16 bg-[var(--color-parchment-shadow)]/30 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-[var(--color-cream-canvas)] rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const handleRowClick = (item: DashboardRecentExpense) => {
    const formattedDate = new Date(item.expenseDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const detailedExpense: DetailedExpense = {
      id: item.id,
      description: item.description,
      transactionId: item.transactionId,
      paidBy: item.paidBy.name,
      paidById: item.paidBy.id,
      amount: item.amountPaid,
      formattedAmount: `₹${item.amountPaid.toLocaleString("en-IN")}`,
      date: formattedDate,
      category: item.category || "Infrastructure",
      isExtraFund: item.isExtraFund,
      bankFundingMode: item.bankFundingMode,
      fundAppliedToCurrentUser: item.fundAppliedToCurrentUser,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
      shares: item.splits.map((split) => ({ userId: split.userId, name: split.user.name, amountPaid: split.amountPaid })),
      attachments: item.attachments?.map((att) => ({
        ...att,
        driveFileId: att.driveFileId || "",
        createdAt: typeof att.createdAt === "string" ? att.createdAt : new Date(att.createdAt).toISOString(),
      })),
    };

    onSelectExpense(detailedExpense);
  };

  return (
    <Card variant="paper" className="p-5 border border-[var(--color-parchment-shadow)] shadow-sm rounded-[22px]">
      <div className="flex items-center justify-between border-b border-[var(--color-parchment-shadow)]/60 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-harvest-flame)]/10 text-[var(--color-harvest-flame)] flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-[var(--color-ink-black)]">Latest Transactions</h3>
            <p className="text-xs text-[var(--color-warm-stone)]">Recent shared expenses and extra funds</p>
          </div>
        </div>
        <Link
          href="/expenses"
          className="text-xs font-semibold text-[var(--color-harvest-flame)] hover:underline flex items-center gap-0.5"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!expenses || expenses.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--color-driftwood)] space-y-1">
          <p className="font-semibold">No recent transactions</p>
          <p>Click &quot;Add Expense&quot; above to log your first shared expense.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {expenses.map((item) => {
            const formattedDate = new Date(item.expenseDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const hasAttachments = item.attachments && item.attachments.length > 0;
            const isExtraFund = item.isExtraFund;
            const isPooledCash = !isExtraFund && item.bankFundingMode === "POOLED_BANK";

            return (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  isExtraFund
                    ? "bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50/80 dark:bg-emerald-950/40 dark:border-emerald-900/80 dark:hover:bg-emerald-950/40"
                    : "bg-[var(--color-surface)] border-[var(--color-parchment-shadow)]/60 hover:border-[var(--color-harvest-flame)]/50 hover:bg-[var(--color-cream-canvas)]/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                      isExtraFund
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-[var(--color-success)]"
                        : "bg-[var(--color-cream-canvas)] border-[var(--color-parchment-shadow)] text-[var(--color-harvest-flame)] group-hover:bg-[var(--color-harvest-flame)] group-hover:text-white"
                    }`}
                  >
                    {isExtraFund ? <Wallet className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[var(--color-ink-black)] truncate">{item.description}</p>
                      {isExtraFund && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 dark:text-[var(--color-success)] dark:bg-emerald-950/40 dark:border-emerald-900 px-1.5 py-0.2 rounded-md">
                          Extra Fund
                        </span>
                      )}
                      {isPooledCash && <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-[var(--color-info)] px-1.5 py-0.5 text-[10px] font-bold">Pooled cash</span>}
                      {hasAttachments && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--color-harvest-flame)] bg-[var(--color-harvest-flame)]/10 px-1.5 py-0.2 rounded-md">
                          <Paperclip className="w-3 h-3" /> {item.attachments.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-warm-stone)]">
                      Paid by <span className="font-semibold text-[var(--color-ink-black)]">{item.paidBy.name}</span> • {formattedDate}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-driftwood)]">
                      {isExtraFund ? "Deposited into official bank · no partner split" : isPooledCash ? "Paid from pooled bank · no partner dues" : isCompanyBankAccount(item.paidBy) ? "Official bank paid · partner shares recorded" : "Paid personally · other partners owe their share to payer"}
                    </p>
                    {(item.fundAppliedToCurrentUser ?? 0) > 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-[var(--color-success)]">
                        ₹{item.fundAppliedToCurrentUser!.toLocaleString("en-IN")} of your extra funds applied to your share
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <p
                    className={`text-sm sm:text-base font-extrabold tracking-tight ${
                      isExtraFund ? "text-emerald-800 dark:text-[var(--color-success)]" : "text-[var(--color-ink-black)]"
                    }`}
                  >
                    ₹{item.amountPaid.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isExtraFund ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-[var(--color-harvest-flame)]"
                    }`}
                  >
                    {isExtraFund ? "No Split" : isPooledCash ? "Bank cash" : item.category || "Shared"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
