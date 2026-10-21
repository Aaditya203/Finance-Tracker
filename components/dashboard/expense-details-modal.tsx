"use client";

import React, { useState } from "react";
import { Attachment } from "@/types";
import { AttachmentSection } from "@/components/ui/attachment-section";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import {
  X,
  Receipt,
  UserRound,
  Calendar,
  Tag,
  CreditCard,
  CheckCircle2,
  Wallet,
} from "lucide-react";

import { uploadExpenseAttachment } from "@/lib/api/expenses";

export type DetailedExpense = {
  id: string;
  description: string;
  transactionId?: string;
  paidBy: string;
  paidById?: string;
  shares?: Array<{ userId: string; name: string; amountPaid: number }>;
  amount: number;
  formattedAmount: string;
  date: string;
  category: string;
  isExtraFund?: boolean;
  bankFundingMode?: "PARTNER_SPLIT" | "POOLED_BANK";
  fundAppliedToCurrentUser?: number;
  attachments?: Attachment[];
};

interface ExpenseDetailsModalProps {
  expense: DetailedExpense | null;
  onClose: () => void;
  onUpdateExpense?: (updated: DetailedExpense) => void;
}

const isCompanyName = (name: string) => /flex\s*study|flextudy/i.test(name);

export function ExpenseDetailsModal({
  expense,
  onClose,
  onUpdateExpense,
}: ExpenseDetailsModalProps) {
  const { user } = useCurrentUser();
  const [prevExpense, setPrevExpense] = useState<DetailedExpense | null>(expense);
  const [currentExpense, setCurrentExpense] = useState<DetailedExpense | null>(expense);

  if (expense !== prevExpense) {
    setPrevExpense(expense);
    setCurrentExpense(expense);
  }

  if (!currentExpense) return null;

  const isPayer = user?.id
    ? (currentExpense.paidById
        ? user.id === currentExpense.paidById
        : user.name?.toLowerCase() === currentExpense.paidBy?.toLowerCase())
    : true;

  const isCompanyPayer = isCompanyName(currentExpense.paidBy);
  const shares = currentExpense.shares ?? [];

  const handleUpload = async (file: File) => {
    const newAtt = await uploadExpenseAttachment(currentExpense.id, file);
    const updated = {
      ...currentExpense,
      attachments: [newAtt, ...(currentExpense.attachments || [])],
    };
    setCurrentExpense(updated);
    if (onUpdateExpense) {
      onUpdateExpense(updated);
    }
  };

  const isPaidByFlextudy = currentExpense.paidBy?.toLowerCase().includes("flexstudy") || currentExpense.paidBy?.toLowerCase().includes("flextudy");
  const isPooledCash = !currentExpense.isExtraFund && currentExpense.bankFundingMode === "POOLED_BANK";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#1d1e1c]/50 backdrop-blur-md p-0 sm:p-4 transition-all duration-300 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Expense Details"
    >
      <div className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] border border-[#e3d6c5] bg-white p-5 sm:p-7 shadow-2xl space-y-6 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e3d6c5]/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-[#fa5d00]/10 text-[#fa5d00] flex items-center justify-center shrink-0 border border-[#fa5d00]/20 shadow-sm">
              <Receipt className="size-5" />
            </div>
            <div>
              {currentExpense.isExtraFund ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                  <Wallet className="size-3" /> Extra Fund (No Split)
                </span>
              ) : (
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${isPooledCash ? "bg-blue-50 text-blue-800 border border-blue-200" : "bg-[#fa5d00]/10 text-[#fa5d00]"}`}>
                  {isPooledCash ? "Pooled bank cash" : currentExpense.category || "Expense"}
                </span>
              )}
              <h2 className="text-xl font-bold text-[#1d1e1c] leading-tight text-balance">
                Expense Details
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-[#8e8b87] hover:bg-[#fff8f1] hover:text-[#1d1e1c] transition-colors cursor-pointer shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Amount Hero Banner */}
        <div
          className={`rounded-[20px] border p-5 shadow-sm space-y-1 ${
            currentExpense.isExtraFund
              ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
              : "border-[#fee3b5] bg-gradient-to-br from-[#fff8f1] to-[#fff3e4]"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
            {currentExpense.isExtraFund ? "Extra Fund Title" : "Expense Title"}
          </p>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xl font-bold text-[#1d1e1c] tracking-tight">
              {currentExpense.description}
            </p>
            <p
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${
                currentExpense.isExtraFund ? "text-emerald-700" : "text-[#fa5d00]"
              }`}
            >
              {currentExpense.formattedAmount || `₹${currentExpense.amount.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-[#fff8f1]/50 p-4 rounded-[20px] border border-[#e3d6c5]/60 text-xs sm:text-sm">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
              <CreditCard className="size-3 text-[#fa5d00]" /> Transaction ID
            </span>
            <p className="font-semibold text-[#1d1e1c] truncate">
              {currentExpense.transactionId || `TXN-${currentExpense.id.slice(-6)}`}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
              <Tag className="size-3 text-[#fa5d00]" /> Category
            </span>
            <p className="font-semibold text-[#1d1e1c]">
              {currentExpense.category}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
              <UserRound className="size-3 text-[#fa5d00]" /> Paid By
            </span>
            <p className="font-semibold text-[#1d1e1c]">
              {isPaidByFlextudy ? "FlexStudy Official (Company Account)" : currentExpense.paidBy}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
              <Calendar className="size-3 text-[#fa5d00]" /> Date
            </span>
            <p className="font-semibold text-[#1d1e1c]">
              {currentExpense.date}
            </p>
          </div>
        </div>

        {/* Partner Split Card */}
        {currentExpense.isExtraFund ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-900">
                <Wallet className="size-4 text-emerald-600" /> Extra Fund Contribution
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                Not Splitted
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              <b>{currentExpense.paidBy}</b> contributed this amount to the <b>FlexStudy company bank account</b>. It is recorded as company funding, not as money the company owes back to the contributor.
            </p>
          </div>
        ) : isPooledCash ? (
          <div className="rounded-[20px] border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900"><Wallet className="size-4" /> Paid from pooled bank cash · no partner split</div>
            <p className="mt-2 text-xs leading-relaxed text-blue-900">The company bank balance decreased by {currentExpense.formattedAmount || `₹${currentExpense.amount.toLocaleString("en-IN")}`}. No partner share or repayment due was created for this expense.</p>
          </div>
        ) : (
          <div className="rounded-[20px] border border-[#e3d6c5] bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1d1e1c]">
                <UserRound className="size-4 text-[#fa5d00]" /> {isPooledCash ? "No partner split" : `Partner shares · ${shares.length} partners`}
              </div>
              {!isPooledCash && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="size-3" /> Recorded split</span>}
            </div>
            {isPooledCash ? <p className="text-xs leading-relaxed text-[#615f5c]">The full amount was paid from pooled company cash. No partner share or repayment balance was created.</p> : shares.length ? <div className="space-y-2">
              {shares.map((share) => {
                const isPayer = currentExpense.paidById ? share.userId === currentExpense.paidById : share.name === currentExpense.paidBy;
                return (
                  <div
                    key={share.userId}
                    className={`flex items-center justify-between gap-3 rounded-xl p-2.5 border ${
                      isPayer
                        ? "bg-[#fff8f1] border-[#fa5d00]/30"
                        : "bg-white border-[#e3d6c5]/70"
                    }`}
                  >
                    <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#1d1e1c]">{share.name}{isPayer ? " · payer" : ""}</p><p className="mt-0.5 text-[11px] text-[#615f5c]">{isCompanyPayer ? "Share assigned · company bank paid" : isPayer ? "Own share · covered by payer" : `Owes ${currentExpense.paidBy}`}</p></div>
                    <p className="shrink-0 text-sm font-bold text-[#1d1e1c] tabular-nums">₹{share.amountPaid.toLocaleString("en-IN")}</p>
                  </div>
                );
              })}
              {isCompanyPayer && <p className="text-[11px] leading-relaxed text-[#615f5c]">These are the recorded shares. Each partner’s remaining amount due to the official bank is reduced by their own deposits and repayments.</p>}
              {!isCompanyPayer && <p className="text-[11px] leading-relaxed text-[#615f5c]">These are the shares for this expense. Later repayments are listed separately under Settlements and reduce the current “Who pays whom” balance.</p>}
            </div> : <p className="text-xs leading-relaxed text-[#615f5c]">No individual split details were returned for this record. The listed transaction amount is ₹{currentExpense.amount.toLocaleString("en-IN")}.</p>}
          </div>
        )}

        {!currentExpense.isExtraFund && (currentExpense.fundAppliedToCurrentUser ?? 0) > 0 && (
          <div className="rounded-[16px] border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Wallet className="size-4" /> Your contribution applied
            </div>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              ₹{currentExpense.fundAppliedToCurrentUser!.toLocaleString("en-IN")} from your extra funds covered your share of this company-paid expense.
            </p>
          </div>
        )}

        {/* Attachment Section */}
        <AttachmentSection
          attachments={currentExpense.attachments}
          onUpload={handleUpload}
          disabled={!isPayer}
          title="Expense Receipts & Documents"
        />

        {/* Footer Actions */}
        <div className="flex justify-end pt-3 border-t border-[#e3d6c5]">
          <Button variant="secondary" size="md" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
