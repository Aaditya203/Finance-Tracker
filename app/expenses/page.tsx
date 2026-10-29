"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { Attachment } from "@/types";
import { AttachmentSection } from "@/components/ui/attachment-section";
import {
  CalendarDays,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Paperclip,
  Plus,
  Receipt,
  Search,
  UserRound,
  Wallet,
  X,
  Pencil,
  Trash2,
  Clock,
  Lock,
  AlertTriangle,
} from "lucide-react";

import { CustomSelect } from "@/components/ui/custom-select";
import { getExpensesApi, createExpense, uploadExpenseAttachment, updateExpenseApi, deleteExpenseApi } from "@/lib/api/expenses";
import { isCompanyBankAccount } from "@/lib/finance";
import { isWithinTwoDays, getTimeRemainingText } from "@/lib/time-limit";

type Expense = {
  id: string;
  description: string;
  transactionId: string;
  paidBy: string;
  paidById: string;
  amount: number;
  date: string;
  category: string;
  createdAt?: string;
  isExtraFund?: boolean;
  bankFundingMode?: "PARTNER_SPLIT" | "POOLED_BANK";
  fundAppliedToCurrentUser?: number;
  attachments?: Attachment[];
  splits: Array<{ userId: string; amountPaid: number; user: { id: string; name: string } }>;
};

const partners = ["Aditya Sharma", "Vishal Kumar Singh", "Ujjwal Kumar Singh", "Flextudy Official"];
const categories = ["Software", "Hosting", "Marketing", "Operations"];

