"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Shield, MessageSquare, Terminal, Eye, Zap, Lock } from "lucide-react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { toast } from "react-toastify";
import { useAuth, UserRole } from "@/lib/auth-context";
import { ADDRESSES } from "@/constants/contracts";
import AccessControlManagerABI from '../../../abi/AccessControlManager.json';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  const { address } = useAccount();
  const { connect } = useAuth();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSelect = async (role: UserRole) => {
    if (role === "journalist") {
      if (!address || !publicClient) {
        console.error("Wallet not connected or public client unavailable");
        return;
      }

      setIsRegistering(true);
      const toastId = toast.loading("Registering Journalist...");

      try {
        // Read check: has this address already registered?
        const isAlreadyJournalist = await publicClient.readContract({
          address: ADDRESSES.AccessControlManager as `0x${string}`,
          abi: AccessControlManagerABI.abi,
          functionName: "isJournalist",
          args: [address],
        });

        console.log("isAlreadyJournalist:", isAlreadyJournalist);

        if (isAlreadyJournalist) {
          toast.update(toastId, {
            render: "Already registered as Journalist!",
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });
          connect(role);
          onClose();
          return;
        }

        // Write: use wagmi's writeContractAsync — guaranteed correct calldata encoding
        const hash = await writeContractAsync({
          address: ADDRESSES.AccessControlManager as `0x${string}`,
          abi: AccessControlManagerABI.abi,
          functionName: "registerJournalist",
          gas: BigInt(300000), // bypass gas estimation issues on FHEVM-compiled contracts
        });

        console.log("Registration tx hash:", hash);

        // Wait for on-chain confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 60_000,
        });

        if (receipt.status === "success") {
          toast.update(toastId, {
            render: "Journalist registered successfully!",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          });
          connect(role);
          onClose();
        } else {
          throw new Error("Transaction reverted on-chain");
        }
      } catch (error: any) {
        console.error("Registration failed:", error);
        toast.update(toastId, {
          render: error?.shortMessage || error?.message || "Registration failed",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      } finally {
        setIsRegistering(false);
      }
    } else {
      // Whisperer is permissionless
      connect(role);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-md overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full game-grid bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_70%)]" />
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-slow-spin bg-[conic-gradient(from_0deg,_#6C5CE733_0deg,_transparent_60deg,_#00D1B233_120deg,_transparent_180deg,_#6C5CE733_240deg,_transparent_300deg)]" />
      </div>

      <div className="relative w-full max-w-5xl px-6 flex flex-col items-center">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 mb-4">
            <Lock size={12} className="text-[#6C5CE7]" />
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/60">Secure Handshake Required</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 italic">
            Identity <span className="text-[#6C5CE7]">Verification</span>
          </h2>
          <p className="text-[#A1A1AA] text-sm md:text-base max-w-lg mx-auto font-medium">
            Select your clearance level to access the encrypted investigation network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl pt-4">
          {/* Journalist Card */}
          <button
            onClick={() => handleSelect("journalist")}
            disabled={isRegistering}
            onMouseEnter={() => setHoveredRole("journalist")}
            onMouseLeave={() => setHoveredRole(null)}
            className={`group relative flex flex-col items-center text-center p-8 bg-[#0F0F0F] border border-white/10 transition-all duration-500 hover:border-[#6C5CE7] hover:bg-[#141414] hover:shadow-[0_0_50px_rgba(108,92,231,0.15)] animate-in fade-in slide-in-from-left-12 duration-1000 ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {/* Corner Accents */}
            <span className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-white/20 group-hover:border-[#6C5CE7] transition-colors" />
            <span className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white/20 group-hover:border-[#6C5CE7] transition-colors" />

            <div className="relative mb-8">
              <div className="w-24 h-24 bg-[#6C5CE7]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Terminal size={48} className="text-[#6C5CE7]" />
              </div>
              <div className="absolute inset-0 animate-pulse opacity-50 bg-[#6C5CE7] blur-3xl pointer-events-none" />
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4 group-hover:text-[#6C5CE7] transition-colors">
              {isRegistering && hoveredRole === 'journalist' ? 'Registering...' : 'Journalist'}
            </h3>
            <p className="text-[#A1A1AA] text-xs leading-relaxed font-bold uppercase tracking-tight mb-8">
              CLEARANCE LEVEL: ALPHA<br />
              PRIMARY TASK: CREATE CASES & VALIDATE INTEL<br />
              REACH: GLOBAL NETWORK access
            </p>

            <div className="flex flex-col gap-2 w-full text-left text-[10px] font-mono border-t border-white/5 pt-6">
              <div className="flex items-center gap-2 text-[#555] group-hover:text-white/60 transition-colors">
                <Eye size={12} /> SCANNING ENCRYPTED FEEDS
              </div>
              <div className="flex items-center gap-2 text-[#555] group-hover:text-white/60 transition-colors">
                <Terminal size={12} /> MANUAL CASE INITIALIZATION
              </div>
              <div className="flex items-center gap-2 text-[#555] group-hover:text-white/60 transition-colors">
                <Zap size={12} /> PRIZE POOL ALLOCATION
              </div>
            </div>

            <div className="mt-8 w-full h-1 bg-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[#6C5CE7] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
            </div>
          </button>

          {/* Whisperer Card */}
          <button
            onClick={() => handleSelect("whisperer")}
            disabled={isRegistering}
            onMouseEnter={() => setHoveredRole("whisperer")}
            onMouseLeave={() => setHoveredRole(null)}
            className={`group relative flex flex-col items-center text-center p-8 bg-[#0F0F0F] border border-white/10 transition-all duration-500 hover:border-[#00D1B2] hover:bg-[#141414] hover:shadow-[0_0_50px_rgba(0,209,178,0.15)] animate-in fade-in slide-in-from-right-12 duration-1000 ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {/* Corner Accents */}
            <span className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-white/20 group-hover:border-[#00D1B2] transition-colors" />
            <span className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-white/20 group-hover:border-[#00D1B2] transition-colors" />

            <div className="relative mb-8">
              <div className="w-24 h-24 bg-[#00D1B2]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Shield size={48} className="text-[#00D1B2]" />
              </div>
              <div className="absolute inset-0 animate-pulse opacity-50 bg-[#00D1B2] blur-3xl pointer-events-none" />
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4 group-hover:text-[#00D1B2] transition-colors">Whisperer</h3>
            <p className="text-[#A1A1AA] text-xs leading-relaxed font-bold uppercase tracking-tight mb-8">
              CLEARANCE LEVEL: STEALTH<br />
              PRIMARY TASK: ANONYMOUS TIP SUBMISSION<br />
              REACH: END-TO-END ENCRYPTED PIPES
            </p>

            <div className="flex flex-col gap-2 w-full text-left text-[10px] font-mono border-t border-white/5 pt-6">
              <div className="flex items-center gap-2 text-[#555] group-hover:text-white/60 transition-colors">
                <MessageSquare size={12} /> SECURE TIP SUBMISSION
              </div>
              <div className="flex items-center gap-2 text-[#555] group-hover:text-white/60 transition-colors">
                <Terminal size={12} /> ANONYMOUS PROFILE LOGBOOKS
              </div>
              <div className="flex items-center gap-2 text-[#555] group-hover:text-white/60 transition-colors">
                <Zap size={12} /> EARN BOUNTY REWARDS
              </div>
            </div>

            <div className="mt-8 w-full h-1 bg-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[#00D1B2] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-12 text-[#555] hover:text-white text-[10px] font-black uppercase tracking-[0.5em] transition-colors"
        >
          - ABORT CONNECTION -
        </button>
      </div>
    </div>,
    document.body
  );
}
