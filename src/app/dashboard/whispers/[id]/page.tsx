"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  ArrowLeft, Shield, Clock, FileText, User,
  Eye, Link2, Flag, Folder, Loader2, Gift
} from "lucide-react";
import Link from "next/link";
import { useWhisperVault, useWhisperCaseManager, useRewardManager } from "@/hooks/useContracts";
import { useFhevmDecrypt } from "@/hooks/useFhevmDecrypt";
import { useFhevmEncrypt } from "@/hooks/useFhevmEncrypt";
import { ADDRESSES } from "@/constants/contracts";

export default function WhisperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const vault = useWhisperVault();
  const caseManager = useWhisperCaseManager();
  const { decryptHandle, isDecrypting } = useFhevmDecrypt();
  const { encrypt256 } = useFhevmEncrypt();

  const [whisperData, setWhisperData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [caseTitle, setCaseTitle] = useState("Unknown Case");

  const [escalateOpen, setEscalateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const rewardManager = useRewardManager();
  const [rewardingWhisper, setRewardingWhisper] = useState(false);
  const [rejected, setRejected] = useState(false);

  const fetchWhisper = useCallback(async () => {
    if (!vault || !id || !caseManager) return;
    try {
      setIsLoading(true);

      let whisper;
      let onChainIndex;
      let caseId;

      if (id.startsWith("W-G-")) {
        onChainIndex = parseInt(id.replace("W-G-", ""));
        whisper = await vault.getGlobalWhisper(onChainIndex);
        caseId = whisper.caseId;
      } else if (id.startsWith("W-C-")) {
        // Format: W-C-{caseId}-{whisperIndex}
        const parts = id.split("-");
        caseId = BigInt(parts[2]);
        onChainIndex = parseInt(parts[3]);
        whisper = await vault.getWhisper(caseId, onChainIndex);
      }

      if (whisper) {
        // Fetch case title
        try {
          if (caseId > BigInt(0)) {
            const c = await caseManager.getCase(caseId);
            setCaseTitle(c.title);
          } else {
            setCaseTitle("General Platform");
          }
        } catch (e) { console.error(e); }

        const sanitizeString = (str: string) => str.replace(/\0/g, '').trim();

        const mappedAttachments = whisper.attachments.map((a: any) => ({
          name: sanitizeString(a.name),
          size: sanitizeString(a.size),
          type: sanitizeString(a.fileType)
        }));

        setWhisperData({
          id,
          onChainIndex,
          caseId,
          content: "🔒 Encrypted Transmission",
          status: whisper.status || "unread",
          isUrgent: whisper.isUrgent,
          timestamp: new Date(Number(whisper.timestamp) * 1000).toLocaleString(),
          attachments: mappedAttachments.filter((a: any) => a.name !== "long_form_payload"),
          longFormPayload: mappedAttachments.find((a: any) => a.name === "long_form_payload")?.type || null,
          encryptedMessageHandle: whisper.encryptedMessage
        });
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[WhisperDetail] Error fetching whisper:", err);
    } finally {
      setIsLoading(false);
    }
  }, [vault, id, caseManager]);

  useEffect(() => {
    fetchWhisper();
  }, [fetchWhisper]);

  const handleReveal = async () => {
    if (!vault || !whisperData || !address) return;

    const toastId = toast.loading("🔓 Requesting Reveal...");
    setIsRevealing(true);

    try {
      // 1. Request reveal on-chain (makes handle publicly decryptable)
      const tx = await vault.requestWhisperReveal(whisperData.caseId, whisperData.onChainIndex);
      toast.update(toastId, { render: "Waiting for blockchain approval...", type: "info" });
      const receipt = await tx.wait();

      // 2. Extract the handle from the event instead of calling getGlobalWhisper (avoiding view-call reverts)
      const revealEvent = receipt.logs
        .map((log: any) => {
          try { return vault.interface.parseLog(log); } catch (e) { return null; }
        })
        .find((e: any) => e && e.name === "WhisperRevealRequested");

      if (!revealEvent) throw new Error("Could not find Reveal event in transaction receipt.");
      const messageHandle = revealEvent.args.messageHandle;

      // 3. Use FHEVM to decrypt the handle
      toast.update(toastId, { render: "Decrypting at secure terminal...", type: "info" });
      const decryptedBigInt = await decryptHandle(messageHandle, ADDRESSES.WhisperVault);

      if (decryptedBigInt === null) throw new Error("FHE Decryption returned null");

      // 4. Extract decrypted key bytes
      const hex = decryptedBigInt.toString(16).padStart(64, '0');
      const keyBytes = ethers.getBytes("0x" + hex).slice(0, 32);

      let finalContent = "";

      if (whisperData.longFormPayload) {
         try {
           const fullBytes = Buffer.from(whisperData.longFormPayload, "base64");
           const iv = fullBytes.slice(0, 12);
           const ciphertext = fullBytes.slice(12);

           const cryptoKey = await window.crypto.subtle.importKey(
             "raw",
             keyBytes,
             { name: "AES-GCM" },
             false,
             ["decrypt"]
           );

           const decryptedBuffer = await window.crypto.subtle.decrypt(
             { name: "AES-GCM", iv: iv },
             cryptoKey,
             ciphertext
           );

           finalContent = new TextDecoder().decode(decryptedBuffer);
         } catch (e) {
           console.error("[AES Decryption Failed]:", e);
           finalContent = "⚠️ AES-GCM Decryption of long-form data failed. Data integrity compromised.";
         }
      } else {
         // Fallback to older direct payload
         finalContent = new TextDecoder().decode(keyBytes).replace(/\0/g, '');
      }

      setWhisperData((prev: any) => ({
        ...prev,
        content: finalContent,
        status: "reviewed"
      }));

      toast.update(toastId, {
        render: "Content revealed! ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
    } catch (err: any) {
      console.error("[WhisperDetail] Reveal failed:", err);
      toast.update(toastId, {
        render: `Error: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsRevealing(false);
    }
  };

  const handleReward = async () => {
    if (!vault || !rewardManager || !address || !whisperData) {
      toast.error("Wallet connection or contract not ready.");
      return;
    }

    const toastId = toast.loading("💡 Initializing Reward Sequence...");
    setRewardingWhisper(true);

    try {
      // 1. Check if reward is already approved
      const rewardInfo = await rewardManager.rewards(whisperData.caseId);
      if (!rewardInfo.approved) {
        toast.update(toastId, { render: "Locking confidential reward amount...", type: "info" });
        
        // Encrypt amount (1000 as placeholder based on contract logic)
        const encrypted = await encrypt256(BigInt(1000), ADDRESSES.RewardManager);
        if (!encrypted) throw new Error("Encryption of reward amount failed.");

        const txApprove = await rewardManager.approveReward(
          whisperData.caseId,
          encrypted.handles[0],
          encrypted.inputProof
        );
        await txApprove.wait();
        toast.update(toastId, { render: "Reward approved! Revealing recipient...", type: "info" });
      }

      // 2. Request Submitter Reveal on-chain
      console.log(`[WhisperDetail] Requesting submitter reveal...`);
      const txReveal = await vault.requestSubmitterReveal(whisperData.caseId, whisperData.onChainIndex);
      toast.update(toastId, { render: "Unlocking source identity...", type: "info" });
      const receiptReveal = await txReveal.wait();

      if (!receiptReveal) throw new Error("Reveal transaction failed.");

      // 3. Extract Submitter Handle from event
      const revealEvent = receiptReveal.logs
        .map((log: any) => {
          try { return vault.interface.parseLog(log); } catch (e) { return null; }
        })
        .find((e: any) => e && e.name === "SubmitterRevealRequested");

      if (!revealEvent) throw new Error("Could not extract identity handle.");
      const submitterHandle = revealEvent.args.submitterHandle;

      // 4. Decrypt the address
      toast.update(toastId, { render: "Decrypting source address...", type: "info" });
      const decryptedAddrBigInt = await decryptHandle(submitterHandle, ADDRESSES.WhisperVault);
      if (!decryptedAddrBigInt) throw new Error("Failed to decrypt source address.");

      const sourceAddress = ethers.getAddress("0x" + decryptedAddrBigInt.toString(16).padStart(40, '0'));
      console.log("[WhisperDetail] Decrypted source address:", sourceAddress);

      // 5. Distribute Reward
      toast.update(toastId, { render: "Executing reward distribution...", type: "info" });
      const txReward = await rewardManager.distributeReward(whisperData.caseId, sourceAddress);
      await txReward.wait();

      toast.update(toastId, {
        render: "Reward successfully sent to source! 🏆",
        type: "success",
        isLoading: false,
        autoClose: 5000
      });
    } catch (err: any) {
      console.error("[WhisperDetail] Reward failed:", err);
      toast.update(toastId, {
        render: `Reward failed: ${err.reason || err.message || "Unknown error"}`,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setRewardingWhisper(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Loading Whisper...">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-widest">Accessing Vault...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!whisperData) {
    return (
      <DashboardLayout pageTitle="Whisper Not Found">
        <div className="text-center py-24">
          <p className="text-[#A1A1AA] text-sm mb-4">No whisper found with ID <span className="font-mono text-white">{id}</span></p>
          <Link href="/dashboard/whispers">
            <Button variant="ghost" size="sm">← Back to Whispers</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Whisper Detail">
      <Link
        href="/dashboard/whispers"
        className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white text-xs font-semibold uppercase tracking-widest mb-6 transition-colors"
      >
        <ArrowLeft size={12} /> Back to Whispers
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#6C5CE7] font-mono text-sm font-bold">{whisperData.id}</span>
            <Badge variant={whisperData.status} dot>{whisperData.status}</Badge>
            {whisperData.isUrgent && <span className="bg-error/20 text-error text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest">Urgent</span>}
          </div>
          <h2 className="text-white font-black text-lg leading-snug max-w-2xl">
            Intel Packet: {caseTitle}
          </h2>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setAssignOpen(true)}>
            <Folder size={12} /> Link Case
          </Button>
          {whisperData.status === 'reviewed' && (
            <Button
              variant="primary"
              size="sm"
              className="bg-success hover:bg-success/80 border-none px-4"
              disabled={rewardingWhisper}
              onClick={handleReward}
            >
              {rewardingWhisper ? <Loader2 size={12} className="animate-spin mr-1" /> : <Gift size={12} className="mr-1" />}
              Send Reward
            </Button>
          )}
          <Button variant="primary" size="sm"
            disabled={isRevealing || whisperData.status === 'reviewed'}
            onClick={handleReveal}
          >
            {isRevealing ? <Loader2 size={12} className="animate-spin mr-1" /> : (whisperData.status === 'reviewed' ? "Validated" : "Validate & Reveal")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card variant="secure" title="Whisper Content">
            <div className={`flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest ${whisperData.status === 'reviewed' ? 'text-success' : 'text-warning'}`}>
              <Shield size={10} className="flex-shrink-0" />
              <span>{whisperData.status === 'reviewed' ? 'Fully revealed at secure terminal' : 'Content is end-to-end encrypted'}</span>
            </div>
            <div className="text-[#A1A1AA] text-sm leading-relaxed whitespace-pre-line bg-surface/50 p-4 border border-border/30 italic">
              "{whisperData.content}"
            </div>
          </Card>

          {whisperData.attachments.length > 0 && (
            <Card title="Source Evidence">
              <div className="flex flex-col gap-4">
                {whisperData.attachments.map((f: any) => (
                  <div key={f.name} className="flex flex-col gap-3">
                    {/* Image Preview - Permissive detection for Cloudinary and direct URLs */}
                    {(f.type && (f.type.startsWith('http') || f.type.includes('cloudinary'))) && (
                      <div className="relative aspect-video bg-[#050505] border border-border group overflow-hidden">
                        <img
                          src={f.type}
                          alt={f.name}
                          crossOrigin="anonymous"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Secure Evidence Preview</span>
                            <span className="text-[#A1A1AA] text-[8px] font-mono">{f.name}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 bg-[#121212] border border-[#2A2A2A] px-4 py-3">
                      <FileText size={14} className="text-[#6C5CE7]" />
                      <div className="flex-1">
                        <p className="text-white text-xs font-medium">{f.name}</p>
                        <p className="text-[#A1A1AA] text-[10px]">{f.size}</p>
                      </div>
                      <a href={f.type} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">Download Original</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Metadata">
            {[
              { icon: <Clock size={12} />, label: "Received", value: whisperData.timestamp },
              { icon: <User size={12} />, label: "Source", value: "Anonymous" },
              { icon: <Link2 size={12} />, label: "Linked Case", value: caseTitle },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 py-2.5 border-b border-[#1E1E1E] last:border-0">
                <span className="text-[#A1A1AA] mt-0.5">{row.icon}</span>
                <div>
                  <p className="text-[#A1A1AA] text-[10px] uppercase tracking-widest">{row.label}</p>
                  <p className="text-white text-xs font-medium">{row.value}</p>
                </div>
              </div>
            ))}
          </Card>

        </div>
      </div>

      <Modal open={escalateOpen} onClose={() => setEscalateOpen(false)} title="Escalate Whisper" confirmLabel="Escalate" onConfirm={() => setEscalateOpen(false)}>
        <p>Escalate to senior editorial review?</p>
      </Modal>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Link to Case" confirmLabel="Link" onConfirm={() => setAssignOpen(false)}>
        <p>Select a case...</p>
      </Modal>
    </DashboardLayout>
  );
}
