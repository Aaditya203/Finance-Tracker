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
} from "lucide-react";

import { uploadExpenseAttachment } from "@/lib/api/expenses";

export type DetailedExpense = {
  id: string;
  description: string;
  transactionId?: string;
  paidBy: string;
  paidById?: string;
  amount: number;
  formattedAmount: string;
  date: string;
  category: string;
  attachments?: Attachment[];
};

interface ExpenseDetailsModalProps {
  expense: DetailedExpense | null;
  onClose: () => void;
  onUpdateExpense?: (updated: DetailedExpense) => void;
}

const partners = ["Aditya Sharma", "Vishal Kumar Singh", "Ujjwal Kumar Singh"];

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

  const perPartnerShare = `₹${(Math.floor(currentExpense.amount / 3)).toLocaleString("en-IN")}`;

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
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fa5d00]/10 text-[#fa5d00] mb-1">
                {currentExpense.category || "Expense"}
              </span>
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
        <div className="rounded-[20px] border border-[#fee3b5] bg-gradient-to-br from-[#fff8f1] to-[#fff3e4] p-5 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
            Expense Title
          </p>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xl font-bold text-[#1d1e1c] tracking-tight">
              {currentExpense.description}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#fa5d00] tabular-nums">
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
              {currentExpense.paidBy}
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

        {/* Partner Equal Split Card */}
        <div className="rounded-[20px] border border-[#e3d6c5] bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1d1e1c]">
              <UserRound className="size-4 text-[#fa5d00]" /> Equal 3-Way Split
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Split 1/3
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {partners.map((partner) => {
              const isPayer = currentExpense.paidBy === partner;
              return (
                <div
                  key={partner}
                  className={`rounded-xl p-2.5 text-center border transition-all ${
                    isPayer
                      ? "bg-[#fff8f1] border-[#fa5d00]/30 shadow-sm"
                      : "bg-[#fff8f1]/40 border-[#e3d6c5]/50"
                  }`}
                >
                  <p className="truncate text-[11px] font-medium text-[#615f5c]">
                    {partner.split(" ")[0]}
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#1d1e1c] tabular-nums">
                    {perPartnerShare}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

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
