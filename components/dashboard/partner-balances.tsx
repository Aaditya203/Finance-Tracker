"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { DashboardBalanceItem } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PartnerBalancesProps {
  balances?: DashboardBalanceItem[];
  currentUserId?: string;
  isLoading?: boolean;
}

export function PartnerBalances({ balances, currentUserId, isLoading }: PartnerBalancesProps) {
  const sortedBalances = React.useMemo(() => {
    if (!balances) return [];
    if (!currentUserId) return balances;
    return [...balances].sort((a, b) => {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
      return 0;
    });
  }, [balances, currentUserId]);

  if (isLoading || !balances || balances.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1d1e1c]">Partner Balances</h2>
          <span className="text-xs sm:text-sm font-semibold text-[#8e8b87]">3 Workspace Partners</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} variant="paper" className="p-6 border border-[#e3d6c5] shadow-sm animate-pulse space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#e3d6c5]/40" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 bg-[#e3d6c5]/60 rounded" />
                  <div className="h-3 w-16 bg-[#e3d6c5]/30 rounded" />
                </div>
              </div>
              <div className="h-7 w-36 bg-[#e3d6c5]/50 rounded" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1d1e1c]">Partner Balances</h2>
          <p className="text-xs sm:text-sm text-[#615f5c] mt-0.5">
            Breakdown of individual partner contributions and net positions
          </p>
        </div>
        <span className="text-xs sm:text-sm font-bold text-[#fa5d00] bg-[#fff8f1] border border-[#e3d6c5] px-3.5 py-1.5 rounded-full shadow-2xs">
          3 Partners
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sortedBalances.map((item) => {
          const isCurrentUser = item.userId === currentUserId;
          const isPositive = item.balance > 0;
          const isNegative = item.balance < 0;
          const isZero = item.balance === 0;

          const initials = item.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2);

          return (
            <Card
              key={item.userId}
              variant="paper"
              className={`p-5 sm:p-6 border rounded-[24px] transition-all duration-200 shadow-sm relative overflow-hidden ${
                isCurrentUser
                  ? "border-[#fa5d00]/60 bg-gradient-to-br from-white via-[#fff8f1]/80 to-[#fff3e4]/60 ring-2 ring-[#fa5d00]/30 shadow-md"
                  : "border-[#e3d6c5] hover:border-[#fa5d00]/40 bg-white"
              }`}
            >
              {isCurrentUser && (
                <span className="absolute top-3.5 right-3.5 text-xs font-extrabold uppercase tracking-wider bg-[#fa5d00] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  You
                </span>
              )}

              <div className="flex items-center gap-3.5 mb-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base shrink-0 border shadow-xs ${
                    isCurrentUser
                      ? "bg-[#fa5d00] text-white border-[#fa5d00]"
                      : "bg-[#fff8f1] text-[#1d1e1c] border-[#e3d6c5]"
                  }`}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1d1e1c] truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#615f5c]">Workspace Partner</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[#e3d6c5]/70">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-[#8e8b87]">Total Paid:</span>
                  <span className="font-bold text-[#1d1e1c] text-sm sm:text-base">
                    ₹{item.totalPaid.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-[#8e8b87]">1/3 Share:</span>
                  <span className="font-bold text-[#615f5c] text-sm sm:text-base">
                    ₹{item.totalShare.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#e3d6c5]/70 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#8e8b87]">Net Position</span>
                {isPositive && (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold border border-emerald-200 shadow-2xs">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Gets back ₹{item.balance.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {isNegative && (
                  <div className="flex items-center gap-1.5 text-[#fa5d00] bg-[#fff8f1] px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold border border-[#fee3b5] shadow-2xs">
                    <TrendingDown className="w-4 h-4 text-[#fa5d00]" />
                    <span>Owes ₹{Math.abs(item.balance).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {isZero && (
                  <div className="flex items-center gap-1.5 text-[#615f5c] bg-gray-50 px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold border border-gray-200 shadow-2xs">
                    <Minus className="w-4 h-4 text-[#8e8b87]" />
                    <span>Settled up</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
