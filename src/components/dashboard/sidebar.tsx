"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  MessageSquare,
  Gift,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["journalist", "whisperer", null] },
  { label: "Create Case", href: "/dashboard/cases", icon: Folder, roles: ["journalist"] },
  { label: "Cases", href: "/dashboard/cases", icon: Folder, roles: ["journalist", "whisperer", null] },
  { label: "Incoming Whispers", href: "/dashboard/whispers", icon: MessageSquare, roles: ["journalist"] },
  { label: "Submit Tip", href: "/dashboard/cases", icon: MessageSquare, roles: ["whisperer"] },
  { label: "My Whispers", href: "/dashboard/whispers", icon: Shield, roles: ["whisperer"] },
  { label: "Rewards", href: "/dashboard/rewards", icon: Gift, roles: ["journalist", "whisperer"] },
  { label: "Platform Feed", href: "/dashboard/feed", icon: Zap, roles: ["journalist", "whisperer", null] },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["journalist", "whisperer", null] },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, disconnect } = useAuth();

  const handleLogout = () => {
    disconnect();
    router.push("/dashboard");
  };

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside
      className={[
        "fixed left-0 top-0 h-full z-40 flex flex-col",
        "bg-[#121212] border-r border-[#2A2A2A]",
        "transition-all duration-200",
        collapsed ? "w-16" : "w-[260px]",
      ].join(" ")}
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2A2A2A]">
        <div className="w-8 h-8 bg-[#6C5CE7] flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-black text-base tracking-widest uppercase">
            Whisper
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto" role="navigation">
        <ul className="flex flex-col gap-0.5 px-2">
          {filteredItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={[
                    "sidebar-item flex items-center gap-3 px-3 py-2.5 w-full",
                    "text-xs font-semibold uppercase tracking-widest",
                    "focus-ring transition-colors",
                    isActive
                      ? "active text-white"
                      : "text-[#A1A1AA] hover:text-white",
                    collapsed ? "justify-center" : "",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="border-t border-[#2A2A2A]" />

      {/* Bottom area */}
      <div className="py-3 px-2 flex flex-col gap-0.5">
        <button
          className={[
            "sidebar-item flex items-center gap-3 px-3 py-2.5 w-full",
            "text-xs font-semibold uppercase tracking-widest text-[#A1A1AA] hover:text-white",
            collapsed ? "justify-center" : "",
          ].join(" ")}
          title={collapsed ? "Profile" : undefined}
        >
          <User size={16} className="flex-shrink-0" />
          {!collapsed && <span>Profile</span>}
        </button>
        <button
          onClick={handleLogout}
          className={[
            "sidebar-item flex items-center gap-3 px-3 py-2.5 w-full",
            "text-xs font-semibold uppercase tracking-widest text-[#A1A1AA] hover:text-[#FF4D4F]",
            collapsed ? "justify-center" : "",
          ].join(" ")}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-14 w-6 h-6 bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#6C5CE7] transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
