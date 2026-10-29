"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: (string | CustomSelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  icon,
  className,
  triggerClassName,
  menuClassName,
  ariaLabel,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const formattedOptions: CustomSelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = formattedOptions.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder,
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full min-w-[140px]", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 bg-white border border-[#c0bbb6] text-[#1d1e1c] text-sm font-semibold rounded-[16px] px-4 py-2.5 shadow-sm transition-all duration-200 hover:border-[#fa5d00] focus:outline-none focus:ring-2 focus:ring-[#fa5d00]/20 select-none text-left",
          isOpen && "border-[#fa5d00] ring-2 ring-[#fa5d00]/20 shadow-md",
          disabled ? "opacity-60 cursor-not-allowed bg-[#fff8f1]/50 border-[#e3d6c5] hover:border-[#e3d6c5]" : "cursor-pointer",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon && <span className="text-[#fa5d00] shrink-0">{icon}</span>}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#8e8b87] shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-[#fa5d00]"
          )}
        />
      </button>

      {/* Floating Curved Menu */}
      {isOpen && !disabled && (
        <div className={cn("absolute left-0 right-0 top-full mt-2 z-[130] min-w-[180px] bg-white border border-[#e3d6c5] rounded-[20px] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto", menuClassName)}>
          {formattedOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[12px] text-sm font-medium transition-all text-left cursor-pointer",
                  isSelected
                    ? "bg-[#fff8f1] text-[#fa5d00] font-bold"
                    : "text-[#1d1e1c] hover:bg-[#fff8f1] hover:text-[#fa5d00]"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {option.icon}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#fa5d00] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
