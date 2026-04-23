"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { NotificationStack, useNotifications } from "@/components/ui/notification";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { items, dismiss } = useNotifications();
  const { isConnected } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to base dashboard if disconnected and on a subpage
  useEffect(() => {
    if (!isConnected && pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  }, [isConnected, pathname, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] game-grid">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <Navbar sidebarCollapsed={collapsed} pageTitle={pageTitle} />

      <main
        className={[
          "transition-all duration-200 pt-16",
          collapsed ? "ml-16" : "ml-[260px]",
        ].join(" ")}
      >
        <div className="p-6 animate-fade-in-up">{children}</div>
      </main>

      <NotificationStack items={items} onDismiss={dismiss} />
    </div>
  );
}
