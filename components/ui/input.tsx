import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "w-full bg-[var(--color-surface)] border border-[var(--color-bone)] text-[var(--color-ink-black)] placeholder:text-[var(--color-driftwood)] rounded-xl px-5 py-3.5 text-base transition-all duration-200 focus:outline-none focus:border-[var(--color-harvest-flame)] focus:ring-2 focus:ring-[var(--color-harvest-flame)]/20 disabled:bg-[var(--color-cream-canvas)] disabled:cursor-not-allowed",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
