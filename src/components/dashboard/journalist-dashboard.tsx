"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Folder, 
  MessageSquare, 
  Gift, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";

const recentWhispers = [
  { id: "W-042", content: "Evidence of offshore account movements for case C-014...", time: "2m ago", status: "urgent" as const },
  { id: "W-039", content: "Procurement scorecards for the 2025 Delta Project...", time: "18m ago", status: "pending" as const },
  { id: "W-038", content: "Whistleblower interview transcript (Pre-encryption)...", time: "1h ago", status: "reviewed" as const },
];

export function JournalistDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          variant="metric"
          metricLabel="Managed Cases"
          metricValue="6"
          metricDelta={{ value: "+1 this week", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Pending Whispers"
          metricValue="12"
          metricDelta={{ value: "4 urgent", positive: false }}
        />
        <Card
          variant="metric"
          metricLabel="Validated Intel"
          metricValue="84%"
          metricDelta={{ value: "+5% accuracy", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Bounties Paid"
          metricValue="$12.5K"
          metricDelta={{ value: "+$2K month", positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="Incoming Intel Queue" subtitle="Verify and take action on incoming whispers">
            <div className="flex flex-col gap-1">
              {recentWhispers.map((w) => (
                <div key={w.id} className="group flex items-center justify-between p-3 border border-transparent hover:border-white/5 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 flex items-center justify-center font-mono text-[10px] text-[#A1A1AA]">
                      {w.id}
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold mb-1 line-clamp-1">{w.content}</p>
                      <span className="text-[#555] text-[9px] uppercase font-bold tracking-widest">{w.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={w.status} dot>{w.status}</Badge>
                    <Button variant="ghost" size="xs">Review</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <Button variant="secondary" size="sm" className="w-full">Open Intel Matrix</Button>
            </div>
          </Card>

          <Card title="Active Investigations" subtitle="Cases you are currently leading">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "C-014", title: "Municipal Contract Fraud", whispers: 7, priority: "High" },
                  { id: "C-009", title: "Detention Center Conditions", whispers: 12, priority: "High" }
                ].map(c => (
                  <div key={c.id} className="p-4 bg-white/5 border border-white/10 hover:border-[#6C5CE7]/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-[10px] text-[#6C5CE7]">{c.id}</span>
                      <span className="text-[#FF4D4F] text-[9px] font-black uppercase tracking-tighter">{c.priority} Priority</span>
                    </div>
                    <h4 className="text-white text-sm font-black uppercase mb-3 leading-tight">{c.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#555] text-[10px] font-bold">
                        <MessageSquare size={12} /> {c.whispers} Whispers
                      </div>
                      <Button variant="ghost" size="xs">View Details</Button>
                    </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card variant="secure" title="Identity Verification">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-[#6C5CE7] flex items-center justify-center text-white text-[10px] font-black">EF</div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Elena Fischer</p>
                  <p className="text-[10px] font-bold text-[#6C5CE7] uppercase">Verified Journalist</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-[#555]">TRUST SCORE</span>
                  <span className="text-[#22C55E]">98.2</span>
                </div>
                <div className="w-full h-1 bg-white/5">
                  <div className="w-[98%] h-full bg-[#22C55E]" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="flex flex-col gap-1">
              <Button variant="primary" size="sm" className="w-full justify-start gap-3">
                <Folder size={14} /> Initialize New Case
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start gap-3">
                <MessageSquare size={14} /> Global Feed Search
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                <Gift size={14} /> Manage Payouts
              </Button>
            </div>
          </Card>

          <div className="bg-[#FF4D4F]/5 border border-[#FF4D4F]/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-[#FF4D4F]" />
              <span className="text-[#FF4D4F] text-[10px] font-black uppercase tracking-widest">Urgent Notice</span>
            </div>
            <p className="text-text-secondary text-[10px] leading-relaxed">
              3 whispers for case C-014 require immediate validation. High probability of leak expiration in 4 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
