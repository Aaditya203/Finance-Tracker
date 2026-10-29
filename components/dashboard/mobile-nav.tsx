"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { SwitchMode } from "../ui/original";
import { logoutApi } from "@/lib/api/auth";
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  GraduationCap,
  Home,
  Landmark,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";

/**
 * Illustrated vector sketch avatar matching the ASTRIX style.
 */
function MobileUserAvatar({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="relative size-10 rounded-full border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--color-surface)] shadow-sm shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 64 64" className="w-full h-full object-cover" fill="none">
        <circle cx="32" cy="32" r="32" fill="var(--color-chrome)" />
        <path
          d="M20 25c0-8 5-14 12-14s13 5 13 12c0 2-1 3-1 5-2-3-5-4-8-4-4 0-7 2-9 5-2-2-5-3-7-4z"
          fill="var(--color-ink-black)"
        />
        <circle cx="19" cy="32" r="3.5" fill="#fff" stroke="var(--color-ink-black)" strokeWidth="1.2" />
        <circle cx="45" cy="32" r="3.5" fill="#fff" stroke="var(--color-ink-black)" strokeWidth="1.2" />
        <circle cx="32" cy="31" r="12" fill="#ffffff" stroke="var(--color-ink-black)" strokeWidth="1.5" />
        <circle cx="28" cy="29" r="1.3" fill="var(--color-ink-black)" />
        <circle cx="36" cy="29" r="1.3" fill="var(--color-ink-black)" />
        <path d="M29.5 35c1.2 1.3 3.8 1.3 5 0" stroke="var(--color-ink-black)" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M26 26c1-0.8 3-0.8 4 0M34 26c1-0.8 3-0.8 4 0" stroke="var(--color-ink-black)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M19 58c0-10 6-16 13-16s13 6 13 16" fill="var(--color-chrome)" stroke="var(--color-ink-black)" strokeWidth="1.5" />
        <path d="M27 42l5 8 5-8" fill="#fff" stroke="var(--color-ink-black)" strokeWidth="1.3" />
        <path d="M32 50v8" stroke="var(--color-harvest-flame)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{name || initials}</span>
    </div>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isMounted } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Bank Activity", href: "/bank-transactions", icon: Landmark },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Settlements", href: "/settlements", icon: ArrowLeftRight },
    { name: "Student Directory", href: "/students", icon: Users },
    { name: "Teacher Directory", href: "/teachers-directory", icon: GraduationCap },
    { name: "Parent Payment", href: "/parents", icon: CreditCard },
    { name: "Teacher Payment", href: "/teachers", icon: Banknote },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const userName = isMounted && user?.name ? user.name : "Flextudy Partner";
  const userInitials = userName
    ? userName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
    : "--";
  const userEmail = isMounted && user?.email ? user.email : "admin@flextudy.com";

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeDrawer();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDrawer]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch { }
    localStorage.removeItem("flextudy-current-user-id");
    router.push("/sign-in");
  };

  return (
    <>
      {/* ── Sticky Top Bar (always visible, never shifts content) ── */}
      <header className="md:hidden sticky top-0 z-50 bg-[var(--color-chrome)]/95 backdrop-blur-md border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-xl bg-gradient-to-br from-[var(--color-harvest-flame)] to-[var(--color-harvest-flame)] flex items-center justify-center text-white shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
                <path d="M12 3L2 21h20L12 3zm0 4.8l6.2 11.2H5.8L12 7.8z" />
              </svg>
            </div>
            <span className="truncate text-lg font-bold tracking-tight text-[var(--color-ink-black)]">
              FLEXTUDY
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-ink-black)] active:scale-95 transition-transform cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-[var(--color-harvest-flame)]" />
              ) : (
                <Moon className="w-5 h-5 text-[var(--color-ink-black)]" />
              )}
            </button>
            <MobileUserAvatar name={userName} initials={userInitials} />
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-ink-black)] active:scale-95 transition-transform"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Slide-over Drawer Overlay (fixed, outside document flow) ── */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-[100] transition-all duration-300 ease-in-out",
          isOpen ? "visible" : "invisible pointer-events-none"
        )}
        aria-hidden={!isOpen}
      >
        {/* Backdrop: semi-transparent + blur */}
        <div
          className={cn(
            "absolute inset-0 bg-[var(--color-ink-black)]/30 transition-opacity duration-300 ease-in-out",
            isOpen ? "opacity-100 backdrop-blur-sm" : "opacity-0"
          )}
          onClick={closeDrawer}
          aria-label="Close navigation menu"
        />

        {/* Drawer Panel: slides in from the right, ~75% width */}
        <nav
          className={cn(
            "absolute top-0 right-0 h-full w-[78%] max-w-[320px] bg-[var(--color-chrome)] shadow-[-8px_0_32px_-4px_rgba(0,0,0,0.12)] flex flex-col justify-between transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* ── Drawer Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-gradient-to-br from-[var(--color-harvest-flame)] to-[var(--color-harvest-flame)] flex items-center justify-center text-white shadow-sm shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
                  <path d="M12 3L2 21h20L12 3zm0 4.8l6.2 11.2H5.8L12 7.8z" />
                </svg>
              </div>
              <span className="truncate text-xl font-bold tracking-tight text-[var(--color-ink-black)]">
                FLEXTUDY
              </span>
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 -mr-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-warm-stone)] hover:text-[var(--color-ink-black)] active:scale-95 transition-all"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Navigation Links (Floating active card) ── */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname === "/"
                  : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  (item.href === "/students" && (pathname === "/students" || pathname === "/student-directory")) ||
                  (item.href === "/teachers-directory" && (pathname === "/teachers-directory" || pathname === "/teacher-directory"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeDrawer}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-[15px] transition-all duration-150 min-h-[46px] my-0.5",
                    isActive
                      ? "bg-[var(--color-surface)] text-[var(--color-harvest-flame)] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] border border-black/[0.04]"
                      : "text-[var(--color-warm-stone)] hover:text-[var(--color-ink-black)] hover:bg-[var(--color-surface)] dark:hover:bg-neutral-800/50 hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:hover:shadow-none font-medium"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      isActive ? "text-[var(--color-harvest-flame)]" : "text-[var(--color-driftwood)]"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Drawer Footer: Profile & Settings ── */}
          <div className="p-4 border-t border-[var(--color-border-subtle)] space-y-2">
            <div className="flex justify-center pb-2">
              <SwitchMode
                width={64}
                height={32}
                darkColor="#111111"
                lightColor="#FFFFFF"
                knobDarkColor="#1C1C1C"
                knobLightColor="#F3F3F7"
                borderDarkColor="#333333"
                borderLightColor="#E3D6C5"
              />
            </div>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-sm">
              <MobileUserAvatar name={userName} initials={userInitials} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--color-ink-black)] truncate">{userName}</p>
                <p className="text-xs text-[var(--color-driftwood)] truncate">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Link
                href="/settings"
                onClick={closeDrawer}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink-black)] hover:bg-[var(--color-chrome)] transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[var(--color-driftwood)]" />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-900 bg-red-950/40 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
