"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: "default" | "danger";
  loading?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  loading = false,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop animate-fade-in-up px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-[#181818] border border-[#2A2A2A] shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
        {/* Game corner accents */}
        <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#6C5CE7]" />
        <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#6C5CE7]" />
        <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#6C5CE7]/30" />
        <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#6C5CE7]/30" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <h2
            id="modal-title"
            className="text-white font-bold text-sm uppercase tracking-widest"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors p-1"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-[#A1A1AA] text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2A2A2A]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
