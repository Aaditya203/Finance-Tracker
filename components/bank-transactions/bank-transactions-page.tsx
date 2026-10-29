"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownLeft, ArrowRight, ArrowUpRight, Banknote, Clock, Download, FileText, LoaderCircle, Lock, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { DatePicker } from "@/components/ui/date-picker";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { isCompanyBankAccount } from "@/lib/finance";
import { createBankTransactionApi, getBankTransactionsApi, uploadBankTransactionAttachment, updateBankTransactionApi, deleteBankTransactionApi } from "@/lib/api/bank-transactions";
import { buildBankTransactionsCsv } from "@/lib/bank-transaction-export";
import { isWithinTwoDays, getTimeRemainingText } from "@/lib/time-limit";
import type { BankTransactionReason, BankTransactionRecord, BankTransactionType, CreateBankTransactionPayload } from "@/types";

type Scope = "all" | "parents" | "teachers";
const reasonLabels: Record<BankTransactionReason, string> = {
  STUDENT: "Student payment",
  TEACHER: "Teacher payment",
  EMPLOYEE: "Employee",
  DIRECTOR_LOAN_REPAYMENT: "Director loan repayment",
  OTHER: "Other",
};
const typeLabels: Record<BankTransactionType, string> = { CREDIT: "Credit · received", DEBIT: "Debit · paid" };
const currency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const localDateInput = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

