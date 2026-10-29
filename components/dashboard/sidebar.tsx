"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Moon,
  Receipt,
  Settings,
  Sun,
  User,
  Users,
} from "lucide-react";

interface NavItemDef {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItemDef[] = [
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

/**
 * Astrix-style sidebar toggle icon (rounded rectangle with left-half filled).
 */
function SidebarToggleIcon({ isCollapsed, className }: { isCollapsed: boolean; className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("transition-transform duration-200", className)}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 3v18" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4.5 4.5h4v15h-4a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z"
        fill="currentColor"
        stroke="none"
        className={cn("transition-opacity duration-200", isCollapsed ? "opacity-0" : "opacity-90")}
      />
    </svg>
  );
}

/**
 * Astrix-style black floating tooltip with left-pointing triangular pointer.
 * Appears on hover next to icons when the sidebar is collapsed.
 */
function CollapsedTooltip({
  label,
  badge,
  className,
}: {
  label: string;
  badge?: string | number;
  className?: string;
}) {
  return (
    <div
      role="tooltip"
      className={cn(
        "absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 pointer-events-none z-50",
        "invisible opacity-0 group-hover:visible group-hover:opacity-100",
        "-translate-x-1 group-hover:translate-x-0 transition-all duration-150 ease-out",
        "flex items-center select-none",
        className
      )}
    >
      <div className="relative bg-[var(--color-surface)] text-[var(--color-ink-black)] text-[13px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.25)] flex items-center">
        {/* Left-pointing arrow tail */}
        <span
          aria-hidden="true"
          className="absolute right-full top-1/2 -translate-y-1/2 -mr-[0.5px] w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-[var(--color-surface)]"
        />
        <span>{label}</span>
        {badge !== undefined && (
          <span className="ml-2 rounded bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-ink-black)]">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Illustrated vector sketch avatar matching the ASTRIX style.
 */
function UserAvatar({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="relative size-10 rounded-full border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--color-surface)] shadow-sm shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 64 64" className="w-full h-full object-cover" fill="none">
        <circle cx="32" cy="32" r="32" fill="var(--color-chrome)" />
        {/* Hair */}
        <path
          d="M20 25c0-8 5-14 12-14s13 5 13 12c0 2-1 3-1 5-2-3-5-4-8-4-4 0-7 2-9 5-2-2-5-3-7-4z"
          fill="var(--color-ink-black)"
        />
        {/* Ears */}
        <circle cx="19" cy="32" r="3.5" fill="#fff" stroke="var(--color-ink-black)" strokeWidth="1.2" />
        <circle cx="45" cy="32" r="3.5" fill="#fff" stroke="var(--color-ink-black)" strokeWidth="1.2" />
        {/* Face */}
        <circle cx="32" cy="31" r="12" fill="#ffffff" stroke="var(--color-ink-black)" strokeWidth="1.5" />
        {/* Eyes & smile */}
        <circle cx="28" cy="29" r="1.3" fill="var(--color-ink-black)" />
        <circle cx="36" cy="29" r="1.3" fill="var(--color-ink-black)" />
        <path d="M29.5 35c1.2 1.3 3.8 1.3 5 0" stroke="var(--color-ink-black)" strokeWidth="1.3" strokeLinecap="round" />
        {/* Eyebrows */}
        <path d="M26 26c1-0.8 3-0.8 4 0M34 26c1-0.8 3-0.8 4 0" stroke="var(--color-ink-black)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Collar & Shirt */}
        <path d="M19 58c0-10 6-16 13-16s13 6 13 16" fill="var(--color-chrome)" stroke="var(--color-ink-black)" strokeWidth="1.5" />
        <path d="M27 42l5 8 5-8" fill="#fff" stroke="var(--color-ink-black)" strokeWidth="1.3" />
        <path d="M32 50v8" stroke="var(--color-harvest-flame)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{name || initials}</span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isMounted } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync collapsed state from localStorage safely after initial mount to prevent hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem("flextudy-sidebar-collapsed");
      if (saved === "true") {
        queueMicrotask(() => setIsCollapsed(true));
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("flextudy-sidebar-collapsed", String(next));
      } catch { }
      return next;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch { }
    localStorage.removeItem("flextudy-current-user-id");
    router.push("/sign-in");
  };

  const userName = isMounted && user?.name ? user.name : "Flextudy Partner";
  const userInitials = userName
    ? userName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
    : "--";
  const userEmail = isMounted && user?.email ? user.email : "admin@flextudy.com";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-chrome)] h-screen sticky top-0 justify-between select-none z-40 transition-[width,padding] duration-200 ease-in-out",
        isCollapsed ? "w-[76px] px-2.5 py-4" : "w-64 px-3 py-4"
      )}
    >
      {/* ── Top Header: Astrix-style Logo & Toggle Buttons ── */}
      <div className={cn("flex items-center h-14", isCollapsed ? "justify-center" : "justify-between px-2")}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
            {/* Orange Geometric Delta/Astrix Mark */}
            <div className="size-8 rounded-xl bg-gradient-to-br from-[var(--color-harvest-flame)] to-[var(--color-harvest-flame)] flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
                <path d="M12 3L2 21h20L12 3zm0 4.8l6.2 11.2H5.8L12 7.8z" />
              </svg>
            </div>
            <span className="truncate text-xl font-bold tracking-tight text-[var(--color-ink-black)]">
              FLEXTUDY
            </span>
          </Link>
        )}

        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-2" : "gap-1")}>
          {/* Sidebar Collapse Toggle Button */}
          <div className={cn("relative", isCollapsed && "group")}>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="rounded-xl p-2 text-[var(--color-driftwood)] hover:text-[var(--color-ink-black)] hover:bg-[var(--color-surface)] dark:hover:bg-neutral-800/50 transition-colors cursor-pointer flex items-center justify-center"
            >
              <SidebarToggleIcon isCollapsed={isCollapsed} className="size-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </button>
            {isCollapsed && <CollapsedTooltip label="Expand sidebar" />}
          </div>
        </div>
      </div>

      {/* ── Navigation Links (Astrix-style Floating Pill Card for Active Item) ── */}
      <nav
        className={cn(
          "flex-1 space-y-1 py-4",
          isCollapsed ? "overflow-visible" : "overflow-y-auto scrollbar-none"
        )}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/students" && (pathname === "/students" || pathname === "/student-directory")) ||
              (item.href === "/teachers-directory" && (pathname === "/teachers-directory" || pathname === "/teacher-directory"));
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className={cn(
                  "group relative flex size-12 items-center justify-center mx-auto rounded-xl transition-all duration-150 my-1",
                  isActive
                    ? "bg-[var(--color-surface)] text-[var(--color-harvest-flame)] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] border border-black/[0.04]"
                    : "text-[var(--color-driftwood)] hover:text-[var(--color-ink-black)] hover:bg-[var(--color-surface)] dark:hover:bg-neutral-800/50 hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:hover:shadow-none"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    isActive ? "text-[var(--color-harvest-flame)]" : "text-[var(--color-driftwood)] group-hover:text-[var(--color-ink-black)]"
                  )}
                />
                <CollapsedTooltip label={item.name} badge={item.badge} />
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex h-12 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] transition-all duration-150 my-0.5",
                isActive
                  ? "bg-[var(--color-surface)] text-[var(--color-harvest-flame)] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] border border-black/[0.04]"
                  : "text-[var(--color-warm-stone)] hover:text-[var(--color-ink-black)] hover:bg-[var(--color-surface)] dark:hover:bg-neutral-800/50 hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:hover:shadow-none font-medium"
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0 transition-colors",
                  isActive ? "text-[var(--color-harvest-flame)]" : "text-[var(--color-driftwood)] group-hover:text-[var(--color-ink-black)]"
                )}
              />
              <span className="truncate">{item.name}</span>
              {item.badge && (
                <span className="ml-auto rounded-md bg-neutral-200 dark:bg-neutral-800/50 px-2 py-0.5 text-xs font-semibold text-[var(--color-ink-black)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer: Profile Card & Dropdown Menu ── */}
      <div ref={dropdownRef} className="relative pt-2 border-t border-[var(--color-border-subtle)]">
        {/* Floating Dropdown Menu */}
        {isDropdownOpen && (
          <div
            className={cn(
              "absolute bottom-16 bg-[var(--color-surface)] rounded-xl shadow-xl border border-[var(--color-border-subtle)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100",
              isCollapsed ? "left-0 w-60" : "left-0 right-0"
            )}
          >
            <div className="px-3 py-2.5">
              <p className="font-semibold text-sm text-[var(--color-ink-black)] truncate">{userName}</p>
              <p className="text-xs text-[var(--color-driftwood)] truncate mt-0.5">{userEmail}</p>
            </div>
            <div className="my-1 border-t border-[var(--color-border-subtle)]" />
            <Link
              href="/settings"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-ink-black)] hover:bg-[var(--color-surface-raised)]/70 transition-colors"
            >
              <User className="size-4 text-[var(--color-driftwood)]" />
              <span>Profile Settings</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-ink-black)] hover:bg-[var(--color-surface-raised)]/70 transition-colors"
            >
              <Settings className="size-4 text-[var(--color-driftwood)]" />
              <span>Account Settings</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-ink-black)] hover:bg-[var(--color-surface-raised)]/70 transition-colors cursor-pointer text-left"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="size-4 text-[var(--color-harvest-flame)]" />
                  <span>Light mode</span>
                </>
              ) : (
                <>
                  <Moon className="size-4 text-[var(--color-ink-black)]" />
                  <span>Dark mode</span>
                </>
              )}
            </button>
            <div className="my-1 border-t border-[var(--color-border-subtle)]" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer text-left"
            >
              <LogOut className="size-4 text-red-400" />
              <span>Log out</span>
            </button>
          </div>
        )}

        <div className={cn("py-2.5", isCollapsed ? "flex justify-center" : "flex justify-start px-2")}>
          <SwitchMode
            width={isCollapsed ? 48 : 64}
            height={32}
            darkColor="#111111"
            lightColor="#FFFFFF"
            knobDarkColor="#1C1C1C"
            knobLightColor="#F3F3F7"
            borderDarkColor="#333333"
            borderLightColor="#E3D6C5"
          />
        </div>

        {/* Trigger Button */}
        {isCollapsed ? (
          <div className="relative group mx-auto flex justify-center">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-label={userName}
              className="flex items-center justify-center size-12 mx-auto rounded-xl hover:bg-[var(--color-surface)] dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
            >
              <UserAvatar name={userName} initials={userInitials} />
            </button>
            {!isDropdownOpen && <CollapsedTooltip label={userName} />}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 w-full rounded-xl p-2 text-left hover:bg-[var(--color-surface)] dark:hover:bg-neutral-800/50 hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:hover:shadow-none transition-colors cursor-pointer group"
          >
            <UserAvatar name={userName} initials={userInitials} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--color-ink-black)] truncate">{userName}</p>
              <p className="text-xs text-[var(--color-driftwood)] truncate">{userEmail}</p>
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
