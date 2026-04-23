"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, ChevronRight } from "lucide-react";

type Step = 1 | 2 | 3;

export default function WhisperSubmissionPage() {
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <DashboardLayout pageTitle="Whisper Submitted">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center mx-auto mb-6">
            <Shield size={28} className="text-[#22C55E]" />
          </div>
          <h2 className="text-white font-black text-xl uppercase tracking-widest mb-2">
            Whisper Received
          </h2>
          <p className="text-[#A1A1AA] text-sm leading-relaxed mb-2">
            Your submission has been encrypted and logged securely.
            A journalist will review it within 24 hours.
          </p>
          <div className="my-6 bg-[#181818] border border-[#2A2A2A] px-6 py-4 text-left">
            <p className="text-[#A1A1AA] text-xs">Reference ID</p>
            <p className="text-[#6C5CE7] font-mono font-bold text-lg tracking-widest">
              W-{Math.floor(Math.random() * 9000 + 1000)}
            </p>
            <p className="text-[#A1A1AA] text-[10px] mt-1">Save this to follow up anonymously.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); setStep(1); setTitle(""); setBody(""); }}>
            Submit Another
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Submit Whisper">
      {/* Security notice bar */}
      <div className="flex items-center gap-3 bg-[#22C55E]/5 border border-[#22C55E]/20 px-4 py-3 mb-6">
        <Shield size={14} className="text-[#22C55E] flex-shrink-0" />
        <p className="text-[#22C55E] text-xs font-semibold">
          All transmissions are end-to-end encrypted. Your identity is never stored.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {([1, 2, 3] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={[
              "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest",
              step === s ? "bg-[#6C5CE7] text-white" :
              step > s ? "bg-[#6C5CE7]/20 text-[#6C5CE7]" : "bg-[#181818] text-[#A1A1AA]",
            ].join(" ")}>
              <span>{s}</span>
              <span>{s === 1 ? "Details" : s === 2 ? "Evidence" : "Confirm"}</span>
            </div>
            {i < 2 && (
              <ChevronRight size={12} className="text-[#2A2A2A] flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-2xl">
        {step === 1 && (
          <Card title="Whisper Details">
            <div className="flex flex-col gap-5">
              <Input
                label="Title / Subject"
                placeholder="Brief description of the issue..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                label="Full Account"
                placeholder="Describe what you witnessed in detail. Dates, names, evidence..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxChars={5000}
                securityNotice="Encrypted locally before sending"
              />
              <Input
                label="Anonymous Contact (optional)"
                placeholder="Encrypted email or Signal number..."
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                hint="This is optional and stored only with your consent."
              />
              <Button
                variant="primary"
                disabled={!title.trim() || !body.trim()}
                onClick={() => setStep(2)}
              >
                Next: Upload Evidence
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="Upload Evidence" subtitle="Optional — max 50MB per file">
            <div className="flex flex-col gap-5">
              <FileUpload accept="image/*,application/pdf,.doc,.docx,.zip" />
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Next: Confirm
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card title="Confirm Submission">
            <div className="flex flex-col gap-5">
              <div className="bg-[#121212] border border-[#2A2A2A] p-4 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA] text-xs">Title</span>
                  <span className="text-white text-xs font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA] text-xs">Characters</span>
                  <span className="text-white text-xs font-medium tabular-nums">{body.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA] text-xs">Encryption</span>
                  <Badge variant="reviewed" dot>AES-256</Badge>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[#F59E0B] bg-[#F59E0B]/5 border border-[#F59E0B]/20 p-3">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs">Once submitted, you cannot edit your whisper. Ensure all details are accurate.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Submit Whisper
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
