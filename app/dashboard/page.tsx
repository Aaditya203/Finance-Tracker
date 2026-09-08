"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AddExpenseModal } from "@/components/dashboard/add-expense-modal";
import { RecordSettlementModal } from "@/components/dashboard/record-settlement-modal";
import { PendingSettlementsBanner, PendingSettlementItem } from "@/components/dashboard/pending-settlements-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpinningCounter } from "@/components/ui/spinning-counter";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { cn } from "@/lib/utils";
import {
  Plus,
  ArrowLeftRight,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Wallet,
  Clock,
  ArrowRight,
  Paperclip,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import { Attachment } from "@/types";
import { ExpenseDetailsModal, DetailedExpense } from "@/components/dashboard/expense-details-modal";
import { SettlementDetailsModal, DetailedSettlement } from "@/components/dashboard/settlement-details-modal";

import { CustomSelect } from "@/components/ui/custom-select";

type DashboardExpense = DetailedExpense;
type DashboardSettlement = DetailedSettlement;
type DashboardBalance = { id: string; name: string; email: string; initials: string; status: "receives" | "owes"; balance: string; subtitle: string; isCurrentUser: boolean; };

export default function DashboardPage() {
  const { user, isMounted } = useCurrentUser();
  const [selectedMonth, setSelectedMonth] = useState("September 2026");
  const [expenses, setExpenses] = useState<DashboardExpense[]>([]);
  const [settlements, setSettlements] = useState<DashboardSettlement[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlementItem[]>([]);
  const [partnerBalances, setPartnerBalances] = useState<DashboardBalance[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<{ month: string; amount: number }[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<DashboardExpense | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<DashboardSettlement | null>(null);

  const greeting = useMemo(() => {
    if (!isMounted) return "Welcome";
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }, [isMounted]);
  const partnerBalancesWithUser = useMemo(() => {
    return partnerBalances.map((partner) => ({
      ...partner,
      isCurrentUser: Boolean(isMounted && user?.id && partner.id === user.id),
    }));
  }, [partnerBalances, isMounted, user?.id]);

  const currentBalance = useMemo(() => {
    return partnerBalancesWithUser.find((partner) => partner.isCurrentUser);
  }, [partnerBalancesWithUser]);

  const paidByCurrentUser = expenses.filter((expense) => expense.paidBy === (isMounted ? user?.name : "")).reduce((total, expense) => total + expense.amount, 0);

  const loadDashboardData = useCallback(async (currentUserId?: string) => {
    setIsLoading(true);
    try {
      const url = currentUserId ? `/api/dashboard?userId=${currentUserId}` : "/api/dashboard";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Unable to load dashboard data");
      
      const { summary, expenses: expenseData, settlements: settlementData, pendingSettlements: pendingData } = await response.json();

      setTotalSpent(summary.totalSpent ?? 0);
      setMonthlyExpenses(summary.monthlyExpenses ?? []);

      setPartnerBalances(
        (summary.balance ?? []).map((item: { userId: string; name: string; balance: number }) => {
          const isReceiving = item.balance > 0;
          return {
            id: item.userId,
            name: item.name,
            email: "",
            initials: item.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2),
            status: isReceiving ? "receives" : "owes",
            balance: `₹${Math.abs(item.balance).toLocaleString("en-IN")}`,
            subtitle: isReceiving ? "Should receive from partners" : "Pending amount to pay",
            isCurrentUser: item.userId === (currentUserId || user?.id),
          };
        })
      );

      setExpenses(
        (expenseData || []).map(
          (item: {
            id: string;
            description: string;
            amountPaid: number;
            transactionId: string;
            category: string | null;
            expenseDate: string;
            paidBy: { name: string };
            attachments?: Attachment[];
          }) => ({
            id: item.id,
            description: item.description,
            paidBy: item.paidBy.name,
            amount: item.amountPaid,
            formattedAmount: `₹${item.amountPaid.toLocaleString("en-IN")}`,
            date: new Date(item.expenseDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            category: item.category ?? "Uncategorised",
            attachments: item.attachments || [],
          })
        )
      );

      setSettlements(
        (settlementData || []).map(
          (item: {
            id: string;
            amountPaid: number;
            status: string;
            settledAt: string | null;
            fromUser: { id: string; name: string };
            toUser: { id: string; name: string };
            attachments?: Attachment[];
          }) => ({
            id: item.id,
            fromUser: item.fromUser.name,
            fromUserId: item.fromUser.id,
            toUser: item.toUser.name,
            toUserId: item.toUser.id,
            amount: item.amountPaid,
            status: item.status || "COMPLETED",
            formattedAmount: `₹${item.amountPaid.toLocaleString("en-IN")}`,
            date: item.settledAt
              ? new Date(item.settledAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Pending",
            attachments: item.attachments || [],
          })
        )
      );

      setPendingSettlements(pendingData || []);
    } catch {
      // Keep silent fallback state
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData(user?.id);
  }, [user?.id, loadDashboardData]);

  const handleAddExpense = (newExpense: DashboardExpense) => {
    setExpenses((current) => [newExpense, ...current]);
    loadDashboardData(user?.id);
  };

  const handleAddSettlement = (newSettlement: DashboardSettlement) => {
    setSettlements((current) => [newSettlement, ...current]);
    loadDashboardData(user?.id);
  };

  const userName = isMounted && user?.name ? user.name : null;
  const firstName = userName ? userName.split(" ")[0] : "there";
  const userInitials = userName ? userName.split(" ").map((part) => part[0]).join("").slice(0, 2) : "--";

  return (
    <div className="min-h-screen bg-[#fff8f1] flex flex-col md:flex-row selection:bg-[#fee3b5] selection:text-[#1d1e1c]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Mobile Top Navigation */}
      <MobileNav />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e3d6c5]/70">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-[#1d1e1c]">
                {greeting}, {firstName} 👋
              </h1>
            </div>
            <p className="text-sm sm:text-base text-[#615f5c] mt-1">
              Here&apos;s an overview of your shared finances.
            </p>
          </div>

          {/* Right Header Options (Month selector & User Pill) */}
          <div className="flex items-center gap-3">
            {/* Month Selector Dropdown */}
            <CustomSelect
              options={["September 2026", "August 2026", "July 2026", "June 2026", "May 2026"]}
              value={selectedMonth}
              onChange={setSelectedMonth}
              icon={<Calendar className="w-4 h-4 text-[#fa5d00]" />}
              className="min-w-[165px]"
            />

            {/* Profile Avatar Pill */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white border border-[#e3d6c5] rounded-full p-1.5 pr-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#fa5d00] text-white font-bold flex items-center justify-center text-xs">
                {userInitials}
              </div>
              <span className="text-sm font-semibold text-[#1d1e1c]">
                {userName ? firstName : "Partner"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Toolbar */}
        <div className="bg-white border border-[#e3d6c5] rounded-[20px] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fa5d00] animate-pulse shrink-0" />
            <span className="text-sm font-semibold text-[#1d1e1c] whitespace-nowrap">
              Quick Actions
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base whitespace-normal text-center"
            >
              <Plus className="w-4 h-4 shrink-0" /> Add Expense
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsSettlementModalOpen(true)}
              className="px-3 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base border-[#c0bbb6] whitespace-normal text-center"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#fa5d00] shrink-0" /> Record Settlement
            </Button>
          </div>
        </div>

        {/* Pending Settlements Notification Banner */}
        {user?.id && (
          <PendingSettlementsBanner
            pendingSettlements={pendingSettlements}
            currentUserId={user.id}
            onSettlementAction={() => loadDashboardData(user.id)}
          />
        )}

        {/* Financial Summary Cards Grid (4 Cards) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="paper" className="p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 w-20 bg-[#e3d6c5]/50 rounded" />
                  <div className="w-8 h-8 rounded-xl bg-[#e3d6c5]/40" />
                </div>
                <div className="h-7 w-24 bg-[#e3d6c5]/70 rounded mb-2" />
                <div className="h-3 w-36 bg-[#e3d6c5]/30 rounded" />
              </Card>
            ))
          ) : (
            <>
              {/* Card 1: Total Spent */}
              <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                    Total Spent
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fff8f1] border border-[#e3d6c5] flex items-center justify-center text-[#1d1e1c]">
                    <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
                  <SpinningCounter text={`₹${totalSpent.toLocaleString("en-IN")}`} />
                </p>
                <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">
                  Total expenses this month
                </p>
              </Card>

              {/* Card 2: Your Contribution */}
              <Card variant="paper" className="p-3.5 sm:p-5 border border-[#e3d6c5] shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                    Contribution
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fff8f1] border border-[#e3d6c5] flex items-center justify-center text-[#fa5d00]">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-[#1d1e1c] tracking-tight">
                  <SpinningCounter text={`₹${paidByCurrentUser.toLocaleString("en-IN")}`} />
                </p>
                <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">
                  Amount paid by you
                </p>
              </Card>

              {/* Card 3: You Owe */}
              <Card variant="paper" className="p-3.5 sm:p-5 border border-[#fee3b5] bg-white shadow-sm relative overflow-hidden group hover:border-[#fa5d00]/40 transition-colors">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#fa5d00]">
                    You Owe
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fee3b5]/60 text-[#fa5d00] flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-[#fa5d00] tracking-tight">
                  <SpinningCounter text={currentBalance?.status === "owes" ? currentBalance.balance : "₹0"} />
                </p>
                <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">
                  Pending amount to settle
                </p>
              </Card>

              {/* Card 4: You Receive */}
              <Card variant="paper" className="p-3.5 sm:p-5 border border-emerald-200 bg-white shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    You Receive
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-emerald-600 tracking-tight">
                  <SpinningCounter text={currentBalance?.status === "receives" ? currentBalance.balance : "₹0"} />
                </p>
                <p className="text-[10px] sm:text-xs text-[#615f5c] mt-1 sm:mt-1.5 font-medium">
                  Amount others owe you
                </p>
              </Card>
            </>
          )}
        </section>

        {/* Spending Overview Chart */}
        <section>
          {isLoading ? (
            <Card variant="paper" className="h-64 border border-[#e3d6c5] shadow-sm animate-pulse flex items-center justify-center text-[#8e8b87] text-sm">
              Loading Spending Overview...
            </Card>
          ) : (
            <SpendingChart monthlyData={monthlyExpenses} />
          )}
        </section>

        {/* Partner Balances Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1d1e1c]">
                Partner Balances
              </h2>
              <p className="text-sm text-[#615f5c]">
                Real-time financial standing across all 3 business partners
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 min-[340px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  variant="paper"
                  className={cn(
                    "p-3.5 sm:p-6 border border-[#e3d6c5] shadow-sm animate-pulse flex flex-col justify-between",
                    i === 2 &&
                    "min-[340px]:col-span-2 min-[340px]:w-full min-[340px]:max-w-[calc(50%-0.375rem)] min-[340px]:justify-self-center md:col-span-1 md:max-w-none"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#e3d6c5]/40 shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="h-3.5 w-16 sm:w-24 bg-[#e3d6c5]/60 rounded" />
                      <div className="h-2.5 w-24 sm:w-36 bg-[#e3d6c5]/30 rounded hidden sm:block" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-[#e3d6c5]/60 flex items-center justify-between gap-2">
                    <div className="h-4 w-12 sm:w-16 bg-[#e3d6c5]/50 rounded" />
                    <div className="h-5 sm:h-6 w-16 sm:w-20 bg-[#e3d6c5]/40 rounded-full shrink-0" />
                  </div>
                </Card>
              ))
            ) : (
              partnerBalancesWithUser.map((partner, index) => {
                const isReceiving = partner.status === "receives";
                const isThirdOnMobile = index === 2;

                return (
                  <Card
                    key={partner.id}
                    variant="paper"
                    className={cn(
                      "p-3.5 sm:p-5 border transition-all duration-200 flex flex-col justify-between",
                      partner.isCurrentUser
                        ? "border-[#fa5d00]/40 shadow-[0px_4px_16px_rgba(250,93,0,0.1)] bg-[#fff8f1]/30"
                        : "border-[#e3d6c5] shadow-sm",
                      isThirdOnMobile &&
                      "min-[340px]:col-span-2 min-[340px]:w-full min-[340px]:max-w-[calc(50%-0.375rem)] min-[340px]:justify-self-center md:col-span-1 md:max-w-none"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm shrink-0",
                            isReceiving
                              ? "bg-emerald-600 text-white"
                              : "bg-[#fa5d00] text-white"
                          )}
                        >
                          {partner.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <h3 className="font-semibold text-[#1d1e1c] text-xs sm:text-base leading-tight truncate">
                              {partner.name}
                            </h3>
                            {partner.isCurrentUser && (
                              <span className="bg-[#fa5d00]/10 text-[#fa5d00] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          {partner.email && (
                            <p className="text-[10px] sm:text-xs text-[#8e8b87] truncate mt-0.5 hidden sm:block">
                              {partner.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 sm:pt-2.5 border-t border-[#e3d6c5]/60 flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-base sm:text-lg font-bold tracking-tight shrink-0",
                          isReceiving ? "text-emerald-600" : "text-[#fa5d00]"
                        )}
                      >
                        <SpinningCounter text={partner.balance} />
                      </p>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border shrink-0",
                          isReceiving
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-[#fee3b5]/60 text-[#fa5d00] border-[#fee3b5]"
                        )}
                      >
                        {isReceiving ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600 shrink-0" /> Receives
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-[#fa5d00] shrink-0" /> Owes
                          </>
                        )}
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Two-Column Grid: Recent Expenses & Recent Settlements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Recent Expenses Section */}
          <section className="flex flex-col space-y-4">
            <div className="flex items-center justify-between h-9">
              <div>
                <h2 className="text-xl font-bold text-[#1d1e1c]">Recent Expenses</h2>
                <p className="text-xs text-[#615f5c]">Latest transactions paid by partners</p>
              </div>
              <Link
                href="/expenses"
                className="text-xs font-semibold text-[#fa5d00] hover:underline flex items-center gap-1 shrink-0"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Card variant="paper" className="p-0 border border-[#e3d6c5] shadow-sm overflow-hidden flex-1 flex flex-col justify-between">
              {isLoading ? (
                <div className="p-4 space-y-4 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#e3d6c5]/40" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-[#e3d6c5]/60 rounded" />
                          <div className="h-3 w-20 bg-[#e3d6c5]/30 rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-12 bg-[#e3d6c5]/50 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#fff8f1] border-b border-[#e3d6c5] text-xs font-semibold text-[#8e8b87] uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3.5">Description</th>
                          <th className="px-5 py-3.5">Paid By</th>
                          <th className="px-5 py-3.5">Amount</th>
                          <th className="px-5 py-3.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e3d6c5]/50">
                        {expenses.slice(0, 5).map((expense) => (
                          <tr
                            key={expense.id}
                            onClick={() => setSelectedExpense(expense)}
                            className="hover:bg-[#fff8f1] cursor-pointer transition-all duration-150 group"
                          >
                            <td className="px-5 py-4 font-semibold text-[#1d1e1c]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="group-hover:text-[#fa5d00] transition-colors">{expense.description}</span>
                                {expense.attachments && expense.attachments.length > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fa5d00]/10 border border-[#fa5d00]/20 px-2 py-0.5 text-[10px] font-bold text-[#fa5d00] shrink-0">
                                    <Paperclip className="h-3 w-3" />
                                    {expense.attachments.length} {expense.attachments.length === 1 ? "file" : "files"}
                                  </span>
                                )}
                              </div>
                              <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8e8b87] bg-[#fff8f1] px-2 py-0.5 rounded-full border border-[#e3d6c5]/60">
                                {expense.category}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-[#615f5c]">
                              <span className="inline-flex items-center gap-1.5 font-medium">
                                <span className="w-2 h-2 rounded-full bg-[#fa5d00]" />
                                {expense.paidBy}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-bold text-[#1d1e1c] tabular-nums">
                              {expense.formattedAmount}
                            </td>
                            <td className="px-5 py-4 text-right text-xs text-[#8e8b87] font-medium">
                              {expense.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="sm:hidden divide-y divide-[#e3d6c5]/60">
                    {expenses.slice(0, 5).map((expense) => (
                      <div
                        key={expense.id}
                        onClick={() => setSelectedExpense(expense)}
                        className="p-4 space-y-2 hover:bg-[#fff8f1] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-[#1d1e1c] text-sm flex items-center gap-1.5">
                            {expense.description}
                            {expense.attachments && expense.attachments.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#fa5d00]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#fa5d00]">
                                <Paperclip className="h-2.5 w-2.5" />
                                {expense.attachments.length}
                              </span>
                            )}
                          </h4>
                          <span className="font-bold text-[#1d1e1c] text-base tabular-nums">
                            {expense.formattedAmount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#615f5c]">
                          <span>Paid by <b>{expense.paidBy}</b></span>
                          <span className="text-[#8e8b87]">{expense.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </section>

          {/* Recent Settlements Section */}
          <section className="flex flex-col space-y-4">
            <div className="flex items-center justify-between h-9">
              <div>
                <h2 className="text-xl font-bold text-[#1d1e1c]">Recent Settlements</h2>
                <p className="text-xs text-[#615f5c]">Direct payments cleared between partners</p>
              </div>
              <Link
                href="/settlements"
                className="text-xs font-semibold text-[#fa5d00] hover:underline flex items-center gap-1 shrink-0"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Card variant="paper" className="p-5 border border-[#e3d6c5] shadow-sm flex-1 flex flex-col justify-between">
              {isLoading ? (
                <div className="space-y-3.5 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-[#e3d6c5]/40 rounded-[16px]" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {settlements.slice(0, 5).map((settlement) => {
                    const st = (settlement.status || "COMPLETED").toUpperCase();
                    const isPending = st === "PENDING";
                    const isCancelled = st === "CANCELLED" || st === "REJECTED";

                    return (
                      <div
                        key={settlement.id}
                        onClick={() => setSelectedSettlement(settlement)}
                        className="bg-[#fff8f1] border border-[#e3d6c5]/70 rounded-[16px] p-4 flex items-center justify-between hover:border-[#fa5d00]/40 hover:shadow-sm cursor-pointer transition-all duration-150 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                              isPending
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : isCancelled
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200"
                            }`}
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1d1e1c] truncate">
                              <span className="truncate">{settlement.fromUser || settlement.from}</span>
                              <span className="text-[#fa5d00] font-bold shrink-0">→</span>
                              <span className="truncate">{settlement.toUser || settlement.to}</span>
                            </div>
                            <p className="text-xs text-[#8e8b87] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-[#8e8b87]" /> {settlement.date}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-base font-bold block tabular-nums ${
                              isPending
                                ? "text-amber-700"
                                : isCancelled
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {settlement.formattedAmount || `₹${settlement.amount.toLocaleString("en-IN")}`}
                          </span>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            {settlement.attachments && settlement.attachments.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fa5d00]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#fa5d00]">
                                <Paperclip className="h-3 w-3" />
                                {settlement.attachments.length}
                              </span>
                            )}

                            {isPending ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100/90 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-amber-300">
                                <Clock3 className="size-2.5" /> Pending
                              </span>
                            ) : isCancelled ? (
                              <span className="inline-flex items-center gap-1 bg-red-100/80 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-red-300">
                                <XCircle className="size-2.5" /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100/60 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                <CheckCircle2 className="size-2.5" /> Settled
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
          </section>
        </div>
      </main>

      {/* Add Expense Dialog Modal */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={handleAddExpense}
      />

      {/* Record Settlement Dialog Modal */}
      <RecordSettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        onSuccess={handleAddSettlement}
      />

      {/* Detailed View Modals */}
      <ExpenseDetailsModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />

      <SettlementDetailsModal
        settlement={selectedSettlement}
        onClose={() => setSelectedSettlement(null)}
        onUpdateSettlement={() => loadDashboardData(user?.id)}
      />
    </div>
  );
}
