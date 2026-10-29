import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "orange" | "neutral" | "outline";
}

export function Badge({
  className,
  variant = "orange",
  ...props
}: BadgeProps) {
  const variants = {
    orange: "bg-[var(--color-harvest-flame)]/10 text-[var(--color-harvest-flame)] font-semibold",
    neutral: "bg-[var(--color-ink-black)]/5 text-[var(--color-warm-stone)] font-medium",
    outline: "border border-[var(--color-bone)] text-[var(--color-warm-stone)] font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs uppercase tracking-wider transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
