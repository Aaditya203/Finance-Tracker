"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowLeftRight, CheckCircle2, Loader2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { getUsersApi } from "@/lib/api/dashboard";
import { createSettlementApi, uploadSettlementAttachmentApi } from "@/lib/api/settlements";
import { WorkspaceUser, SettlementRecord, Attachment } from "@/types";
import { useCurrentUser } from "@/components/providers/current-user-provider";

interface RecordSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (settlement: SettlementRecord) => void;
}

export function RecordSettlementModal({
  isOpen,
  onClose,
  onSuccess,
}: RecordSettlementModalProps) {
  const { user: currentUser } = useCurrentUser();
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function loadPartners() {
        setIsLoadingUsers(true);
        try {
          const partners = await getUsersApi();
          setUsers(partners);
          const recipientOptions = partners.filter((p) => p.id !== currentUser?.id);
          if (recipientOptions.length > 0) {
            setToUserId((current) => current || recipientOptions[0].id);
          }
        } catch {
          setError("Failed to load workspace partners");
        } finally {
          setIsLoadingUsers(false);
        }
      }
      loadPartners();
    }
  }, [isOpen, currentUser?.id]);

  useEffect(() => {
    if (!isOpen) {
      setToUserId("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setFile(null);
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedAmount = Math.round(parseFloat(amount));
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const recipientPartners = users.filter((u) => u.id !== currentUser?.id);
  const recipientOptions = recipientPartners.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const selectedRecipient = users.find((u) => u.id === toUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!toUserId) {
      setError("Please select a recipient partner.");
      return;
    }
    if (!isValidAmount) {
      setError("Please enter a valid positive settlement amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdSettlement = await createSettlementApi({
        toUserId,
        amountPaid: parsedAmount,
      });

      let uploadedAttachment: Attachment | undefined;

      if (file && createdSettlement.id) {
        try {
          uploadedAttachment = await uploadSettlementAttachmentApi(createdSettlement.id, file);
        } catch (attErr) {
          console.error("Failed to upload attachment", attErr);
        }
      }

      const finalRecord: SettlementRecord = {
        ...createdSettlement,
        attachments: uploadedAttachment
          ? [...(createdSettlement.attachments || []), uploadedAttachment]
          : createdSettlement.attachments || [],
      };

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        if (onSuccess) onSuccess(finalRecord);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred while recording settlement.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1d1e1c]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#e3d6c5] rounded-[24px] max-w-lg w-full p-5 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e3d6c5]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#fa5d00]/10 text-[#fa5d00] flex items-center justify-center shrink-0">
              <ArrowLeftRight className="size-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#1d1e1c] text-balance">Record Partner Settlement</h3>
              <p className="text-xs text-[#615f5c] text-pretty">Record a direct payment between partners</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#8e8b87] hover:text-[#1d1e1c] p-1.5 rounded-full hover:bg-[#fff8f1] transition-colors cursor-pointer shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-[#1d1e1c]">Settlement Recorded!</h4>
            <p className="text-sm text-[#615f5c]">Partner balances updated accordingly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                  Payer (You)
                </label>
                <Input
                  value={currentUser?.name || "Payer"}
                  disabled
                  className="bg-[#fff8f1] border-[#e3d6c5] cursor-not-allowed font-semibold text-[#1d1e1c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                  Recipient (To)
                </label>
                <CustomSelect
                  options={
                    recipientOptions.length > 0
                      ? recipientOptions
                      : [{ value: "", label: isLoadingUsers ? "Loading partners..." : "Select recipient" }]
                  }
                  value={toUserId}
                  onChange={setToUserId}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  placeholder="₹ 1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                  Payment Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Optional File Attachment Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c] mb-1.5">
                Attachment (Optional Proof / Receipt)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-[#615f5c] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#fa5d00]/10 file:text-[#fa5d00] hover:file:bg-[#fa5d00]/20 cursor-pointer"
              />
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-[16px] border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>Transfer summary:</span>
              <span className="font-bold">
                {currentUser?.name?.split(" ")[0] || "Payer"} → {selectedRecipient?.name?.split(" ")[0] || "Recipient"}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e3d6c5]">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting || isLoadingUsers}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Recording...
                  </span>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