export function BankTransactionsPage({ scope }: { scope: Scope }) {
  const { user } = useCurrentUser();
  const canRecord = Boolean(user && isCompanyBankAccount(user));
  const [items, setItems] = useState<BankTransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ credits: 0, debits: 0, count: 0 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BankTransactionRecord | null>(null);
  const [details, setDetails] = useState<BankTransactionRecord | null>(null);
  const [error, setError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const loadPage = useCallback(async () => {
    try {
      const result = await getBankTransactionsApi({ page, scope, query: query.trim() || undefined, type: typeFilter, date: dateFilter || undefined });
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setSummary(result.summary);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load bank activity.");
    } finally {
      setLoading(false);
    }
  }, [page, scope, query, typeFilter, dateFilter]);
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadPage();
  }, [loadPage]);
  useEffect(() => {
    // Starts an async server request; state changes happen only after its response settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage();
  }, [loadPage]);

  const filtered = items;
  const pageStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => pageStart + index);
  const title = scope === "parents" ? "Parents" : scope === "teachers" ? "Teachers" : "Bank Activity";
  const subtitle = scope === "parents"
    ? "Record student payments received into the official bank account."
    : scope === "teachers"
      ? "Track payments made to teachers from the official bank account."
      : "A clear record of money received and paid by Flextudy.";
  const defaultReason: BankTransactionReason = scope === "parents" ? "STUDENT" : scope === "teachers" ? "TEACHER" : "OTHER";

  return (
    <div className="min-h-screen bg-[#fff8f1] text-[#1d1e1c] md:flex">
      <Sidebar />
      <MobileNav />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="flex flex-col gap-4 border-b border-[#e3d6c5]/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#fa5d00]">Flextudy Finance Tracker</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-1 text-sm text-[#615f5c] sm:text-base">{subtitle}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => setIsExportModalOpen(true)}
                disabled={summary.count === 0}
                className="w-full whitespace-nowrap sm:w-auto"
                title="Export transactions to Excel by date range."
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
              {canRecord && <Button onClick={() => setIsFormOpen(true)} className="w-full whitespace-nowrap sm:w-auto"><Plus className="h-4 w-4" /> Record transaction</Button>}
            </div>
          </header>

          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Bank sections">
            {([ ["all", "Bank activity", "/bank-transactions"], ["parents", "Parents", "/parents"], ["teachers", "Teachers", "/teachers"] ] as const).map(([key, label, href]) => (
              <Link key={key} href={href} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${scope === key ? "border-[#fa5d00] bg-[#fa5d00] text-white" : "border-[#e3d6c5] bg-white text-[#615f5c] hover:border-[#fa5d00]/50 hover:text-[#fa5d00]"}`}>{label}</Link>
            ))}
          </div>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <SummaryCard label="Transactions" amount={String(summary.count)} supporting="Recorded bank entries" icon={<FileText className="h-4 w-4" />} />
            <SummaryCard label="Money received" amount={currency(summary.credits)} supporting="Credits to company cash" positive icon={<ArrowDownLeft className="h-4 w-4" />} />
            <SummaryCard label="Money paid" amount={currency(summary.debits)} supporting="Debits from company cash" icon={<ArrowUpRight className="h-4 w-4" />} />
          </section>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#615f5c]"><Banknote className="h-4 w-4 text-[#fa5d00]" /> Visible to all partners · Only Flextudy Official can record transactions or upload proof.</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_200px_190px]">
              <label className="relative block">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8b87]" />
                <Input
                  className="h-[50px] rounded-[16px] pl-10"
                  placeholder="Search name, ID, receipt, or UTR..."
                  value={query}
                  onChange={(event) => {
                    setLoading(true);
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <CustomSelect
                ariaLabel="Filter by transaction type"
                value={typeFilter}
                onChange={(val) => {
                  setLoading(true);
                  setTypeFilter(val);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All transaction types" },
                  { value: "CREDIT", label: "Money received" },
                  { value: "DEBIT", label: "Money paid" },
                ]}
                triggerClassName="h-[50px] rounded-[16px]"
              />
              <DatePicker
                ariaLabel="Filter by date"
                value={dateFilter}
                onChange={(val) => {
                  setLoading(true);
                  setDateFilter(val);
                  setPage(1);
                }}
                placeholder="Filter by date"
                clearable
                triggerClassName="h-[50px] rounded-[16px]"
              />
            </div>
          </Card>

          {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error} <button onClick={() => void refresh()} className="ml-2 underline">Retry</button></div>}

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><h2 className="text-xl font-bold">{scope === "parents" ? "Student payments" : scope === "teachers" ? "Teacher payments" : "Transaction history"}</h2><p className="mt-1 text-sm text-[#8e8b87]">{total} {total === 1 ? "entry" : "entries"}</p></div>
              {(query || typeFilter !== "ALL" || dateFilter) && <button className="text-sm font-semibold text-[#fa5d00]" onClick={() => { setLoading(true); setQuery(""); setTypeFilter("ALL"); setDateFilter(""); setPage(1); }}>Clear filters</button>}
            </div>
            {loading ? <Card className="animate-pulse p-8 text-center text-sm text-[#8e8b87]">Loading transactions…</Card> : filtered.length === 0 ? (
              <Card className="py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff8f1] text-[#fa5d00]"><Users className="h-5 w-5" /></div>
                <h3 className="mt-4 text-lg font-bold">{summary.count === 0 ? "No transactions yet" : "No matching transactions"}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#615f5c]">{summary.count === 0 ? "Official bank receipts and payments will appear here once recorded." : "Try a different name, receipt number, or date filter."}</p>
                {summary.count === 0 && canRecord && <Button className="mt-5" onClick={() => setIsFormOpen(true)}><Plus className="h-4 w-4" /> Record first transaction</Button>}
              </Card>
            ) : (
              <>
                <Card className="hidden overflow-hidden p-0 md:block">
                  <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left">
                    <thead className="bg-[#fff8f1] text-[11px] uppercase tracking-wider text-[#8e8b87]"><tr><th className="px-5 py-3.5">Receipt / invoice</th><th className="px-4 py-3.5">Name &amp; reference</th><th className="px-4 py-3.5">Type / reason</th><th className="px-4 py-3.5">Amount</th><th className="px-4 py-3.5">Date</th><th className="px-4 py-3.5 text-right">Details</th></tr></thead>
                    <tbody>{filtered.map((item) => <tr key={item.id} onClick={() => setDetails(item)} className="cursor-pointer border-t border-[#e3d6c5]/70 transition-colors hover:bg-[#fff8f1]/70">
                      <td className="px-5 py-4"><span className="font-semibold">{item.invoiceNumber}</span><p className="mt-1 text-xs text-[#8e8b87]">{item.utrNumber ? `UTR: ${item.utrNumber}` : <span className="font-medium text-amber-600">No UTR</span>} · {item.attachments.length ? `${item.attachments.length} file attached` : "No file attached"}</p></td>
                      <td className="px-4 py-4"><span className="font-semibold">{item.counterpartyName}</span><p className="mt-1 text-xs text-[#8e8b87]">{item.type === "CREDIT" ? "Paid into Flextudy Official" : "Paid from Flextudy Official"}{item.reason === "STUDENT" && item.studentId ? ` · Student ID ${item.studentId}` : item.reason === "TEACHER" && item.teacherId ? ` · Teacher ID ${item.teacherId}` : ""}</p></td>
                      <td className="px-4 py-4"><TypeBadge type={item.type} /><p className="mt-1.5 text-xs text-[#8e8b87]">{reasonLabels[item.reason]}</p></td>
                      <td className={`px-4 py-4 font-bold tabular-nums ${item.type === "CREDIT" ? "text-emerald-700" : "text-[#1d1e1c]"}`}>{item.type === "CREDIT" ? "+" : "−"}{currency(item.amount)}</td>
                      <td className="px-4 py-4 text-sm text-[#615f5c]">{new Date(item.transactionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-4 text-right"><button onClick={(event) => { event.stopPropagation(); setDetails(item); }} className="rounded-xl border border-[#e3d6c5] bg-white px-3 py-2 text-xs font-semibold text-[#fa5d00] hover:border-[#fa5d00]">View</button></td>
                    </tr>)}</tbody>
                  </table></div>
                </Card>
                <div className="space-y-3 md:hidden">{filtered.map((item) => <button key={item.id} type="button" onClick={() => setDetails(item)} className="w-full rounded-[20px] border border-[#e3d6c5] bg-white p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,.06)] transition-colors hover:border-[#fa5d00]/50">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{item.counterpartyName}</p><p className="mt-1 text-xs text-[#8e8b87]">{item.invoiceNumber} · {item.utrNumber ? `UTR: ${item.utrNumber}` : <span className="font-medium text-amber-600">No UTR</span>}</p></div><p className={`shrink-0 text-lg font-bold tabular-nums ${item.type === "CREDIT" ? "text-emerald-700" : "text-[#1d1e1c]"}`}>{item.type === "CREDIT" ? "+" : "−"}{currency(item.amount)}</p></div>
                  <div className="mt-3 flex flex-wrap items-center gap-2"><TypeBadge type={item.type} /><span className="text-xs text-[#615f5c]">{reasonLabels[item.reason]}</span></div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#e3d6c5]/70 pt-3 text-xs text-[#8e8b87]"><span>{item.type === "CREDIT" ? "Into official bank" : "Out of official bank"}{item.reason === "STUDENT" ? ` · ID ${item.studentId || "—"}` : item.reason === "TEACHER" ? ` · ID ${item.teacherId || "—"}` : ""}</span><span>{new Date(item.transactionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                </button>)}</div>
              </>
            )}
            {total > 0 && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#e3d6c5] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#615f5c]">Showing {Math.min((page - 1) * 10 + 1, total)}–{Math.min(page * 10, total)} of {total} entries</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => Math.max(1, current - 1)); }}>Previous</Button>
                  <div className="flex items-center gap-1" aria-label="Transaction pages">
                    {visiblePages.map((pageNumber) => <button key={pageNumber} aria-current={pageNumber === page ? "page" : undefined} onClick={() => { setLoading(true); setPage(pageNumber); }} className={`h-9 min-w-9 rounded-xl px-2 text-sm font-semibold transition-colors ${pageNumber === page ? "bg-[#fa5d00] text-white" : "text-[#615f5c] hover:bg-[#fff8f1]"}`}>{pageNumber}</button>)}
                  </div>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => { setLoading(true); setPage((current) => Math.min(totalPages, current + 1)); }}>Next</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {isFormOpen && (
        <TransactionForm
          scope={scope}
          defaultReason={defaultReason}
          onClose={() => setIsFormOpen(false)}
          onCreated={async () => {
            setIsFormOpen(false);
            if (page === 1) await refresh();
            else setPage(1);
          }}
        />
      )}
      {editingItem && (
        <TransactionForm
          scope={scope}
          defaultReason={defaultReason}
          initialItem={editingItem}
          onClose={() => setEditingItem(null)}
          onCreated={async () => {
            setEditingItem(null);
            await refresh();
          }}
        />
      )}
      {details && (
        <TransactionDetails
          item={details}
          canRecord={canRecord}
          onClose={() => setDetails(null)}
          onEdit={() => {
            const target = details;
            setDetails(null);
            setEditingItem(target);
          }}
          onDeleted={async () => {
            setDetails(null);
            await refresh();
          }}
        />
      )}
      {isExportModalOpen && (
        <ExportTransactionsModal
          scope={scope}
          initialType={typeFilter}
          initialDate={dateFilter}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, amount, supporting, icon, positive = false }: { label: string; amount: string; supporting: string; icon: ReactNode; positive?: boolean }) {
  return <Card className="p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">{label}</p><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${positive ? "bg-emerald-50 text-emerald-700" : "bg-[#fff8f1] text-[#fa5d00]"}`}>{icon}</span></div><p className="mt-3 truncate text-xl font-bold tabular-nums sm:text-2xl">{amount}</p><p className="mt-1 text-xs text-[#8e8b87]">{supporting}</p></Card>;
}

function TypeBadge({ type }: { type: BankTransactionType }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${type === "CREDIT" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{typeLabels[type]}</span>;
}

function TransactionForm({
  scope,
  defaultReason,
  initialItem,
  onClose,
  onCreated,
}: {
  scope: Scope;
  defaultReason: BankTransactionReason;
  initialItem?: BankTransactionRecord | null;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const isEditing = Boolean(initialItem);
  const [invoiceNumber, setInvoiceNumber] = useState(initialItem?.invoiceNumber ?? "");
  const [utrNumber, setUtrNumber] = useState(initialItem?.utrNumber ?? "");
  const [counterpartyName, setCounterpartyName] = useState(initialItem?.counterpartyName ?? "");
  const [transactionDate, setTransactionDate] = useState(
    initialItem
      ? new Date(initialItem.transactionDate).toISOString().slice(0, 10)
      : localDateInput()
  );
  const [amount, setAmount] = useState(initialItem ? String(initialItem.amount) : "");
  const [type, setType] = useState<BankTransactionType>(
    initialItem ? initialItem.type : defaultReason === "TEACHER" ? "DEBIT" : "CREDIT"
  );
  const [reason, setReason] = useState<BankTransactionReason>(
    initialItem?.reason ?? defaultReason
  );
  const [studentId, setStudentId] = useState(initialItem?.studentId ?? "");
  const [teacherId, setTeacherId] = useState(initialItem?.teacherId ?? "");
  const [note, setNote] = useState(initialItem?.note ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedTransactionId, setSavedTransactionId] = useState<string | null>(null);
  const expectedType = reason === "STUDENT" ? "CREDIT" : reason === "TEACHER" ? "DEBIT" : type;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload: CreateBankTransactionPayload = {
      invoiceNumber: invoiceNumber.trim(),
      utrNumber: utrNumber.trim(),
      counterpartyName: counterpartyName.trim(),
      transactionDate,
      type: expectedType,
      reason,
      amount: Number(amount),
      note: note.trim() || undefined,
      ...(reason === "STUDENT" ? { studentId: studentId.trim() } : {}),
      ...(reason === "TEACHER" ? { teacherId: teacherId.trim() } : {}),
    };
    try {
      if (isEditing && initialItem) {
        await updateBankTransactionApi(initialItem.id, payload);
        if (file) {
          try {
            await uploadBankTransactionAttachment(initialItem.id, file);
          } catch (uploadError) {
            setError(
              uploadError instanceof Error
                ? `Transaction updated, but the file could not upload: ${uploadError.message}`
                : "Transaction updated, but the file could not upload."
            );
            setSaving(false);
            return;
          }
        }
      } else {
        const createdId = savedTransactionId ?? (await createBankTransactionApi(payload)).id;
        if (!savedTransactionId) setSavedTransactionId(createdId);
        if (file) {
          try {
            await uploadBankTransactionAttachment(createdId, file);
          } catch (uploadError) {
            setError(
              uploadError instanceof Error
                ? `Transaction saved, but the file could not upload: ${uploadError.message}`
                : "Transaction saved, but the file could not upload."
            );
            setSaving(false);
            return;
          }
        }
      }
      await onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : isEditing ? "Could not update this transaction." : "Could not save this transaction.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#1d1e1c]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="bank-transaction-title" className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[24px] border border-[#e3d6c5] bg-white p-5 shadow-2xl sm:rounded-[24px] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="bank-transaction-title" className="text-xl font-bold">
              {isEditing
                ? `Edit transaction (${initialItem?.invoiceNumber})`
                : scope === "parents"
                  ? "Record parent payment"
                  : scope === "teachers"
                    ? "Record teacher payment"
                    : "Record bank transaction"}
            </h2>
            <p className="mt-1 text-sm text-[#615f5c]">
              {isEditing
                ? "Update transaction details. Any changes will adjust the Flextudy Official balance."
                : "This entry changes the Flextudy Official cash balance only."}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-[#8e8b87] hover:bg-[#fff8f1] hover:text-[#1d1e1c]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Invoice / receipt number">
              <Input className="h-[48px] rounded-[14px] px-3.5" placeholder="e.g. REC-2026-104" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} required />
            </Field>
            <Field label="UTR number">
              <Input className="h-[48px] rounded-[14px] px-3.5" placeholder="e.g. 429381920192 or UTR reference" value={utrNumber} onChange={(event) => setUtrNumber(event.target.value)} required />
            </Field>
            <Field label="Transaction date">
              <DatePicker
                ariaLabel="Transaction date"
                value={transactionDate}
                onChange={setTransactionDate}
                placeholder="Select date"
                required
                triggerClassName="h-[48px] rounded-[14px]"
              />
            </Field>
            <Field label={reason === "STUDENT" ? "Parent / payer name" : reason === "TEACHER" ? "Teacher name" : "Name"}>
              <Input className="h-[48px] rounded-[14px] px-3.5" placeholder="Full name" value={counterpartyName} onChange={(event) => setCounterpartyName(event.target.value)} required />
            </Field>
            <Field label="Amount (₹)">
              <Input className="h-[48px] rounded-[14px] px-3.5" type="number" min="1" step="1" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </Field>
            <Field label="Transaction type">
              <CustomSelect
                ariaLabel="Transaction type"
                value={expectedType}
                onChange={(val) => setType(val as BankTransactionType)}
                options={[
                  { value: "CREDIT", label: "Credit · money received" },
                  { value: "DEBIT", label: "Debit · money paid" },
                ]}
                disabled={reason === "STUDENT" || reason === "TEACHER"}
                triggerClassName="h-[48px] rounded-[14px]"
              />
            </Field>
            <Field label="Reason">
              <CustomSelect
                ariaLabel="Reason"
                value={reason}
                onChange={(val) => {
                  const nextReason = val as BankTransactionReason;
                  setReason(nextReason);
                  if (nextReason === "STUDENT") setType("CREDIT");
                  if (nextReason === "TEACHER") setType("DEBIT");
                }}
                options={[
                  { value: "STUDENT", label: "Students / parent payment" },
                  { value: "TEACHER", label: "Teacher payment" },
                  { value: "EMPLOYEE", label: "Employee" },
                  { value: "DIRECTOR_LOAN_REPAYMENT", label: "Director loan repayment" },
                  { value: "OTHER", label: "Other" },
                ]}
                triggerClassName="h-[48px] rounded-[14px]"
              />
            </Field>
            {reason === "STUDENT" && (
              <Field label="Student ID">
                <Input className="h-[48px] rounded-[14px] px-3.5" placeholder="Student ID" value={studentId} onChange={(event) => setStudentId(event.target.value)} required />
              </Field>
            )}
            {reason === "TEACHER" && (
              <Field label="Teacher ID">
                <Input className="h-[48px] rounded-[14px] px-3.5" placeholder="Teacher ID" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} required />
              </Field>
            )}
          </div>
          <Field label={isEditing ? "Upload additional receipt / bill (optional)" : "Receipt / bill (JPG, PNG or PDF · max 10 MB)"}>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full rounded-[14px] border border-[#e3d6c5] bg-[#fff8f1]/40 p-3 text-sm text-[#615f5c] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fa5d00]/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#fa5d00]" />
          </Field>
          <Field label="Note (optional)">
            <textarea className="min-h-[88px] w-full resize-y rounded-[14px] border border-[#c0bbb6] bg-white px-3.5 py-3 text-sm text-[#1d1e1c] placeholder:text-[#8e8b87] focus:border-[#fa5d00] focus:outline-none focus:ring-2 focus:ring-[#fa5d00]/20" placeholder="Add any helpful context..." value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} />
          </Field>
          <div className={`rounded-[16px] border p-4 ${expectedType === "CREDIT" ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#615f5c]">Bank balance effect</p>
            <p className={`mt-1 text-sm font-semibold ${expectedType === "CREDIT" ? "text-emerald-800" : "text-amber-900"}`}>
              {expectedType === "CREDIT" ? "Adds" : "Deducts"} {amount && Number(amount) > 0 ? currency(Number(amount)) : "the entered amount"} {expectedType === "CREDIT" ? "to" : "from"} pooled company cash. This does not create partner split balances.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-[#e3d6c5] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (isEditing ? "Updating…" : "Saving…") : isEditing ? "Save changes" : "Record transaction"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TransactionDetails({
  item,
  canRecord,
  onClose,
  onEdit,
  onDeleted,
}: {
  item: BankTransactionRecord;
  canRecord: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDeleted?: () => void | Promise<void>;
}) {
  const isMissingUtr = !item.utrNumber || item.utrNumber.trim() === "";
  const isEditable = canRecord && (isWithinTwoDays(item.createdAt) || isMissingUtr);
  const timeRemaining = getTimeRemainingText(item.createdAt);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteBankTransactionApi(item.id);
      if (onDeleted) {
        await onDeleted();
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete transaction.");
      setIsDeleting(false);
    }
  };

  const studentOrTeacherId = item.reason === "STUDENT" ? item.studentId : item.reason === "TEACHER" ? item.teacherId : null;
  const paidBy = item.type === "CREDIT" ? item.counterpartyName : "Flextudy Official";
  const paidTo = item.type === "CREDIT" ? "Flextudy Official" : item.counterpartyName;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#1d1e1c]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="transaction-details-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[24px] border border-[#e3d6c5] bg-white p-5 shadow-2xl sm:rounded-[24px] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#fa5d00]">{reasonLabels[item.reason]}</p>
            <h2 id="transaction-details-title" className="mt-1 text-xl font-bold">{item.counterpartyName}</h2>
          </div>
          <button type="button" aria-label="Close details" onClick={onClose} disabled={isDeleting} className="rounded-xl p-2 text-[#8e8b87] hover:bg-[#fff8f1]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2-Day Status Banner */}
        <div className="mt-4">
          {isEditable ? (
            isWithinTwoDays(item.createdAt) ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                <Clock className="h-4 w-4 shrink-0 text-amber-700" />
                <span>
                  <strong>Editable &amp; Deletable:</strong> {timeRemaining} remaining (within 2 days of creation).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900">
                <Clock className="h-4 w-4 shrink-0 text-blue-700" />
                <span>
                  <strong>Editable to add UTR number:</strong> This transaction is missing a UTR number and can be edited.
                </span>
              </div>
            )
          ) : canRecord ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e3d6c5] bg-[#fff8f1]/50 p-3 text-xs text-[#615f5c]">
              <Lock className="h-4 w-4 shrink-0 text-[#8e8b87]" />
              <span>
                <strong>Locked:</strong> Created on {new Date(item.createdAt).toLocaleDateString("en-IN")}. Editing and deletion are restricted to 2 days after creation.
              </span>
            </div>
          ) : null}
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Delete this bank transaction?</p>
                <p className="mt-1 text-xs text-red-700 leading-relaxed">
                  This will permanently delete receipt <strong>{item.invoiceNumber}</strong> ({currency(item.amount)}) from Flextudy Official bank records. This action cannot be undone.
                </p>
              </div>
            </div>
            {deleteError && <p className="text-xs font-semibold text-red-700">{deleteError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</Button>
              <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {isDeleting ? "Deleting…" : "Confirm Delete"}
              </Button>
            </div>
          </div>
        )}

        <div className={`mt-5 rounded-[18px] border p-4 ${item.type === "CREDIT" ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}><TypeBadge type={item.type} /><p className={`mt-3 text-3xl font-bold tabular-nums ${item.type === "CREDIT" ? "text-emerald-800" : "text-amber-900"}`}>{item.type === "CREDIT" ? "+" : "−"}{currency(item.amount)}</p><p className="mt-1 text-sm text-[#615f5c]">{new Date(item.transactionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p></div>
        <div className="mt-4 rounded-[16px] border border-[#e3d6c5] bg-[#fff8f1]/60 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b87]">Money flow</p><div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#1d1e1c]"><span>{paidBy}</span><ArrowRight className={`h-4 w-4 ${item.type === "CREDIT" ? "text-emerald-700" : "text-amber-700"}`} aria-hidden="true" /><span>{paidTo}</span></div><p className={`mt-2 text-xs font-medium ${item.type === "CREDIT" ? "text-emerald-800" : "text-amber-900"}`}>Official bank cash {item.type === "CREDIT" ? "increases" : "decreases"} by {currency(item.amount)}. This entry does not change partner-to-partner balances.</p></div>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm"><Detail label="Invoice / receipt" value={item.invoiceNumber} /><Detail label="UTR number" value={item.utrNumber || "—"} /><Detail label="Reason" value={reasonLabels[item.reason]} />{studentOrTeacherId && <Detail label={item.reason === "STUDENT" ? "Student ID" : "Teacher ID"} value={studentOrTeacherId} />}<Detail label="Recorded by" value={item.createdBy.name} /></dl>
        {item.note && <div className="mt-5 rounded-[14px] bg-[#fff8f1] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">Note</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#1d1e1c]">{item.note}</p></div>}
        <div className="mt-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">Receipt / bill</p>{item.attachments.length ? <div className="space-y-2">{item.attachments.map((attachment) => <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[#e3d6c5] p-3 text-sm font-semibold text-[#fa5d00] hover:bg-[#fff8f1]"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{attachment.fileName}</span><span className="text-xs">Open</span></a>)}</div> : <p className="rounded-xl border border-dashed border-[#e3d6c5] p-4 text-sm text-[#8e8b87]">No receipt or bill attached.</p>}</div>

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#e3d6c5] pt-4 sm:flex-row sm:items-center sm:justify-between">
          {isEditable && !showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              {isWithinTwoDays(item.createdAt) && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </div>
          ) : <div />}
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>Close</Button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block min-w-0 text-xs font-semibold uppercase tracking-wider text-[#1d1e1c]"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8b87]">{label}</dt><dd className="mt-1 break-words font-semibold text-[#1d1e1c]">{value}</dd></div>; }

function ExportTransactionsModal({
  scope,
  initialType = "ALL",
  initialDate = "",
  onClose,
}: {
  scope: Scope;
  initialType?: string;
  initialDate?: string;
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [type, setType] = useState(initialType);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const scopeLabel = scope === "parents" ? "Parent payments" : scope === "teachers" ? "Teacher payments" : "Bank activity";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExporting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExporting, onClose]);

  const applyPreset = (preset: "all" | "this_month" | "last_month" | "last_30_days" | "fy") => {
    setError("");
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "this_month") {
      const y = now.getFullYear();
      const m = now.getMonth();
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0);
      setStartDate(fmt(first));
      setEndDate(fmt(last));
    } else if (preset === "last_month") {
      const y = now.getFullYear();
      const m = now.getMonth();
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      setStartDate(fmt(first));
      setEndDate(fmt(last));
    } else if (preset === "last_30_days") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(fmt(past));
      setEndDate(fmt(now));
    } else if (preset === "fy") {
      const curYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? curYear : curYear - 1;
      setStartDate(`${fyStartYear}-04-01`);
      setEndDate(`${fyStartYear + 1}-03-31`);
    }
  };

  const handleExport = async (e: FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }
    setIsExporting(true);
    setError("");

    try {
      let allRecords: BankTransactionRecord[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await getBankTransactionsApi({
          scope,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          type: type === "ALL" ? undefined : type,
          page: currentPage,
          pageSize: 500,
        });

        allRecords = allRecords.concat(response.items);
        totalPages = response.totalPages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages && allRecords.length < 5000);

      if (allRecords.length === 0) {
        setError("No transactions found for the selected date range and criteria.");
        setIsExporting(false);
        return;
      }

      const csvContent = buildBankTransactionsCsv(allRecords);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const dateSuffix = startDate && endDate
        ? `${startDate}_to_${endDate}`
        : startDate
          ? `from_${startDate}`
          : endDate
            ? `up_to_${endDate}`
            : "all_time";
      const fileScope = scope === "parents" ? "parents" : scope === "teachers" ? "teachers" : "bank_activity";
      link.href = url;
      link.download = `${fileScope}_${dateSuffix}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error("Export error:", err);
      setError(err instanceof Error ? err.message : "Failed to export transactions.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-[28px] border border-[#e3d6c5] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 border-b border-[#e3d6c5]/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff8f1] text-[#fa5d00] border border-[#e3d6c5]/60 shadow-sm">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1d1e1c]">Export to Excel</h2>
              <p className="text-xs text-[#8e8b87]">Download {scopeLabel} spreadsheet filtered by date range</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-full p-2 text-[#8e8b87] hover:bg-[#fff8f1] hover:text-[#1d1e1c] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleExport} className="mt-5 space-y-5">
          {/* Quick presets */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8e8b87]">
              Quick date range
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "All time", key: "all" as const },
                { label: "This month", key: "this_month" as const },
                { label: "Last month", key: "last_month" as const },
                { label: "Last 30 days", key: "last_30_days" as const },
                { label: "Current FY", key: "fy" as const },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => applyPreset(item.key)}
                  disabled={isExporting}
                  className="rounded-full border border-[#e3d6c5] bg-[#fff8f1]/60 px-3 py-1 text-xs font-semibold text-[#615f5c] transition-colors hover:border-[#fa5d00] hover:bg-[#fff8f1] hover:text-[#fa5d00]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c]">
                From date
              </label>
              <DatePicker
                value={startDate}
                onChange={(val) => {
                  setError("");
                  setStartDate(val);
                }}
                placeholder="Start date (optional)"
                clearable
                disabled={isExporting}
                triggerClassName="h-[46px] rounded-[16px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c]">
                To date
              </label>
              <DatePicker
                value={endDate}
                onChange={(val) => {
                  setError("");
                  setEndDate(val);
                }}
                placeholder="End date (optional)"
                clearable
                disabled={isExporting}
                triggerClassName="h-[46px] rounded-[16px]"
              />
            </div>
          </div>

          {/* Type filter */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1d1e1c]">
              Transaction type
            </label>
            <CustomSelect
              ariaLabel="Export transaction type"
              value={type}
              onChange={setType}
              options={[
                { value: "ALL", label: "All transaction types" },
                { value: "CREDIT", label: "Money received (Credits only)" },
                { value: "DEBIT", label: "Money paid (Debits only)" },
              ]}
              disabled={isExporting}
              triggerClassName="h-[46px] rounded-[16px]"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-[#e3d6c5]/80 bg-[#fff8f1]/60 p-3.5 text-xs text-[#615f5c]">
            💡 The exported .csv file includes full details (Receipt/Invoice, UTR Number, counterparty, amount, reason, IDs, notes, and attachment links) and opens directly in Microsoft Excel or Google Sheets.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isExporting}
              className="min-w-[150px]"
            >
              {isExporting ? (
                <>
                  <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-4 w-4" />
                  Export to Excel
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
