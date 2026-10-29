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
          <div className="size-2 rounded-full bg-orange-500 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-orange-400 flex items-center gap-1.5">
            <Clock3 className="size-4 text-amber-600 dark:text-orange-400" /> Pending Approvals ({pendingSettlements.length})
          </h2>
        </div>
        <span className="text-xs font-semibold text-amber-700 dark:text-orange-400 hidden sm:inline">
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
              className="border-2 border-amber-300 dark:border-orange-900 bg-gradient-to-r from-amber-50 dark:from-orange-950/40 to-white dark:to-[var(--color-surface)] p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="size-10 sm:size-11 rounded-xl bg-amber-100 dark:bg-orange-950/40 border border-amber-300 dark:border-orange-900 text-amber-800 dark:text-orange-400 font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {payerName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[var(--color-ink-black)] text-sm sm:text-base leading-tight">
                        {payerName}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-orange-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-orange-400 border border-amber-300/60 dark:border-orange-900">
                        <Clock3 className="size-3 text-amber-600 dark:text-orange-400" /> Pending Confirmation
                      </span>
                    </div>

                    <p className="text-xs text-[var(--color-warm-stone)]">
                      wants to record a payment of{" "}
                      <span className="font-bold text-[var(--color-ink-black)] tabular-nums">
                        {formattedAmount}
                      </span>{" "}
                      to you.
                    </p>

                    {item.attachments && item.attachments.length > 0 && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/60 dark:bg-orange-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-orange-400 border border-amber-300 dark:border-orange-900">
                          <Paperclip className="size-3" /> Proof attached ({item.attachments.length})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/70 dark:border-amber-900/70 justify-end shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setActionItem({ item, type: "reject" })}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 text-xs px-3 py-1.5"
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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-ink-black)]/50 backdrop-blur-sm p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`size-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  actionItem.type === "confirm"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                    : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
                }`}
              >
                {actionItem.type === "confirm" ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <AlertTriangle className="size-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-ink-black)]">
                  {actionItem.type === "confirm"
                    ? "Confirm Settlement Receipt?"
                    : "Reject Settlement?"}
                </h3>
                <p className="text-xs text-[var(--color-warm-stone)]">
                  {actionItem.type === "confirm"
                    ? "This will mark the settlement as completed and update your balance."
                    : "This will reject the payment record."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--color-driftwood)] font-semibold uppercase">Payer:</span>
                <span className="font-bold text-[var(--color-ink-black)]">
                  {actionItem.item.fromUser.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-driftwood)] font-semibold uppercase">Amount:</span>
                <span className="font-extrabold text-[var(--color-harvest-flame)] tabular-nums text-sm">
                  {money(actionItem.item.amountPaid)}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 p-3 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-parchment-shadow)]">
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