const formatAmount = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [paidBy, setPaidBy] = useState("All partners");
  const [category, setCategory] = useState("All categories");
  const [dateFilter, setDateFilter] = useState("All dates");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summaryCount, setSummaryCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [thisMonthAmount, setThisMonthAmount] = useState(0);
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [details, setDetails] = useState<Expense | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getExpensesApi({
      page,
      query: query.trim() || undefined,
      paidBy: paidBy === "All partners" ? undefined : paidBy,
      category: category === "All categories" ? undefined : category,
      month: dateFilter === "All dates" ? undefined : dateFilter,
    })
      .then((result) => {
        if (cancelled) return;
        const items = result.items;
        setTotalPages(result.totalPages);
        setTotalCount(result.total);
        setSummaryCount(result.summary.count);
        setTotalAmount(result.summary.amount);
        setThisMonthAmount(result.summary.currentMonthAmount);
        setMonthOptions(result.months);
        setExpenses(
          items.map((item) => ({
            id: item.id,
            description: item.description,
            transactionId: item.transactionId,
            amount: item.amountPaid,
            date: new Date(item.expenseDate || Date.now()).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            category: item.category || "Operations",
            paidBy: item.paidBy.name,
            paidById: item.paidBy.id,
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
            isExtraFund: item.isExtraFund || false,
            bankFundingMode: item.bankFundingMode || "PARTNER_SPLIT",
            fundAppliedToCurrentUser: item.fundAppliedToCurrentUser ?? 0,
            attachments: item.attachments || [],
            splits: item.splits || [],
          }))
        );
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, query, paidBy, category, dateFilter]);

  const filteredExpenses = expenses;
  const pageStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => pageStart + index);

  // Dynamic calculations for summary cards
  const stats = useMemo(() => {
    const total = totalAmount;
    return {
      total: formatAmount(total),
      thisMonth: formatAmount(thisMonthAmount),
      count: summaryCount.toString(),
    };
  }, [totalAmount, summaryCount, thisMonthAmount]);

  const resetFilters = () => {
    setIsLoading(true);
    setQuery("");
    setPaidBy("All partners");
    setCategory("All categories");
    setDateFilter("All dates");
    setPage(1);
  };

  const hasFilters =
    Boolean(query) ||
    paidBy !== "All partners" ||
    category !== "All categories" ||
    dateFilter !== "All dates";

  return (
    <div className="min-h-screen bg-[var(--color-cream-canvas)] selection:bg-[var(--color-marigold-glow)] selection:text-[var(--color-ink-black)] md:flex">
      <Sidebar />
      <MobileNav />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="flex flex-col gap-4 border-b border-[var(--color-parchment-shadow)]/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-harvest-flame)]">
                Partner finance
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink-black)] sm:text-4xl">
                Expenses
              </h1>
              <p className="mt-1 text-sm text-[var(--color-warm-stone)] sm:text-base">
                Track and manage all shared expenses.
              </p>
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </header>

          {/* Summary Cards with Skeleton State */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-5 border-[var(--color-parchment-shadow)] shadow-sm animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2.5">
                      <div className="h-3 w-28 bg-[var(--color-parchment-shadow)]/50 rounded" />
                      <div className="h-7 w-20 bg-[var(--color-parchment-shadow)]/70 rounded" />
                      <div className="h-3 w-36 bg-[var(--color-parchment-shadow)]/30 rounded" />
                    </div>
                    <div className="h-9 w-9 bg-[var(--color-parchment-shadow)]/40 rounded-xl" />
                  </div>
                </Card>
              ))
            ) : (
              <>
                <Card className="p-5 border-[var(--color-parchment-shadow)] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">
                        Total Expenses
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-ink-black)] sm:text-3xl">
                        {stats.total}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[var(--color-warm-stone)]">
                        Across all shared spending
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] text-[var(--color-harvest-flame)]">
                      <Receipt className="h-4 w-4" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-[var(--color-parchment-shadow)] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">
                        This Month
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-ink-black)] sm:text-3xl">
                        {stats.thisMonth}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[var(--color-warm-stone)]">
                        August 2026
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] text-[var(--color-harvest-flame)]">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-[var(--color-parchment-shadow)] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">
                        Total Transactions
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-ink-black)] sm:text-3xl">
                        {stats.count}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[var(--color-warm-stone)]">
                        Recorded by all partners
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] text-[var(--color-harvest-flame)]">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </>
            )}
          </section>

          {/* Filters Row */}
          <section className="rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-driftwood)]" />
                <Input
                  value={query}
                  onChange={(event) => { setIsLoading(true); setQuery(event.target.value); setPage(1); }}
                  placeholder="Search expenses..."
                  className="py-2.5 pl-10 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <CustomSelect
                  options={["All dates", ...monthOptions]}
                  value={dateFilter}
                  onChange={(value) => { setIsLoading(true); setDateFilter(value); setPage(1); }}
                  ariaLabel="Filter by date"
                />
                <CustomSelect
                  options={["All partners", ...partners]}
                  value={paidBy}
                  onChange={(value) => { setIsLoading(true); setPaidBy(value); setPage(1); }}
                  ariaLabel="Filter by paid by"
                />
                <CustomSelect
                  options={["All categories", ...categories]}
                  value={category}
                  onChange={(value) => { setIsLoading(true); setCategory(value); setPage(1); }}
                  ariaLabel="Filter by category"
                />
              </div>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="self-center whitespace-nowrap text-xs font-semibold text-[var(--color-harvest-flame)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>

          {/* Expenses Table / Cards with Skeleton Loader */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-ink-black)]">All expenses</h2>
                <p className="mt-0.5 text-sm text-[var(--color-warm-stone)]">
                  {isLoading ? "Loading..." : `${filteredExpenses.length} expense${filteredExpenses.length === 1 ? "" : "s"} shown`}
                </p>
              </div>
              <div className="hidden items-center gap-2 text-xs font-semibold text-[var(--color-driftwood)] sm:flex">
                <Filter className="h-3.5 w-3.5" /> Refine your results
              </div>
            </div>

            {isLoading ? (
              <Card className="p-0 overflow-hidden border border-[var(--color-parchment-shadow)] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--color-parchment-shadow)] text-xs uppercase tracking-wider text-[var(--color-driftwood)]">
                        <th className="px-6 py-4 font-semibold">Expense</th>
                        <th className="px-4 py-4 font-semibold">Paid by</th>
                        <th className="px-4 py-4 font-semibold">Amount</th>
                        <th className="px-4 py-4 font-semibold">Date</th>
                        <th className="w-16 px-4 py-4"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="border-b border-[var(--color-parchment-shadow)]/50 animate-pulse">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[var(--color-parchment-shadow)]/40" />
                              <div className="space-y-2">
                                <div className="h-4 w-44 bg-[var(--color-parchment-shadow)]/60 rounded" />
                                <div className="h-3 w-28 bg-[var(--color-parchment-shadow)]/30 rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-28 bg-[var(--color-parchment-shadow)]/50 rounded" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-16 bg-[var(--color-parchment-shadow)]/60 rounded" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-20 bg-[var(--color-parchment-shadow)]/40 rounded" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-6 bg-[var(--color-parchment-shadow)]/30 rounded" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : filteredExpenses.length ? (
              <>
                <Card className="hidden overflow-visible p-0 md:block border border-[var(--color-parchment-shadow)] shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--color-parchment-shadow)] text-xs uppercase tracking-wider text-[var(--color-driftwood)]">
                          <th className="px-6 py-4 font-semibold">Expense</th>
                          <th className="px-4 py-4 font-semibold">Paid by</th>
                          <th className="px-4 py-4 font-semibold">Amount</th>
                          <th className="px-4 py-4 font-semibold">Date</th>
                          <th className="w-16 px-4 py-4">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((expense) => (
                          <ExpenseTableRow
                            key={expense.id}
                            expense={expense}
                            onView={() => setDetails(expense)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <div className="space-y-3 md:hidden">
                  {filteredExpenses.map((expense) => (
                    <ExpenseMobileCard
                      key={expense.id}
                      expense={expense}
                      onView={() => setDetails(expense)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                onAdd={() => setIsAddOpen(true)}
                compact={hasFilters}
                onClear={resetFilters}
              />
            )}
            {totalCount > 0 && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-warm-stone)]">Showing {Math.min((page - 1) * 10 + 1, totalCount)}–{Math.min(page * 10, totalCount)} of {totalCount} expenses</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1 || isLoading} onClick={() => { setIsLoading(true); setPage((current) => Math.max(1, current - 1)); }}>Previous</Button>
                  <div className="flex items-center gap-1" aria-label="Expense pages">
                    {visiblePages.map((pageNumber) => <button key={pageNumber} aria-current={pageNumber === page ? "page" : undefined} onClick={() => { setIsLoading(true); setPage(pageNumber); }} className={`h-9 min-w-9 rounded-xl px-2 text-sm font-semibold transition-colors ${pageNumber === page ? "bg-[var(--color-harvest-flame)] text-white" : "text-[var(--color-warm-stone)] hover:bg-[var(--color-cream-canvas)]"}`}>{pageNumber}</button>)}
                  </div>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages || isLoading} onClick={() => { setIsLoading(true); setPage((current) => Math.min(totalPages, current + 1)); }}>Next</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      {details && (
        <ExpenseDetails
          expense={details}
          onClose={() => setDetails(null)}
          onUpdateExpense={(updated) => {
            setExpenses((current) =>
              current.map((e) => (e.id === updated.id ? updated : e))
            );
            setDetails(updated);
          }}
          onDeleteExpense={(deletedId) => {
            setExpenses((current) => current.filter((e) => e.id !== deletedId));
            setDetails(null);
            setTotalCount((c) => Math.max(0, c - 1));
          }}
        />
      )}
      {isAddOpen && (
        <AddExpenseForm
          onClose={() => setIsAddOpen(false)}
          onAdd={(expense) => {
            void expense;
            setPage(1);
            void getExpensesApi({
              page: 1,
              query: query.trim() || undefined,
              paidBy: paidBy === "All partners" ? undefined : paidBy,
              category: category === "All categories" ? undefined : category,
              month: dateFilter === "All dates" ? undefined : dateFilter,
            }).then((result) => {
              setExpenses(result.items.map((item) => ({
                id: item.id, description: item.description, transactionId: item.transactionId,
                amount: item.amountPaid, date: new Date(item.expenseDate || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                category: item.category || "Operations", paidBy: item.paidBy.name, isExtraFund: item.isExtraFund || false,
                bankFundingMode: item.bankFundingMode || "PARTNER_SPLIT", fundAppliedToCurrentUser: item.fundAppliedToCurrentUser ?? 0,
                paidById: item.paidBy.id, splits: item.splits || [],
                createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
                attachments: item.attachments || [],
              })));
              setTotalPages(result.totalPages); setTotalCount(result.total); setSummaryCount(result.summary.count); setTotalAmount(result.summary.amount); setThisMonthAmount(result.summary.currentMonthAmount);
            });
            setIsAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ExpenseTableRow({
  expense,
  onView,
}: {
  expense: Expense;
  onView: () => void;
}) {
  const isExtra = expense.isExtraFund;
  const isPooledCash = !isExtra && expense.bankFundingMode === "POOLED_BANK";
  return (
    <tr
      onClick={onView}
      className="border-b border-[var(--color-parchment-shadow)]/70 last:border-0 hover:bg-[var(--color-cream-canvas)] cursor-pointer transition-all duration-150 group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`hidden h-9 w-9 items-center justify-center rounded-xl border group-hover:scale-105 transition-transform lg:flex ${isExtra ? 'border-emerald-900 bg-emerald-950/40 text-emerald-400' : 'border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] text-[var(--color-harvest-flame)]'}`}>
            {isExtra ? <Wallet className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[var(--color-ink-black)] group-hover:text-[var(--color-harvest-flame)] transition-colors">{expense.description}</p>
              {isExtra && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                  <Wallet className="h-2.5 w-2.5" /> Extra Fund
                </span>
              )}
              {isPooledCash && <span className="rounded-full border border-blue-900 bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-info)]">Pooled cash</span>}
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-driftwood)]">{expense.transactionId}</p>
            {(expense.fundAppliedToCurrentUser ?? 0) > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-[var(--color-success)]">
                ₹{expense.fundAppliedToCurrentUser!.toLocaleString("en-IN")} from your extra funds applied to your share
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--color-ink-black)]">{expense.paidBy}</p>
          {expense.attachments && expense.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-harvest-flame)]/10 border border-[var(--color-harvest-flame)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--color-harvest-flame)]">
              <Paperclip className="h-3 w-3" />
              {expense.attachments.length}
            </span>
          )}
        </div>
        <span className="mt-1 inline-flex rounded-full bg-[var(--color-harvest-flame)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-harvest-flame)]">
          {expense.category}
        </span>
      </td>
      <td className={`px-4 py-4 text-sm font-bold tabular-nums ${isExtra ? 'text-emerald-400' : 'text-[var(--color-ink-black)]'}`}>
        {isExtra ? '+' : ''}{formatAmount(expense.amount)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-warm-stone)]">
        {expense.date}
      </td>
      <td className="relative px-4 py-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-harvest-flame)] hover:bg-[var(--color-harvest-flame)] hover:text-white hover:border-[var(--color-harvest-flame)] transition-all shadow-sm cursor-pointer"
          aria-label={`View details for ${expense.description}`}
        >
          <Eye className="h-3.5 w-3.5" /> Details
        </button>
      </td>
    </tr>
  );
}

function ExpenseMobileCard({ expense, onView }: { expense: Expense; onView: () => void }) {
  const isExtra = expense.isExtraFund;
  const isPooledCash = !isExtra && expense.bankFundingMode === "POOLED_BANK";
  return (
    <Card
      onClick={onView}
      className={`p-4 border shadow-sm hover:border-[var(--color-harvest-flame)]/40 transition-all cursor-pointer ${isExtra ? 'border-emerald-900 bg-emerald-950/40' : 'border-[var(--color-parchment-shadow)]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-[var(--color-ink-black)]">{expense.description}</p>
            {isExtra && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                <Wallet className="h-2.5 w-2.5" /> Extra Fund
              </span>
            )}
            {isPooledCash && <span className="rounded-full border border-blue-900 bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-info)]">Pooled cash</span>}
          </div>
          <p className="mt-1 text-xs text-[var(--color-driftwood)]">{expense.transactionId}</p>
          {(expense.fundAppliedToCurrentUser ?? 0) > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-[var(--color-success)]">
              ₹{expense.fundAppliedToCurrentUser!.toLocaleString("en-IN")} from your extra funds applied to your share
            </p>
          )}
        </div>
        <p className={`shrink-0 text-lg font-bold tabular-nums ${isExtra ? 'text-emerald-400' : 'text-[var(--color-ink-black)]'}`}>
          {isExtra ? '+' : ''}{formatAmount(expense.amount)}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-parchment-shadow)]/70 pt-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-warm-stone)]">{expense.paidBy}</p>
          <p className="mt-0.5 text-xs text-[var(--color-driftwood)]">{expense.date}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-1 rounded-[12px] border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-harvest-flame)] hover:bg-[var(--color-harvest-flame)] hover:text-white transition-colors cursor-pointer"
          aria-label={`View ${expense.description}`}
        >
          <Eye className="h-3.5 w-3.5" /> View
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex rounded-full bg-[var(--color-harvest-flame)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-harvest-flame)]">
          {expense.category}
        </span>
        {expense.attachments && expense.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-harvest-flame)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-harvest-flame)]">
            <Paperclip className="h-3 w-3" />
            {expense.attachments.length} file{expense.attachments.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Card>
  );
}

function EmptyState({
  onAdd,
  compact,
  onClear,
}: {
  onAdd: () => void;
  compact: boolean;
  onClear: () => void;
}) {
  return (
    <Card className="py-14 text-center border border-[var(--color-parchment-shadow)] shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-cream-canvas)] text-[var(--color-harvest-flame)]">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[var(--color-ink-black)]">No expenses yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-warm-stone)]">
        {compact
          ? "No expenses match your current filters."
          : "Your shared expenses will appear here once they are added."}
      </p>
      <div className="mt-5 flex justify-center gap-3">
        {compact && (
          <Button variant="secondary" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add First Expense
        </Button>
      </div>
    </Card>
  );
}

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-[var(--color-ink-black)]/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-t-[24px] border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-5 shadow-2xl sm:rounded-xl sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-parchment-shadow)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-ink-black)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--color-warm-stone)]">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-[var(--color-driftwood)] hover:bg-[var(--color-cream-canvas)] hover:text-[var(--color-ink-black)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ExpenseDetails({
  expense,
  onClose,
  onUpdateExpense,
  onDeleteExpense,
}: {
  expense: Expense;
  onClose: () => void;
  onUpdateExpense?: (updated: Expense) => void;
  onDeleteExpense?: (id: string) => void;
}) {
  const { user } = useCurrentUser();
  const isExtra = expense.isExtraFund;
  const isPooledCash = !isExtra && expense.bankFundingMode === "POOLED_BANK";
  const isCompanyPayer = isCompanyBankAccount({ name: expense.paidBy });

  const isPayer = user?.id
    ? expense.paidById
      ? user.id === expense.paidById
      : user.name?.toLowerCase() === expense.paidBy?.toLowerCase()
    : true;

  const canModify = isPayer && isWithinTwoDays(expense.createdAt);
  const timeRemaining = getTimeRemainingText(expense.createdAt);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(expense.description);
  const [editAmount, setEditAmount] = useState(String(expense.amount));
  const [editCategory, setEditCategory] = useState(expense.category || "Operations");
  const [editDate, setEditDate] = useState(() => {
    const d = new Date(expense.date);
    return !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    const numAmount = Number(editAmount);
    if (!Number.isSafeInteger(numAmount) || numAmount <= 0) {
      setSaveError("Please enter a valid amount in rupees.");
      return;
    }
    if (!editDescription.trim()) {
      setSaveError("Please enter a description.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateExpenseApi(expense.id, {
        description: editDescription.trim(),
        amountPaid: numAmount,
        category: editCategory,
        expenseDate: editDate,
      });

      const updatedExpense: Expense = {
        ...expense,
        description: result.expense.description,
        amount: result.expense.amountPaid,
        category: result.expense.category || "Operations",
        date: new Date(result.expense.expenseDate || Date.now()).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        splits: result.expense.splits || expense.splits,
      };

      setIsEditing(false);
      if (onUpdateExpense) {
        onUpdateExpense(updatedExpense);
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update expense");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    setIsDeleting(true);
    try {
      await deleteExpenseApi(expense.id);
      if (onDeleteExpense) {
        onDeleteExpense(expense.id);
      }
      onClose();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete expense");
      setIsDeleting(false);
    }
  };

  const handleUpload = async (file: File) => {
    const newAtt = await uploadExpenseAttachment(expense.id, file);
    const updated = {
      ...expense,
      attachments: [newAtt, ...(expense.attachments || [])],
    };
    if (onUpdateExpense) {
      onUpdateExpense(updated);
    }
  };

  return (
    <ModalShell
      title={isEditing ? "Edit expense" : isExtra ? "Extra Fund details" : "Expense details"}
      subtitle={
        isEditing
          ? "Modify expense details within the 2-day creation window."
          : isExtra
          ? "A direct contribution from a partner — not split among others."
          : isPooledCash
          ? "Paid from pooled company bank cash without creating partner dues."
          : "A shared expense split equally between partners."
      }
      onClose={onClose}
    >
      <div className="space-y-5 py-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* 2-Day Status Indicator Banner */}
        <div
          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
            canModify
              ? "bg-orange-950/40 border-amber-900 text-orange-400"
              : "bg-[var(--color-cream-canvas)] border-[var(--color-parchment-shadow)] text-[var(--color-driftwood)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {canModify ? (
              <Clock className="size-3.5 text-orange-400 shrink-0" />
            ) : (
              <Lock className="size-3.5 text-[var(--color-driftwood)] shrink-0" />
            )}
            <span>
              {canModify
                ? `2-day window active · ${timeRemaining}`
                : "Locked · Created > 2 days ago (read-only)"}
            </span>
          </div>

          {canModify && !isEditing && !showDeleteConfirm && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditDescription(expense.description);
                  setEditAmount(String(expense.amount));
                  setEditCategory(expense.category || "Operations");
                  const d = new Date(expense.date);
                  setEditDate(!Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
                  setSaveError("");
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] text-[var(--color-ink-black)] hover:border-[var(--color-harvest-flame)] hover:text-[var(--color-harvest-flame)] font-semibold text-xs transition-colors cursor-pointer"
              >
                <Pencil className="size-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-900 bg-red-950/40 text-red-400 hover:bg-red-950/40 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5 text-red-400">
              <AlertTriangle className="size-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Delete this transaction?</h4>
                <p className="text-xs text-red-400 mt-0.5 leading-relaxed">
                  This action is permanent and cannot be undone. All recorded shares will be removed.
                </p>
              </div>
            </div>
            {deleteError && (
              <p className="text-xs font-semibold text-red-400">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-red-700"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {saveError && (
              <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-xs font-medium text-red-400">
                {saveError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                Expense Title / Description
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="h-[50px] w-full rounded-xl border border-[var(--color-bone)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink-black)] focus:border-[var(--color-harvest-flame)] focus:outline-none focus:ring-2 focus:ring-[var(--color-harvest-flame)]/20"
                >
                  {["Software", "Hosting", "Marketing", "Operations", "Infrastructure", "Other"].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
                Expense Date
              </label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-parchment-shadow)]">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" size="md" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <>
            <div className={`rounded-xl border p-4 ${isExtra ? 'border-emerald-900 bg-emerald-950/40' : 'border-[var(--color-marigold-glow)] bg-[var(--color-cream-canvas)]'}`}>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">
                  Description
                </p>
                {isExtra && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                    <Wallet className="h-2.5 w-2.5" /> Extra Fund
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-bold text-[var(--color-ink-black)]">{expense.description}</p>
                <p className={`text-xl font-bold ${isExtra ? 'text-emerald-400' : 'text-[var(--color-harvest-flame)]'}`}>{isExtra ? '+' : ''}{formatAmount(expense.amount)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
              <Detail label="Transaction ID" value={expense.transactionId} />
              <Detail label="Category" value={expense.category} />
              <Detail label={isExtra ? "Contributed by" : "Paid by"} value={expense.paidBy} />
              <Detail label="Date" value={expense.date} />
            </div>

            {isExtra ? (
              <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
                  <Wallet className="h-4 w-4" /> Direct contribution to Flextudy Bank Account by {expense.paidBy.split(" ")[0]}
                </div>
                <p className="mt-2 text-xs text-[var(--color-warm-stone)] leading-relaxed">
                  This extra fund of <span className="font-bold text-emerald-400">{formatAmount(expense.amount)}</span> was
                  deposited by <span className="font-semibold">{expense.paidBy}</span> into the <strong>Flextudy Bank Account</strong>.
                  It is <strong>not split</strong> among partners. If {expense.paidBy.split(" ")[0]} has any
                  outstanding balance to pay to the company, this fund will offset that balance automatically.
                </p>
              </div>
            ) : isPooledCash ? (
              <div className="rounded-xl border border-blue-900 bg-blue-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-400"><Wallet className="h-4 w-4" /> Paid from pooled bank cash</div>
                <p className="mt-2 text-xs leading-relaxed text-blue-400">The company balance decreased by {formatAmount(expense.amount)}. This transaction does not create an equal partner split or partner repayment dues.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-black)]">
                  <UserRound className="h-4 w-4 text-[var(--color-harvest-flame)]" /> {isPooledCash ? "No partner split" : `Recorded partner shares · ${expense.splits.length} partners`}
                </div>
                {isPooledCash ? <p className="mt-2 text-xs leading-relaxed text-[var(--color-warm-stone)]">The full amount was paid from pooled company cash. No partner share or repayment balance was created.</p> : expense.splits.length ? <div className="mt-3 space-y-2">
                  {expense.splits.map((split) => {
                    const isPayerUser = split.userId === expense.paidById;
                    return <div key={split.userId} className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 ${isPayerUser ? "border-[var(--color-harvest-flame)]/30 bg-[var(--color-cream-canvas)]" : "border-[var(--color-parchment-shadow)]/70 bg-[var(--color-surface)]"}`}>
                      <div className="min-w-0"><p className="truncate text-xs font-semibold text-[var(--color-ink-black)]">{split.user.name}{isPayerUser ? " · payer" : ""}</p><p className="mt-0.5 text-[11px] text-[var(--color-warm-stone)]">{isCompanyPayer ? "Share assigned · company bank paid" : isPayerUser ? "Own share · covered by payer" : `Owes ${expense.paidBy}`}</p></div>
                      <p className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-ink-black)]">{formatAmount(split.amountPaid)}</p>
                    </div>
                  })}
                  {isCompanyPayer && <p className="text-[11px] leading-relaxed text-[var(--color-warm-stone)]">Each share is added to that partner’s company-bank balance. Their deposits and repayments can reduce what remains due.</p>}
                  {!isCompanyPayer && <p className="text-[11px] leading-relaxed text-[var(--color-warm-stone)]">These are this expense’s shares. Later repayments are shown separately in Settlements and reduce the current “Who pays whom” balance.</p>}
                </div> : <p className="mt-2 text-xs leading-relaxed text-[var(--color-warm-stone)]">Individual split details are not available for this transaction.</p>}
              </div>
            )}

            {!isExtra && (expense.fundAppliedToCurrentUser ?? 0) > 0 && (
              <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
                  <Wallet className="h-4 w-4" /> Your contribution applied
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-success)]">
                  {formatAmount(expense.fundAppliedToCurrentUser!)} from your extra funds covered your share of this company-paid expense.
                </p>
              </div>
            )}

            {/* Attachment Section */}
            <AttachmentSection
              attachments={expense.attachments}
              onUpload={handleUpload}
              title="Expense Attachments"
            />

            <div className="flex justify-end border-t border-[var(--color-parchment-shadow)] pt-4">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-driftwood)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--color-ink-black)]">{value}</p>
    </div>
  );
}

