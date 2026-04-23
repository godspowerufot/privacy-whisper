"use client";

import React from "react";

type CardVariant = "standard" | "metric" | "secure" | "glass";

interface CardProps {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  metricValue?: string | number;
  metricLabel?: string;
  metricDelta?: { value: string; positive: boolean };
}

export function Card({
  variant = "standard",
  title,
  subtitle,
  footer,
  children,
  className = "",
  metricValue,
  metricLabel,
  metricDelta,
}: CardProps) {
  const base = "relative overflow-hidden transition-all duration-200";

  const variantStyles: Record<CardVariant, string> = {
    standard: "bg-[#181818] border border-[#2A2A2A] hover:border-[#6C5CE7]/30",
    metric: "bg-[#181818] border border-[#2A2A2A] hover:border-[#6C5CE7]/40 hover:shadow-[0_0_24px_rgba(108,92,231,0.15)]",
    secure: "bg-[#141414] border border-[#22C55E]/20 hover:border-[#22C55E]/40",
    glass: "bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/8",
  };

  if (variant === "metric") {
    return (
      <div className={[base, variantStyles.metric, "p-6", className].join(" ")}>
        {/* Corner accent — game style */}
        <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#6C5CE7]" />
        <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#6C5CE7]/30" />

        <p className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-widest mb-2">
          {metricLabel}
        </p>
        <p className="text-4xl font-black text-white tabular-nums leading-none">
          {metricValue}
        </p>
        {metricDelta && (
          <p
            className={[
              "mt-2 text-xs font-semibold",
              metricDelta.positive ? "text-[#22C55E]" : "text-[#FF4D4F]",
            ].join(" ")}
          >
            {metricDelta.positive ? "▲" : "▼"} {metricDelta.value}
          </p>
        )}
      </div>
    );
  }

  if (variant === "secure") {
    return (
      <div className={[base, variantStyles.secure, "p-6", className].join(" ")}>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-[#22C55E] text-xs font-semibold uppercase tracking-widest">
            Encrypted
          </span>
        </div>
        {title && <h3 className="text-white font-bold text-base mb-2">{title}</h3>}
        {children}
      </div>
    );
  }

  return (
    <div className={[base, variantStyles[variant], "p-6", className].join(" ")}>
      {/* Game corner mark */}
      <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#6C5CE7]/40" />

      {title && (
        <div className="mb-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">{title}</h3>
          {subtitle && <p className="text-[#A1A1AA] text-xs mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="mt-4 pt-4 border-t border-[#2A2A2A]">{footer}</div>
      )}
    </div>
  );
}
