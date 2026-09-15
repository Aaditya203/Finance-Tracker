"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { Attachment } from "@/types";
import { PendingSettlementsBanner, PendingSettlementItem } from "@/components/dashboard/pending-settlements-banner";
import { SettlementDetailsModal, DetailedSettlement } from "@/components/dashboard/settlement-details-modal";
import { RecordSettlementModal } from "@/components/dashboard/record-settlement-modal";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  HandCoins,
  Paperclip,
  Plus,
  Search,
  Wallet,
  XCircle,
  Loader2,
} from "lucide-react";

import { CustomSelect } from "@/components/ui/custom-select";
import { getSettlementsApi, getPendingSettlementsApi, confirmSettlementApi, rejectSettlementApi } from "@/lib/api/settlements";
import { getSummaryApi } from "@/lib/api/dashboard";

type Settlement = {
  id: string;
  from: string;
  fromUserId?: string;
  to: string;
  toUserId?: string;
  amount: number;
  date: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
  attachments?: Attachment[];
};

type PartnerBalance = {
  name: string;
  amount: number;
  status: "Receives" | "Owes";
  receives: boolean;
};

const partners = ["Aditya Sharma", "Vishal Kumar Singh", "Ujjwal Kumar Singh"];
const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      className={`${
        small ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-xs"
      } inline-flex shrink-0 items-center justify-center rounded-full bg-[#fa5d00] font-bold text-white shadow-sm`}
    >
      {initials(name)}
    </span>
  );
}

