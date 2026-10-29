"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function padZero(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateString(year: number, monthZeroIndexed: number, day: number) {
  return `${year}-${padZero(monthZeroIndexed + 1)}-${padZero(day)}`;
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "";
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10) - 1;
  const day = Number.parseInt(dayStr, 10);
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTodayString() {
  const now = new Date();
  return formatDateString(now.getFullYear(), now.getMonth(), now.getDate());
}

export function DatePicker({
  value = "",
  onChange,
  placeholder = "Select date...",
  clearable = false,
  className,
  triggerClassName,
  ariaLabel,
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current viewing month & year
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth());

  const toggleCalendar = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [y, m] = value.split("-").map(Number);
          setViewYear(y);
          setViewMonth(m - 1);
        } else {
          const now = new Date();
          setViewYear(now.getFullYear());
          setViewMonth(now.getMonth());
        }
      }
      return nextOpen;
    });
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = getTodayString();
    onChange(today);
    setIsOpen(false);
  };

  // Build grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    const todayStr = getTodayString();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNumber = prevMonthDays - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = formatDateString(prevYear, prevMonth, dayNumber);
      days.push({
        dateStr,
        dayNumber,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === value,
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = formatDateString(viewYear, viewMonth, day);
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === value,
      });
    }

    // Next month leading days to complete full weeks
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingSlots; day++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = formatDateString(nextYear, nextMonth, day);
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === value,
      });
    }

    return days;
  }, [viewYear, viewMonth, value]);

  const displayValue = value ? formatDisplayDate(value) : "";

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        onClick={toggleCalendar}
        className={cn(
          "w-full h-[50px] flex items-center justify-between gap-2.5 bg-[var(--color-surface)] border border-[var(--color-bone)] text-[var(--color-ink-black)] text-sm font-semibold rounded-xl px-3.5 shadow-sm transition-all duration-200 hover:border-[var(--color-harvest-flame)] focus:outline-none focus:ring-2 focus:ring-[var(--color-harvest-flame)]/20 select-none text-left",
          isOpen && "border-[var(--color-harvest-flame)] ring-2 ring-[var(--color-harvest-flame)]/20 shadow-md",
          disabled ? "opacity-60 cursor-not-allowed bg-[var(--color-cream-canvas)]/50 border-[var(--color-parchment-shadow)]" : "cursor-pointer",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 truncate">
          <CalendarDays className="w-4 h-4 text-[var(--color-driftwood)] shrink-0" />
          <span className={cn("truncate", !displayValue && "text-[var(--color-driftwood)] font-normal")}>
            {displayValue || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange("");
                }
              }}
              className="p-1 rounded-full text-[var(--color-driftwood)] hover:text-red-400 hover:bg-red-950/40 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Popover Calendar */}
      {isOpen && !disabled && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute left-0 mt-2 z-[130] w-[310px] sm:w-[320px] bg-[var(--color-surface)] border border-[var(--color-parchment-shadow)] rounded-[22px] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-parchment-shadow)]/70">
            <div>
              <p className="text-sm font-bold text-[var(--color-ink-black)]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-[var(--color-warm-stone)] hover:bg-[var(--color-cream-canvas)] hover:text-[var(--color-harvest-flame)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-[var(--color-warm-stone)] hover:bg-[var(--color-cream-canvas)] hover:text-[var(--color-harvest-flame)] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-driftwood)]">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => selectDate(day.dateStr)}
                  className={cn(
                    "h-8 w-full rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative",
                    day.isSelected
                      ? "bg-[var(--color-harvest-flame)] text-white font-bold shadow-md shadow-[var(--color-harvest-flame)]/30"
                      : day.isCurrentMonth
                        ? "text-[var(--color-ink-black)] hover:bg-[var(--color-cream-canvas)] hover:text-[var(--color-harvest-flame)]"
                        : "text-[var(--color-bone)] hover:bg-[var(--color-cream-canvas)]/50 hover:text-[var(--color-driftwood)]",
                    day.isToday && !day.isSelected && "border border-[var(--color-harvest-flame)] text-[var(--color-harvest-flame)]"
                  )}
                >
                  {day.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--color-parchment-shadow)]/70 text-xs">
            {clearable ? (
              <button
                type="button"
                onClick={handleClear}
                className="font-semibold text-[var(--color-driftwood)] hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleToday}
              className="font-bold text-[var(--color-harvest-flame)] hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
