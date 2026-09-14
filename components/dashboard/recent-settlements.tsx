"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DashboardRecentSettlement } from "@/types";
import { DetailedSettlement } from "@/components/dashboard/settlement-details-modal";
import { ArrowLeftRight, ChevronRight, CheckCircle2, Clock3, XCircle } from "lucide-react";

interface RecentSettlementsProps {
  settlements?: DashboardRecentSettlement[];
  onSelectSettlement: (settlement: DetailedSettlement) => void;
  isLoading?: boolean;
}

export function RecentSettlements({
  settlements,
  onSelectSettlement,
  isLoading,
}: RecentSettlementsProps) {
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

  const handleRowClick = (item: DashboardRecentSettlement) => {
    const formattedDate = new Date(item.settledAt || item.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const detailedSettlement: DetailedSettlement = {
      id: item.id,
      fromUser: item.fromUser.name,
      fromUserId: item.fromUser.id,
      toUser: item.toUser.name,
      toUserId: item.toUser.id,
      amount: item.amountPaid,
      formattedAmount: `₹${item.amountPaid.toLocaleString("en-IN")}`,
      date: formattedDate,
      status: item.status,
      attachments: item.attachments?.map((att) => ({
        ...att,
        driveFileId: att.driveFileId || "",
        createdAt: typeof att.createdAt === "string" ? att.createdAt : new Date(att.createdAt).toISOString(),
      })),
    };

    onSelectSettlement(detailedSettlement);
  };

  return (
    <Card variant="paper" className="p-5 border border-[#e3d6c5] shadow-sm rounded-[22px]">
      <div className="flex items-center justify-between border-b border-[#e3d6c5]/60 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-[#1d1e1c]">Latest Settlements</h3>
            <p className="text-xs text-[#615f5c]">Recent settlement records between partners</p>
          </div>
        </div>
        <Link
          href="/settlements"
          className="text-xs font-semibold text-[#fa5d00] hover:underline flex items-center gap-0.5"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!settlements || settlements.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8e8b87] space-y-1">
          <p className="font-semibold">No settlements recorded</p>
          <p>Click &quot;Record Settlement&quot; above when partners transfer funds.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {settlements.map((item) => {
            const formattedDate = new Date(item.settledAt || item.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            const isCompleted = item.status === "COMPLETED";
            const isPending = item.status === "PENDING";

            return (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="group flex items-center justify-between p-3.5 rounded-[16px] bg-white border border-[#e3d6c5]/60 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1d1e1c] truncate">
                      {item.fromUser.name} <span className="text-[#8e8b87] font-normal">→</span> {item.toUser.name}
                    </p>
                    <p className="text-xs text-[#615f5c]">{formattedDate}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3 space-y-0.5">
                  <p className="text-sm sm:text-base font-extrabold text-emerald-600 tracking-tight">
                    ₹{item.amountPaid.toLocaleString("en-IN")}
                  </p>
                  <div>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock3 className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {!isCompleted && !isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
