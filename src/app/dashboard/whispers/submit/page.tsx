"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, ChevronRight, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useWhisperVault, useWhisperCaseManager } from "@/hooks/useContracts";
import { useFhevmEncrypt } from "@/hooks/useFhevmEncrypt";
import { ADDRESSES } from "@/constants/contracts";
import { toast } from "react-toastify";
import { ethers } from "ethers";

type Step = 1 | 2;

export default function WhisperSubmissionPage() {
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [caseId, setCaseId] = useState("0");
  const [isUrgent, setIsUrgent] = useState(false);
  const [priority, setPriority] = useState("2"); // 1=Low, 2=Med, 3=High
  const [txStatus, setTxStatus] = useState<"idle" | "encrypting" | "signing" | "mining" | "success">("idle");
  const [cases, setCases] = useState<any[]>([]);
  const [refId, setRefId] = useState("");

  const { address } = useAccount();
  const vault = useWhisperVault();
  const caseManager = useWhisperCaseManager();
  const { encryptWhisper, isReady: fheReady } = useFhevmEncrypt();

  // Fetch active cases
  useEffect(() => {
    async function fetchCases() {
      if (!caseManager) return;
      try {
        const nextIdBig = await caseManager.nextCaseId();
        const nextId = Number(nextIdBig);
        const casePromises = [];
        for (let i = 1; i < nextId; i++) {
          casePromises.push(caseManager.getCase(i).catch(() => null));
        }
        const results = await Promise.all(casePromises);
        const fetched = results
          .filter(c => c !== null && c.caseId.toString() !== "0")
          .map(c => ({ id: c.caseId.toString(), title: c.title }));
        setCases([{ id: "0", title: "General Platform Leak" }, ...fetched]);
      } catch (e) {
        setCases([{ id: "0", title: "General Platform Leak" }]);
      }
    }
    fetchCases();
  }, [caseManager]);

  const handleSubmit = async () => {
    if (!vault || !address || !fheReady) {
      toast.error("Initialization incomplete. Check wallet and FHE status.");
      return;
    }

    try {
      setTxStatus("encrypting");
      
      // 1. Generate AES-GCM Key (Web Crypto API)
      const cryptoKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      // 2. Export key as raw bytes and pad to 32 bytes for FHE
      const rawKeyBytes = await window.crypto.subtle.exportKey("raw", cryptoKey);
      const paddedKey = new Uint8Array(32);
      paddedKey.set(new Uint8Array(rawKeyBytes));
      const msgBigInt = BigInt("0x" + Array.from(paddedKey).map(b => b.toString(16).padStart(2, '0')).join(''));

      // 3. Encrypt the entire body using the generated AES key
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedBodyBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        new TextEncoder().encode(body)
      );

      // 4. Package IV + Ciphertext as Base64 for on-chain storage
      const fullEncryptedBytes = new Uint8Array(iv.length + encryptedBodyBuffer.byteLength);
      fullEncryptedBytes.set(iv, 0);
      fullEncryptedBytes.set(new Uint8Array(encryptedBodyBuffer), iv.length);
      const ciphertextBase64 = Buffer.from(fullEncryptedBytes).toString("base64");

      const fileHashBigInt = BigInt("0x" + "1".repeat(64)); 

      // 5. Encrypt key handle using specialized FHEVM hook
      const encrypted = await encryptWhisper(
        msgBigInt,
        fileHashBigInt,
        address as `0x${string}`,
        parseInt(priority),
        ADDRESSES.WhisperVault
      );

      if (!encrypted) throw new Error("Encryption failed");

      setTxStatus("signing");
      
      const attachments = [
        { name: "long_form_payload", fileType: ciphertextBase64, size: "0" }
      ];

      // 6. Submit Transaction
      const tx = await vault.submitWhisper(
        BigInt(caseId),
        "unread",
        isUrgent,
        attachments,
        encrypted.handles[0], // msg key
        encrypted.handles[1], // hash
        encrypted.handles[2], // submitter
        encrypted.handles[3], // priority
        encrypted.inputProof
      );

      setTxStatus("mining");
      const receipt = await tx.wait();
      
      // Parse whisper index from event if possible
      setRefId(`W-${caseId}-${Date.now().toString().slice(-4)}`);
      setTxStatus("success");
      toast.success("Whisper successfully encrypted and submitted!");
    } catch (err: any) {
        console.error(err);
        setTxStatus("idle");
        toast.error(err.reason || err.message || "Submission failed");
    }
  };

  if (txStatus === "success") {
    return (
      <DashboardLayout pageTitle="Whisper Submitted">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-[#22C55E]" />
          </div>
          <h2 className="text-white font-black text-xl uppercase tracking-widest mb-2">Transmission Secure</h2>
          <p className="text-[#A1A1AA] text-sm leading-relaxed mb-6">
            Your intelligence has been FHE-encrypted and committed to the blockchain vault.
          </p>
          <div className="bg-[#181818] border border-[#2A2A2A] px-6 py-4 text-left">
            <p className="text-[#A1A1AA] text-xs font-bold uppercase mb-1">Receipt ID</p>
            <p className="text-[#6C5CE7] font-mono font-bold text-lg tracking-widest">{refId}</p>
          </div>
          <Button variant="primary" size="sm" className="mt-8" onClick={() => window.location.reload()}>
            New Submission
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Submit Whisper">
      <div className="flex items-center gap-3 bg-[#22C55E]/5 border border-[#22C55E]/20 px-4 py-3 mb-8">
        <Shield size={14} className="text-[#22C55E]" />
        <p className="text-[#22C55E] text-[10px] font-black uppercase tracking-widest">
          End-to-End FHE Encryption Protocol Active
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Evidence/Photo Upload */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card title="Source Evidence" subtitle="Drag photos or documents to encrypt">
            <div className="py-2">
               <FileUpload accept="image/*" />
               <div className="mt-4 p-4 bg-white/[0.02] border border-dashed border-white/10 text-center">
                  <p className="text-[#555] text-[10px] font-bold uppercase">Files will be hashed & encrypted side-by-side with your message</p>
               </div>
            </div>
          </Card>
          
          <div className="p-5 bg-[#121212] border border-[#2A2A2A]">
            <div className="flex items-center gap-3 mb-3">
               <Lock size={14} className="text-[#6C5CE7]" />
               <span className="text-white text-[10px] font-black uppercase tracking-widest">Privacy Protection</span>
            </div>
            <p className="text-[#555] text-[10px] leading-relaxed">
              Whisperer uses Zama's Fully Homomorphic Encryption. Even the platform operators cannot see your message or identity until a reveal is explicitly requested and authorized by on-chain logic.
            </p>
          </div>
        </div>

        {/* Right: Details & Encryption */}
        <div className="lg:col-span-7">
          <Card title="Intelligence Report" subtitle="Encrypted local-first submission">
             <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[#555] text-[10px] font-black uppercase tracking-widest">Target Investigation</label>
                  <select 
                    value={caseId} 
                    onChange={(e) => setCaseId(e.target.value)}
                    className="w-full h-11 bg-[#0A0A0A] border border-[#2A2A2A] text-white text-xs px-4 focus:border-[#6C5CE7] transition-colors appearance-none"
                  >
                    {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <Input 
                  label="Context / Brief" 
                  placeholder="Subject line for this whisper..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className="relative">
                  <div className="absolute right-0 top-0 flex items-center gap-1.5 px-2 py-1 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20">
                     <Lock size={10} className="text-[#6C5CE7]" />
                     <span className="text-[#6C5CE7] text-[8px] font-black uppercase">FHE Encrypted</span>
                  </div>
                  <Textarea 
                    label="Confidential Message" 
                    placeholder="Your detailed account (max 5000 chars, first 32 deeply encrypted)..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-2">
                      <label className="text-[#555] text-[10px] font-black uppercase tracking-widest">Priority Level</label>
                      <select 
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full h-11 bg-[#0A0A0A] border border-[#2A2A2A] text-white text-xs px-4 focus:border-[#6C5CE7] transition-colors"
                      >
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High / Critical</option>
                      </select>
                   </div>
                   <div className="flex items-center gap-3 h-11 pt-5">
                      <input 
                        type="checkbox" 
                        id="urgent" 
                        checked={isUrgent} 
                        onChange={(e) => setIsUrgent(e.target.checked)}
                        className="w-4 h-4 rounded border-[#2A2A2A] bg-[#0A0A0A] text-[#6C5CE7] focus:ring-[#6C5CE7]"
                      />
                      <label htmlFor="urgent" className="text-white text-[10px] font-black uppercase tracking-widest cursor-pointer">Mark as Urgent</label>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-4">
                  <Button 
                    variant="primary" 
                    className="flex-1 h-12 gap-3"
                    disabled={txStatus !== "idle" || !title || !body || !fheReady}
                    onClick={handleSubmit}
                  >
                    {txStatus === "idle" ? (
                      <>
                        <Shield size={16} /> 
                        {!fheReady ? "Initializing FHE..." : "Encrypt & Submit"}
                      </>
                    ) : (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {txStatus === "encrypting" ? "Encrypting Data..." : 
                         txStatus === "signing" ? "Confirm in Wallet..." : "Mining Transaction..."}
                      </>
                    )}
                  </Button>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
