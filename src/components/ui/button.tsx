"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: [
    "bg-[#6C5CE7] text-white border border-[#6C5CE7]",
    "hover:brightness-125 hover:shadow-[0_0_16px_rgba(108,92,231,0.5)]",
    "active:scale-[0.98]",
  ].join(" "),
  secondary: [
    "bg-transparent text-[#00D1B2] border border-[#00D1B2]",
    "hover:bg-[#00D1B2] hover:text-[#0A0A0A] hover:shadow-[0_0_16px_rgba(0,209,178,0.4)]",
    "active:scale-[0.98]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[#A1A1AA] border border-[#2A2A2A]",
    "hover:bg-[#1E1E1E] hover:text-white hover:border-[#3A3A3A]",
    "active:scale-[0.98]",
  ].join(" "),
  danger: [
    "bg-[#FF4D4F] text-white border border-[#FF4D4F]",
    "hover:brightness-125 hover:shadow-[0_0_16px_rgba(255,77,79,0.5)]",
    "active:scale-[0.98]",
  ].join(" "),
};

const sizes: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-[10px]",
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={[
        "relative inline-flex items-center justify-center gap-2",
        "font-semibold tracking-wide uppercase text-[0.72em] letter-spacing-widest",
        "transition-all duration-150 cursor-pointer select-none",
        "clip-corner-tl", // game-style corner clip
        variants[variant],
        sizes[size],
        isDisabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "",
        className,
      ].join(" ")}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
