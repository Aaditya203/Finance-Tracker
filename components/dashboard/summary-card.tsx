"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { SpinningCounter } from "@/components/ui/spinning-counter";
import { Receipt, Wallet, ArrowUpRight, ArrowDownLeft, Landmark } from "lucide-react";
import { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary | undefined;
  currentUserId: string | undefined;
  isLoading: boolean;
}

export function SummaryCards({ summary, currentUserId, isLoading }: SummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
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
  const isCompanyAccount = Boolean(currentUserId && !currentUserBalance);
  // Company-funded shares and partner-to-partner balances are separate debts.
  // Add companyDue back before showing the partner-only position so a bank bill
  // cannot cancel an amount another partner owes this user.
  const partnerBalance = currentUserBalance
    ? currentUserBalance.balance + currentUserBalance.companyDue
    : 0;
  const youOwe = !isCompanyAccount && partnerBalance < 0 ? Math.abs(partnerBalance) : 0;
  const youReceive = isCompanyAccount
    ? summary.companyReceivables
    : partnerBalance > 0 ? partnerBalance : 0;
  const hasPositiveBankCash = summary.extraFundsRemaining >= 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#8e8b87] uppercase tracking-wider mb-3">Company Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {/* Partner deposits are distinct from parent receipts. */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">Partner contributions</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
              <SpinningCounter text={`₹${summary.totalInvestment.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Partner deposits to the bank</p>
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

          {/* All bank inflows and outflows affect the pooled cash balance. */}
          <Card variant="paper" className={`p-3.5 sm:p-5 border bg-white shadow-sm relative overflow-hidden group transition-colors ${hasPositiveBankCash ? "border-emerald-200 hover:border-emerald-400" : "border-[#fee3b5] hover:border-[#fa5d00]/50"}`}>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${hasPositiveBankCash ? "text-emerald-600" : "text-[#fa5d00]"}`}>Company cash</span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${hasPositiveBankCash ? "bg-emerald-50 text-emerald-600" : "bg-[#fff8f1] text-[#fa5d00]"}`}>
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className={`text-xl sm:text-3xl font-bold tracking-tight ${hasPositiveBankCash ? "text-emerald-600" : "text-[#fa5d00]"}`}>
              <SpinningCounter text={`₹${summary.extraFundsRemaining.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">After contributions, receipts, costs &amp; payouts</p>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-[#8e8b87] uppercase tracking-wider mb-3 mt-6">Personal Overview</h2>
        <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${isCompanyAccount ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-5"}`}>
          {/* Card 4: Your Contribution */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">{isCompanyAccount ? "Company paid" : "Your Contribution"}</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fff8f1] border border-[#e3d6c5] flex items-center justify-center text-[#fa5d00]">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
              <SpinningCounter text={`₹${(isCompanyAccount ? summary.bankPaidExpenses : (currentUserBalance?.totalPaid || 0) + (currentUserBalance?.moneySpent || 0)).toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Amount paid by you</p>
          </Card>

          {/* Card 5: You Owe */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#fee3b5] bg-white shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#fa5d00]">{isCompanyAccount ? "Company owes" : "You Owe Partners"}</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fee3b5]/60 text-[#fa5d00] flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#fa5d00] tracking-tight">
              <SpinningCounter text={`₹${youOwe.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">{isCompanyAccount ? "The company bank does not owe partners" : "Your net amount due to other partners"}</p>
          </Card>

          {/* Card 6: You Receive */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-200 bg-white shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600">{isCompanyAccount ? "Owed by partners" : "You Receive from Partners"}</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-emerald-600 tracking-tight">
              <SpinningCounter text={`₹${youReceive.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">{isCompanyAccount ? "Partner shares due to company" : "Net amount partners owe you"}</p>
          </Card>

          {!isCompanyAccount && currentUserBalance && (
            <Card variant="paper" className="p-3.5 sm:p-5 border border-[#fee3b5] bg-white shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#fa5d00]">You Owe Company</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fee3b5]/60 text-[#fa5d00] flex items-center justify-center">
                  <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-[#fa5d00] tracking-tight">
                <SpinningCounter text={`₹${currentUserBalance.companyDue.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Your share of company-paid expenses</p>
            </Card>
          )}

          {!isCompanyAccount && currentUserBalance && (
            <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-200 bg-white shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700">Your remaining contribution</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-emerald-700 tracking-tight">
                <SpinningCounter text={`₹${currentUserBalance.extraFunds.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Unallocated from your deposits after your share of company expenses</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
