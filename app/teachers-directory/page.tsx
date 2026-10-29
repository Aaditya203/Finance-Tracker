import React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { TeacherDirectory } from "@/components/teachers/teacher-directory";

export default function TeacherDirectoryPage() {
  return (
    <div className="min-h-screen bg-[#fff8f1] text-[#1d1e1c] md:flex">
      <Sidebar />
      <MobileNav />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="border-b border-[#e3d6c5]/70 pb-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#fa5d00]">
              Flextudy Finance Tracker
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Teacher Directory</h1>
            <p className="mt-1 text-sm text-[#615f5c] sm:text-base">
              Manage teacher profiles, teacher IDs, emails, and contact details.
            </p>
          </header>

          <TeacherDirectory />
        </div>
      </main>
    </div>
  );
}
