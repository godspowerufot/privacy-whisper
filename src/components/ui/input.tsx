"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] group-focus-within:text-[#6C5CE7] transition-colors">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            "w-full h-12 bg-[#121212] text-white text-sm font-medium",
            "border border-[#2A2A2A] placeholder:text-[#3A3A3A]",
            "transition-all duration-150",
            "focus:outline-none focus:border-[#6C5CE7] focus:shadow-[0_0_12px_rgba(108,92,231,0.25)]",
            error ? "border-[#FF4D4F] focus:border-[#FF4D4F] focus:shadow-[0_0_12px_rgba(255,77,79,0.25)]" : "",
            leftIcon ? "pl-10" : "px-4",
            rightIcon ? "pr-10" : "px-4",
            className,
          ].join(" ")}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] group-focus-within:text-[#6C5CE7] transition-colors">
            {rightIcon}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[#A1A1AA] text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-[#FF4D4F] text-xs font-medium">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

/* ─── Textarea ──────────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxChars?: number;
  securityNotice?: string;
}

export function Textarea({
  label,
  error,
  maxChars,
  securityNotice,
  className = "",
  id,
  value,
  onChange,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const charCount = typeof value === "string" ? value.length : 0;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        className={[
          "w-full min-h-40 bg-[#121212] text-white text-sm font-medium p-4",
          "border border-[#2A2A2A] placeholder:text-[#3A3A3A] resize-y",
          "transition-all duration-150",
          "focus:outline-none focus:border-[#6C5CE7] focus:shadow-[0_0_12px_rgba(108,92,231,0.25)]",
          error ? "border-[#FF4D4F]" : "",
          className,
        ].join(" ")}
        aria-invalid={!!error}
        {...props}
      />
      <div className="flex items-center justify-between">
        {securityNotice && (
          <p className="text-[#22C55E] text-xs flex items-center gap-1">
            <span>🔒</span> {securityNotice}
          </p>
        )}
        {maxChars && (
          <p
            className={[
              "text-xs ml-auto tabular-nums",
              charCount > maxChars * 0.9 ? "text-[#F59E0B]" : "text-[#A1A1AA]",
              charCount >= maxChars ? "text-[#FF4D4F]" : "",
            ].join(" ")}
          >
            {charCount}/{maxChars}
          </p>
        )}
      </div>
      {error && (
        <p className="text-[#FF4D4F] text-xs font-medium">⚠ {error}</p>
      )}
    </div>
  );
}
