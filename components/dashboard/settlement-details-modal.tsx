"use client";

import React, { useState } from "react";
import { Attachment } from "@/types";
import { AttachmentSection } from "@/components/ui/attachment-section";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import {
  X,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Clock3,
  Loader2,
} from "lucide-react";
import {
  confirmSettlementApi,
  rejectSettlementApi,
  uploadSettlementAttachmentApi,
} from "@/lib/api/settlements";

export type DetailedSettlement = {
  id: string;
  fromUser?: string;
  fromUserId?: string;
  from?: string;
  toUser?: string;
  toUserId?: string;
  to?: string;
  amount: number;
  formattedAmount?: string;
  date: string;
  status?: string;
  attachments?: Attachment[];
};

interface SettlementDetailsModalProps {
  settlement: DetailedSettlement | null;
  onClose: () => void;
  onUpdateSettlement?: (updated: DetailedSettlement) => void;
}

export function SettlementDetailsModal({
  settlement,
  onClose,
  onUpdateSettlement,
}: SettlementDetailsModalProps) {
  const { user } = useCurrentUser();
  const [prevSettlement, setPrevSettlement] = useState<DetailedSettlement | null>(settlement);
  const [currentSettlement, setCurrentSettlement] = useState<DetailedSettlement | null>(settlement);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (settlement !== prevSettlement) {
    setPrevSettlement(settlement);
    setCurrentSettlement(settlement);
    setError(null);
  }

  if (!currentSettlement) return null;

  const sender = currentSettlement.fromUser || currentSettlement.from || "Partner";
  const receiver = currentSettlement.toUser || currentSettlement.to || "Partner";
  const formattedAmt = currentSettlement.formattedAmount || `₹${currentSettlement.amount.toLocaleString("en-IN")}`;
  const status = (currentSettlement.status || "COMPLETED").toUpperCase();

  const isPending = status === "PENDING";
  const isCancelled = status === "CANCELLED" || status === "REJECTED";
  const isCompleted = status === "COMPLETED";

  const isRecipient = user?.id
    ? currentSettlement.toUserId === user.id || receiver.toLowerCase() === user.name?.toLowerCase()
    : false;

  const isPayer = user?.id
    ? (currentSettlement.fromUserId
        ? user.id === currentSettlement.fromUserId
        : sender.toLowerCase() === user.name?.toLowerCase())
    : true;

  const handleUpload = async (file: File) => {
    const newAtt = await uploadSettlementAttachmentApi(currentSettlement.id, file);
    const updated = {
      ...currentSettlement,
      attachments: [newAtt, ...(currentSettlement.attachments || [])],
    };
    setCurrentSettlement(updated);
    if (onUpdateSettlement) {
      onUpdateSettlement(updated);
    }
  };

  const handleAction = async (actionType: "confirm" | "reject") => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (actionType === "confirm") {
        await confirmSettlementApi(currentSettlement.id);
      } else {
        await rejectSettlementApi(currentSettlement.id);
      }

      const newStatus = actionType === "confirm" ? "COMPLETED" : "CANCELLED";
      const updated: DetailedSettlement = {
        ...currentSettlement,
        status: newStatus,
        date: actionType === "confirm"
          ? new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : currentSettlement.date,
      };

      setCurrentSettlement(updated);
      if (onUpdateSettlement) {
        onUpdateSettlement(updated);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#1d1e1c]/50 backdrop-blur-md p-0 sm:p-4 transition-all duration-300 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Settlement Details"
    >
      <div className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] border border-[#e3d6c5] bg-white p-5 sm:p-7 shadow-2xl space-y-6 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e3d6c5]/70 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`size-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : isPending
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}
            >
              <ArrowLeftRight className="size-5" />
            </div>
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isCompleted
                    ? "bg-emerald-100/70 text-emerald-800"
                    : isPending
                    ? "bg-amber-100/80 text-amber-800"
                    : "bg-red-100/70 text-red-800"
                }`}
              >
                Settlement Record
              </span>
              <h2 className="text-xl font-bold text-[#1d1e1c] leading-tight text-balance">
                Settlement Details
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

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Sender & Receiver Card */}
        <div
          className={`rounded-[20px] border p-5 shadow-sm space-y-4 ${
            isCompleted
              ? "border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-emerald-100/30"
              : isPending
              ? "border-amber-300 bg-gradient-to-br from-amber-50/70 to-amber-100/30"
              : "border-red-200 bg-gradient-to-br from-red-50/60 to-red-100/20"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b87]">
                Payer
              </span>
              <p className="font-bold text-[#1d1e1c] text-sm sm:text-base">
                {sender}
              </p>
            </div>

            <div
              className={`flex items-center justify-center size-8 rounded-full text-white shadow-sm font-bold text-xs shrink-0 ${
                isCompleted
                  ? "bg-emerald-600"
                  : isPending
                  ? "bg-amber-600"
                  : "bg-red-600"
              }`}
            >
              →
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b87]">
                Recipient
              </span>
              <p className="font-bold text-[#1d1e1c] text-sm sm:text-base">
                {receiver}
              </p>
            </div>
          </div>

          <div
            className={`pt-3 border-t flex items-center justify-between ${
              isCompleted
                ? "border-emerald-200/60"
                : isPending
                ? "border-amber-200/80"
                : "border-red-200/60"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[#615f5c]">
              Amount
            </span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${
                isCompleted
                  ? "text-emerald-600"
                  : isPending
                  ? "text-amber-700"
                  : "text-red-600"
              }`}
            >
              {formattedAmt}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-[#fff8f1]/50 p-4 rounded-[20px] border border-[#e3d6c5]/60 text-xs sm:text-sm">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
              Status
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="size-3 text-emerald-600" /> Completed
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                <Clock3 className="size-3 text-amber-600" /> Pending
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                <XCircle className="size-3 text-red-600" /> Rejected
              </span>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87] flex items-center gap-1">
              <Calendar className="size-3 text-[#fa5d00]" /> Date
            </span>
            <p className="font-semibold text-[#1d1e1c] flex items-center gap-1">
              <Clock className="size-3 text-[#8e8b87]" /> {currentSettlement.date}
            </p>
          </div>
        </div>

        {/* Action Buttons inside modal if pending and user is recipient */}
        {isPending && isRecipient && (
          <div className="rounded-[20px] border border-amber-300 bg-amber-50/80 p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-900">
              You are the recipient of this settlement. Please confirm or reject this record:
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAction("reject")}
                disabled={isSubmitting}
                className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="size-3.5" /> Reject
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAction("confirm")}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" /> Confirm Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Attachment Section */}
        <AttachmentSection
          attachments={currentSettlement.attachments}
          onUpload={handleUpload}
          disabled={!isPayer}
          title="Payment Receipts & Proofs"
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
