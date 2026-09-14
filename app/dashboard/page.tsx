"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AddExpenseModal } from "@/components/dashboard/add-expense-modal";
import { RecordSettlementModal } from "@/components/dashboard/record-settlement-modal";
import { PendingSettlementsBanner } from "@/components/dashboard/pending-settlements-banner";
import { ExpenseDetailsModal, DetailedExpense } from "@/components/dashboard/expense-details-modal";
import { SettlementDetailsModal, DetailedSettlement } from "@/components/dashboard/settlement-details-modal";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { SummaryCards } from "@/components/dashboard/summary-card";
import { PartnerBalances } from "@/components/dashboard/partner-balances";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { RecentSettlements } from "@/components/dashboard/recent-settlements";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeftRight, Calendar } from "lucide-react";
import { generateMonthOptions } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading, refetch, currentUser, isMounted } = useDashboard();
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<DetailedExpense | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<DetailedSettlement | null>(null);

  const firstName = isMounted && currentUser?.name ? currentUser.name.split(" ")[0] : "there";
  const userInitials = isMounted && currentUser?.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
    : "--";

  return (
    <div className="min-h-screen bg-[#fff8f1] flex flex-col md:flex-row selection:bg-[#fee3b5] selection:text-[#1d1e1c]">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e3d6c5]/70">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-[#1d1e1c]">
              Welcome, {firstName} 👋
            </h1>
            <p className="text-sm sm:text-base text-[#615f5c] mt-1">
              Here&apos;s an overview of your shared finances.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CustomSelect
              options={monthOptions}
              value={selectedMonth}
              onChange={setSelectedMonth}
              icon={<Calendar className="w-4 h-4 text-[#fa5d00]" />}
              className="min-w-[165px]"
            />
            <div className="hidden sm:flex items-center gap-2.5 bg-white border border-[#e3d6c5] rounded-full p-1.5 pr-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#fa5d00] text-white font-bold flex items-center justify-center text-xs">
                {userInitials}
              </div>
              <span className="text-sm font-semibold text-[#1d1e1c]">{firstName}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-[#e3d6c5] rounded-[20px] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fa5d00] animate-pulse shrink-0" />
            <span className="text-sm font-semibold text-[#1d1e1c]">Quick Actions</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <Button variant="primary" size="md" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus className="w-4 h-4 shrink-0" /> Add Expense
            </Button>
            <Button variant="secondary" size="md" onClick={() => setIsSettlementModalOpen(true)}>
              <ArrowLeftRight className="w-4 h-4 text-[#fa5d00] shrink-0" /> Record Settlement
            </Button>
          </div>
        </div>

        {/* Pending Settlements Banner */}
        {currentUser?.id && data?.pendingSettlements && (
          <PendingSettlementsBanner
            pendingSettlements={data.pendingSettlements as any}
            currentUserId={currentUser.id}
            onSettlementAction={refetch}
          />
        )}

        {/* Summary Cards */}
        <SummaryCards
          summary={data?.summary}
          currentUserId={currentUser?.id}
          isLoading={isLoading}
        />

        {/* Partner Balances Breakdown */}
        <PartnerBalances
          balances={data?.summary?.balance}
          currentUserId={currentUser?.id}
          isLoading={isLoading}
        />

        {/* Recent Activity Grid: Latest Transactions & Latest Settlements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions
            expenses={data?.expenses}
            onSelectExpense={setSelectedExpense}
            isLoading={isLoading}
          />
          <RecentSettlements
            settlements={data?.settlements}
            onSelectSettlement={setSelectedSettlement}
            isLoading={isLoading}
          />
        </div>

        {/* Spending Overview Chart */}
        <section>
          {isLoading ? (
            <div className="h-64 border border-[#e3d6c5] rounded-2xl bg-white animate-pulse flex items-center justify-center text-xs text-[#8e8b87]">
              Loading Spending Overview...
            </div>
          ) : (
            <SpendingChart monthlyData={data?.summary.monthlyExpenses || []} />
          )}
        </section>
      </main>

      {/* Dialog Modals */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={refetch}
      />
      <RecordSettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        onSuccess={refetch}
      />
      <ExpenseDetailsModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
      <SettlementDetailsModal
        settlement={selectedSettlement}
        onClose={() => setSelectedSettlement(null)}
        onUpdateSettlement={refetch}
      />
    </div>
  );
}
