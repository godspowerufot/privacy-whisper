"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableColumn } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MOCK_CASES, CaseRecord } from "@/lib/mock-cases";
import { ADDRESSES } from "@/constants/contracts";
import { useWhisperCaseManager } from "@/hooks/useContracts";
import { useFhevm } from "@/providers/useFhevmContext";
import { useFhevmEncrypt } from "@/hooks/useFhevmEncrypt";
import { toast } from "react-toastify";
import {
  Search, Plus, Filter, X, Folder, Lock,
  Loader2, CheckCircle2, AlertTriangle, Shield, Gift,
} from "lucide-react";

/* ─── Form shape — maps 1-to-1 to createCase params ─── */
interface NewCaseForm {
  title: string;          // → title (plain, public)
  description: string;    // → description (plain, public)
  journalistName: string; // → encryptedName via FHE (private)
}

const BLANK: NewCaseForm = { title: "", description: "", journalistName: "" };

type TxStep = "idle" | "encrypting" | "confirming" | "mining" | "done" | "error";

function NewCaseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (caseId: string) => void;
}) {
  const { encrypt256, isEncrypting: fheEncrypting } = useFhevmEncrypt();
  const { isReady: fheReady } = useFhevm();
  const [form, setForm] = useState<NewCaseForm>(BLANK);
  const [step, setStep] = useState<TxStep>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const caseManager = useWhisperCaseManager();
  const { address } = useAccount();

  /* Reset on close */
  useEffect(() => {
    if (!open) { setForm(BLANK); setStep("idle"); setErrMsg(null); }
  }, [open]);

  const isBusy = step === "encrypting" || step === "confirming" || step === "mining";

  const handleClose = useCallback(() => {
    if (isBusy) return;
    onClose();
  }, [isBusy, onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleClose]);

  if (!open) return null;

  const set = <K extends keyof NewCaseForm>(k: K, v: NewCaseForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    step === "idle" &&
    form.title.trim().length >= 5 &&
    form.description.trim().length >= 10 &&
    form.journalistName.trim().length >= 1 &&
    !!caseManager &&
    !!address &&
    fheReady; // CRITICAL: Need to enforce fhe is initialized!

  /* ── Submit ───────────────────────────────────────── */
  const handleSubmit = async () => {
    console.log("[CasesPage] handleSubmit invoked! Checking requirements...");
    console.log("[CasesPage] caseManager:", !!caseManager, "fheReady:", fheReady, "address:", !!address);

    if (!caseManager || !fheReady || !address) {
        console.error("[CasesPage] Early return because requirements not met!", { caseManager: !!caseManager, fhe: fheReady, address: !!address });
        toast.error("Initialization incomplete. Please check your wallet and ensure FHE is loaded.");
        return;
    }
    
    setErrMsg(null);

    try {
      /* Step 1 — encrypt journalist name */
      setStep("encrypting");
      toast.info("🔒 Encrypting name…", { toastId: "fhe", autoClose: false });

      console.log("[CasesPage] Form Data:", {
          title: form.title,
          description: form.description,
          journalistName: form.journalistName
      });
      console.log("[CasesPage] Converting plaintext name to BigInt...");
      
      const nameBytes = new TextEncoder().encode(form.journalistName.trim());
      const padded = new Uint8Array(32);
      padded.set(nameBytes.slice(0, 32));
      const nameBigInt = BigInt(
        "0x" + Array.from(padded).map((b) => b.toString(16).padStart(2, "0")).join("")
      );

      console.log("[CasesPage] Name Converted. nameBytes:", nameBytes);
      console.log("[CasesPage] Padded Array:", padded);
      console.log("[CasesPage] Resulting BigInt:", nameBigInt.toString());

      console.log("[CasesPage] Calling encrypt256...");
      const encryptedInput = await encrypt256(nameBigInt, ADDRESSES.WhisperCaseManager);
      
      if (!encryptedInput) {
        throw new Error("Encryption failed - no result returned.");
      }

      console.log("[CasesPage] FULL Encrypted Input object:", encryptedInput);
      console.log("[CasesPage] Handles (bytes32):", encryptedInput.handles);
      console.log("[CasesPage] Input Proof (bytes):", encryptedInput.inputProof);

      toast.dismiss("fhe");

      /* Step 2 — wallet sign */
      setStep("confirming");
      console.log("[CasesPage] Formatting tx arguments for createCase...");
      console.log(`[CasesPage] Args: title="${form.title.trim()}", description="${form.description.trim()}", externalEuint256="${encryptedInput.handles[0]}", inputProof="${encryptedInput.inputProof}"`);

      toast.info("📝 Confirm in wallet…", { toastId: "wallet", autoClose: false });

      console.log("[CasesPage] Prompting wallet via caseManager.createCase...");
      const tx = await caseManager.createCase(
        form.title.trim(),
        form.description.trim(),
        encryptedInput.handles[0],  // externalEuint256 (bytes32)
        encryptedInput.inputProof,  // bytes
      );
      console.log("[CasesPage] Transaction successfully sent! tx:", tx);

      toast.dismiss("wallet");

      /* Step 3 — mine */
      setStep("mining");
      toast.info(
        <span>
          ⛏ Mining…{" "}
          <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="underline">
            {tx.hash.slice(0, 10)}…
          </a>
        </span>,
        { toastId: "mine", autoClose: false },
      );

      const receipt = await tx.wait(1);
      toast.dismiss("mine");

      /* Parse caseId from CaseCreated(uint256 indexed caseId, ...) */
      let caseIdStr = `C-${Date.now()}`;
      if (receipt?.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = caseManager.interface.parseLog({ topics: [...log.topics], data: log.data });
            if (parsed?.name === "CaseCreated") { caseIdStr = `C-${parsed.args[0]}`; break; }
          } catch { /* skip */ }
        }
      }

      setStep("done");
      toast.success(
        <span>
          ✅ Case on-chain!{" "}
          <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="underline">
            View tx
          </a>
        </span>,
        { autoClose: 6000 },
      );

      onCreated(caseIdStr);
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      ["fhe", "wallet", "mine"].forEach((id) => toast.dismiss(id));
      const msg =
        (err as { reason?: string })?.reason ||
        (err as { shortMessage?: string })?.shortMessage ||
        (err as Error)?.message ||
        "Unknown error";
      setErrMsg(msg);
      setStep("error");
      toast.error(`❌ ${msg}`, { autoClose: 8000 });
    }
  };

  /* ── Progress steps ───────────────────────────────── */
  const STEPS: { key: TxStep; label: string }[] = [
    { key: "encrypting", label: "Encrypt" },
    { key: "confirming", label: "Wallet" },
    { key: "mining", label: "Mine" },
    { key: "done", label: "Done" },
  ];
  const activeIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.82)" }}
      role="dialog" aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-md bg-card border border-border shadow-[0_24px_64px_rgba(0,0,0,0.85)]">
        <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary" />
        <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Folder size={14} className="text-primary" />
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">Open Investigation</h2>
          </div>
          <button onClick={handleClose} disabled={isBusy} className="text-text-secondary hover:text-white disabled:opacity-30" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Tx progress (only visible while transacting) */}
        {step !== "idle" && step !== "error" && (
          <div className="flex items-center px-6 pt-4 pb-0">
            {STEPS.map((s, i) => {
              const done = activeIdx > i || step === "done";
              const active = STEPS[activeIdx]?.key === s.key && step !== "done";
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={[
                      "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border",
                      done ? "bg-success border-success text-white"
                        : active ? "bg-primary/20 border-primary text-primary animate-pulse"
                          : "border-border text-text-secondary",
                    ].join(" ")}>
                      {done ? <CheckCircle2 size={10} /> : active ? <Loader2 size={10} className="animate-spin" /> : i + 1}
                    </div>
                    <span className={["text-[9px] uppercase tracking-widest whitespace-nowrap",
                      done ? "text-success" : active ? "text-primary" : "text-text-secondary"].join(" ")}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={["flex-1 h-px mx-1 mb-4", done ? "bg-success" : "bg-border"].join(" ")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Error */}
        {step === "error" && errMsg && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-error/8 border border-error/30 px-3 py-2">
            <AlertTriangle size={11} className="text-error shrink-0 mt-0.5" />
            <p className="text-error text-[10px] break-all">{errMsg}</p>
          </div>
        )}

        {/* Body — exactly 3 fields matching createCase params */}
        <div className={["px-6 py-5 flex flex-col gap-4", isBusy ? "pointer-events-none opacity-40" : ""].join(" ")}>

          {/* title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">
              Case Title <span className="text-error">*</span>
            </label>
            <input
              id="case-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Budget Manipulation — City Hall Q2"
              autoFocus
              className="w-full h-11 bg-surface border border-border text-white text-sm px-4 placeholder:text-[#3A3A3A] focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">
              Description <span className="text-error">*</span>
            </label>
            <textarea
              id="case-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this case about? Give enough context so sources know if their info is relevant…"
              rows={4}
              className="w-full bg-surface border border-border text-white text-sm p-4 placeholder:text-[#3A3A3A] resize-none focus:outline-none focus:border-primary transition-all leading-relaxed"
            />
          </div>

          {/* journalistName → encrypted → encryptedName */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={9} className="text-primary" />
              Journalist Name <span className="text-error">*</span>
              <span className="text-primary normal-case font-normal tracking-normal ml-1">— FHE-encrypted</span>
            </label>
            <input
              id="case-journalist-name"
              value={form.journalistName}
              onChange={(e) => set("journalistName", e.target.value)}
              placeholder="Your name or handle"
              className="w-full h-11 bg-surface border border-primary/40 text-white text-sm px-4 placeholder:text-[#3A3A3A] focus:outline-none focus:border-primary transition-all"
            />
            <p className="text-[10px] text-text-secondary">
              🔒 Encrypted client-side with Zama FHE before the transaction. Never stored in plaintext.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isBusy}>Cancel</Button>
          <Button
            id="create-case-submit"
            variant="primary"
            size="sm"
            disabled={!canSubmit || (step as string) === "done"}
            onClick={handleSubmit}
          >
            {isBusy ? (
              <span className="flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                {step === "encrypting" ? "Encrypting…" : step === "confirming" ? "Waiting…" : "Mining…"}
              </span>
            ) : step === "done" ? (
              <span className="flex items-center gap-2"><CheckCircle2 size={12} /> Done</span>
            ) : !fheReady ? (
              <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Load FHE</span>
            ) : (
              <span className="flex items-center gap-2"><Lock size={12} /> Encrypt & Submit</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Table columns ──────────────────────────────────── */
const columns: TableColumn<CaseRecord>[] = [
  { key: "id", label: "ID", sortable: true, width: "w-20" },
  { key: "title", label: "Case Title", sortable: true },
  {
    key: "reporterName", label: "Reporter",
    render: (row) => (
      <div className="flex items-center gap-2">
        {row.isAnonymous ? (
          <><Shield size={10} className="text-primary" /><span className="text-primary text-[10px] uppercase font-bold tracking-tight">Hidden</span></>
        ) : (
          <span className="text-white text-xs">{row.reporterName}</span>
        )}
      </div>
    ),
  },
  { key: "status", label: "Status", render: (row) => <Badge variant={row.status} dot>{row.status}</Badge> },
  {
    key: "priority", label: "Priority",
    render: (row) => (
      <span className={["text-xs font-bold uppercase tracking-wide",
        row.priority === "High" ? "text-error" : row.priority === "Medium" ? "text-warning" : "text-text-secondary"].join(" ")}>
        {row.priority}
      </span>
    ),
  },
  { key: "whispers", label: "Whispers", sortable: true },
  {
    key: "prizePool", label: "Prize Pool", sortable: true,
    render: (row) => (
      <span className="flex items-center gap-1.5 text-success font-bold text-xs">
        <Gift size={11} />${row.prizePool.toLocaleString()}
      </span>
    ),
  },
  { key: "created", label: "Created", sortable: true },
];

/* ─── Page ───────────────────────────────────────────── */
export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRecord[]>(MOCK_CASES);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [newOpen, setNewOpen] = useState(false);

  // FHE is initialised by FhevmProvider at app boot — just consume it here.
  const { isReady: fheReady } = useFhevm();

  const filtered = cases
    .filter((c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const handleCreated = (caseId: string) => {
    setCases((prev) => [{
      id: caseId,
      title: "New on-chain case",
      status: "open",
      priority: "Medium",
      whispers: 0,
      created: new Date().toISOString().slice(0, 10),
      tags: [],
      background: "",
      whisperBrief: "",
      prizePool: 0,
      reporterName: "Anonymous",
      isAnonymous: true,
    }, ...prev]);
  };

  return (
    <DashboardLayout pageTitle="Cases">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: cases.length, color: "text-white" },
          { label: "Urgent", value: cases.filter((c) => c.status === "urgent").length, color: "text-error" },
          { label: "Open", value: cases.filter((c) => c.status === "open").length, color: "text-[#3B82F6]" },
          { label: "Reviewed", value: cases.filter((c) => c.status === "reviewed").length, color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border px-4 py-3">
            <p className="text-text-secondary text-[10px] uppercase tracking-widest">{s.label}</p>
            <p className={["text-2xl font-black tabular-nums", s.color].join(" ")}>{s.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <Input placeholder="Search cases…" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} />
          </div>
          <Button variant="ghost" size="sm"><Filter size={12} /> Filter</Button>

          {/* Disabled + spinner until FHE SDK is ready */}
          <Button
            id="open-new-case-btn"
            variant="primary"
            size="sm"

            onClick={() => setNewOpen(true)}
            title={"Open a new case"}
          >
            <Plus size={12} /> New Case

          </Button>
        </div>

        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(k) => { setSortKey(k); setSortDir((d) => (sortKey === k && d === "asc" ? "desc" : "asc")); }}
          onRowClick={(row) => router.push(`/dashboard/cases/${row.id}`)}
          emptyText="No cases match your search."
        />
        <p className="text-text-secondary text-[10px] mt-3">↗ Click any row to view the case and submit a whisper</p>
      </Card>

        <NewCaseModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          onCreated={handleCreated}
        />
    </DashboardLayout>
  );
}
