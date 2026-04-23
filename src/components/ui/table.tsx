"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  emptyText?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  emptyText = "No records found.",
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#2A2A2A]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={[
                  "px-4 py-3 text-left text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest",
                  col.sortable ? "cursor-pointer hover:text-white select-none" : "",
                  col.width ?? "",
                ].join(" ")}
                onClick={() => col.sortable && onSort?.(String(col.key))}
                aria-sort={
                  sortKey === String(col.key)
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === String(col.key) && (
                    <span className="text-[#6C5CE7]">
                      {sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[#A1A1AA] text-sm"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={[
                  "border-b border-[#1E1E1E] table-row-hover transition-colors duration-150",
                  onRowClick ? "cursor-pointer" : "",
                ].join(" ")}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-white">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key as string] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Mobile card fallback */}
      <style>{`
        @media (max-width: 640px) {
          table, thead, tbody, th, td, tr { display: block; }
          thead tr { display: none; }
          tr { margin-bottom: 12px; border: 1px solid #2A2A2A; padding: 12px; }
          td::before {
            content: attr(data-label);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #A1A1AA;
            display: block;
            margin-bottom: 2px;
          }
        }
      `}</style>
    </div>
  );
}
