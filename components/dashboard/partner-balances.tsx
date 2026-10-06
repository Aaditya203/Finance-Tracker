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
    
    // Filter out Flextudy / Company account
    const humanBalances = balances.filter(b => b.name.toLowerCase() !== "flextudy" && b.name.toLowerCase() !== "flextudy bank");

    if (!currentUserId) return humanBalances;
    return [...humanBalances].sort((a, b) => {
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
          <span className="text-xs sm:text-sm font-semibold text-[#8e8b87]">4 Workspace Partners</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm animate-pulse space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#e3d6c5]/40 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-4 w-20 sm:w-28 bg-[#e3d6c5]/60 rounded" />
                  <div className="h-2.5 w-12 bg-[#e3d6c5]/30 rounded" />
                </div>
              </div>
              <div className="h-5 w-24 bg-[#e3d6c5]/50 rounded" />
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
            Breakdown of partner contributions & net positions
          </p>
        </div>
        <span className="text-xs sm:text-sm font-bold text-[#fa5d00] bg-[#fff8f1] border border-[#e3d6c5] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-2xs">
          {sortedBalances.length} Partners
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {sortedBalances.map((item) => {
          const isCurrentUser = item.userId === currentUserId;
          const isFlextudy = item.name.toLowerCase() === "flextudy";
          const humanPartnerCount = sortedBalances.filter((b) => b.name.toLowerCase() !== "flextudy").length || 3;
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
              className={`p-3.5 sm:p-5 border rounded-[20px] sm:rounded-[24px] transition-all duration-200 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                isCurrentUser
                  ? "border-[#fa5d00]/60 bg-gradient-to-br from-white via-[#fff8f1]/80 to-[#fff3e4]/60 ring-2 ring-[#fa5d00]/30 shadow-md"
                  : isFlextudy
                  ? "border-[#fa5d00]/30 bg-gradient-to-br from-[#fff8f1]/60 to-white"
                  : "border-[#e3d6c5] hover:border-[#fa5d00]/40 bg-white"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-extrabold text-xs sm:text-base shrink-0 border shadow-xs ${
                        isCurrentUser
                          ? "bg-[#fa5d00] text-white border-[#fa5d00]"
                          : isFlextudy
                          ? "bg-[#1d1e1c] text-white border-[#1d1e1c]"
                          : "bg-[#fff8f1] text-[#1d1e1c] border-[#e3d6c5]"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-base font-extrabold text-[#1d1e1c] truncate">
                        {item.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs font-semibold text-[#615f5c] truncate">
                        {isFlextudy ? "Company Account" : "Partner"}
                      </p>
                    </div>
                  </div>

                  {isCurrentUser && (
                    <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider bg-[#fa5d00] text-white px-2 py-0.5 rounded-full shadow-xs">
                      You
                    </span>
                  )}
                  {isFlextudy && !isCurrentUser && (
                    <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider bg-[#1d1e1c] text-white px-2 py-0.5 rounded-full shadow-xs">
                      Bank
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2 pt-2.5 border-t border-[#e3d6c5]/70">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="font-semibold text-[#8e8b87]">Total Paid:</span>
                    <span className="font-bold text-[#1d1e1c]">
                      ₹{item.totalPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="font-semibold text-[#8e8b87]">
                      {isFlextudy ? "Split Share:" : `1/${humanPartnerCount} Share:`}
                    </span>
                    <span className="font-bold text-[#615f5c]">
                      ₹{isFlextudy ? 0 : item.totalShare.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#e3d6c5]/70 flex items-center justify-between flex-wrap gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-[#8e8b87]">Net</span>
                {isPositive && (
                  <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full text-[10px] sm:text-xs font-extrabold border border-emerald-200">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gets back ₹{item.balance.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {isNegative && (
                  <div className="flex items-center gap-1 text-[#fa5d00] bg-[#fff8f1] px-2 py-1 rounded-full text-[10px] sm:text-xs font-extrabold border border-[#fee3b5]">
                    <TrendingDown className="w-3.5 h-3.5 text-[#fa5d00]" />
                    <span>Owes ₹{Math.abs(item.balance).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {isZero && (
                  <div className="flex items-center gap-1 text-[#615f5c] bg-gray-50 px-2 py-1 rounded-full text-[10px] sm:text-xs font-extrabold border border-gray-200">
                    <Minus className="w-3.5 h-3.5 text-[#8e8b87]" />
                    <span>Settled</span>
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
