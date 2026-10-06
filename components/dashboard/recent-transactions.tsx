"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DashboardRecentExpense } from "@/types";
import { DetailedExpense } from "@/components/dashboard/expense-details-modal";
import { Receipt, Paperclip, ChevronRight, Tag, Wallet } from "lucide-react";

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
      <Card variant="paper" className="p-5 border border-[#e3d6c5] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#e3d6c5]/60 pb-3">
          <div className="h-5 w-40 bg-[#e3d6c5]/50 rounded animate-pulse" />
          <div className="h-4 w-16 bg-[#e3d6c5]/30 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#fff8f1] rounded-xl animate-pulse" />
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
      amount: item.amountPaid,
      formattedAmount: `₹${item.amountPaid.toLocaleString("en-IN")}`,
      date: formattedDate,
      category: item.category || "Infrastructure",
      isExtraFund: item.isExtraFund,
      attachments: item.attachments?.map((att) => ({
        ...att,
        driveFileId: att.driveFileId || "",
        createdAt: typeof att.createdAt === "string" ? att.createdAt : new Date(att.createdAt).toISOString(),
      })),
    };

    onSelectExpense(detailedExpense);
  };

  return (
    <Card variant="paper" className="p-5 border border-[#e3d6c5] shadow-sm rounded-[22px]">
      <div className="flex items-center justify-between border-b border-[#e3d6c5]/60 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#fa5d00]/10 text-[#fa5d00] flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-[#1d1e1c]">Latest Transactions</h3>
            <p className="text-xs text-[#615f5c]">Recent shared expenses and extra funds</p>
          </div>
        </div>
        <Link
          href="/expenses"
          className="text-xs font-semibold text-[#fa5d00] hover:underline flex items-center gap-0.5"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!expenses || expenses.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8e8b87] space-y-1">
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

            return (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                className={`group flex items-center justify-between p-3.5 rounded-[16px] border transition-all cursor-pointer shadow-2xs ${
                  isExtraFund
                    ? "bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50/80"
                    : "bg-white border-[#e3d6c5]/60 hover:border-[#fa5d00]/50 hover:bg-[#fff8f1]/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                      isExtraFund
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : "bg-[#fff8f1] border-[#e3d6c5] text-[#fa5d00] group-hover:bg-[#fa5d00] group-hover:text-white"
                    }`}
                  >
                    {isExtraFund ? <Wallet className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#1d1e1c] truncate">{item.description}</p>
                      {isExtraFund && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                          Extra Fund
                        </span>
                      )}
                      {hasAttachments && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#fa5d00] bg-[#fa5d00]/10 px-1.5 py-0.2 rounded-md">
                          <Paperclip className="w-3 h-3" /> {item.attachments.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#615f5c]">
                      Paid by <span className="font-semibold text-[#1d1e1c]">{item.paidBy.name}</span> • {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <p
                    className={`text-sm sm:text-base font-extrabold tracking-tight ${
                      isExtraFund ? "text-emerald-800" : "text-[#1d1e1c]"
                    }`}
                  >
                    ₹{item.amountPaid.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isExtraFund ? "text-emerald-600 font-bold" : "text-[#fa5d00]"
                    }`}
                  >
                    {isExtraFund ? "No Split" : item.category || "Shared"}
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
