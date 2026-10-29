"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Check, ChevronDown, LoaderCircle, Plus, Search, X } from "lucide-react";

export interface SearchableComboboxItem {
  id: string;
  value: string;
  label: string;
  sublabel?: string | null;
  badge?: string | null;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string, item?: SearchableComboboxItem) => void;
  onSearch: (query: string) => Promise<SearchableComboboxItem[]>;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  addNewLabel?: string;
  onAddNew?: () => void;
  className?: string;
  triggerClassName?: string;
  autoSelectFirst?: boolean;
}

export function SearchableCombobox({
  value,
  onChange,
  onSearch,
  placeholder = "Search by name, ID, or email...",
  disabled = false,
  addNewLabel,
  onAddNew,
  className = "",
  triggerClassName = "",
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [items, setItems] = useState<SearchableComboboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Sync external value when prop changes without cascading effect
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  // Debounce the search query by 250ms (in the 200-300ms range specified)
  const debouncedQuery = useDebounce(inputValue, 250);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch results when debounced query changes
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const results = await onSearch(debouncedQuery);
        if (!cancelled) {
          setItems(results);
          setSelectedIndex(-1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Combobox search error:", err);
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, onSearch]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: SearchableComboboxItem) => {
    setInputValue(item.value);
    onChange(item.value, item);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (isOpen && selectedIndex >= 0 && selectedIndex < items.length) {
        e.preventDefault();
        handleSelect(items[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`h-[48px] w-full rounded-[14px] border border-[var(--color-bone)] bg-[var(--color-surface)] pl-10 pr-16 text-sm font-medium text-[var(--color-ink-black)] placeholder:text-[var(--color-driftwood)] focus:border-[var(--color-harvest-flame)] focus:outline-none focus:ring-2 focus:ring-[var(--color-harvest-flame)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-raised)] ${triggerClassName}`}
        />
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-driftwood)]" />

        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading && <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-harvest-flame)]" />}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-1 text-[var(--color-driftwood)] hover:bg-[var(--color-cream-canvas)] hover:text-[var(--color-ink-black)]"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-full p-1 text-[var(--color-driftwood)] hover:text-[var(--color-ink-black)]"
            tabIndex={-1}
            aria-label="Toggle options list"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {onAddNew && addNewLabel && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddNew();
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--color-harvest-flame)]/40 bg-[var(--color-cream-canvas)]/80 px-3 py-2 text-xs font-bold text-[var(--color-harvest-flame)] hover:bg-[var(--color-cream-canvas)] hover:border-[var(--color-harvest-flame)]"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>{addNewLabel}</span>
            </button>
          )}

          {items.length === 0 ? (
            <div className="p-3 text-center text-xs text-[var(--color-driftwood)]">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-harvest-flame)]" />
                  <span>Searching...</span>
                </div>
              ) : inputValue ? (
                <div className="space-y-2 py-1">
                  <p className="font-semibold text-xs text-[var(--color-ink-black)]">
                    No directory records match &quot;{inputValue}&quot;
                  </p>
                  <p className="text-[11px] text-[var(--color-warm-stone)]">
                    You can use this typed value directly or add it to the directory.
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onChange(inputValue);
                        setIsOpen(false);
                      }}
                      className="rounded-lg bg-[var(--color-cream-canvas)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-harvest-flame)] hover:bg-[var(--color-harvest-flame)] hover:text-white transition-colors"
                    >
                      Use &quot;{inputValue}&quot; as ID
                    </button>
                    {onAddNew && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddNew();
                        }}
                        className="rounded-lg border border-dashed border-[var(--color-harvest-flame)]/40 px-2.5 py-1.5 text-xs font-medium text-[var(--color-harvest-flame)] hover:bg-[var(--color-cream-canvas)] transition-colors"
                      >
                        + Add to directory
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <p className="font-medium text-[var(--color-ink-black)]">Type to search</p>
                  <p className="text-[11px] text-[var(--color-driftwood)] mt-0.5">Search by name, email, or ID</p>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-0.5 pt-1">
              {items.map((item, index) => {
                const isSelected = item.value === value;
                const isFocused = index === selectedIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-[var(--color-harvest-flame)]/10 font-bold text-[var(--color-harvest-flame)]"
                          : isFocused
                          ? "bg-[var(--color-cream-canvas)] text-[var(--color-ink-black)]"
                          : "text-[var(--color-ink-black)] hover:bg-[var(--color-cream-canvas)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold">{item.label}</span>
                          {item.badge && (
                            <span className="rounded bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.sublabel && (
                          <p className="truncate text-[11px] text-[var(--color-driftwood)]">{item.sublabel}</p>
                        )}
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--color-harvest-flame)]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
