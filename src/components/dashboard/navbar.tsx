"use client";

import React, { useState } from "react";
import { Bell, Search, Zap, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RoleSelectionModal } from "./role-selection-modal";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface NavbarProps {
  sidebarCollapsed?: boolean;
  pageTitle?: string;
}

export function Navbar({ sidebarCollapsed = false, pageTitle }: NavbarProps) {
  const { role, isConnected, disconnect } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header
      className={[
        "fixed top-0 right-0 z-30 h-16 flex items-center gap-4 px-6",
        "bg-[#0A0A0A]/90 border-b border-[#2A2A2A]",
        "backdrop-blur-sm transition-all duration-200",
        sidebarCollapsed ? "left-16" : "left-[260px]",
      ].join(" ")}
    >
      {/* Page title / Connect Area */}
      <div className="flex items-center gap-4">
        {pageTitle && (
          <h1 className="text-white font-black text-sm uppercase tracking-widest mr-2 shrink-0">
            {pageTitle}
          </h1>
        )}

        <ConnectButton accountStatus="avatar" showBalance={true} />
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm ml-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
        />
        <input
          type="search"
          placeholder="Search global network..."
          className={[
            "w-full h-9 bg-[#181818] text-white text-xs pl-9 pr-4",
            "border border-[#2A2A2A] placeholder:text-[#3A3A3A]",
            "focus:outline-none focus:border-[#6C5CE7] focus:shadow-[0_0_12px_rgba(108,92,231,0.2)]",
            "transition-all duration-150",
          ].join(" ")}
          aria-label="Global search"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Role Indicator */}
        {isConnected && (
          <div className={[
            "hidden md:flex items-center gap-2 px-3 py-1 border font-bold text-[9px] uppercase tracking-[0.2em]",
            role === "journalist" 
              ? "bg-[#6C5CE7]/10 border-[#6C5CE7]/30 text-[#6C5CE7]" 
              : "bg-[#00D1B2]/10 border-[#00D1B2]/30 text-[#00D1B2]"
          ].join(" ")}>
            <div className={["w-1 h-1 rounded-full animate-pulse", role === "journalist" ? "bg-[#6C5CE7]" : "bg-[#00D1B2]"].join(" ")} />
            {role} verified
          </div>
        )}

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors border border-transparent hover:border-[#2A2A2A]"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF4D4F] animate-pulse" />
        </button>

        {/* User Identity */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-white text-[10px] font-black uppercase tracking-wider">
              {isConnected ? (role === "journalist" ? "Elena Fischer" : "Anon_Whisperer") : "Guest User"}
            </span>
            <span className="text-[#555] text-[8px] font-bold uppercase">
              {isConnected ? `Clearance: ${role === "journalist" ? "Alpha" : "Beta"}` : "Access restricted"}
            </span>
          </div>
          <div className={[
            "w-9 h-9 flex items-center justify-center text-white text-xs font-black uppercase flex-shrink-0 transition-all border",
            isConnected 
              ? (role === "journalist" ? "bg-[#6C5CE7] border-[#6C5CE7]" : "bg-[#00D1B2] border-[#00D1B2]") 
              : "bg-[#181818] border-[#2A2A2A]"
          ].join(" ")}>
            {isConnected ? (role === "journalist" ? "EF" : "AW") : "??"}
          </div>
        </div>
      </div>

      <RoleSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
}