function AddExpenseForm({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (expense: Expense) => void;
}) {
  const { user: currentUser } = useCurrentUser();
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Software");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtraFund, setIsExtraFund] = useState(false);
  const [bankFundingMode, setBankFundingMode] = useState<"PARTNER_SPLIT" | "POOLED_BANK">("PARTNER_SPLIT");
  const isCompanyAccount = currentUser ? isCompanyBankAccount(currentUser) : false;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!description || !transactionId || !Number.isFinite(parsedAmount) || parsedAmount <= 0)
      return;

    const paidById = currentUser?.id;
    if (!paidById) {
      setError("Authenticated user not found. Please re-login.");
      return;
    }

    setIsSubmitting(true);
    try {
      const paidByName = currentUser?.name || "You";

      let createdExpenseId = Date.now().toString();
      const createdAttachments: Attachment[] = [];

      const created = await createExpense({
        amountPaid: parsedAmount,
        transactionId,
        description,
        category,
        paidById,
        isExtraFund,
        bankFundingMode: isCompanyAccount && !isExtraFund ? bankFundingMode : "PARTNER_SPLIT",
      });

      createdExpenseId = created.id;

      if (file) {
        try {
          const att = await uploadExpenseAttachment(created.id, file);
          if (att) {
            createdAttachments.push(att);
          }
        } catch {
          // Ignore attachment upload errors
        }
      }

      onAdd({
        id: createdExpenseId,
        description,
        transactionId,
        category,
        paidBy: paidByName,
        paidById: created.paidBy.id,
        createdAt: (created as unknown as { createdAt?: string | Date }).createdAt
          ? new Date((created as unknown as { createdAt?: string | Date }).createdAt!).toISOString()
          : new Date().toISOString(),
        amount: parsedAmount,
        isExtraFund,
        bankFundingMode,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        attachments: createdAttachments,
        splits: created.splits || [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  const humanCount = partners.filter((partner) => !partner.toLowerCase().includes("flextudy")).length;

  return (
    <ModalShell
      title={isExtraFund ? "Add extra fund" : "Add expense"}
      subtitle={
        isExtraFund
          ? `This fund will be credited to your account only — not split among partners.`
          : isCompanyAccount && bankFundingMode === "POOLED_BANK"
            ? "This expense will reduce pooled company cash without creating partner dues."
            : `This expense will be split equally among all ${humanCount} partners.`
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4 pt-5 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-xs font-semibold text-red-400">
            {error}
          </div>
        )}

        {/* Extra Fund Toggle */}
        <div className={`rounded-xl border p-3.5 transition-all duration-200 ${isExtraFund ? 'border-emerald-900 bg-emerald-950/40' : 'border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)]/50'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isExtraFund ? 'bg-emerald-950/40 text-emerald-400' : 'bg-[var(--color-harvest-flame)]/10 text-[var(--color-harvest-flame)]'}`}>
                {isExtraFund ? <Wallet className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink-black)]">
                  {isExtraFund ? "Extra Fund" : "Regular Expense"}
                </p>
                <p className="text-[11px] text-[var(--color-driftwood)]">
                  {isExtraFund ? "Not split — credited to your account" : "Split equally among all partners"}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isExtraFund}
              onClick={() => setIsExtraFund(!isExtraFund)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isExtraFund ? 'bg-emerald-950/40 focus-visible:ring-emerald-500' : 'bg-[var(--color-parchment-shadow)] focus-visible:ring-[var(--color-harvest-flame)]'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--color-surface)] shadow-lg ring-0 transition duration-200 ease-in-out ${isExtraFund ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {isCompanyAccount && !isExtraFund && (
          <fieldset className="rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-3.5">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--color-warm-stone)]">Expense funding</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {([
                ["PARTNER_SPLIT", "Partner split", "Share equally; partners may owe the bank."],
                ["POOLED_BANK", "Pooled bank cash", "Use company cash; no partner dues."],
              ] as const).map(([mode, label, detail]) => (
                <button key={mode} type="button" aria-pressed={bankFundingMode === mode} onClick={() => setBankFundingMode(mode)} className={`rounded-xl border p-3 text-left transition-colors ${bankFundingMode === mode ? "border-[var(--color-harvest-flame)] bg-[var(--color-cream-canvas)] ring-1 ring-[var(--color-harvest-flame)]/20" : "border-[var(--color-parchment-shadow)] hover:bg-[var(--color-cream-canvas)]/60"}`}>
                  <span className="block text-sm font-bold text-[var(--color-ink-black)]">{label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-warm-stone)]">{detail}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)">
            <Input
              type="number"
              min="1"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </Field>
          <Field label="Transaction ID">
            <Input
              placeholder="e.g. TXN-2026-082"
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Description">
          <Input
            placeholder={isExtraFund ? "Reason for the extra fund" : "What was this expense for?"}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <CustomSelect
              options={categories}
              value={category}
              onChange={setCategory}
            />
          </Field>
          <Field label={isExtraFund ? "Contributed by" : "Paid by"}>
            <div className={`w-full py-2.5 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold text-[var(--color-ink-black)] flex items-center justify-between ${isExtraFund ? 'border-emerald-900 bg-emerald-950/40' : 'border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)]/50'}`}>
              <span>{currentUser?.name || "Authenticated User"}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isExtraFund ? 'text-emerald-400 bg-emerald-950/40' : 'text-[var(--color-harvest-flame)] bg-[var(--color-harvest-flame)]/10'}`}>You</span>
            </div>
          </Field>
        </div>

        {/* Optional File Attachment Input */}
        <Field label="Attachment (Optional Receipt / Invoice)">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-[var(--color-warm-stone)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-harvest-flame)]/10 file:text-[var(--color-harvest-flame)] hover:file:bg-[var(--color-harvest-flame)]/20 cursor-pointer"
          />
        </Field>

        {/* Preview: Extra Fund vs Equal Split */}
        {isExtraFund ? (
          <div className="rounded-[14px] border border-emerald-900 bg-emerald-950/40 px-3.5 py-3 text-xs text-[var(--color-warm-stone)]">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Extra fund contribution:</span>
            </div>
            <p className="mt-1.5 font-bold text-emerald-400">
              {amount && Number(amount) > 0
                ? `${formatAmount(Number(amount))} — credited entirely to ${currentUser?.name?.split(" ")[0] || "you"}`
                : "Enter an amount to preview"}
            </p>
            {amount && Number(amount) > 0 && (
              <p className="mt-1 text-[11px] text-[var(--color-driftwood)]">
                This amount will offset any outstanding balance {currentUser?.name?.split(" ")[0] || "you"} may owe.
              </p>
            )}
          </div>
        ) : isCompanyAccount && bankFundingMode === "POOLED_BANK" ? (
          <div className="rounded-[14px] border border-blue-900 bg-blue-950/40 px-3.5 py-3 text-xs text-blue-400">
            Pooled bank cash will decrease by <span className="font-bold">{amount && Number(amount) > 0 ? formatAmount(Number(amount)) : "the entered amount"}</span>. No partner share or repayment due will be created.
          </div>
        ) : (
          <div className="rounded-[14px] border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] px-3.5 py-3 text-xs text-[var(--color-warm-stone)]">
            Equal split:{" "}
            <span className="font-bold text-[var(--color-harvest-flame)]">
              {amount && Number(amount) > 0
                ? `${formatAmount(Number(amount) / humanCount)} per partner`
                : "Enter an amount to preview the split"}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-[var(--color-parchment-shadow)] pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={isExtraFund ? '!bg-emerald-950/40 hover:!bg-emerald-600 !border-emerald-500' : ''}
          >
            {isSubmitting ? "Adding..." : (
              isExtraFund
                ? <><Wallet className="h-4 w-4" /> Add Extra Fund</>
                : <><Plus className="h-4 w-4" /> Add Expense</>
            )}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

