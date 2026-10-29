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
          <Card key={i} variant="paper" className="p-5 border border-[var(--color-parchment-shadow)] shadow-sm relative overflow-hidden animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-20 bg-[var(--color-parchment-shadow)]/50 rounded" />
              <div className="w-8 h-8 rounded-xl bg-[var(--color-parchment-shadow)]/40" />
            </div>
            <div className="h-7 w-24 bg-[var(--color-parchment-shadow)]/70 rounded mb-2" />
            <div className="h-3 w-36 bg-[var(--color-parchment-shadow)]/30 rounded" />
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
          <h2 className="text-sm font-bold text-[var(--color-driftwood)] uppercase tracking-wider">
            Company Overview
          </h2>
          <span className="text-[11px] font-semibold text-[var(--color-driftwood)]">
            {isOverall ? "All Time" : selectedMonth}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {/* Partner deposits are distinct from parent receipts. */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[var(--color-parchment-shadow)] shadow-sm relative overflow-hidden group hover:border-[var(--color-harvest-flame)]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">Partner contributions</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[var(--color-ink-black)] tracking-tight">
              <SpinningCounter text={`₹${currentMonthContributions.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">
              {isOverall ? "Partner deposits to the bank" : `Deposited in ${selectedMonth}`}
            </p>
          </Card>

          {/* Card 2: Total Spent (Costs) */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[var(--color-parchment-shadow)] shadow-sm relative overflow-hidden group hover:border-[var(--color-harvest-flame)]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">Total Costs</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--color-cream-canvas)] border border-[var(--color-parchment-shadow)] flex items-center justify-center text-[var(--color-harvest-flame)]">
                <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[var(--color-ink-black)] tracking-tight">
              <SpinningCounter text={`₹${currentMonthCosts.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">
              {isOverall ? "Regular expenses" : `Spent in ${selectedMonth}`}
            </p>
          </Card>

          {/* All bank inflows and outflows affect the pooled cash balance. */}
          <Card variant="paper" className={`p-3.5 sm:p-5 border bg-[var(--color-surface)] shadow-sm relative overflow-hidden group transition-colors ${hasPositiveBankCash ? "border-emerald-200 dark:border-emerald-900 hover:border-emerald-400" : "border-[#fee3b5] dark:border-[var(--color-marigold-glow)] hover:border-[var(--color-harvest-flame)]/50"}`}>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${hasPositiveBankCash ? "text-emerald-600 dark:text-emerald-400" : "text-[#ea580c] dark:text-[var(--color-harvest-flame)]"}`}>Company cash</span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${hasPositiveBankCash ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900" : "bg-[var(--color-cream-canvas)] text-[var(--color-harvest-flame)]"}`}>
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className={`text-xl sm:text-3xl font-bold tracking-tight ${hasPositiveBankCash ? "text-emerald-600 dark:text-emerald-400" : "text-[#ea580c] dark:text-[var(--color-harvest-flame)]"}`}>
              <SpinningCounter text={`₹${summary.extraFundsRemaining.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">Pooled bank cash position</p>
          </Card>
        </div>
      </div>

      {/* Student Purchases & Teacher Funds Reserve */}
      {monthEconomics && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3 mt-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--color-driftwood)] uppercase tracking-wider">
                  Student Courses &amp; Teacher Payouts
                </h2>
                <span className="rounded-full bg-[var(--color-harvest-flame)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-harvest-flame)]">
                  {isOverall ? "Overall (All Time)" : selectedMonth}
                </span>
              </div>
              <p className="text-xs text-[var(--color-warm-stone)]">
                Track protected teacher funds so student fee receipts are not spent on company expenses.
              </p>
            </div>
            <span className={`self-start sm:self-auto text-[11px] font-semibold px-3 py-1 rounded-full border ${monthEconomics.pendingTeacherPayable > 0 ? "text-amber-800 bg-amber-50 border-amber-300 dark:text-orange-400 dark:bg-amber-950/40 dark:border-orange-900 font-bold" : "text-emerald-900 bg-emerald-50 border-emerald-200 dark:text-[var(--color-success)] dark:bg-emerald-950/40 dark:border-emerald-900"}`}>
              Teacher Reserve: ₹{monthEconomics.pendingTeacherPayable.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Card 1: Money to be Paid to Teachers */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-amber-300 dark:border-orange-900 bg-amber-50/40 dark:bg-orange-950/40 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-orange-400">To Pay Teachers</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-orange-950/40 border border-amber-300 dark:border-orange-900 flex items-center justify-center text-amber-800 dark:text-orange-400">
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-amber-950 dark:text-orange-400 tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.pendingTeacherPayable.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-amber-800 dark:text-orange-400 mt-1 sm:mt-1.5 font-medium">
                Hold in bank · Do not spend on expenses
              </p>
            </Card>

            {/* Card 2: Total Revenue from Parents / Lifetime Revenue */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-[var(--color-parchment-shadow)] shadow-sm relative overflow-hidden group hover:border-[var(--color-harvest-flame)]/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">
                  {isOverall ? "Lifetime Revenue" : "Total Revenue from Parents"}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--color-cream-canvas)] border border-[var(--color-parchment-shadow)] flex items-center justify-center text-[var(--color-harvest-flame)]">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-[var(--color-ink-black)] tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.totalStudentFees.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">
                {isOverall ? "Total revenue from parents" : `Collected in ${selectedMonth}`}
              </p>
            </Card>

            {/* Card 3: Lifetime Profit (Till Date) / Monthly Course Profit */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-300 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-[var(--color-success)]">
                  {isOverall ? "Lifetime Profit (Till Date)" : "Course Profit"}
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900 flex items-center justify-center text-emerald-800 dark:text-[var(--color-success)]">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-emerald-950 dark:text-emerald-400 tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.overallCourseProfit.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-800 dark:text-[var(--color-success)] mt-1 sm:mt-1.5 font-medium">
                {isOverall ? "Net profit from student purchases" : `Net profit in ${selectedMonth}`}
              </p>
            </Card>

            {/* Card 4: Safe Spendable Company Cash (Profit Section) */}
            <Card variant="paper" className="p-3.5 sm:p-5 border border-sky-300 dark:border-blue-900 bg-sky-50/40 dark:bg-blue-950/40 shadow-sm relative overflow-hidden group hover:border-sky-500 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-blue-400">Safe Spendable Cash</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-100 dark:bg-blue-950/40 border border-sky-300 dark:border-blue-900 flex items-center justify-center text-sky-800 dark:text-blue-400">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-sky-950 dark:text-blue-400 tracking-tight">
                <SpinningCounter text={`₹${monthEconomics.safeSpendableCash.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-sky-800 dark:text-blue-400 mt-1 sm:mt-1.5 font-medium">
                Bank cash after teacher reserve
              </p>
            </Card>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-[var(--color-driftwood)] uppercase tracking-wider mb-3 mt-6">Personal Overview</h2>
        <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${isCompanyAccount ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-5"}`}>
          {/* Card 4: Your Contribution */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[var(--color-parchment-shadow)] shadow-sm relative overflow-hidden group hover:border-[var(--color-harvest-flame)]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">{isCompanyAccount ? "Company paid" : "Your Contribution"}</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--color-cream-canvas)] border border-[var(--color-parchment-shadow)] flex items-center justify-center text-[var(--color-harvest-flame)]">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[var(--color-ink-black)] tracking-tight">
              <SpinningCounter text={`₹${(isCompanyAccount ? summary.bankPaidExpenses : (currentUserBalance?.totalPaid || 0) + (currentUserBalance?.moneySpent || 0)).toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">Amount paid by you</p>
          </Card>

          {/* Card 5: You Owe */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-[#fee3b5] dark:border-[var(--color-marigold-glow)] bg-[var(--color-surface)] shadow-sm relative overflow-hidden group hover:border-[var(--color-harvest-flame)]/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#ea580c] dark:text-[var(--color-harvest-flame)]">{isCompanyAccount ? "Company owes" : "You Owe Partners"}</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fee3b5]/60 dark:bg-[var(--color-marigold-glow)]/60 text-[#ea580c] dark:text-[var(--color-harvest-flame)] flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-[#ea580c] dark:text-[var(--color-harvest-flame)] tracking-tight">
              <SpinningCounter text={`₹${youOwe.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">{isCompanyAccount ? "The company bank does not owe partners" : "Your net amount due to other partners"}</p>
          </Card>

          {/* Card 6: You Receive */}
          <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-200 dark:border-emerald-900 bg-[var(--color-surface)] shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{isCompanyAccount ? "Owed by partners" : "You Receive from Partners"}</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              <SpinningCounter text={`₹${youReceive.toLocaleString("en-IN")}`} />
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">{isCompanyAccount ? "Partner shares due to company" : "Net amount partners owe you"}</p>
          </Card>

          {!isCompanyAccount && currentUserBalance && (
            <Card variant="paper" className="p-3.5 sm:p-5 border border-[#fee3b5] dark:border-[var(--color-marigold-glow)] bg-[var(--color-surface)] shadow-sm relative overflow-hidden group hover:border-[var(--color-harvest-flame)]/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#ea580c] dark:text-[var(--color-harvest-flame)]">You Owe Company</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fee3b5]/60 dark:bg-[var(--color-marigold-glow)]/60 text-[#ea580c] dark:text-[var(--color-harvest-flame)] flex items-center justify-center">
                  <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-[#ea580c] dark:text-[var(--color-harvest-flame)] tracking-tight">
                <SpinningCounter text={`₹${currentUserBalance.companyDue.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">Your share of company-paid expenses</p>
            </Card>
          )}

          {!isCompanyAccount && currentUserBalance && (
            <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-200 dark:border-emerald-900 bg-[var(--color-surface)] shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-[var(--color-success)]">Your remaining contribution</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-emerald-700 dark:text-[var(--color-success)] tracking-tight">
                <SpinningCounter text={`₹${currentUserBalance.extraFunds.toLocaleString("en-IN")}`} />
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--color-warm-stone)] mt-1 sm:mt-1.5 font-medium">Unallocated from your deposits after your share of company expenses</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
