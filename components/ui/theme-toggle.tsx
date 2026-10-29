"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center justify-center size-9 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-driftwood)] hover:text-[var(--color-ink-black)] hover:bg-[var(--color-surface-raised)] transition-all cursor-pointer",
        className
      )}
    >
      {theme === "dark" ? (
        <Sun className="size-4.5 text-[var(--color-harvest-flame)]" />
      ) : (
        <Moon className="size-4.5 text-[var(--color-ink-black)]" />
      )}
    </button>
  );
}
