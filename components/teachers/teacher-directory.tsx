"use client";

import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  createTeacherApi,
  deleteTeacherApi,
  fetchTeachersApi,
  updateTeacherApi,
} from "@/lib/api/teachers";
import type { TeacherItem } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

export function TeacherDirectory() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce the search query by 250ms
  const debouncedSearch = useDebounce(searchQuery, 250);

  const loadTeachers = useCallback(async (currentPage: number, query: string) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchTeachersApi({
        query,
        page: currentPage,
        limit: 10,
      });
      setTeachers(data.items);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load teachers:", err);
      setError(err instanceof Error ? err.message : "Failed to load teachers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchTeachersApi({
      query: debouncedSearch,
      page: 1,
      limit: 10,
    })
      .then((data) => {
        if (!ignore) {
          setTeachers(data.items);
          setTotal(data.total);
          setPage(data.page);
          setTotalPages(data.totalPages || 1);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load teachers");
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [debouncedSearch]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormTeacherId("");
    setFormEmail("");
    setFormPhone("");
    setFormNotes("");
    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherItem) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormTeacherId(teacher.teacherId);
    setFormEmail(teacher.email || "");
    setFormPhone(teacher.phone || "");
    setFormNotes(teacher.notes || "");
    setFormError("");
  };

  const handleSaveTeacher = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTeacherId.trim()) {
      setFormError("Teacher name and Teacher ID are required.");
      return;
    }
    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingTeacher) {
        await updateTeacherApi(editingTeacher.id, {
          name: formName.trim(),
          teacherId: formTeacherId.trim(),
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
        setEditingTeacher(null);
      } else {
        await createTeacherApi({
          name: formName.trim(),
          teacherId: formTeacherId.trim(),
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
        setIsAddModalOpen(false);
      }
      await loadTeachers(page, debouncedSearch);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setIsSubmitting(true);
    try {
      await deleteTeacherApi(deletingTeacher.id);
      setDeletingTeacher(null);
      await loadTeachers(page, debouncedSearch);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar: Search & Add Teacher button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-driftwood)]" />
          <Input
            className="h-[46px] rounded-xl pl-10 pr-4"
            placeholder="Search teachers by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-driftwood)] hover:bg-[var(--color-cream-canvas)] hover:text-[var(--color-ink-black)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button onClick={handleOpenAdd} className="shrink-0 gap-1.5 h-[46px] rounded-xl">
          <Plus className="h-4 w-4" /> Add Teacher
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-semibold text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Teachers Table / List */}
      <Card className="overflow-hidden border border-[var(--color-parchment-shadow)] shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-[var(--color-driftwood)] gap-3">
            <LoaderCircle className="h-6 w-6 animate-spin text-[var(--color-harvest-flame)]" />
            <p className="text-sm">Loading teachers directory...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-driftwood)]">
            <GraduationCap className="mx-auto h-12 w-12 text-[var(--color-parchment-shadow)] mb-3" />
            <p className="font-bold text-base text-[var(--color-ink-black)]">
              {searchQuery ? "No matching teachers found" : "No teachers in directory yet"}
            </p>
            <p className="text-xs text-[var(--color-warm-stone)] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No teacher record matches "${searchQuery}". Try a different name, email, or teacher ID.`
                : "Add teachers to easily assign them to students and track teacher payouts & reserves."}
            </p>
            <div className="flex items-center justify-center gap-2 mt-5">
              {searchQuery && (
                <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")} className="h-9">
                  Clear Search
                </Button>
              )}
              <Button onClick={handleOpenAdd} size="sm" className="h-9 gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Teacher
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)]/80 text-[11px] font-bold uppercase tracking-wider text-[var(--color-driftwood)]">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Teacher ID</th>
                  <th className="px-4 py-3 sm:px-6">Name</th>
                  <th className="px-4 py-3 sm:px-6">Email</th>
                  <th className="px-4 py-3 sm:px-6">Phone / Notes</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-parchment-shadow)]/50">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-[var(--color-cream-canvas)]/40 transition-colors">
                    <td className="px-4 py-3 sm:px-6 font-mono font-bold text-[var(--color-ink-black)]">
                      <span className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2.5 py-1 text-orange-700 dark:text-orange-400">
                        {teacher.teacherId}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 font-bold text-[var(--color-ink-black)]">
                      {teacher.name}
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-[var(--color-warm-stone)]">
                      {teacher.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-[var(--color-driftwood)]" />
                          {teacher.email}
                        </span>
                      ) : (
                        <span className="text-[var(--color-driftwood)] italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-[var(--color-warm-stone)]">
                      {teacher.phone || teacher.notes ? (
                        <div className="max-w-xs truncate">
                          {teacher.phone && <span className="font-medium mr-2">{teacher.phone}</span>}
                          {teacher.notes && <span className="text-[var(--color-driftwood)]">{teacher.notes}</span>}
                        </div>
                      ) : (
                        <span className="text-[var(--color-driftwood)] italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(teacher)}
                          className="rounded-lg p-1.5 text-[var(--color-driftwood)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-black)]"
                          title="Edit teacher"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTeacher(teacher)}
                          className="rounded-lg p-1.5 text-[var(--color-driftwood)] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:text-red-400"
                          title="Delete teacher"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination: 10 items per page */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)]/40 px-4 py-3 sm:px-6 text-xs text-[var(--color-warm-stone)]">
            <p>
              Showing <span className="font-bold text-[var(--color-ink-black)]">{(page - 1) * 10 + 1}</span> to{" "}
              <span className="font-bold text-[var(--color-ink-black)]">{Math.min(page * 10, total)}</span> of{" "}
              <span className="font-bold text-[var(--color-ink-black)]">{total}</span> teachers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const prev = page - 1;
                  void loadTeachers(prev, debouncedSearch);
                }}
                disabled={page <= 1 || isLoading}
                className="h-8 gap-1 rounded-xl"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <span className="text-xs font-semibold px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const next = page + 1;
                  void loadTeachers(next, debouncedSearch);
                }}
                disabled={page >= totalPages || isLoading}
                className="h-8 gap-1 rounded-xl"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingTeacher) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsAddModalOpen(false);
              setEditingTeacher(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--color-parchment-shadow)]/70 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[var(--color-ink-black)]">
                    {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
                  </h3>
                  <p className="text-xs text-[var(--color-warm-stone)]">Save teacher profile for quick payout tracking</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTeacher(null);
                }}
                disabled={isSubmitting}
                className="rounded-full p-1 text-[var(--color-driftwood)] hover:bg-[var(--color-cream-canvas)] hover:text-[var(--color-ink-black)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
                  Teacher Name <span className="text-red-500">*</span>
                </label>
                <Input
                  className="h-[46px] rounded-[14px]"
                  placeholder="e.g. Ananya Verma"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
                  Teacher ID <span className="text-red-500">*</span>
                </label>
                <Input
                  className="h-[46px] rounded-[14px]"
                  placeholder="e.g. TEACHER-01 or TCH-201"
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
                  Email (optional)
                </label>
                <Input
                  className="h-[46px] rounded-[14px]"
                  type="email"
                  placeholder="e.g. teacher@flextudy.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
                  Phone (optional)
                </label>
                <Input
                  className="h-[46px] rounded-[14px]"
                  placeholder="e.g. +91 98765 43210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
                  Notes / Subjects (optional)
                </label>
                <Input
                  className="h-[46px] rounded-[14px]"
                  placeholder="e.g. Math, Science · 2 classes/week"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-parchment-shadow)]/70">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTeacher(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : editingTeacher ? (
                    "Update Teacher"
                  ) : (
                    "Add Teacher"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setDeletingTeacher(null);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-5 shadow-2xl">
            <h3 className="font-serif text-base font-bold text-[var(--color-ink-black)]">Delete Teacher?</h3>
            <p className="mt-2 text-xs text-[var(--color-warm-stone)]">
              Are you sure you want to delete teacher <strong>{deletingTeacher.name}</strong> ({deletingTeacher.teacherId}) from the directory?
            </p>
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingTeacher(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteTeacher}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting…" : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