export default function SettlementsPage() {
  const { user } = useCurrentUser();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlementItem[]>([]);
  const [balances, setBalances] = useState<PartnerBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("All dates");
  const [partnerFilter, setPartnerFilter] = useState("All partners");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [modalOpen, setModalOpen] = useState(false);
  const [details, setDetails] = useState<DetailedSettlement | null>(null);

  const [refreshIndex, setRefreshIndex] = useState(0);

  const loadSettlementsData = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const userId = user?.id;
    const pendingPromise = userId
      ? getPendingSettlementsApi(userId).catch(() => ({ count: 0, settlements: [] }))
      : Promise.resolve({ count: 0, settlements: [] });

    Promise.all([getSettlementsApi(), getSummaryApi(), pendingPromise])
      .then(([settlementData, summaryData, pendingData]) => {
        if (isCancelled) return;
        setSettlements(
          settlementData.map((item) => ({
            id: item.id,
            from: item.fromUser?.name || "Unknown",
            fromUserId: item.fromUserId,
            to: item.toUser?.name || "Unknown",
            toUserId: item.toUserId,
            amount: item.amountPaid,
            status: item.status || "COMPLETED",
            date: item.settledAt
              ? new Date(item.settledAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Pending",
            attachments: item.attachments || [],
          }))
        );

        setPendingSettlements(
          (pendingData.settlements || [])
            .filter((item) => item.fromUser && item.toUser)
            .map((item) => ({
              id: item.id,
              fromUser: {
                id: item.fromUser!.id,
                name: item.fromUser!.name,
                email: item.fromUser!.email,
              },
              toUser: {
                id: item.toUser!.id,
                name: item.toUser!.name,
                email: item.toUser!.email,
              },
              amountPaid: item.amountPaid,
              status: item.status || "PENDING",
              createdAt: typeof item.createdAt === "string" ? item.createdAt : item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
              attachments: item.attachments,
            }))
        );

        setBalances(
          (summaryData.balance ?? []).map((item) => {
            const isReceiving = item.balance > 0;
            return {
              name: item.name,
              amount: Math.abs(item.balance),
              status: isReceiving ? "Receives" : ("Owes" as const),
              receives: isReceiving,
            };
          })
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user, refreshIndex]);

  const filtered = useMemo(() => {
    return settlements.filter((settlement) => {
      const searchMatch = `${settlement.from} ${settlement.to}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const partnerMatch =
        partnerFilter === "All partners" ||
        settlement.from === partnerFilter ||
        settlement.to === partnerFilter;

      const dateMatch =
        dateFilter === "All dates" || settlement.date.includes("Sep 2026") || settlement.date.includes("Aug 2026");

      const st = (settlement.status || "COMPLETED").toUpperCase();
      const statusMatch =
        statusFilter === "All statuses" ||
        (statusFilter === "Pending" && st === "PENDING") ||
        (statusFilter === "Completed" && st === "COMPLETED") ||
        (statusFilter === "Cancelled" && (st === "CANCELLED" || st === "REJECTED"));

      return searchMatch && partnerMatch && dateMatch && statusMatch;
    });
  }, [settlements, query, partnerFilter, dateFilter, statusFilter]);

  // Dynamic values based on active user context
  const summaryStats = useMemo(() => {
    const completedSettlements = settlements.filter(
      (s) => (s.status || "").toUpperCase() === "COMPLETED"
    );
    const totalSettled = completedSettlements.reduce((acc, curr) => acc + curr.amount, 0);

    const currentUserBalance = balances.find((b) => b.name === user?.name);
    let pendingToPay = 0;
    let pendingToReceive = 0;

    if (currentUserBalance) {
      if (currentUserBalance.receives) {
        pendingToReceive = currentUserBalance.amount;
      } else {
        pendingToPay = currentUserBalance.amount;
      }
    }

    return {
      totalSettled: money(totalSettled),
      pendingToPay: money(pendingToPay),
      pendingToReceive: money(pendingToReceive),
    };
  }, [settlements, balances, user]);

  const filtersActive =
    Boolean(query) ||
    dateFilter !== "All dates" ||
    partnerFilter !== "All partners" ||
    statusFilter !== "All statuses";

  const clearFilters = () => {
    setQuery("");
    setDateFilter("All dates");
    setPartnerFilter("All partners");
    setStatusFilter("All statuses");
  };

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
                Settlements
              </h1>
              <p className="mt-1 text-sm text-[#615f5c] sm:text-base">
                Track payments and settlements between partners.
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Record Settlement
            </Button>
          </header>

          {/* Pending Approvals Banner */}
          {user?.id && (
            <PendingSettlementsBanner
              pendingSettlements={pendingSettlements}
              currentUserId={user.id}
              onSettlementAction={loadSettlementsData}
            />
          )}

          {/* Dynamic Summary Cards with Skeleton */}
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
                <Card className="border-[#e3d6c5] p-5 shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                        Total Settled
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-[#fa5d00]">
                        {summaryStats.totalSettled}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#615f5c]">
                        Completed settlements recorded
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3d6c5] bg-[#fff8f1] text-[#fa5d00]">
                      <HandCoins className="h-4 w-4" />
                    </div>
                  </div>
                </Card>

                <Card className="border-[#e3d6c5] p-5 shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                        Pending to Pay
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-[#fa5d00]">
                        {summaryStats.pendingToPay}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#615f5c]">
                        Your remaining balance
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3d6c5] bg-[#fff8f1] text-[#fa5d00]">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Card>

                <Card className="border-[#e3d6c5] p-5 shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                        Pending to Receive
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-emerald-600">
                        {summaryStats.pendingToReceive}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#615f5c]">
                        Amount partners owe you
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3d6c5] bg-[#fff8f1] text-emerald-600">
                      <ArrowDownLeft className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </>
            )}
          </section>

          {/* Current Partner Balances with Skeleton */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#1d1e1c]">Current Partner Balances</h2>
              <p className="mt-0.5 text-sm text-[#615f5c]">
                See who should receive or settle the remaining balance.
              </p>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border border-[#e3d6c5] p-5 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e3d6c5]/40" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-28 bg-[#e3d6c5]/60 rounded" />
                        <div className="h-3 w-36 bg-[#e3d6c5]/30 rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {balances.map((p) => (
                  <BalanceCard
                    key={p.name}
                    name={p.name}
                    amount={money(p.amount)}
                    status={p.status}
                    receives={p.receives}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Settlement History Table / Search with Skeleton */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1d1e1c]">Settlement History</h2>
                <p className="mt-0.5 text-sm text-[#615f5c]">Payments recorded between partners.</p>
              </div>
              <span className="hidden text-xs font-semibold text-[#8e8b87] sm:block">
                {filtered.length} records shown
              </span>
            </div>

            <div className="mb-4 rounded-[20px] border border-[#e3d6c5] bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8b87]" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search settlements..."
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
                    value={partnerFilter}
                    onChange={setPartnerFilter}
                    ariaLabel="Filter by partner"
                  />
                  <CustomSelect
                    options={["All statuses", "Pending", "Completed", "Cancelled"]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    ariaLabel="Filter by status"
                  />
                </div>
                {filtersActive && (
                  <button
                    onClick={clearFilters}
                    className="self-center whitespace-nowrap text-xs font-semibold text-[#fa5d00] hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <Card className="p-0 overflow-hidden border border-[#e3d6c5] shadow-sm animate-pulse">
                <div className="h-48 bg-[#fff8f1]/30" />
              </Card>
            ) : filtered.length ? (
              <>
                <Card className="hidden overflow-hidden p-0 md:block border border-[#e3d6c5] shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#e3d6c5] text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
                        <th className="px-6 py-4">From</th>
                        <th className="px-4 py-4">To</th>
                        <th className="px-4 py-4">Amount</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Date</th>
                        <th className="w-12 px-4 py-4">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((settlement) => (
                        <SettlementRow
                          key={settlement.id}
                          settlement={settlement}
                          currentUserId={user?.id}
                          onView={() =>
                            setDetails({
                              id: settlement.id,
                              fromUser: settlement.from,
                              fromUserId: settlement.fromUserId,
                              toUser: settlement.to,
                              toUserId: settlement.toUserId,
                              amount: settlement.amount,
                              status: settlement.status,
                              date: settlement.date,
                              attachments: settlement.attachments,
                            })
                          }
                          onActionComplete={loadSettlementsData}
                        />
                      ))}
                    </tbody>
                  </table>
                </Card>
                <div className="space-y-3 md:hidden">
                  {filtered.map((settlement) => (
                    <SettlementMobileCard
                      key={settlement.id}
                      settlement={settlement}
                      currentUserId={user?.id}
                      onView={() =>
                        setDetails({
                          id: settlement.id,
                          fromUser: settlement.from,
                          fromUserId: settlement.fromUserId,
                          toUser: settlement.to,
                          toUserId: settlement.toUserId,
                          amount: settlement.amount,
                          status: settlement.status,
                          date: settlement.date,
                          attachments: settlement.attachments,
                        })
                      }
                      onActionComplete={loadSettlementsData}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Empty
                onRecord={() => setModalOpen(true)}
                filtersActive={Boolean(filtersActive)}
                onClear={clearFilters}
              />
            )}
          </section>

          {/* Activity Section */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <Card className="border-[#e3d6c5] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1d1e1c]">Recent activity</h2>
                  <p className="mt-0.5 text-sm text-[#615f5c]">Latest settlement updates</p>
                </div>
                <Clock3 className="h-5 w-5 text-[#fa5d00]" />
              </div>
              <div className="mt-5 space-y-0">
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 w-3/4 bg-[#e3d6c5]/40 rounded" />
                    <div className="h-4 w-2/3 bg-[#e3d6c5]/40 rounded" />
                  </div>
                ) : settlements.length ? (
                  settlements.slice(0, 4).map((s, idx) => (
                    <Activity
                      key={s.id}
                      day={s.date}
                      from={s.from.split(" ")[0]}
                      to={s.to.split(" ")[0]}
                      amount={money(s.amount)}
                      status={s.status}
                      last={idx === Math.min(settlements.length, 4) - 1}
                    />
                  ))
                ) : (
                  <p className="text-xs text-[#8e8b87]">No settlement activity logged.</p>
                )}
              </div>
            </Card>

            <Card className="border-[#fee3b5] bg-[#fff8f1] p-5 sm:p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fa5d00]/10 text-[#fa5d00]">
                <Wallet className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#1d1e1c]">Ready to settle?</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#615f5c]">
                Record a payment in seconds and keep each partner&apos;s balance up to date.
              </p>
              <Button size="sm" onClick={() => setModalOpen(true)} className="mt-5 w-full">
                Record Settlement
              </Button>
            </Card>
          </section>
        </div>
      </main>

      {details && (
        <SettlementDetailsModal
          settlement={details}
          onClose={() => setDetails(null)}
          onUpdateSettlement={() => {
            loadSettlementsData();
          }}
        />
      )}
      {modalOpen && (
        <RecordSettlementModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            loadSettlementsData();
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function BalanceCard({
  name,
  amount,
  status,
  receives = false,
}: {
  name: string;
  amount: string;
  status: string;
  receives?: boolean;
}) {
  const accent = receives ? "text-emerald-600" : "text-[#fa5d00]";
  return (
    <Card className={`border p-5 shadow-sm ${receives ? "border-emerald-200" : "border-[#e3d6c5]"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#1d1e1c]">{name}</p>
            <p className={`mt-0.5 text-sm font-semibold ${accent}`}>
              {status} <span className="font-bold">{amount}</span>
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            receives ? "bg-emerald-50 text-emerald-700" : "bg-[#fa5d00]/10 text-[#fa5d00]"
          }`}
        >
          {status}
        </span>
      </div>
    </Card>
  );
}

function PartnerCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={name} small />
      <span className="text-sm font-semibold text-[#1d1e1c]">{name}</span>
    </div>
  );
}

function SettlementRow({
  settlement,
  currentUserId,
  onView,
  onActionComplete,
}: {
  settlement: Settlement;
  currentUserId?: string;
  onView?: () => void;
  onActionComplete?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const st = (settlement.status || "COMPLETED").toUpperCase();
  const isPending = st === "PENDING";
  const isCancelled = st === "CANCELLED" || st === "REJECTED";
  const isRecipient = currentUserId && settlement.toUserId === currentUserId;

  const handleQuickAction = async (e: React.MouseEvent, type: "confirm" | "reject") => {
    e.stopPropagation();
    if (!currentUserId) return;
    setIsSubmitting(true);
    try {
      if (type === "confirm") {
        await confirmSettlementApi(settlement.id);
      } else {
        await rejectSettlementApi(settlement.id);
      }
      if (onActionComplete) {
        onActionComplete();
      }
    } catch {
      // ignore error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <tr
      onClick={onView}
      className="border-b border-[#e3d6c5]/70 last:border-0 hover:bg-[#fff8f1] cursor-pointer transition-all duration-150 group"
    >
      <td className="px-6 py-4">
        <PartnerCell name={settlement.from} />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-3.5 w-3.5 text-[#fa5d00]" />
          <PartnerCell name={settlement.to} />
        </div>
      </td>
      <td className="px-4 py-4 text-sm font-bold text-[#1d1e1c]">
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{money(settlement.amount)}</span>
          {settlement.attachments && settlement.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fa5d00]/10 border border-[#fa5d00]/20 px-2 py-0.5 text-[10px] font-bold text-[#fa5d00]">
              <Paperclip className="h-3 w-3" />
              {settlement.attachments.length}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        {isPending ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
            <Clock3 className="h-3.5 w-3.5 text-amber-600" />
            Pending
          </span>
        ) : isCancelled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#615f5c]">
        {settlement.date}
      </td>
      <td className="relative px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {isPending && isRecipient && (
            <>
              <button
                onClick={(e) => handleQuickAction(e, "confirm")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Confirm
              </button>
              <button
                onClick={(e) => handleQuickAction(e, "reject")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView();
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[#e3d6c5] bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm cursor-pointer"
            aria-label="View settlement details"
          >
            <Eye className="h-3.5 w-3.5" /> Details
          </button>
        </div>
      </td>
    </tr>
  );
}

function SettlementMobileCard({
  settlement,
  currentUserId,
  onView,
  onActionComplete,
}: {
  settlement: Settlement;
  currentUserId?: string;
  onView?: () => void;
  onActionComplete?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const st = (settlement.status || "COMPLETED").toUpperCase();
  const isPending = st === "PENDING";
  const isCancelled = st === "CANCELLED" || st === "REJECTED";
  const isRecipient = currentUserId && settlement.toUserId === currentUserId;

  const handleQuickAction = async (e: React.MouseEvent, type: "confirm" | "reject") => {
    e.stopPropagation();
    if (!currentUserId) return;
    setIsSubmitting(true);
    try {
      if (type === "confirm") {
        await confirmSettlementApi(settlement.id);
      } else {
        await rejectSettlementApi(settlement.id);
      }
      if (onActionComplete) {
        onActionComplete();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      onClick={onView}
      className={`p-4 border shadow-sm transition-all cursor-pointer ${
        isPending
          ? "border-amber-300 bg-amber-50/30"
          : isCancelled
          ? "border-red-200"
          : "border-[#e3d6c5]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={settlement.from} small />
          <ArrowRight className="h-4 w-4 shrink-0 text-[#fa5d00]" />
          <Avatar name={settlement.to} small />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-[#1d1e1c] tabular-nums">{money(settlement.amount)}</p>
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="inline-flex items-center gap-1 rounded-[12px] border border-[#e3d6c5] bg-[#fff8f1] px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              aria-label={`View settlement details`}
            >
              <Eye className="h-3.5 w-3.5" /> View
            </button>
          )}
        </div>
      </div>
      <div className="mt-3">
        <p className="font-semibold text-[#1d1e1c]">{settlement.from}</p>
        <div className="my-1 flex items-center gap-1.5 text-xs text-[#fa5d00]">
          <ArrowDownLeft className="h-3.5 w-3.5" /> paid to
        </div>
        <p className="font-semibold text-[#1d1e1c]">{settlement.to}</p>
      </div>

      {isPending && isRecipient && (
        <div className="mt-3 flex items-center gap-2 border-t border-amber-200 pt-3">
          <button
            onClick={(e) => handleQuickAction(e, "confirm")}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Confirm Receipt
          </button>
          <button
            onClick={(e) => handleQuickAction(e, "reject")}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-white py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Reject
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[#e3d6c5]/70 pt-3">
        {isPending ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800">
            <Clock3 className="h-3.5 w-3.5 text-amber-600" /> Pending Approval
          </span>
        ) : isCancelled ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </span>
        )}
        <div className="flex items-center gap-2">
          {settlement.attachments && settlement.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fa5d00]/10 px-2 py-0.5 text-[10px] font-bold text-[#fa5d00]">
              <Paperclip className="h-3 w-3" />
              {settlement.attachments.length}
            </span>
          )}
          <span className="text-xs text-[#8e8b87]">{settlement.date}</span>
        </div>
      </div>
    </Card>
  );
}

function Activity({
  day,
  from,
  to,
  amount,
  status,
  last = false,
}: {
  day: string;
  from: string;
  to: string;
  amount: string;
  status?: string;
  last?: boolean;
}) {
  const st = (status || "COMPLETED").toUpperCase();
  const isPending = st === "PENDING";
  const isCancelled = st === "CANCELLED" || st === "REJECTED";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
            isPending ? "bg-amber-500" : isCancelled ? "bg-red-500" : "bg-[#fa5d00]"
          }`}
        />
        {!last && <span className="my-1 h-full w-px bg-[#e3d6c5]" />}
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#8e8b87]">{day}</p>
          {isPending && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
              Pending
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-[#1d1e1c]">
          <span className="font-semibold">{from}</span> paid{" "}
          <span className="font-semibold">{amount}</span> to{" "}
          <span className="font-semibold">{to}</span>
        </p>
      </div>
    </div>
  );
}

function Empty({
  onRecord,
  filtersActive,
  onClear,
}: {
  onRecord: () => void;
  filtersActive: boolean;
  onClear: () => void;
}) {
  return (
    <Card className="py-14 text-center border border-[#e3d6c5] shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff8f1] text-[#fa5d00]">
        <ArrowLeftRight className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#1d1e1c]">No settlements found</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[#615f5c]">
        {filtersActive
          ? "No settlements match your current filters."
          : "Settlement payments between partners will appear here."}
      </p>
      <div className="mt-5 flex justify-center gap-3">
        {filtersActive && (
          <Button variant="secondary" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
        <Button size="sm" onClick={onRecord}>
          <Plus className="h-4 w-4" /> Record First Settlement
        </Button>
      </div>
    </Card>
  );
}
