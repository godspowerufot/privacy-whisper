"use client";

import React, { useEffect, useCallback } from "react";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

export type NotifVariant = "success" | "error" | "warning" | "info";

export interface NotifItem {
  id: string;
  variant: NotifVariant;
  title: string;
  message?: string;
}

interface NotificationProps {
  items: NotifItem[];
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

const variantConfig: Record<
  NotifVariant,
  { icon: React.ReactNode; border: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 size={16} />,
    border: "border-l-[#22C55E]",
    iconColor: "text-[#22C55E]",
  },
  error: {
    icon: <XCircle size={16} />,
    border: "border-l-[#FF4D4F]",
    iconColor: "text-[#FF4D4F]",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    border: "border-l-[#F59E0B]",
    iconColor: "text-[#F59E0B]",
  },
  info: {
    icon: <Info size={16} />,
    border: "border-l-[#3B82F6]",
    iconColor: "text-[#3B82F6]",
  },
};

export function NotificationStack({
  items,
  onDismiss,
  autoDismissMs = 5000,
}: NotificationProps) {
  const scheduleAuto = useCallback(
    (id: string) => {
      setTimeout(() => onDismiss(id), autoDismissMs);
    },
    [autoDismissMs, onDismiss]
  );

  useEffect(() => {
    items.forEach((item) => scheduleAuto(item.id));
    // intentionally only run when items change (not scheduleAuto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80"
      aria-live="polite"
      aria-label="Notifications"
    >
      {items.map((item) => {
        const cfg = variantConfig[item.variant];
        return (
          <div
            key={item.id}
            role="alert"
            className={[
              "bg-[#181818] border border-[#2A2A2A] border-l-4 px-4 py-3",
              "flex items-start gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)]",
              "animate-slide-in-right",
              cfg.border,
            ].join(" ")}
          >
            <span className={["mt-0.5 flex-shrink-0", cfg.iconColor].join(" ")}>
              {cfg.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold uppercase tracking-wide">
                {item.title}
              </p>
              {item.message && (
                <p className="text-[#A1A1AA] text-xs mt-0.5 leading-relaxed">
                  {item.message}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              className="text-[#A1A1AA] hover:text-white transition-colors flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Hook for easy usage ─────────────────── */
export function useNotifications() {
  const [items, setItems] = React.useState<NotifItem[]>([]);

  const push = useCallback((item: Omit<NotifItem, "id">) => {
    setItems((prev) => [
      ...prev,
      { ...item, id: Math.random().toString(36).slice(2) },
    ]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { items, push, dismiss };
}
