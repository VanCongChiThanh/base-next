"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SearchableComboboxOption {
  value: string;
  label: string;
}

export interface SearchableComboboxProps {
  options: SearchableComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  buttonClassName?: string;
  /** Max height of dropdown list */
  listMaxHeightClass?: string;
}

function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm...",
  emptyText = "Không có kết quả",
  disabled = false,
  id: idProp,
  className,
  buttonClassName,
  listMaxHeightClass = "max-h-56",
}: SearchableComboboxProps) {
  const autoId = useId();
  const listboxId = idProp ?? `scb-${autoId}`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const nq = normalizeSearch(query);
    return options.filter((o) => normalizeSearch(o.label).includes(nq));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  const commit = useCallback(
    (v: string) => {
      onChange(v);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      commit(filtered[highlight]?.value ?? "");
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)} onKeyDown={onKeyDown}>
      <button
        type="button"
        id={listboxId}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "w-full text-left flex items-center justify-between gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300",
          disabled && "opacity-50 cursor-not-allowed",
          buttonClassName,
        )}
      >
        <span className={cn(!selected && "text-gray-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-labelledby={listboxId}
        >
          <div className="px-2 pb-1 pt-1 border-b border-gray-100">
            <input
              ref={inputRef}
              type="search"
              autoComplete="off"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <ul className={cn("overflow-y-auto py-1", listMaxHeightClass)}>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyText}</li>
            ) : (
              filtered.map((opt, idx) => (
                <li key={opt.value} role="option" aria-selected={opt.value === value}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      idx === highlight ? "bg-blue-50 text-blue-900" : "text-gray-800 hover:bg-gray-50",
                      opt.value === value && "font-semibold text-blue-700",
                    )}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(opt.value)}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
