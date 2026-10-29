import React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
  serifTitle?: boolean;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  serifTitle = false,
}: SectionHeaderProps) {
  const alignments = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  };

  return (
    <div
      className={cn(
        "flex flex-col max-w-[720px] mb-12 md:mb-16",
        alignments[align],
        className
      )}
    >
      {eyebrow && (
        <span className="text-sm font-semibold tracking-wider text-[var(--color-harvest-flame)] uppercase mb-3">
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--color-ink-black)] leading-[1.2] tracking-tight",
          serifTitle && "font-serif font-normal"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg md:text-xl text-[var(--color-warm-stone)] leading-relaxed max-w-[620px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
