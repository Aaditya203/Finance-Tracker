"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock3,
  CheckCircle2,
  XCircle,
  Paperclip,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Attachment } from "@/types";
import { confirmSettlementApi, rejectSettlementApi } from "@/lib/api/settlements";

export type PendingSettlementItem = {
  id: string;
  fromUser: {
    id: string;
    name: string;
    email?: string;
  };
  toUser: {
    id: string;
    name: string;
    email?: string;
  };
  amountPaid: number;
  status: string;
  createdAt?: string;
  attachments?: Attachment[];
};

interface PendingSettlementsBannerProps {
  pendingSettlements: PendingSettlementItem[];
  currentUserId: string;
  onSettlementAction: () => void;
}

export function PendingSettlementsBanner({
  pendingSettlements,
  onSettlementAction,
}: PendingSettlementsBannerProps) {
  const [actionItem, setActionItem] = useState<{
    item: PendingSettlementItem;
    type: "confirm" | "reject";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pendingSettlements || pendingSettlements.length === 0) {
    return null;
  }

  const handleAction = async () => {
    if (!actionItem) return;
    setIsSubmitting(true);
    setError(null);

    const { item, type } = actionItem;

    try {
      if (type === "confirm") {
        await confirmSettlementApi(item.id);
      } else {
        await rejectSettlementApi(item.id);
      }

      setActionItem(null);
      onSettlementAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Clock3 className="size-4 text-amber-600" /> Pending Approvals ({pendingSettlements.length})
          </h2>
        </div>
        <span className="text-xs font-semibold text-amber-700 hidden sm:inline">
          Action required to update balance
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {pendingSettlements.map((item) => {
          const formattedAmount = money(item.amountPaid);
          const payerName = item.fromUser?.name || "Partner";

          return (
            <Card
              key={item.id}
              className="border-2 border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="size-10 sm:size-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {payerName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#1d1e1c] text-sm sm:text-base leading-tight">
                        {payerName}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300/60">
                        <Clock3 className="size-3 text-amber-600" /> Pending Confirmation
                      </span>
                    </div>

                    <p className="text-xs text-[#615f5c]">
                      wants to record a payment of{" "}
                      <span className="font-bold text-[#1d1e1c] tabular-nums">
                        {formattedAmount}
                      </span>{" "}
                      to you.
                    </p>

                    {item.attachments && item.attachments.length > 0 && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                          <Paperclip className="size-3" /> Proof attached ({item.attachments.length})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/70 justify-end shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setActionItem({ item, type: "reject" })}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 text-xs px-3 py-1.5"
                  >
                    <XCircle className="size-3.5" /> Reject
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setActionItem({ item, type: "confirm" })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="size-3.5" /> Confirm Receipt
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {actionItem && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1d1e1c]/50 backdrop-blur-sm p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[24px] border border-[#e3d6c5] bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`size-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  actionItem.type === "confirm"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-red-50 text-red-600 border-red-200"
                }`}
              >
                {actionItem.type === "confirm" ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <AlertTriangle className="size-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1d1e1c]">
                  {actionItem.type === "confirm"
                    ? "Confirm Settlement Receipt?"
                    : "Reject Settlement?"}
                </h3>
                <p className="text-xs text-[#615f5c]">
                  {actionItem.type === "confirm"
                    ? "This will mark the settlement as completed and update your balance."
                    : "This will reject the payment record."}
                </p>
              </div>
            </div>

            <div className="rounded-[16px] border border-[#e3d6c5] bg-[#fff8f1] p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#8e8b87] font-semibold uppercase">Payer:</span>
                <span className="font-bold text-[#1d1e1c]">
                  {actionItem.item.fromUser.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8e8b87] font-semibold uppercase">Amount:</span>
                <span className="font-extrabold text-[#fa5d00] tabular-nums text-sm">
                  {money(actionItem.item.amountPaid)}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e3d6c5]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setActionItem(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAction}
                disabled={isSubmitting}
                className={
                  actionItem.type === "confirm"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Processing...
                  </span>
                ) : actionItem.type === "confirm" ? (
                  "Yes, Confirm Payment"
                ) : (
                  "Yes, Reject"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
