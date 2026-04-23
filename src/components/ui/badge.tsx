"use client";

import React from "react";

type BadgeVariant = "open" | "reviewed" | "urgent" | "pending" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  open: "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30",
  reviewed: "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30",
  urgent: "bg-[#FF4D4F]/15 text-[#FF4D4F] border border-[#FF4D4F]/30",
  pending: "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30",
  default: "bg-[#2A2A2A] text-[#A1A1AA] border border-[#3A3A3A]",
};

const dotColors: Record<BadgeVariant, string> = {
  open: "bg-[#3B82F6]",
  reviewed: "bg-[#22C55E]",
  urgent: "bg-[#FF4D4F] animate-pulse",
  pending: "bg-[#F59E0B]",
  default: "bg-[#A1A1AA]",
};

export function Badge({
  variant = "default",
  children,
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-widest",
        badgeStyles[variant],
        className,
      ].join(" ")}
    >
      {dot && (
        <span className={["w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant]].join(" ")} />
      )}
      {children}
    </span>
  );
}
