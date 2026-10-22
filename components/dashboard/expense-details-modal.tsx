"use client";

import React, { useState } from "react";
import { Attachment } from "@/types";
import { AttachmentSection } from "@/components/ui/attachment-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { isWithinTwoDays, getTimeRemainingText } from "@/lib/time-limit";
import { updateExpenseApi, deleteExpenseApi, uploadExpenseAttachment } from "@/lib/api/expenses";
import {
  X,
  Receipt,
  UserRound,
  Calendar,
  CreditCard,
  CheckCircle2,
  Wallet,
  Pencil,
  Trash2,
  Clock,
  Lock,
  AlertTriangle,
} from "lucide-react";

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
  createdAt?: string;
};

interface ExpenseDetailsModalProps {
  expense: DetailedExpense | null;
  onClose: () => void;
  onUpdateExpense?: (updated: DetailedExpense) => void;
  onDeleteExpense?: (id: string) => void;
}

const isCompanyName = (name: string) => /flex\s*study|flextudy/i.test(name);
const CATEGORIES = ["Software", "Hosting", "Marketing", "Operations", "Infrastructure", "Other"];

export function ExpenseDetailsModal({
  expense,
  onClose,
  onUpdateExpense,
  onDeleteExpense,
}: ExpenseDetailsModalProps) {
  const { user } = useCurrentUser();
  const [prevExpense, setPrevExpense] = useState<DetailedExpense | null>(expense);
  const [currentExpense, setCurrentExpense] = useState<DetailedExpense | null>(expense);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (expense !== prevExpense) {
    setPrevExpense(expense);
    setCurrentExpense(expense);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setSaveError("");
    setDeleteError("");
  }

  if (!currentExpense) return null;

  const isPayer = user?.id
    ? currentExpense.paidById
      ? user.id === currentExpense.paidById
      : user.name?.toLowerCase() === currentExpense.paidBy?.toLowerCase()
    : true;

  const isCompanyPayer = isCompanyName(currentExpense.paidBy);
  const shares = currentExpense.shares ?? [];

  // 2-Day Edit Window
  const canModify = isPayer && isWithinTwoDays(currentExpense.createdAt);
  const timeRemaining = getTimeRemainingText(currentExpense.createdAt);

  const startEditing = () => {
    setEditDescription(currentExpense.description);
    setEditAmount(String(currentExpense.amount));
    setEditCategory(currentExpense.category || "Operations");
    // Parse current date to YYYY-MM-DD
    const parsedDate = new Date(currentExpense.date);
    const dateStr = !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    setEditDate(dateStr);
    setSaveError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    const numAmount = Number(editAmount);
    if (!Number.isSafeInteger(numAmount) || numAmount <= 0) {
      setSaveError("Please enter a valid amount in rupees.");
      return;
    }
    if (!editDescription.trim()) {
      setSaveError("Please enter a description.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateExpenseApi(currentExpense.id, {
        description: editDescription.trim(),
        amountPaid: numAmount,
        category: editCategory,
        expenseDate: editDate,
      });

      const updatedExpense: DetailedExpense = {
        ...currentExpense,
        description: result.expense.description,
        amount: result.expense.amountPaid,
        formattedAmount: `₹${result.expense.amountPaid.toLocaleString("en-IN")}`,
        category: result.expense.category || "Operations",
        date: new Date(result.expense.expenseDate || Date.now()).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        shares: result.expense.splits?.map((s) => ({
          userId: s.userId,
          name: s.user?.name || "Partner",
          amountPaid: s.amountPaid,
        })),
      };

      setCurrentExpense(updatedExpense);
      setIsEditing(false);
      if (onUpdateExpense) {
        onUpdateExpense(updatedExpense);
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update expense");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    setIsDeleting(true);
    try {
      await deleteExpenseApi(currentExpense.id);
      if (onDeleteExpense) {
        onDeleteExpense(currentExpense.id);
      }
      onClose();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete expense");
      setIsDeleting(false);
    }
  };

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

  const isPaidByFlextudy =
    currentExpense.paidBy?.toLowerCase().includes("flextudy");
  const isPooledCash =
    !currentExpense.isExtraFund && currentExpense.bankFundingMode === "POOLED_BANK";

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
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    isPooledCash
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "bg-[#fa5d00]/10 text-[#fa5d00]"
                  }`}
                >
                  {isPooledCash ? "Pooled bank cash" : currentExpense.category || "Expense"}
                </span>
              )}
              <h2 className="text-xl font-bold text-[#1d1e1c] leading-tight text-balance">
                {isEditing ? "Edit Expense" : "Expense Details"}
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

        {/* 2-Day Status Indicator Banner */}
        <div
          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
            canModify
              ? "bg-amber-50/70 border-amber-200 text-amber-900"
              : "bg-[#fff8f1] border-[#e3d6c5] text-[#8e8b87]"
          }`}
        >
          <div className="flex items-center gap-2">
            {canModify ? (
              <Clock className="size-3.5 text-amber-600 shrink-0" />
            ) : (
              <Lock className="size-3.5 text-[#8e8b87] shrink-0" />
            )}
            <span>
              {canModify
                ? `2-day window active · ${timeRemaining}`
                : "Locked · Created > 2 days ago (read-only)"}
            </span>
          </div>

          {canModify && !isEditing && !showDeleteConfirm && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#e3d6c5] bg-white text-[#1d1e1c] hover:border-[#fa5d00] hover:text-[#fa5d00] font-semibold text-xs transition-colors cursor-pointer"
              >
                <Pencil className="size-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="rounded-[20px] border border-red-200 bg-red-50/90 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5 text-red-900">
              <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Delete this transaction?</h4>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                  This action is permanent and cannot be undone. All split balances recorded for this expense will be removed.
                </p>
              </div>
            </div>
            {deleteError && (
              <p className="text-xs font-semibold text-red-800">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-red-700"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        )}

        {/* Edit Form Mode */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {saveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {saveError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                Expense Title / Description
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="e.g. AWS Cloud Hosting"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="h-[50px] w-full rounded-[16px] border border-[#c0bbb6] bg-white px-3.5 text-sm text-[#1d1e1c] focus:border-[#fa5d00] focus:outline-none focus:ring-2 focus:ring-[#fa5d00]/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                Expense Date
              </label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>

            <p className="text-[11px] text-[#8e8b87] leading-relaxed">
              Updating the amount will automatically recalculate equal partner shares.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e3d6c5]">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" size="md" disabled={isSaving}>
                {isSaving ? "Saving changes..." : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <>
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
                  {currentExpense.formattedAmount ||
                    `₹${currentExpense.amount.toLocaleString("en-IN")}`}
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
                  <Calendar className="size-3 text-[#fa5d00]" /> Date
                </span>
                <p className="font-semibold text-[#1d1e1c]">{currentExpense.date}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
                  <UserRound className="size-3 text-[#fa5d00]" /> Paid By
                </span>
                <p className="font-semibold text-[#1d1e1c]">
                  {isPaidByFlextudy
                    ? "Flextudy Official (Company Account)"
                    : currentExpense.paidBy}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
                  <Receipt className="size-3 text-[#fa5d00]" /> Category
                </span>
                <p className="font-semibold text-[#1d1e1c]">
                  {currentExpense.category || "General"}
                </p>
              </div>
            </div>

            {/* Partner Splits or Fund Explanation */}
            {currentExpense.isExtraFund ? (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Wallet className="size-4 text-emerald-600" /> Company Deposit · Not Split
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <b>{currentExpense.paidBy}</b> contributed this amount to the <b>Flextudy company bank account</b>. It is recorded as company funding, not as money the company owes back to the contributor.
                </p>
              </div>
            ) : isPooledCash ? (
              <div className="rounded-[20px] border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Wallet className="size-4" /> Paid from pooled bank cash · no partner split
                </div>
                <p className="mt-2 text-xs leading-relaxed text-blue-900">
                  The company bank balance decreased by{" "}
                  {currentExpense.formattedAmount ||
                    `₹${currentExpense.amount.toLocaleString("en-IN")}`}
                  . No partner share or repayment due was created for this expense.
                </p>
              </div>
            ) : (
              <div className="rounded-[20px] border border-[#e3d6c5] bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1d1e1c]">
                    <UserRound className="size-4 text-[#fa5d00]" />{" "}
                    {`Partner shares · ${shares.length} partners`}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Recorded split
                  </span>
                </div>
                {shares.length ? (
                  <div className="space-y-2">
                    {shares.map((share) => {
                      const isSharePayer = currentExpense.paidById
                        ? share.userId === currentExpense.paidById
                        : share.name === currentExpense.paidBy;
                      return (
                        <div
                          key={share.userId}
                          className={`flex items-center justify-between gap-3 rounded-xl p-2.5 border ${
                            isSharePayer
                              ? "bg-[#fff8f1] border-[#fa5d00]/30"
                              : "bg-white border-[#e3d6c5]/70"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[#1d1e1c]">
                              {share.name}
                              {isSharePayer ? " · payer" : ""}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#615f5c]">
                              {isCompanyPayer
                                ? "Share assigned · company bank paid"
                                : isSharePayer
                                ? "Own share · covered by payer"
                                : `Owes ${currentExpense.paidBy}`}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-[#1d1e1c] tabular-nums">
                            ₹{share.amountPaid.toLocaleString("en-IN")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-[#615f5c]">
                    No individual split details were returned for this record.
                  </p>
                )}
              </div>
            )}

            {!currentExpense.isExtraFund &&
              (currentExpense.fundAppliedToCurrentUser ?? 0) > 0 && (
                <div className="rounded-[16px] border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Wallet className="size-4" /> Your contribution applied
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                    ₹{currentExpense.fundAppliedToCurrentUser!.toLocaleString("en-IN")} from
                    your extra funds covered your share of this company-paid expense.
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
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                className="px-6"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
