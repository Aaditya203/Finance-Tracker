"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { SpinningCounter } from "@/components/ui/spinning-counter";
import { Receipt, Wallet, ArrowUpRight, ArrowDownLeft, Landmark, GraduationCap, TrendingUp, Users, ShieldCheck } from "lucide-react";
import { DashboardSummary } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary | undefined;
  currentUserId: string | undefined;
  isLoading: boolean;
  selectedMonth?: string;
}

export function SummaryCards({ summary, currentUserId, isLoading, selectedMonth }: SummaryCardsProps) {
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

  const isOverall = !selectedMonth || selectedMonth === "Overall (All Time)";
  const monthEconomics = !isOverall && selectedMonth && summary.teacherLiabilities?.byMonth?.[selectedMonth]
    ? summary.teacherLiabilities.byMonth[selectedMonth]
    : summary.teacherLiabilities;

  const currentMonthCosts = !isOverall && selectedMonth && summary.totalSpentByMonth?.[selectedMonth] !== undefined
    ? summary.totalSpentByMonth[selectedMonth]
    : summary.totalSpent;

  const currentMonthContributions = !isOverall && selectedMonth && summary.totalInvestmentByMonth?.[selectedMonth] !== undefined
    ? summary.totalInvestmentByMonth[selectedMonth]
    : summary.totalInvestment;

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#8e8b87] uppercase tracking-wider">
            Company Overview
          </h2>
          <span className="text-[11px] font-semibold text-[#8e8b87]">
            {isOverall ? "All Time" : selectedMonth}
          </span>
        </div>
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
              <SpinningCounter text={`₹${currentMonthContributions.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">
              {isOverall ? "Partner deposits to the bank" : `Deposited in ${selectedMonth}`}
            </p>
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
              <SpinningCounter text={`₹${currentMonthCosts.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">
              {isOverall ? "Regular expenses" : `Spent in ${selectedMonth}`}
            </p>
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
            <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">Pooled bank cash position</p>
          </Card>
        </div>
      </div>

      {/* Student Purchases & Teacher Funds Reserve */}
      {monthEconomics && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3 mt-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#8e8b87] uppercase tracking-wider">
                  Student Courses &amp; Teacher Payouts
                </h2>
                <span className="rounded-full bg-[#fa5d00]/10 px-2 py-0.5 text-[10px] font-bold text-[#fa5d00]">
                  {isOverall ? "Overall (All Time)" : selectedMonth}
                </span>
              </div>
              <p className="text-xs text-[#615f5c]">
                Track protected teacher funds so student fee receipts are not spent on company expenses.
              </p>
            </div>
            <span className={`self-start sm:self-auto text-[11px] font-semibold px-3 py-1 rounded-full border ${monthEconomics.pendingTeacherPayable > 0 ? "text-amber-900 bg-amber-50 border-amber-300 font-bold" : "text-emerald-900 bg-emerald-50 border-emerald-200"}`}>
              Teacher Reserve: ₹{monthEconomics.pendingTeacherPayable.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Card 1: Money to be Paid to Teachers */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-amber-300 bg-amber-50/40 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-800">To Pay Teachers</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-amber-950 tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.pendingTeacherPayable.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-amber-800 mt-1 sm:mt-1.5 font-medium">
                Hold in bank · Do not spend on expenses
              </p>
            </Card>

            {/* Card 2: Total Revenue from Parents / Lifetime Revenue */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                  {isOverall ? "Lifetime Revenue" : "Total Revenue from Parents"}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fff8f1] border border-[#e3d6c5] flex items-center justify-center text-[#fa5d00]">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.totalStudentFees.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">
                {isOverall ? "Total revenue from parents" : `Collected in ${selectedMonth}`}
              </p>
            </Card>

            {/* Card 3: Lifetime Profit (Till Date) / Monthly Course Profit */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-300 bg-emerald-50/40 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  {isOverall ? "Lifetime Profit (Till Date)" : "Course Profit"}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-emerald-950 tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.overallCourseProfit.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-800 mt-1 sm:mt-1.5 font-medium">
                {isOverall ? "Net profit from student purchases" : `Net profit in ${selectedMonth}`}
              </p>
            </Card>

            {/* Card 4: Safe Spendable Company Cash (Profit Section) */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-sky-300 bg-sky-50/40 shadow-sm relative overflow-hidden group hover:border-sky-500 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-800">Safe Spendable Cash</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-sky-950 tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.safeSpendableCash.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-sky-800 mt-1 sm:mt-1.5 font-medium">
                Bank cash after teacher reserve
              </p>
            </Card>
          </div>
        </div>
      )}

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
