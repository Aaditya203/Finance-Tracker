"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { DashboardBalanceItem } from "@/types";
import { PartnerSettlementSuggestion } from "@/types";
import { ArrowRight, TrendingUp, TrendingDown, Minus, CheckCircle2 } from "lucide-react";

interface PartnerBalancesProps {
  balances?: DashboardBalanceItem[];
  currentUserId?: string;
  isLoading?: boolean;
  settlementPlan?: PartnerSettlementSuggestion[];
}

const isCompanyAccountName = (name: string) => name.toLowerCase().includes("flextudy") || name.toLowerCase().includes("flextudy");

export function PartnerBalances({ balances, currentUserId, isLoading, settlementPlan = [] }: PartnerBalancesProps) {
  const sortedBalances = React.useMemo(() => {
    if (!balances) return [];
    
    // The company account is a counterparty, not a fourth partner.
    const humanBalances = balances.filter((balance) => !isCompanyAccountName(balance.name));

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
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--color-ink-black)]">Partner Balances</h2>
          <span className="text-xs sm:text-sm font-semibold text-[var(--color-driftwood)]">3 Partners</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} variant="paper" className="p-3.5 sm:p-5 border border-[var(--color-parchment-shadow)] shadow-sm animate-pulse space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[var(--color-parchment-shadow)]/40 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-4 w-20 sm:w-28 bg-[var(--color-parchment-shadow)]/60 rounded" />
                  <div className="h-2.5 w-12 bg-[var(--color-parchment-shadow)]/30 rounded" />
                </div>
              </div>
              <div className="h-5 w-24 bg-[var(--color-parchment-shadow)]/50 rounded" />
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
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--color-ink-black)]">Partner Balances</h2>
          <p className="text-xs sm:text-sm text-[var(--color-warm-stone)] mt-0.5">
            Partner shares, bank dues, and clear transfer directions
          </p>
        </div>
        <span className="text-xs sm:text-sm font-bold text-[var(--color-harvest-flame)] bg-[var(--color-cream-canvas)] border border-[var(--color-parchment-shadow)] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-2xs">
          {sortedBalances.length} Partners
        </span>
      </div>

      <Card variant="paper" className="overflow-hidden border border-[var(--color-parchment-shadow)] p-0 shadow-sm">
        <div className="border-b border-[var(--color-parchment-shadow)]/70 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold text-[var(--color-ink-black)]">Who pays whom</h3>
          <p className="mt-0.5 text-xs text-[var(--color-warm-stone)]">Suggested partner transfers after shared expenses and pending payments.</p>
        </div>
        {settlementPlan.length ? (
          <div className="divide-y divide-[var(--color-parchment-shadow)]/70">
            {settlementPlan.map((payment) => (
              <div key={`${payment.fromUserId}-${payment.toUserId}`} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
                  <span className="truncate font-semibold text-[var(--color-ink-black)]">{payment.from}</span>
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[var(--color-harvest-flame)]" />
                  <span className="truncate font-semibold text-[var(--color-ink-black)]">{payment.to}</span>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-ink-black)] sm:text-base">₹{payment.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--color-success)] sm:px-5">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> No partner payments due
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {sortedBalances.map((item) => {
          const isCurrentUser = item.userId === currentUserId;
          const humanPartnerCount = sortedBalances.filter((balance) => !isCompanyAccountName(balance.name)).length || 3;
          const partnerBalance = item.balance + item.companyDue;
          const isPositive = partnerBalance > 0;
          const isNegative = partnerBalance < 0;
          const isZero = partnerBalance === 0;

          const initials = item.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2);

          return (
            <Card
              key={item.userId}
              variant="paper"
              className={`p-3.5 sm:p-5 border rounded-xl sm:rounded-xl transition-all duration-200 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                isCurrentUser
                  ? "border-[var(--color-harvest-flame)]/60 bg-gradient-to-br from-white via-[var(--color-cream-canvas)]/80 to-[var(--color-surface-raised)]/60 ring-2 ring-[var(--color-harvest-flame)]/30 shadow-md"
                  : "border-[var(--color-parchment-shadow)] hover:border-[var(--color-harvest-flame)]/40 bg-[var(--color-surface)]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-base shrink-0 border shadow-xs ${
                        isCurrentUser
                          ? "bg-[var(--color-harvest-flame)] text-white border-[var(--color-harvest-flame)]"
                          : "bg-[var(--color-cream-canvas)] text-[var(--color-ink-black)] border-[var(--color-parchment-shadow)]"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-base font-extrabold text-[var(--color-ink-black)] truncate">
                        {item.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs font-semibold text-[var(--color-warm-stone)] truncate">
                        Partner
                      </p>
                    </div>
                  </div>

                  {isCurrentUser && (
                    <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider bg-[var(--color-harvest-flame)] text-white px-2 py-0.5 rounded-full shadow-xs">
                      You
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2 pt-2.5 border-t border-[var(--color-parchment-shadow)]/70">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="font-semibold text-[var(--color-driftwood)]">Total Paid:</span>
                    <span className="font-bold text-[var(--color-ink-black)]">
                      ₹{item.totalPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="font-semibold text-[var(--color-driftwood)]">
                      {`1/${humanPartnerCount} Share:`}
                    </span>
                    <span className="font-bold text-[var(--color-warm-stone)]">
                      ₹{item.totalShare.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {item.extraFunds > 0 && (
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="font-semibold text-[var(--color-success)]">Funding remaining:</span>
                      <span className="font-bold text-[var(--color-success)]">₹{item.extraFunds.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {item.companyDue > 0 && (
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">Owes Flextudy Official:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">₹{item.companyDue.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--color-parchment-shadow)]/70 flex items-center justify-between flex-wrap gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-[var(--color-driftwood)]">Partner net</span>
                {isPositive && (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-[var(--color-success)] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full text-[10px] sm:text-xs font-extrabold border border-emerald-200 dark:border-emerald-900">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Gets back ₹{partnerBalance.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {isNegative && (
                  <div className="flex items-center gap-1 text-[var(--color-harvest-flame)] bg-[var(--color-cream-canvas)] px-2 py-1 rounded-full text-[10px] sm:text-xs font-extrabold border border-[var(--color-marigold-glow)]">
                    <TrendingDown className="w-3.5 h-3.5 text-[var(--color-harvest-flame)]" />
                    <span>Owes partners ₹{Math.abs(partnerBalance).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {isZero && (
                  <div className="flex items-center gap-1 text-[var(--color-warm-stone)] bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-full text-[10px] sm:text-xs font-extrabold border border-neutral-200 dark:border-neutral-800">
                    <Minus className="w-3.5 h-3.5 text-[var(--color-driftwood)]" />
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
