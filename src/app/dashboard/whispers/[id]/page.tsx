"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  ArrowLeft,
  Shield,
  Clock,
  FileText,
  User,
  Eye,
  Link2,
  Flag,
  Folder,
} from "lucide-react";
import Link from "next/link";

// Mock data for a single whisper
const WHISPER = {
  id: "W-0042",
  title: "Public Works Budget Manipulation — Q1 2026",
  status: "urgent" as const,
  received: "2026-04-10 14:22 UTC",
  wordCount: 847,
  source: "Anonymous",
  body: `I am a mid-level project manager at the city's Department of Public Works. Over the past 18 months, I have observed systematic manipulation of procurement bids for infrastructure contracts.

Specifically, the director of procurement, whose name I can provide under protected conditions, has been awarding contracts to companies where they hold undisclosed equity stakes. The bid evaluation process is formalized but the scoring sheets are adjusted retroactively to ensure predetermined vendors win.

In Q1 2026, three major contracts totalling $14.2M were awarded this way. Internal audits have been suppressed — the last auditor who raised concerns was removed from the department in January.

Documentation exists: I have access to before-and-after versions of bid scoring sheets for two contracts. I also have email threads discussing "adjusting the numbers."`,
  attachments: [
    { name: "bid-scores-jan26.pdf", size: "342 KB", encrypted: true },
    { name: "email-thread-export.eml", size: "89 KB", encrypted: true },
  ],
  relatedCase: "C-014",
};

export default function WhisperDetailPage() {
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [rejected, setRejected] = useState(false);

  return (
    <DashboardLayout pageTitle="Whisper Detail">
      {/* Back */}
      <Link
        href="/dashboard/whispers"
        className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-white text-xs font-semibold uppercase tracking-widest mb-6 transition-colors"
      >
        <ArrowLeft size={12} /> Back to Whispers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#6C5CE7] font-mono text-sm font-bold">{WHISPER.id}</span>
            <Badge variant={WHISPER.status} dot>{WHISPER.status}</Badge>
          </div>
          <h2 className="text-white font-black text-lg leading-snug max-w-2xl">
            {WHISPER.title}
          </h2>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setAssignOpen(true)}>
            <Folder size={12} /> Link Case
          </Button>
          <Button variant="danger" size="sm" onClick={() => setRejected(true)} disabled={rejected}>
            {rejected ? "Rejected" : (<><Flag size={12} /> Reject</>)}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setEscalateOpen(true)}>
            Escalate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card variant="secure" title="Whisper Content">
            <div className="flex items-center gap-2 mb-4 text-[#22C55E] text-[10px] font-bold uppercase tracking-widest">
              <Shield size={10} className="flex-shrink-0" />
              <span>Content decrypted for authorized viewers only</span>
            </div>
            <div className="text-[#A1A1AA] text-sm leading-relaxed whitespace-pre-line">
              {WHISPER.body}
            </div>
          </Card>

          {/* Attachments */}
          {WHISPER.attachments.length > 0 && (
            <Card title="Attachments">
              <div className="flex flex-col gap-2">
                {WHISPER.attachments.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-3 bg-[#121212] border border-[#2A2A2A] px-4 py-3"
                  >
                    <FileText size={14} className="text-[#6C5CE7]" />
                    <div className="flex-1">
                      <p className="text-white text-xs font-medium">{f.name}</p>
                      <p className="text-[#A1A1AA] text-[10px]">{f.size}</p>
                    </div>
                    {f.encrypted && (
                      <Badge variant="reviewed">🔒 Encrypted</Badge>
                    )}
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar meta */}
        <div className="flex flex-col gap-4">
          <Card title="Metadata">
            {[
              { icon: <Clock size={12} />, label: "Received", value: WHISPER.received },
              { icon: <User size={12} />, label: "Source", value: WHISPER.source },
              { icon: <Eye size={12} />, label: "Word Count", value: `${WHISPER.wordCount} words` },
              { icon: <Link2 size={12} />, label: "Linked Case", value: WHISPER.relatedCase },
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

          <Card title="Analyst Notes">
            <textarea
              className="w-full h-28 bg-[#121212] border border-[#2A2A2A] text-white text-xs p-3 resize-none focus:outline-none focus:border-[#6C5CE7] placeholder:text-[#3A3A3A]"
              placeholder="Add internal notes..."
            />
            <Button variant="ghost" size="sm" className="mt-2 w-full justify-center">Save Note</Button>
          </Card>
        </div>
      </div>

      {/* Escalate Modal */}
      <Modal
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        title="Escalate Whisper"
        confirmLabel="Escalate to Editor"
        onConfirm={() => setEscalateOpen(false)}
        variant="default"
      >
        <p>You are about to escalate <strong className="text-white">{WHISPER.id}</strong> to senior editorial review. This will notify the duty editor and lock the whisper from further editing.</p>
        <p className="mt-3">Confirm to proceed.</p>
      </Modal>

      {/* Assign Case Modal */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Link to Case"
        confirmLabel="Link Case"
        onConfirm={() => setAssignOpen(false)}
      >
        <p className="mb-4">Select a case to link this whisper to:</p>
        <select className="w-full h-10 bg-[#121212] border border-[#2A2A2A] text-white text-sm px-3 focus:outline-none focus:border-[#6C5CE7]">
          <option value="C-014">C-014 — Municipal Contract Fraud</option>
          <option value="C-013">C-013 — Police Misconduct #88B</option>
          <option value="C-012">C-012 — Environmental Dumping</option>
        </select>
      </Modal>
    </DashboardLayout>
  );
}
