"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Receipt, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { isCompanyBankAccount } from "@/lib/finance";

import { CustomSelect } from "@/components/ui/custom-select";
import { getUsersApi } from "@/lib/api/dashboard";
import { createExpense, uploadExpenseAttachment } from "@/lib/api/expenses";
import { CreatedExpenseResponse, WorkspaceUser, Attachment } from "@/types";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (expense: CreatedExpenseResponse) => void;
}

export function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const { user: currentUser } = useCurrentUser();
  const [isExtraFund, setIsExtraFund] = useState(false);
  const [bankFundingMode, setBankFundingMode] = useState<"PARTNER_SPLIT" | "POOLED_BANK">("PARTNER_SPLIT");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Infrastructure");
  const [file, setFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const formatAmount = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

  useEffect(() => {
    if (isOpen) {
      async function fetchUsers() {
        setIsLoadingUsers(true);
        try {
          const fetchedUsers = await getUsersApi();
          setUsers(fetchedUsers);
        } catch {
          setError("Failed to load workspace partners");
        } finally {
          setIsLoadingUsers(false);
        }
      }
      fetchUsers();
    }
  }, [isOpen]);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setIsExtraFund(false);
      setBankFundingMode("PARTNER_SPLIT");
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("Infrastructure");
      setFile(null);
      setTransactionId("");
      setError(null);
      setIsSuccess(false);
    }
  }

  if (!isOpen) return null;

  const parsedAmount = Math.round(parseFloat(amount));
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const humanPartners = users.filter((user) => !isCompanyBankAccount(user));
  const humanCount = humanPartners.length || 3;
  const isCompanyAccount = currentUser ? isCompanyBankAccount(currentUser) : false;
  const partnerShare = isValidAmount ? (parsedAmount / humanCount).toFixed(2) : "0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Please enter an expense description.");
      return;
    }
    if (!isValidAmount) {
      setError("Please enter a valid positive amount.");
      return;
    }

    const paidById = currentUser?.id;
    if (!paidById) {
      setError("Authenticated user not found. Please re-login.");
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedTxId =
        transactionId.trim() ||
        `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const createdExpense = await createExpense({
        amountPaid: parsedAmount,
        transactionId: generatedTxId,
        description: description.trim(),
        category: isExtraFund ? "Extra Fund" : category,
        paidById,
        isExtraFund,
        bankFundingMode: isCompanyAccount && !isExtraFund ? bankFundingMode : "PARTNER_SPLIT",
        expenseDate: date,
      });

      let uploadedAttachment: Attachment | undefined;

      if (file && createdExpense.id) {
        try {
          uploadedAttachment = await uploadExpenseAttachment(createdExpense.id, file);
        } catch (attErr) {
          console.error("Failed to upload attachment", attErr);
        }
      }

      const finalExpense: CreatedExpenseResponse = {
        ...createdExpense,
        attachments: uploadedAttachment
          ? [...(createdExpense.attachments || []), uploadedAttachment]
          : createdExpense.attachments || [],
      };

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        if (onSuccess) onSuccess(finalExpense);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred while creating expense.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-ink-black)]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-parchment-shadow)] rounded-xl max-w-lg w-full p-5 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-parchment-shadow)]">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isExtraFund
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-[var(--color-success)]"
                  : "bg-[var(--color-harvest-flame)]/10 text-[var(--color-harvest-flame)]"
              }`}
            >
              {isExtraFund ? <Wallet className="size-5" /> : <Receipt className="size-5" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--color-ink-black)] text-balance">
                {isExtraFund ? "Add Extra Funds" : "Add Shared Expense"}
              </h3>
              <p className="text-xs text-[var(--color-warm-stone)] text-pretty">
                {isExtraFund
                  ? `Record a partner contribution to the company bank account`
                  : isCompanyAccount && bankFundingMode === "POOLED_BANK"
                    ? "Record a company cost paid from pooled bank cash"
                    : `Record an expense paid by ${currentUser?.name || "you"}, split equally among ${humanCount} partners`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[var(--color-driftwood)] hover:text-[var(--color-ink-black)] p-1.5 rounded-full hover:bg-[var(--color-cream-canvas)] transition-colors cursor-pointer shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-[var(--color-ink-black)]">
              {isExtraFund ? "Extra Fund Added!" : "Expense Added Successfully!"}
            </h4>
            <p className="text-sm text-[var(--color-warm-stone)]">Partner balances have been recalculated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-6">
            {/* Entry Mode Toggle */}
            <div className={`grid ${isCompanyAccount ? "grid-cols-1" : "grid-cols-2"} p-1 bg-[var(--color-cream-canvas)] rounded-xl border border-[var(--color-parchment-shadow)]`}>
              <button
                type="button"
                onClick={() => setIsExtraFund(false)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  !isExtraFund
                    ? "bg-[var(--color-surface)] text-[var(--color-harvest-flame)] shadow-sm border border-[var(--color-parchment-shadow)]"
                    : "text-[var(--color-warm-stone)] hover:text-[var(--color-ink-black)]"
                }`}
              >
                Regular Expense (Split)
              </button>
              {!isCompanyAccount && <button
                type="button"
                onClick={() => setIsExtraFund(true)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isExtraFund
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-[var(--color-warm-stone)] hover:text-[var(--color-success)]"
                }`}
              >
                <Wallet className="size-3.5" /> Extra Fund (No Split)
              </button>}
            </div>

            {isCompanyAccount && !isExtraFund && (
              <fieldset className="rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-3.5">
                <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--color-warm-stone)]">Expense funding</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {([
                    ["PARTNER_SPLIT", "Partner split", "Share the cost equally; partners may owe the bank."],
                    ["POOLED_BANK", "Pooled bank cash", "Use available company cash; no partner dues."],
                  ] as const).map(([mode, label, detail]) => (
                    <button key={mode} type="button" aria-pressed={bankFundingMode === mode} onClick={() => setBankFundingMode(mode)} className={`rounded-xl border p-3 text-left transition-colors ${bankFundingMode === mode ? "border-[var(--color-harvest-flame)] bg-[var(--color-cream-canvas)] ring-1 ring-[var(--color-harvest-flame)]/20" : "border-[var(--color-parchment-shadow)] hover:bg-[var(--color-cream-canvas)]/60"}`}>
                      <span className="block text-sm font-bold text-[var(--color-ink-black)]">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--color-warm-stone)]">{detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 p-3 text-xs font-semibold">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                {isExtraFund ? "Extra Fund Description" : "Expense Description"}
              </label>
              <Input
                placeholder={
                  isExtraFund
                    ? "e.g. Extra Fund Capital Injection, Vishal Personal Capital"
                    : "e.g. AWS Cloud Hosting, Office Coffee"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  placeholder="₹ 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                  Paid By
                </label>
                <div className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)]/50 text-xs sm:text-sm font-semibold text-[var(--color-ink-black)] flex items-center justify-between">
                  <span>{currentUser?.name || "Authenticated User"}</span>
                  <span className="text-[10px] font-bold text-[var(--color-harvest-flame)] bg-[var(--color-harvest-flame)]/10 px-2 py-0.5 rounded-full uppercase">You</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                  Category
                </label>
                {isExtraFund ? (
                  <div className="w-full py-2.5 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-[var(--color-success)]">
                    Extra Fund (Capital)
                  </div>
                ) : (
                  <CustomSelect
                    options={["Infrastructure", "Software/SaaS", "Domain & Ops", "Office & Food"]}
                    value={category}
                    onChange={setCategory}
                  />
                )}
              </div>
            </div>

            {/* Optional File Attachment Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                Attachment (Optional Receipt / Proof)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-[var(--color-warm-stone)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-harvest-flame)]/10 file:text-[var(--color-harvest-flame)] hover:file:bg-[var(--color-harvest-flame)]/20 cursor-pointer"
              />
            </div>

            {/* Split / Credit Info Card */}
            {isExtraFund ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-[var(--color-success)] flex items-center justify-between">
                <span>
                  Destination: <b>Flextudy company bank account</b>
                </span>
                <span className="font-extrabold text-emerald-800 dark:text-[var(--color-success)]">₹0 / partner split</span>
              </div>
            ) : isCompanyAccount && bankFundingMode === "POOLED_BANK" ? (
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-400">
                Pooled bank cash decreases by <b>{amount && Number(amount) > 0 ? formatAmount(Number(amount)) : "the entered amount"}</b>. This will not create partner shares or dues.
              </div>
            ) : (
              <div className="bg-[var(--color-cream-canvas)] p-3.5 rounded-xl border border-[var(--color-parchment-shadow)] text-xs text-[var(--color-warm-stone)] flex items-center justify-between">
                <span>
                  Split Rule: <b>Split equally (1/{humanCount} each)</b>
                </span>
                <span className="font-bold text-[var(--color-harvest-flame)]">₹{partnerShare} / partner</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-parchment-shadow)]">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={isExtraFund ? "primary" : "primary"}
                className={isExtraFund ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0" : ""}
                showArrow
                disabled={isSubmitting || isLoadingUsers}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : isExtraFund ? (
                  "Add Extra Fund"
                ) : (
                  "Save Expense"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


