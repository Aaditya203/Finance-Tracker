"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { SpinningCounter } from "@/components/ui/spinning-counter";
import { Receipt, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary | undefined;
  currentUserId: string | undefined;
  isLoading: boolean;
}

export function SummaryCards({ summary, currentUserId, isLoading }: SummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="paper" className="p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-20 bg-[#e3d6c5]/50 rounded" />
              <div className="w-8 h-8 rounded-xl bg-[#e3d6c5]/40" />
            </div>
            <div className="h-7 w-24 bg-[#e3d6c5]/70 rounded mb-2" />
            <div className="h-3 w-36 bg-[#e3d6c5]/30 rounded" />
          </Card>
        ))}
      </section>
    );
  }

  const currentUserBalance = summary.balance.find((b) => b.userId === currentUserId);
  const userBalanceVal = currentUserBalance?.balance ?? 0;
  const youOwe = userBalanceVal < 0 ? Math.abs(userBalanceVal) : 0;
  const youReceive = userBalanceVal > 0 ? userBalanceVal : 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#8e8b87] uppercase tracking-wider mb-3">Company Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {/* Card 1: Total Investment */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">Total Investment</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
              <SpinningCounter text={`₹${summary.totalInvestment.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Extra funds deposited</p>
          </Card>

          {/* Card 2: Total Spent (Costs) */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">Total Costs</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fff8f1] border border-[#e3d6c5] flex items-center justify-center text-[#fa5d00]">
                <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
              <SpinningCounter text={`₹${summary.totalSpent.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Regular expenses</p>
          </Card>

          {/* Card 3: Bank Balance (Extra Funds Remaining) */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] bg-white shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600">Bank Balance</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-emerald-600 tracking-tight">
              <SpinningCounter text={`₹${summary.extraFundsRemaining.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Extra funds remaining</p>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-[#8e8b87] uppercase tracking-wider mb-3 mt-6">Personal Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {/* Card 4: Your Contribution */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">Your Contribution</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fff8f1] border border-[#e3d6c5] flex items-center justify-center text-[#fa5d00]">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
              <SpinningCounter text={`₹${((currentUserBalance?.totalPaid || 0) + (currentUserBalance?.moneySpent || 0)).toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Amount paid by you</p>
          </Card>

          {/* Card 5: You Owe */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#fee3b5] bg-white shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#fa5d00]">You Owe</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fee3b5]/60 text-[#fa5d00] flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#fa5d00] tracking-tight">
              <SpinningCounter text={`₹${youOwe.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Pending amount to settle</p>
          </Card>

          {/* Card 6: You Receive */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-200 bg-white shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600">You Receive</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-emerald-600 tracking-tight">
              <SpinningCounter text={`₹${youReceive.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Amount others owe you</p>
          </Card>
        </div>
      </div>
    </section>
  );
}