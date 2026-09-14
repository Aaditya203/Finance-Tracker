"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { logoutApi } from "@/lib/api/auth";
import {
  LayoutDashboard,
  Receipt,
  ArrowLeftRight,
  Menu,
  X,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isMounted } = useCurrentUser();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Settlements", href: "/settlements", icon: ArrowLeftRight },
  ];

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const userName = isMounted && user?.name ? user.name : null;
  const userInitials = userName ? userName.split(" ").map((part) => part[0]).join("").slice(0, 2) : "--";
  const userEmail = isMounted && user?.email ? user.email : "";

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
    window.location.href = "/sign-in";
  };

  return (
    <>
      {/* ── Sticky Top Bar (always visible, never shifts content) ── */}
      <header className="md:hidden sticky top-0 z-50 bg-[#fff8f1]/95 backdrop-blur-md border-b border-[#e3d6c5] px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Brand compact />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#fa5d00] text-white font-bold text-xs flex items-center justify-center">
              {userInitials}
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg bg-white border border-[#c0bbb6] text-[#1d1e1c] active:scale-95 transition-transform"
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
            "absolute inset-0 bg-[#1d1e1c]/30 transition-opacity duration-300 ease-in-out",
            isOpen ? "opacity-100 backdrop-blur-sm" : "opacity-0"
          )}
          onClick={closeDrawer}
          aria-label="Close navigation menu"
        />

        {/* Drawer Panel: slides in from the right, ~70% width */}
        <nav
          className={cn(
            "absolute top-0 right-0 h-full w-[72%] max-w-[320px] bg-[#fff8f1] shadow-[-8px_0_32px_-4px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* ── Drawer Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#e3d6c5]/70">
            <Brand compact />
            <button
              onClick={closeDrawer}
              className="p-2.5 -mr-1 rounded-xl bg-white border border-[#e3d6c5] text-[#615f5c] hover:text-[#1d1e1c] hover:border-[#c0bbb6] active:scale-95 transition-all"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Navigation Links ── */}
          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#8e8b87] mb-3">
              Main Navigation
            </p>
            <div className="space-y-3">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/dashboard" && pathname === "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeDrawer}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-[16px] text-[15px] font-semibold transition-all duration-200 group min-h-[48px]",
                      isActive
                        ? "bg-[#fa5d00] text-white shadow-[0px_2px_8px_0px_rgba(250,93,0,0.25)]"
                        : "text-[#615f5c] hover:bg-white hover:text-[#1d1e1c] active:bg-white/80"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-colors shrink-0",
                          isActive
                            ? "text-white"
                            : "text-[#8e8b87] group-hover:text-[#fa5d00]"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Bottom Section: Settings, Sign out, User Card ── */}
          <div className="px-4 pb-5 pt-3 border-t border-[#e3d6c5]/70 space-y-2.5">
            <Link
              href="/settings"
              onClick={closeDrawer}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-[15px] font-semibold transition-all min-h-[48px]",
                pathname === "/settings"
                  ? "bg-[#fa5d00] text-white shadow-[0px_1px_4px_0px_rgba(250,93,0,0.25)]"
                  : "text-[#615f5c] hover:bg-white hover:text-[#1d1e1c]"
              )}
            >
              <Settings
                className={cn(
                  "w-5 h-5 shrink-0",
                  pathname === "/settings" ? "text-white" : "text-[#8e8b87]"
                )}
              />
              <span>Settings</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                closeDrawer();
                handleLogout();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-[15px] font-semibold text-[#fa5d00] hover:bg-[#fa5d00]/5 active:bg-[#fa5d00]/10 transition-all cursor-pointer min-h-[48px]"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Sign out</span>
            </button>

            {/* User Info Card */}
            <div className="bg-white border border-[#e3d6c5] rounded-[16px] p-3.5 shadow-sm flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-full bg-[#fa5d00] text-white font-bold flex items-center justify-center text-sm shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#1d1e1c] truncate">
                  {userName ?? "Loading partner…"}
                </p>
                <p className="text-[12px] text-[#8e8b87] truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
