"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  lines?: number;
  variant?: "line" | "card" | "avatar" | "metric";
}

export function Skeleton({ className = "", variant = "line" }: SkeletonProps) {
  if (variant === "avatar") {
    return (
      <div className={["skeleton w-10 h-10 rounded-full", className].join(" ")} />
    );
  }
  if (variant === "metric") {
    return (
      <div className="bg-[#181818] border border-[#2A2A2A] p-6 flex flex-col gap-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-10 w-16" />
        <div className="skeleton h-2 w-20" />
      </div>
    );
  }
  if (variant === "card") {
    return (
      <div className="bg-[#181818] border border-[#2A2A2A] p-6 flex flex-col gap-3">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-2 w-full" />
        <div className="skeleton h-2 w-5/6" />
        <div className="skeleton h-2 w-4/6" />
      </div>
    );
  }
  return <div className={["skeleton h-3 w-full", className].join(" ")} />;
}

/* ─── Table Skeleton ─────────────────────── */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-0">
      {/* header */}
      <div className="flex gap-4 px-4 py-3 border-b border-[#2A2A2A]">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-2 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 px-4 py-3 border-b border-[#1E1E1E]"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={["skeleton h-3 flex-1", c === 0 ? "w-1/4" : ""].join(" ")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
