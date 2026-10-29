import React from "react";
import { Container } from "@/components/ui/container";

const companies = [
  "STRIPE",
  "DELL",
  "COLUMBIA",
  "CONDE NAST",
  "SLACK",
  "BOOKING.COM",
];

export function TrustLogos() {
  return (
    <section className="py-10 border-y border-[var(--color-parchment-shadow)]/60 bg-[var(--color-cream-canvas)]">
      <Container className="text-center">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--color-warm-stone)] mb-6">
          TRUSTED BY <span className="text-[var(--color-harvest-flame)]">70,000+</span> COMPANIES
          WORLDWIDE
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
          {companies.map((name) => (
            <span
              key={name}
              className="text-lg md:text-xl font-bold tracking-widest text-[var(--color-ink-black)] select-none font-sans"
            >
              {name}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
