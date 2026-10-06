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
} from "lucide-react";

import { CustomSelect } from "@/components/ui/custom-select";
import { getExpensesApi, createExpense, uploadExpenseAttachment } from "@/lib/api/expenses";
import { getUsersApi } from "@/lib/api/users";

type Expense = {
  id: string;
  description: string;
  transactionId: string;
  paidBy: string;
  amount: number;
  date: string;
  category: string;
  isExtraFund?: boolean;
  attachments?: Attachment[];
};

const partners = ["Aditya Sharma", "Vishal Kumar Singh", "Ujjwal Kumar Singh", "Flextudy"];
const categories = ["Software", "Hosting", "Marketing", "Operations"];

const formatAmount = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [paidBy, setPaidBy] = useState("All partners");
  const [category, setCategory] = useState("All categories");
  const [dateFilter, setDateFilter] = useState("All dates");
  const [details, setDetails] = useState<Expense | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    getExpensesApi()
      .then((items) => {
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
            isExtraFund: item.isExtraFund || false,
            attachments: item.attachments || [],
          }))
        );
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesQuery = `${expense.description} ${expense.transactionId}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesPayer = paidBy === "All partners" || expense.paidBy === paidBy;
      const matchesCategory =
        category === "All categories" || expense.category === category;
      const matchesDate =
        dateFilter === "All dates" ||
        (dateFilter === "August 2026" && expense.date.includes("Aug 2026"));
      return matchesQuery && matchesPayer && matchesCategory && matchesDate;
    });
  }, [expenses, query, paidBy, category, dateFilter]);

  // Dynamic calculations for summary cards
  const stats = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const thisMonthTotal = expenses
      .filter((e) => e.date.includes("Aug 2026"))
      .reduce((acc, curr) => acc + curr.amount, 0);
    const count = expenses.length;

    return {
      total: formatAmount(total),
      thisMonth: formatAmount(thisMonthTotal),
      count: count.toString(),
    };
  }, [expenses]);

  const resetFilters = () => {
    setQuery("");
    setPaidBy("All partners");
    setCategory("All categories");
    setDateFilter("All dates");
  };

  const hasFilters =
    Boolean(query) ||
    paidBy !== "All partners" ||
    category !== "All categories" ||
    dateFilter !== "All dates";

  return (
    <div className="min-h-screen bg-[#fff8f1] selection:bg-[#fee3b5] selection:text-[#1d1e1c] md:flex">
      <Sidebar />
      <MobileNav />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="flex flex-col gap-4 border-b border-[#e3d6c5]/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#fa5d00]">
                Partner finance
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#1d1e1c] sm:text-4xl">
                Expenses
              </h1>
              <p className="mt-1 text-sm text-[#615f5c] sm:text-base">
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
                <Card key={i} className="p-5 border-[#e3d6c5] shadow-sm animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2.5">
                      <div className="h-3 w-28 bg-[#e3d6c5]/50 rounded" />
                      <div className="h-7 w-20 bg-[#e3d6c5]/70 rounded" />
                      <div className="h-3 w-36 bg-[#e3d6c5]/30 rounded" />
                    </div>
                    <div className="h-9 w-9 bg-[#e3d6c5]/40 rounded-xl" />
                  </div>
                </Card>
              ))
            ) : (
              <>
                <Card className="p-5 border-[#e3d6c5] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                        Total Expenses
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-[#1d1e1c] sm:text-3xl">
                        {stats.total}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#615f5c]">
                        Across all shared spending
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3d6c5] bg-[#fff8f1] text-[#fa5d00]">
                      <Receipt className="h-4 w-4" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-[#e3d6c5] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                        This Month
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-[#1d1e1c] sm:text-3xl">
                        {stats.thisMonth}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#615f5c]">
                        August 2026
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3d6c5] bg-[#fff8f1] text-[#fa5d00]">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-[#e3d6c5] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                        Total Transactions
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-[#1d1e1c] sm:text-3xl">
                        {stats.count}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#615f5c]">
                        Recorded by all partners
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3d6c5] bg-[#fff8f1] text-[#fa5d00]">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </>
            )}
          </section>

          {/* Filters Row */}
          <section className="rounded-[20px] border border-[#e3d6c5] bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8b87]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search expenses..."
                  className="py-2.5 pl-10 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <CustomSelect
                  options={["All dates", "September 2026", "August 2026"]}
                  value={dateFilter}
                  onChange={setDateFilter}
                  ariaLabel="Filter by date"
                />
                <CustomSelect
                  options={["All partners", ...partners]}
                  value={paidBy}
                  onChange={setPaidBy}
                  ariaLabel="Filter by paid by"
                />
                <CustomSelect
                  options={["All categories", ...categories]}
                  value={category}
                  onChange={setCategory}
                  ariaLabel="Filter by category"
                />
              </div>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="self-center whitespace-nowrap text-xs font-semibold text-[#fa5d00] hover:underline"
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
                <h2 className="text-xl font-bold text-[#1d1e1c]">All expenses</h2>
                <p className="mt-0.5 text-sm text-[#615f5c]">
                  {isLoading ? "Loading..." : `${filteredExpenses.length} expense${filteredExpenses.length === 1 ? "" : "s"} shown`}
                </p>
              </div>
              <div className="hidden items-center gap-2 text-xs font-semibold text-[#8e8b87] sm:flex">
                <Filter className="h-3.5 w-3.5" /> Refine your results
              </div>
            </div>

            {isLoading ? (
              <Card className="p-0 overflow-hidden border border-[#e3d6c5] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#e3d6c5] text-xs uppercase tracking-wider text-[#8e8b87]">
                        <th className="px-6 py-4 font-semibold">Expense</th>
                        <th className="px-4 py-4 font-semibold">Paid by</th>
                        <th className="px-4 py-4 font-semibold">Amount</th>
                        <th className="px-4 py-4 font-semibold">Date</th>
                        <th className="w-16 px-4 py-4"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="border-b border-[#e3d6c5]/50 animate-pulse">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#e3d6c5]/40" />
                              <div className="space-y-2">
                                <div className="h-4 w-44 bg-[#e3d6c5]/60 rounded" />
                                <div className="h-3 w-28 bg-[#e3d6c5]/30 rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-28 bg-[#e3d6c5]/50 rounded" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-16 bg-[#e3d6c5]/60 rounded" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-20 bg-[#e3d6c5]/40 rounded" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-4 w-6 bg-[#e3d6c5]/30 rounded" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : filteredExpenses.length ? (
              <>
                <Card className="hidden overflow-visible p-0 md:block border border-[#e3d6c5] shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#e3d6c5] text-xs uppercase tracking-wider text-[#8e8b87]">
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
        />
      )}
      {isAddOpen && (
        <AddExpenseForm
          onClose={() => setIsAddOpen(false)}
          onAdd={(expense) => {
            setExpenses((current) => [expense, ...current]);
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
  return (
    <tr
      onClick={onView}
      className="border-b border-[#e3d6c5]/70 last:border-0 hover:bg-[#fff8f1] cursor-pointer transition-all duration-150 group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`hidden h-9 w-9 items-center justify-center rounded-xl border group-hover:scale-105 transition-transform lg:flex ${isExtra ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-[#e3d6c5] bg-[#fff8f1] text-[#fa5d00]'}`}>
            {isExtra ? <Wallet className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#1d1e1c] group-hover:text-[#fa5d00] transition-colors">{expense.description}</p>
              {isExtra && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  <Wallet className="h-2.5 w-2.5" /> Extra Fund
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#8e8b87]">{expense.transactionId}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[#1d1e1c]">{expense.paidBy}</p>
          {expense.attachments && expense.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fa5d00]/10 border border-[#fa5d00]/20 px-2 py-0.5 text-[10px] font-bold text-[#fa5d00]">
              <Paperclip className="h-3 w-3" />
              {expense.attachments.length}
            </span>
          )}
        </div>
        <span className="mt-1 inline-flex rounded-full bg-[#fa5d00]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fa5d00]">
          {expense.category}
        </span>
      </td>
      <td className={`px-4 py-4 text-sm font-bold tabular-nums ${isExtra ? 'text-emerald-600' : 'text-[#1d1e1c]'}`}>
        {isExtra ? '+' : ''}{formatAmount(expense.amount)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#615f5c]">
        {expense.date}
      </td>
      <td className="relative px-4 py-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-[#e3d6c5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#fa5d00] hover:bg-[#fa5d00] hover:text-white hover:border-[#fa5d00] transition-all shadow-sm cursor-pointer"
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
  return (
    <Card
      onClick={onView}
      className={`p-4 border shadow-sm hover:border-[#fa5d00]/40 transition-all cursor-pointer ${isExtra ? 'border-emerald-200 bg-emerald-50/30' : 'border-[#e3d6c5]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-[#1d1e1c]">{expense.description}</p>
            {isExtra && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                <Wallet className="h-2.5 w-2.5" /> Extra Fund
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#8e8b87]">{expense.transactionId}</p>
        </div>
        <p className={`shrink-0 text-lg font-bold tabular-nums ${isExtra ? 'text-emerald-600' : 'text-[#1d1e1c]'}`}>
          {isExtra ? '+' : ''}{formatAmount(expense.amount)}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#e3d6c5]/70 pt-3">
        <div>
          <p className="text-sm font-medium text-[#615f5c]">{expense.paidBy}</p>
          <p className="mt-0.5 text-xs text-[#8e8b87]">{expense.date}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-1 rounded-[12px] border border-[#e3d6c5] bg-[#fff8f1] px-2.5 py-1.5 text-xs font-semibold text-[#fa5d00] hover:bg-[#fa5d00] hover:text-white transition-colors cursor-pointer"
          aria-label={`View ${expense.description}`}
        >
          <Eye className="h-3.5 w-3.5" /> View
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex rounded-full bg-[#fa5d00]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fa5d00]">
          {expense.category}
        </span>
        {expense.attachments && expense.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fa5d00]/10 px-2 py-0.5 text-[10px] font-bold text-[#fa5d00]">
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
    <Card className="py-14 text-center border border-[#e3d6c5] shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff8f1] text-[#fa5d00]">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#1d1e1c]">No expenses yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[#615f5c]">
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
      className="fixed inset-0 z-[60] flex items-end bg-[#1d1e1c]/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-t-[24px] border border-[#e3d6c5] bg-white p-5 shadow-2xl sm:rounded-[24px] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[#e3d6c5] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1d1e1c]">{title}</h2>
            <p className="mt-1 text-sm text-[#615f5c]">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-[#8e8b87] hover:bg-[#fff8f1] hover:text-[#1d1e1c] cursor-pointer"
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
}: {
  expense: Expense;
  onClose: () => void;
  onUpdateExpense?: (updated: Expense) => void;
}) {
  const humanPartners = partners.filter((p) => p.toLowerCase() !== "flextudy");
  const share = formatAmount(Math.floor(expense.amount / humanPartners.length));
  const isExtra = expense.isExtraFund;

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
      title={isExtra ? "Extra Fund details" : "Expense details"}
      subtitle={isExtra ? "A direct contribution from a partner — not split among others." : "A shared expense split equally between partners."}
      onClose={onClose}
    >
      <div className="space-y-5 py-5 max-h-[75vh] overflow-y-auto pr-1">
        <div className={`rounded-[16px] border p-4 ${isExtra ? 'border-emerald-200 bg-emerald-50/50' : 'border-[#fee3b5] bg-[#fff8f1]'}`}>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
              Description
            </p>
            {isExtra && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                <Wallet className="h-2.5 w-2.5" /> Extra Fund
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-lg font-bold text-[#1d1e1c]">{expense.description}</p>
            <p className={`text-xl font-bold ${isExtra ? 'text-emerald-600' : 'text-[#fa5d00]'}`}>{isExtra ? '+' : ''}{formatAmount(expense.amount)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
          <Detail label="Transaction ID" value={expense.transactionId} />
          <Detail label="Category" value={expense.category} />
          <Detail label={isExtra ? "Contributed by" : "Paid by"} value={expense.paidBy} />
          <Detail label="Date" value={expense.date} />
        </div>

        {isExtra ? (
          <div className="rounded-[16px] border border-emerald-200 bg-emerald-50/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Wallet className="h-4 w-4" /> Direct contribution to Flextudy Bank Account by {expense.paidBy.split(" ")[0]}
            </div>
            <p className="mt-2 text-xs text-[#615f5c] leading-relaxed">
              This extra fund of <span className="font-bold text-emerald-600">{formatAmount(expense.amount)}</span> was
              deposited by <span className="font-semibold">{expense.paidBy}</span> into the <strong>Flextudy Bank Account</strong>.
              It is <strong>not split</strong> among partners. If {expense.paidBy.split(" ")[0]} has any
              outstanding balance to pay to the company, this fund will offset that balance automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-[16px] border border-[#e3d6c5] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1d1e1c]">
              <UserRound className="h-4 w-4 text-[#fa5d00]" /> Equal split among all {humanPartners.length} partners
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {humanPartners.map((partner) => (
                <div key={partner} className="rounded-xl bg-[#fff8f1] p-2 text-center">
                  <p className="truncate text-[11px] text-[#615f5c]">{partner.split(" ")[0]}</p>
                  <p className="mt-1 text-sm font-bold text-[#1d1e1c]">{share}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachment Section */}
        <AttachmentSection
          attachments={expense.attachments}
          onUpload={handleUpload}
          title="Expense Attachments"
        />

        <div className="flex justify-end border-t border-[#e3d6c5] pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">{label}</p>
      <p className="mt-1 font-semibold text-[#1d1e1c]">{value}</p>
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
        amount: parsedAmount,
        isExtraFund,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        attachments: createdAttachments,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  const humanCount = partners.filter((p) => p.toLowerCase() !== "flextudy").length;

  return (
    <ModalShell
      title={isExtraFund ? "Add extra fund" : "Add expense"}
      subtitle={
        isExtraFund
          ? `This fund will be credited to your account only — not split among partners.`
          : `This expense will be split equally among all ${humanCount} partners.`
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4 pt-5 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Extra Fund Toggle */}
        <div className={`rounded-[16px] border p-3.5 transition-all duration-200 ${isExtraFund ? 'border-emerald-200 bg-emerald-50/50' : 'border-[#e3d6c5] bg-[#fff8f1]/50'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isExtraFund ? 'bg-emerald-100 text-emerald-600' : 'bg-[#fa5d00]/10 text-[#fa5d00]'}`}>
                {isExtraFund ? <Wallet className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1d1e1c]">
                  {isExtraFund ? "Extra Fund" : "Regular Expense"}
                </p>
                <p className="text-[11px] text-[#8e8b87]">
                  {isExtraFund ? "Not split — credited to your account" : "Split equally among all partners"}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isExtraFund}
              onClick={() => setIsExtraFund(!isExtraFund)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isExtraFund ? 'bg-emerald-500 focus-visible:ring-emerald-500' : 'bg-[#e3d6c5] focus-visible:ring-[#fa5d00]'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isExtraFund ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

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
            <div className={`w-full py-2.5 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold text-[#1d1e1c] flex items-center justify-between ${isExtraFund ? 'border-emerald-200 bg-emerald-50/30' : 'border-[#e3d6c5] bg-[#fff8f1]/50'}`}>
              <span>{currentUser?.name || "Authenticated User"}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isExtraFund ? 'text-emerald-600 bg-emerald-100' : 'text-[#fa5d00] bg-[#fa5d00]/10'}`}>You</span>
            </div>
          </Field>
        </div>

        {/* Optional File Attachment Input */}
        <Field label="Attachment (Optional Receipt / Invoice)">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-[#615f5c] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#fa5d00]/10 file:text-[#fa5d00] hover:file:bg-[#fa5d00]/20 cursor-pointer"
          />
        </Field>

        {/* Preview: Extra Fund vs Equal Split */}
        {isExtraFund ? (
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50/50 px-3.5 py-3 text-xs text-[#615f5c]">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-500" />
              <span>Extra fund contribution:</span>
            </div>
            <p className="mt-1.5 font-bold text-emerald-600">
              {amount && Number(amount) > 0
                ? `${formatAmount(Number(amount))} — credited entirely to ${currentUser?.name?.split(" ")[0] || "you"}`
                : "Enter an amount to preview"}
            </p>
            {amount && Number(amount) > 0 && (
              <p className="mt-1 text-[11px] text-[#8e8b87]">
                This amount will offset any outstanding balance {currentUser?.name?.split(" ")[0] || "you"} may owe.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-[14px] border border-[#e3d6c5] bg-[#fff8f1] px-3.5 py-3 text-xs text-[#615f5c]">
            Equal split:{" "}
            <span className="font-bold text-[#fa5d00]">
              {amount && Number(amount) > 0
                ? `${formatAmount(Number(amount) / humanCount)} per partner`
                : "Enter an amount to preview the split"}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-[#e3d6c5] pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={isExtraFund ? '!bg-emerald-500 hover:!bg-emerald-600 !border-emerald-500' : ''}
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
    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c]">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

