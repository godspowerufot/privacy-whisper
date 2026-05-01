"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { MOCK_CASES } from "@/lib/mock-cases";
import { MOCK_WHISPERS } from "@/lib/mock-whispers";
import {
  ArrowLeft, Shield, Clock, Tag, MessageSquare,
  CheckCircle2, Loader2, AlertTriangle, Gift, User,
  FileText, ExternalLink, ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWhisperCaseManager, useWhisperVault, useRewardManager } from "@/hooks/useContracts";
import { useFhevmEncrypt } from "@/hooks/useFhevmEncrypt";
import { useFhevmDecrypt } from "@/hooks/useFhevmDecrypt"
import { ADDRESSES } from "@/constants/contracts";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { CaseRecord } from "@/lib/mock-cases";
import { WhisperRecord } from "@/lib/mock-whispers";
import { convertFileToBase64, uploadBase64Image } from "@/lib/utils";

const SIMULATED_JOURNALIST = "Elena Fischer";

/* ─── Whisper submission states ─────────── */
type SubmitState = "idle" | "submitting" | "waiting";

export default function CaseDetailPage() {
  const { role } = useAuth();
  const { address } = useAccount();
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const caseManager = useWhisperCaseManager();
  const vault = useWhisperVault();
  const rewardManager = useRewardManager();
  const { encryptWhisper, encrypt256, isEncrypting: fheEncrypting } = useFhevmEncrypt();

  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [isUrgent, setIsUrgent] = useState(false);
  const [refId, setRefId] = useState("");
  const [expandedWhisper, setExpandedWhisper] = useState<string | null>(null);
  const [onChainWhispers, setOnChainWhispers] = useState<WhisperRecord[]>([]);
  const [rewardingWhisper, setRewardingWhisper] = useState<string | null>(null);

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageHash, setUploadedImageHash] = useState<string | null>(null);
  const [attachmentInfo, setAttachmentInfo] = useState<{ name: string; type: string; size: string } | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  React.useEffect(() => {
    async function fetchCase() {
      if (!caseManager || !id) return;

      try {
        setIsLoading(true);
        console.log(`[CaseDetail] Fetching details for case ${id}...`);
        const caseIdNum = id.replace('C-', '');
        const c = await caseManager.getCase(caseIdNum);

        setCaseData({
          id: id,
          title: c.title,
          status: c.status as any,
          priority: c.priority as any,
          whispers: Number(c.whisperCount),
          created: new Date(Number(c.createdAt) * 1000).toISOString().slice(0, 10),
          tags: [...c.tags],
          background: c.description,
          whisperBrief: c.whisperBrief,
          prizePool: parseFloat(ethers.formatEther(c.prizePool)),
          reporterName: c.journalist,
          isAnonymous: c.journalist === "0x0000000000000000000000000000000000000000",
        });
      } catch (err) {
        console.error("[CaseDetail] Error fetching case detail:", err);
        // Fallback to mock if not found on chain
        const mock = MOCK_CASES.find((c) => c.id === id);
        if (mock) setCaseData(mock);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchWhispers() {
      if (!vault || !id) return;
      try {
        const caseIdNum = BigInt(id.replace('C-', ''));

        const CHUNK = 9_000;
        const MAX_LOOKBACK = 100_000;

        const provider = vault.runner?.provider as any;
        const latestBlock: number = await provider.getBlockNumber();
        const startBlock = Math.max(0, latestBlock - MAX_LOOKBACK);

        const filter = vault.filters.WhisperSubmitted(caseIdNum);
        let allEvents: any[] = [];

        for (let from = startBlock; from <= latestBlock; from += CHUNK) {
          const to = Math.min(from + CHUNK - 1, latestBlock);
          let retries = 3;
          while (retries > 0) {
            try {
              const chunk = await vault.queryFilter(filter, from, to);
              allEvents = allEvents.concat(chunk);
              break;
            } catch (err: any) {
              retries--;
              if (retries === 0) {
                console.warn(`[CaseDetail] Failed to fetch chunk ${from}-${to}:`, err.message);
              } else {
                await new Promise(r => setTimeout(r, 1000));
              }
            }
          }
        }

        console.log(`[CaseDetail] Found ${allEvents.length} WhisperSubmitted events for case ${caseIdNum}.`);

        const fetched: WhisperRecord[] = allEvents.map((evt: any) => {
          const whisperIndex = Number(evt.args?.whisperIndex);
          const blockNum = evt.blockNumber ?? 0;
          return {
            id: `W-ON-${whisperIndex}`,
            caseId: id,
            content: "🔒 Encrypted Transmission",
            timestamp: `Block #${blockNum}`,
            status: "unread",
            isUrgent: false,
            attachments: [],
            onChainIndex: whisperIndex
          };
        });

        setOnChainWhispers(fetched);
      } catch (err) {
        console.error("[CaseDetail] Error fetching whispers via events:", err);
      }
    }

    fetchCase();
    fetchWhispers();
  }, [caseManager, vault, id]);

  const { decryptHandle, isDecrypting: isFheDecrypting } = useFhevmDecrypt();
  const [validatingWhisper, setValidatingWhisper] = useState<string | null>(null);

  const handleValidate = async (w: WhisperRecord) => {
    if (!vault || !address || w.onChainIndex === undefined) {
      toast.error("Wallet connection or contract not ready.");
      return;
    }

    // Defensive check: Ensure we have a signer-backed contract
    const runner = vault.runner;
    const isSigner = runner && typeof (runner as any).sendTransaction === 'function';

    if (!isSigner) {
      console.error("[CaseDetail] Vault runner is not a signer:", runner);
      toast.error("Contract is in read-only mode. Please ensure your wallet is connected to the correct network.");
      return;
    }

    const toastId = toast.loading("🔓 Revealing Whisper Content...");
    setValidatingWhisper(w.id);

    try {
      const caseIdNum = BigInt(id.replace('C-', ''));

      console.log(`[CaseDetail] Requesting reveal for case ${caseIdNum}, whisper ${w.onChainIndex}...`);

      // 1. Request reveal on-chain (makes handle publicly decryptable)
      const tx = await vault.requestWhisperReveal(caseIdNum, w.onChainIndex);
      toast.update(toastId, { render: "Waiting for blockchain approval...", type: "info" });
      const receipt = await tx.wait();

      if (!receipt) throw new Error("Transaction failed or was dropped.");

      // 2. Extract the handle from the event
      const revealEvent = receipt.logs
        .map((log: any) => {
          try { return vault.interface.parseLog(log); } catch (e) { return null; }
        })
        .find((e: any) => e && e.name === "WhisperRevealRequested");

      if (!revealEvent) {
        console.error("[CaseDetail] Reveal event not found in logs:", receipt.logs);
        throw new Error("Could not extract reveal handle from transaction events.");
      }

      const messageHandle = revealEvent.args.messageHandle;
      console.log("[CaseDetail] Extracted message handle:", messageHandle);

      // 3. Use FHEVM to decrypt the handle
      toast.update(toastId, { render: "Decrypting at secure terminal...", type: "info" });
      const decryptedBigInt = await decryptHandle(messageHandle, ADDRESSES.WhisperVault);

      if (decryptedBigInt === null) throw new Error("FHE Decryption failed at the secure terminal.");

      // 4. Convert BigInt to string
      // In ZamaPlay, strings are usually padded to 32 bytes (256 bits)
      const hex = decryptedBigInt.toString(16).padStart(64, '0');
      const bytes = ethers.getBytes("0x" + hex);
      const decodedText = new TextDecoder().decode(bytes).replace(/\0/g, '');

      console.log("[CaseDetail] Decrypted text:", decodedText);

      // 5. Update local state
      setOnChainWhispers(prev => prev.map(item =>
        item.id === w.id ? { ...item, content: decodedText, status: 'reviewed' as any } : item
      ));

      toast.update(toastId, {
        render: "Whisper validated and decrypted! ✅",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
    } catch (err: any) {
      console.error("[CaseDetail] Validation failed:", err);
      toast.update(toastId, {
        render: `Failed to decrypt: ${err.reason || err.message || "Unknown error"}`,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setValidatingWhisper(null);
    }
  };

  const isOwner = role === "journalist" && (
    caseData?.reporterName?.toLowerCase() === address?.toLowerCase() ||
    caseData?.reporterName === SIMULATED_JOURNALIST
  );

  // Combine mock and on-chain whispers
  const mockWhispers = MOCK_WHISPERS.filter((w) => w.caseId === id);
  const whispers = [...onChainWhispers, ...mockWhispers];

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Loading Case...">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Bridging Secure Data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!caseData) {
    return (
      <DashboardLayout pageTitle="Case Not Found">
        <div className="text-center py-24">
          <p className="text-text-secondary text-sm mb-4">No case found with ID <span className="font-mono text-white">{id}</span></p>
          <Link href="/dashboard/cases">
            <Button variant="ghost" size="sm">← Back to Cases</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const handleFilesChange = async (files: File[]) => {
    const file = files[0];
    if (file) {
      try {
        setIsUploading(true);
        setUploadedFileName(file.name);

        const toastId = toast.info("Uploading to Cloudinary...", { autoClose: false });

        const base64 = await convertFileToBase64(file);
        if (base64) {
          const url = await uploadBase64Image(base64);
          if (url) {
            setUploadedImageHash(url);
            setAttachmentInfo({
              name: file.name,
              type: url, // Storing the Cloudinary URL in the fileType field as requested
              size: (file.size / 1024).toFixed(1) + " KB"
            });
            toast.update(toastId, {
              render: "Image uploaded successfully! ✅",
              type: "success",
              autoClose: 3000
            });
          }
        }
      } catch (error) {
        console.error("[Upload] Error:", error);
        toast.error("Failed to upload image. Please try again.");
        setUploadedFileName("");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    console.log("sstartiing")
    if (!body.trim() || !vault || !address) return;

    setSubmitState("submitting");
    const toastId = toast.loading("🔒 Encrypting & Submitting...");

    try {
      // 1. Prepare encryption values
      const msgBytes = new TextEncoder().encode(body.trim());
      const msgPadded = new Uint8Array(32);
      msgPadded.set(msgBytes.slice(0, 32));
      const msgBigInt = BigInt("0x" + Array.from(msgPadded).map(b => b.toString(16).padStart(2, "0")).join(""));

      let fileHashBigInt = BigInt(0);
      if (uploadedImageHash) {
        // Hash the Cloudinary URL to a 256-bit value for FHE encryption
        const urlHash = ethers.id(uploadedImageHash);
        fileHashBigInt = BigInt(urlHash);
      }

      // 2. Encrypt
      const encrypted = await encryptWhisper(
        msgBigInt,
        fileHashBigInt,
        address as `0x${string}`,
        isUrgent ? 1 : 0,
        ADDRESSES.WhisperVault
      );

      if (!encrypted) throw new Error("Encryption failed");

      // 3. Submit to contract
      const caseIdNum = BigInt(id.replace('C-', ''));

      const tx = await vault.submitWhisper(
        caseIdNum,
        "unread",
        isUrgent,
        uploadedImageHash && attachmentInfo ? [{
          name: attachmentInfo.name,
          fileType: attachmentInfo.type, // This now contains the URL
          size: attachmentInfo.size
        }] : [],
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      );

      toast.update(toastId, { render: "Mining transaction...", type: "info" });
      await tx.wait();

      setRefId(`W-${Math.floor(Math.random() * 9000 + 1000)}`);
      setSubmitState("waiting");
      toast.update(toastId, {
        render: (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-xs">Whisper logged on-chain! ✅</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline text-[10px] hover:text-primary transition-colors"
            >
              View on Explorer
            </a>
          </div>
        ),
        type: "success",
        isLoading: false,
        autoClose: 7000
      });
    } catch (error: any) {
      console.error("[CaseDetail] Submission failed:", error);
      toast.update(toastId, { render: error.message || "Submission failed", type: "error", isLoading: false, autoClose: 5000 });
      setSubmitState("idle");
    }
  };


  const handleReward = async (w: WhisperRecord) => {
    if (!vault || !rewardManager || !address || w.onChainIndex === undefined) {
      toast.error("Wallet connection or contract not ready.");
      return;
    }

    const toastId = toast.loading("💡 Initializing Reward Sequence...");
    setRewardingWhisper(w.id);

    try {
      const caseIdNum = BigInt(id.replace('C-', ''));

      // 1. Check if reward is already approved
      const rewardInfo = await rewardManager.rewards(caseIdNum);
      if (!rewardInfo.approved) {
        toast.update(toastId, { render: "Locking confidential reward amount...", type: "info" });

        // Encrypt amount (1000 as placeholder based on contract logic)
        const encrypted = await encrypt256(BigInt(1000), ADDRESSES.RewardManager);
        if (!encrypted) throw new Error("Encryption of reward amount failed.");

        const txApprove = await rewardManager.approveReward(
          caseIdNum,
          encrypted.handles[0],
          encrypted.inputProof
        );
        await txApprove.wait();
        toast.update(toastId, { render: "Reward approved! Revealing recipient...", type: "info" });
      }

      // 2. Request Submitter Reveal on-chain
      console.log(`[CaseDetail] Requesting submitter reveal for case ${caseIdNum}, whisper ${w.onChainIndex}...`);
      const txReveal = await vault.requestSubmitterReveal(caseIdNum, w.onChainIndex);
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
      console.log("[CaseDetail] Decrypted source address:", sourceAddress);

      // 5. Distribute Reward
      toast.update(toastId, { render: "Executing reward distribution...", type: "info" });
      // Note: In a real app, we might want to approve the reward first or let the manager handle it
      // But based on the contract ABI, distributeReward seems to be the one
      const txReward = await rewardManager.distributeReward(caseIdNum, sourceAddress);
      await txReward.wait();

      toast.update(toastId, {
        render: "Reward successfully sent to source! 🏆",
        type: "success",
        isLoading: false,
        autoClose: 5000
      });
    } catch (err: any) {
      console.error("[CaseDetail] Reward failed:", err);
      toast.update(toastId, {
        render: `Reward failed: ${err.reason || err.message || "Unknown error"}`,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setRewardingWhisper(null);
    }
  };

  const priorityColor =
    caseData.priority === "High" ? "text-error"
      : caseData.priority === "Medium" ? "text-warning"
        : "text-text-secondary";

  return (
    <DashboardLayout pageTitle={caseData.id}>
      <Link
        href="/dashboard/cases"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-white text-xs font-semibold uppercase tracking-widest mb-6 transition-colors"
      >
        <ArrowLeft size={12} /> All Cases
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-card border border-border p-6 relative">
            <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/30" />

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="font-mono text-primary font-bold text-sm">{caseData.id}</span>
              <Badge variant={caseData.status} dot>{caseData.status}</Badge>
              <span className={["text-[11px] font-bold uppercase tracking-widest", priorityColor].join(" ")}>
                {caseData.priority} Priority
              </span>
            </div>

            <h1 className="text-white font-black text-xl leading-snug mb-4">{caseData.title}</h1>

            <div className="flex flex-wrap gap-4 text-text-secondary text-xs">
              <span className="flex items-center gap-1.5">
                <Clock size={11} /> Opened {caseData.created}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare size={11} /> {caseData.whispers} whispers received
              </span>
              <span className="flex items-center gap-1.5 text-success font-bold">
                <Gift size={11} /> {caseData.prizePool} ETH prize pool
              </span>
              <span className="flex items-center gap-1.5">
                {caseData.isAnonymous ? (
                  <>
                    <Shield size={11} className="text-primary" />
                    <span className="text-primary font-bold uppercase tracking-tight">Protected Reporter</span>
                  </>
                ) : (
                  <>
                    <User size={11} />
                    <span>Reporter: {caseData.reporterName}</span>
                  </>
                )}
              </span>
            </div>

            {caseData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                <Tag size={11} className="text-text-secondary mt-0.5" />
                {caseData.tags.map((t) => (
                  <span key={t} className="bg-border text-text-secondary text-[10px] px-2 py-0.5 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Card title="Case Background">
            <p className="text-text-secondary text-sm leading-relaxed">{caseData.background}</p>
          </Card>

          <div className="bg-primary/5 border border-primary/25 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} className="text-primary" />
              <span className="text-primary text-[10px] font-bold uppercase tracking-widest">
                What We Need From You
              </span>
            </div>
            <p className="text-[#D0CCFF] text-sm leading-relaxed">{caseData.whisperBrief}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isOwner ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-card border border-primary/40 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rotate-45 translate-x-8 -translate-y-8" />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" />
                    <h3 className="text-white font-black text-[10px] uppercase tracking-widest">Incoming Whispers</h3>
                  </div>
                  <Badge variant="open" dot>{whispers.length}</Badge>
                </div>

                <div className="flex flex-col gap-2 relative z-10">
                  {whispers.map((w) => (
                    <div
                      key={w.id}
                      className={[
                        "border transition-all cursor-pointer overflow-hidden",
                        expandedWhisper === w.id
                          ? "bg-surface border-primary/60 shadow-[0_4px_20px_rgba(108,92,231,0.15)]"
                          : "bg-[#1A1A1A] border-border hover:border-[#3A3A3A]"
                      ].join(" ")}
                      onClick={() => setExpandedWhisper(expandedWhisper === w.id ? null : w.id)}
                    >
                      <div className="px-3 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[#555]">{w.id}</span>
                          {w.isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />}
                          <span className="text-white text-[11px] font-bold tracking-tight">
                            {w.status === 'reviewed' ? w.content : w.content.slice(0, 24) + "..."}
                          </span>
                        </div>
                        {expandedWhisper === w.id ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-[#555]" />}
                      </div>

                      {expandedWhisper === w.id && (
                        <div className="px-3 pb-3 border-t border-border pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <p className="text-text-secondary text-xs leading-relaxed mb-4 font-medium italic">
                            "{w.content}"
                          </p>

                          {w.attachments.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[#555] text-[9px] font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">Attachments</p>
                              <div className="flex flex-col gap-1.5">
                                {w.attachments.map((a) => (
                                  <div key={a.name} className="flex items-center justify-between bg-[#141414] border border-border px-2 py-2 group hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2">
                                      <FileText size={12} className="text-primary" />
                                      <div className="flex flex-col">
                                        <span className="text-white text-[10px] truncate max-w-[140px] font-bold">{a.name}</span>
                                        <span className="text-[8px] text-[#555] tabular-nums">{a.size}</span>
                                      </div>
                                    </div>
                                    <a
                                      href={a.type.startsWith('http') ? a.type : '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#555] group-hover:text-primary transition-colors"
                                    >
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center gap-1.5 text-[#555]">
                              <Clock size={10} />
                              <span className="text-[9px] tabular-nums font-mono">{w.timestamp}</span>
                            </div>
                            <div className="flex gap-2">
                              {w.status === 'reviewed' && (
                                <>
                                  <Link href={`/dashboard/whispers/W-C-${id.replace('C-', '')}-${w.onChainIndex}`}>
                                    <Button variant="ghost" size="xs" className="h-7 text-[9px] gap-1">
                                      <Eye size={10} /> View
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    className="h-7 text-[9px] bg-success hover:bg-success/80 border-none gap-1"
                                    disabled={rewardingWhisper === w.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReward(w);
                                    }}
                                  >
                                    {rewardingWhisper === w.id ? <Loader2 size={10} className="animate-spin" /> : <Gift size={10} />}
                                    Reward
                                  </Button>
                                </>
                              )}
                              {w.status !== 'reviewed' && (
                                <Button
                                  variant="primary"
                                  size="xs"
                                  className="h-7 text-[9px]"
                                  disabled={validatingWhisper === w.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleValidate(w as any);
                                  }}
                                >
                                  {validatingWhisper === w.id && <Loader2 size={10} className="animate-spin mr-1" />}
                                  Validate
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {whispers.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-border">
                      <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-2">
                        <MessageSquare size={14} className="text-[#333]" />
                      </div>
                      <p className="text-[#555] text-[10px] uppercase tracking-widest font-bold">No whispers received yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/25 p-4 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={12} className="text-primary" />
                  <span className="text-primary text-[10px] font-bold uppercase tracking-widest">Journalist Access Verified</span>
                </div>
                <p className="text-text-secondary text-[10px] leading-relaxed">
                  You are the verified lead reporter for this investigation. All submissions are decrypted at your terminal for secure review.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-card border border-success/40 p-4 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-success/5 rotate-45 translate-x-6 -translate-y-6" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-success/10 border border-success/30 flex items-center justify-center">
                    <Gift size={18} className="text-success" />
                  </div>
                  <div>
                    <p className="text-success text-[10px] font-bold uppercase tracking-widest">Prize Pool</p>
                    <p className="text-white font-black text-2xl tabular-nums">${Number(caseData.prizePool)}</p>
                  </div>
                </div>
                <p className="text-[#555] text-[9px] leading-relaxed text-right max-w-[100px] relative z-10 font-bold uppercase tracking-tight">
                  Awarded for verified breakthroughs.
                </p>
              </div>

              {submitState === "waiting" ? (
                <div className="bg-card border border-success/30 p-6 flex flex-col items-center text-center relative">
                  <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-success/40" />
                  <div className="w-14 h-14 bg-success/10 border border-success/30 flex items-center justify-center mb-4">
                    <CheckCircle2 size={24} className="text-success" />
                  </div>
                  <h3 className="text-white font-black text-xs uppercase tracking-widest mb-2">
                    Whisper Received
                  </h3>
                  <p className="text-text-secondary text-[11px] leading-relaxed mb-5">
                    Your transmission has been FHE-encrypted and committed to the blockchain vault.
                  </p>
                  <div className="w-full bg-[#1A1A1A] border border-border px-4 py-3 mb-5">
                    <p className="text-[#555] text-[9px] uppercase tracking-widest mb-1 font-bold">Reference Receipt</p>
                    <p className="text-primary font-mono font-bold text-xl tracking-widest">{refId}</p>
                    <p className="text-[#555] text-[9px] mt-1 font-bold uppercase tracking-tight">Save this to follow up anonymously.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSubmitState("idle");
                      setBody("");
                      setRefId("");
                      setUploadedImageHash(null);
                      setUploadedFileName("");
                      setAttachmentInfo(null);
                    }}
                    className="mt-6 text-[#555] hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft size={10} /> Submit Another Whisper
                  </button>
                </div>
              ) : role !== "journalist" ? (
                <Card title="Secure Submission" subtitle="End-to-End FHE Encryption Active">
                  <div className="flex flex-col gap-8 pt-2">
                    {/* Top: Files/Evidence */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield size={12} className="text-success" />
                        <span className="text-success text-[10px] font-black uppercase tracking-widest">
                          Source Evidence (Photos & Files)
                        </span>
                      </div>
                      <FileUpload
                        accept="image/*"
                        maxMB={20}
                        multiple={false}
                        onFilesChange={handleFilesChange}
                      />
                      <div className="p-3 bg-white/[0.02] border border-dashed border-border flex items-center gap-3">
                        <AlertTriangle size={12} className="text-warning shrink-0" />
                        <p className="text-[#555] text-[9px] leading-relaxed uppercase font-bold tracking-tight">
                          Photos are hashed and encrypted locally alongside your report for total privacy.
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Message & Submit */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">
                            Tunnel: Active
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={isUrgent}
                            onChange={(e) => setIsUrgent(e.target.checked)}
                            className="w-3 h-3 accent-error bg-transparent border-border"
                          />
                          <span className="text-error text-[10px] font-black uppercase tracking-widest group-hover:opacity-80 transition-opacity">Mark Urgent</span>
                        </label>
                      </div>

                      <div className="relative">
                        <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20">
                          <span className="text-primary text-[8px] font-black uppercase">FHE Encrypted</span>
                        </div>
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="Provide the details of your findings here..."
                          rows={6}
                          disabled={submitState === "submitting" || isUploading}
                          className="w-full bg-[#0A0A0A] border border-border text-white text-xs p-4 pt-10 placeholder:text-[#3A3A3A] resize-none focus:outline-none focus:border-primary transition-all leading-relaxed"
                        />
                      </div>

                      <Button
                        variant="primary"
                        disabled={!body.trim() || submitState === "submitting" || isUploading}
                        onClick={handleSubmit}
                        className="w-full h-12 gap-3 uppercase font-black tracking-widest text-xs"
                      >
                        {submitState === "submitting" ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Transmitting Securely...
                          </>
                        ) : (
                          <>
                            <Shield size={14} />
                            Encrypt & Transmit Whisper
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="bg-primary/5 border border-primary/25 p-5 relative">
                  <div className="absolute top-0 left-0 w-1/4 h-0.5 bg-primary/40" />
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={12} className="text-primary" />
                    <span className="text-primary text-[10px] font-bold uppercase tracking-widest">Journalist View</span>
                  </div>
                  <p className="text-text-secondary text-[10px] leading-relaxed">
                    You are viewing this case as a lead journalist. Submissions from sources will appear in your intel matrix above.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="bg-card border border-border px-4 py-3 flex justify-between items-center group hover:border-primary/40 transition-colors">
            <span className="text-[#555] text-[10px] uppercase font-black tracking-widest">Case Activity</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-lg tabular-nums">{caseData.whispers}</span>
              <MessageSquare size={14} className="text-[#555] group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
