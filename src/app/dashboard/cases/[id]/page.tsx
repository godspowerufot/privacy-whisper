"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  FileText, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const SIMULATED_JOURNALIST = "Elena Fischer";

/* ─── Whisper submission states ─────────── */
type SubmitState = "idle" | "submitting" | "waiting";

export default function CaseDetailPage() {
  const { role } = useAuth();
  const { id } = useParams<{ id: string }>();
  const caseData = MOCK_CASES.find((c) => c.id === id);

  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [refId, setRefId] = useState("");
  const [expandedWhisper, setExpandedWhisper] = useState<string | null>(null);

  const isOwner = role === "journalist" && caseData?.reporterName === SIMULATED_JOURNALIST;
  const whispers = MOCK_WHISPERS.filter((w) => w.caseId === id);

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

  const handleSubmit = () => {
    if (!body.trim()) return;
    setSubmitState("submitting");
    // Simulate network + encryption delay
    setTimeout(() => {
      setRefId(`W-${Math.floor(Math.random() * 9000 + 1000)}`);
      setSubmitState("waiting");
    }, 2200);
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
                <Gift size={11} /> ${caseData.prizePool.toLocaleString()} prize pool
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
                            {w.content.slice(0, 24)}...
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
                                    <button className="text-[#555] group-hover:text-primary transition-colors">
                                      <ExternalLink size={12} />
                                    </button>
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
                              <Button variant="ghost" size="xs" className="h-7 text-[9px]">Flag</Button>
                              <Button variant="primary" size="xs" className="h-7 text-[9px]">Validate</Button>
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
                    <p className="text-white font-black text-2xl tabular-nums">${caseData.prizePool.toLocaleString()}</p>
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
                    Your submission has been encrypted and logged. The investigating team will review it shortly.
                  </p>
                  <div className="w-full bg-surface border border-border px-4 py-3 mb-5">
                    <p className="text-[#555] text-[9px] uppercase tracking-widest mb-1 font-bold">Reference ID</p>
                    <p className="text-primary font-mono font-bold text-xl tracking-widest">{refId}</p>
                    <p className="text-[#555] text-[9px] mt-1 font-bold uppercase tracking-tight">Secure copy saved to keychain.</p>
                  </div>
                  <button
                    onClick={() => { setSubmitState("idle"); setBody(""); setRefId(""); }}
                    className="mt-6 text-[#555] hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft size={10} /> Submit Another Whisper
                  </button>
                </div>
              ) : (
                <Card title="Submit a Whisper" subtitle="Your identity is never stored">
                  <div className="flex flex-col gap-4 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                      <span className="text-success text-[10px] font-black uppercase tracking-widest">
                        End-to-End Encrypted Tunnel Active
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[#555] text-[9px] font-black uppercase tracking-widest flex justify-between">
                        Your Report <span>*</span>
                      </label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Describe the leak or evidence. Be specific about dates and individuals..."
                        rows={6}
                        disabled={submitState === "submitting"}
                        className="w-full bg-surface border border-border text-white text-xs p-3 placeholder:text-[#3A3A3A] resize-none focus:outline-none focus:border-primary transition-all leading-relaxed disabled:opacity-50"
                      />
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] text-[#555] font-bold uppercase">Markdown Supported</span>
                        <span className="text-primary text-[10px] tabular-nums font-mono">{body.length} chars</span>
                      </div>
                    </div>
                    <div className="mt-1">
                      <label className="text-[#555] text-[9px] font-black uppercase tracking-widest mb-2 block">
                        Evidence Attachments <span className="text-[#333]">(PNG, PDF, ZIP)</span>
                      </label>
                      <FileUpload accept="image/*,application/pdf,.doc,.docx,.zip,.eml" maxMB={50} />
                    </div>
                    <div className="flex items-start gap-2 bg-warning/5 border border-warning/20 px-3 py-3 mt-1">
                      <AlertTriangle size={12} className="text-warning shrink-0 mt-0.5" />
                      <p className="text-text-secondary text-[9px] leading-relaxed font-medium">
                        BY SUBMITTING YOU ATTEST TO THE ACCURACY OF THIS REPORT. REVEALING YOUR IDENTITY IN THE CONTENT VOIDS SYSTEM PROTECTIONS.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      disabled={!body.trim() || submitState === "submitting"}
                      loading={submitState === "submitting"}
                      onClick={handleSubmit}
                      className="w-full h-11 uppercase font-black tracking-widest text-xs mt-2"
                    >
                      {submitState === "submitting" ? "Encrypting & Transmitting..." : "Send Secure Whisper"}
                    </Button>
                  </div>
                </Card>
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
