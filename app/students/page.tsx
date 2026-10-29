import React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { StudentDirectory } from "@/components/students/student-directory";

export default function StudentDirectoryPage() {
  return (
    <div className="min-h-screen bg-[var(--color-cream-canvas)] text-[var(--color-ink-black)] md:flex">
      <Sidebar />
      <MobileNav />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="border-b border-[var(--color-parchment-shadow)]/70 pb-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-harvest-flame)]">
              Flextudy Finance Tracker
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Student Directory</h1>
            <p className="mt-1 text-sm text-[var(--color-warm-stone)] sm:text-base">
              Manage student profiles, student IDs, emails, and contact details.
            </p>
          </header>

          <StudentDirectory />
        </div>
      </main>
    </div>
  );
}
