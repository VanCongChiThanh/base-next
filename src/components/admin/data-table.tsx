"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  /** Hide this column on mobile screens (md and below) */
  hideOnMobile?: boolean;
  /** Mark as primary column — shown prominently in mobile card view */
  isPrimary?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  rowKey,
  emptyMessage = "Không có dữ liệu",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden divide-y divide-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-200 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
        <p className="text-gray-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const primaryCol = columns.find((c) => c.isPrimary) ?? columns[0];
  const secondaryCols = columns.filter((c) => c.key !== primaryCol.key);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Desktop table view (md+) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider",
                    col.sortable && "cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100 transition-colors",
                    col.className,
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      <svg
                        className="w-3.5 h-3.5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        {sortOrder === "ASC" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={rowKey(item)}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3 text-sm text-gray-700", col.className)}
                  >
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card view (<md) ── */}
      <div className="md:hidden divide-y divide-gray-100">
        {data.map((item) => (
          <div
            key={rowKey(item)}
            className={cn(
              "p-4 space-y-2 hover:bg-gray-50 transition-colors",
              onRowClick && "cursor-pointer active:bg-gray-100",
            )}
            onClick={() => onRowClick?.(item)}
          >
            {/* Primary field — large */}
            <div className="font-medium text-sm text-gray-900">
              {primaryCol.render
                ? primaryCol.render(item)
                : String((item as Record<string, unknown>)[primaryCol.key] ?? "")}
            </div>
            {/* Secondary fields */}
            <div className="space-y-1">
              {secondaryCols
                .filter((col) => !col.hideOnMobile || !col.hideOnMobile)
                .map((col) => {
                  const value = col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? "");
                  return (
                    <div key={col.key} className="flex items-start gap-2 text-xs">
                      <span className="shrink-0 font-medium text-gray-400 min-w-[80px]">
                        {col.label}
                      </span>
                      <span className="text-gray-700 flex-1 min-w-0">{value}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
