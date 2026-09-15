import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false, href = "/dashboard" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex min-w-0 items-center gap-2.5">
      <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#07132f] ring-1 ring-white/10 transition-transform group-hover:scale-105">
        <Image src="/logo.png" alt="Partner Finance Tracker" fill sizes="40px" className="object-cover object-center" />
      </span>
      {!compact && <span className="min-w-0 leading-tight"><span className="block truncate text-base font-bold tracking-tight text-[#1d1e1c]">Flextudy</span><span className="block truncate text-[10px] font-bold uppercase tracking-[0.13em] text-[#fa5d00]">Finance Tracker</span></span>}
    </Link>
  );
}
