import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "paper" | "cream" | "glow" | "outline";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "paper", children, ...props }, ref) => {
    const variants = {
      paper:
        "bg-[var(--color-surface)] border border-[var(--color-parchment-shadow)]/70 shadow-[var(--shadow-sm)]",
      cream: "bg-[var(--color-cream-canvas)] border border-[var(--color-parchment-shadow)]/50",
      glow: "bg-[var(--color-surface)] shadow-[var(--shadow-warm-lg)] border border-[var(--color-marigold-glow)]",
      outline: "bg-transparent border border-[var(--color-bone)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-5 sm:p-6 transition-all duration-300",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 mb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl md:text-2xl font-semibold text-[var(--color-ink-black)] tracking-tight",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-base text-[var(--color-warm-stone)] leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-6 flex items-center pt-4", className)} {...props} />
  );
}
