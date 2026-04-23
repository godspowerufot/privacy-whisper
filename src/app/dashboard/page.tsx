"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { JournalistDashboard } from "@/components/dashboard/journalist-dashboard";
import { WhispererDashboard } from "@/components/dashboard/whisperer-dashboard";
import { Shield, Zap, Lock } from "lucide-react";
import { useState } from "react";
import { RoleSelectionModal } from "@/components/dashboard/role-selection-modal";

export default function DashboardPage() {
  const { role, isConnected } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DashboardLayout pageTitle={isConnected ? `${role} dashboard` : "Dashboard"}>
      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-primary/10 flex items-center justify-center">
              <Shield size={48} className="text-primary" />
            </div>
            <div className="absolute inset-0 animate-pulse opacity-30 bg-primary blur-3xl pointer-events-none" />
          </div>

          <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">
            Connection <span className="text-primary">Required</span>
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-10 leading-relaxed font-medium">
            This terminal is currently in guest mode. To access investigations, submit intelligence, or manage rewards, you must establish a secure identity connection.
          </p>

          <Button 
            variant="primary" 
            size="lg" 
            className="px-12 h-14 group"
            onClick={() => setIsModalOpen(true)}
          >
            <Zap size={16} className="group-hover:animate-bounce" />
            Establish Secure Connection
          </Button>

          <div className="mt-12 flex items-center gap-6 text-[#333] font-bold text-[10px] uppercase tracking-[0.3em]">
            <span className="flex items-center gap-2"><Lock size={12} /> AES-256</span>
            <span className="flex items-center gap-2"><Lock size={12} /> E2E Encrypted</span>
            <span className="flex items-center gap-2"><Lock size={12} /> Zero-Log</span>
          </div>
        </div>
      ) : role === "journalist" ? (
        <JournalistDashboard />
      ) : (
        <WhispererDashboard />
      )}

      <RoleSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardLayout>
  );
}

