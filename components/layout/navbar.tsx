import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Brand } from "@/components/layout/brand";
import { ChevronDown } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-cream-canvas)]/90 backdrop-blur-md border-b border-[var(--color-parchment-shadow)]/60 transition-all">
      <Container className="flex items-center justify-between h-20">
        {/* Brand Logo */}
        <Brand />

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-8 text-[var(--color-ink-black)] font-medium text-base">
          <Link
            href="/features"
            className="flex items-center gap-1 hover:text-[var(--color-harvest-flame)] transition-colors"
          >
            Features <ChevronDown className="w-4 h-4 text-[var(--color-driftwood)]" />
          </Link>
          <Link
            href="/why-flextudy"
            className="flex items-center gap-1 hover:text-[var(--color-harvest-flame)] transition-colors"
          >
            Why Flextudy <ChevronDown className="w-4 h-4 text-[var(--color-driftwood)]" />
          </Link>
          <Link
            href="/pricing"
            className="hover:text-[var(--color-harvest-flame)] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/resources"
            className="flex items-center gap-1 hover:text-[var(--color-harvest-flame)] transition-colors"
          >
            Resources <ChevronDown className="w-4 h-4 text-[var(--color-driftwood)]" />
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="hidden sm:inline-block text-base font-medium text-[var(--color-ink-black)] hover:text-[var(--color-harvest-flame)] transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Button variant="primary" size="md">
            Open workspace
          </Button>
        </div>
      </Container>
    </header>
  );
}
