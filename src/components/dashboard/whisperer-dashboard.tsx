"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  MessageSquare, 
  Zap, 
  Gift, 
  Lock, 
  Eye,
  TrendingUp,
  Clock
} from "lucide-react";

const myWhispers = [
  { id: "W-882", case: "Police Misconduct #88B", date: "2d ago", status: "reviewed" as const, reward: "$500" },
  { id: "W-901", case: "Municipal Contract Fraud", date: "4h ago", status: "pending" as const, reward: "Pending" },
];

export function WhispererDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          variant="metric"
          metricLabel="Total Whispers"
          metricValue="14"
          metricDelta={{ value: "2 pending", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Trust Level"
          metricValue="BETA"
          metricDelta={{ value: "+150 XP", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Impact Score"
          metricValue="720"
          metricDelta={{ value: "Top 15%", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Total Earned"
          metricValue="$4.2K"
          metricDelta={{ value: "+$500 week", positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="My Submissions" subtitle="Track your anonymous tips and their impact">
            <div className="flex flex-col gap-1">
              {myWhispers.map((w) => (
                <div key={w.id} className="group flex items-center justify-between p-4 border border-transparent hover:border-white/5 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#00D1B2]/5 flex items-center justify-center font-mono text-[10px] text-[#00D1B2]">
                      {w.id}
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold mb-1">{w.case}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[#555] text-[9px] uppercase font-bold tracking-widest">{w.date}</span>
                        <div className="w-1 h-1 rounded-full bg-[#333]" />
                        <span className="text-[#00D1B2] text-[9px] font-bold uppercase tracking-tight">{w.reward} Reward</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={w.status} dot>{w.status}</Badge>
                    <Button variant="ghost" size="xs">Details</Button>
                  </div>
                </div>
              ))}
            </div>
            {myWhispers.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[#555] text-xs font-bold uppercase tracking-widest mb-4">No active whispers</p>
                <Button variant="primary" size="sm">Submit First Tip</Button>
              </div>
            )}
          </Card>

          <Card title="Open Bounties" subtitle="Browse cases requiring evidence">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Pharmaceutical Pricing", pool: "$10,000", urgency: "Medium" },
                { title: "Environmental Dumping", pool: "$3,000", urgency: "High" }
              ].map(b => (
                <div key={b.title} className="p-4 bg-white/2 border border-white/5 hover:border-[#00D1B2]/30 transition-all cursor-pointer">
                  <div className="flex justify-between mb-3">
                     <span className="text-[#00D1B2] text-[9px] font-black uppercase tracking-widest">Active Bounty</span>
                     <span className="text-white font-mono text-xs">{b.pool}</span>
                  </div>
                  <h4 className="text-white text-sm font-black uppercase mb-4 leading-tight">{b.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[#555] text-[9px] font-bold uppercase">{b.urgency} Urgency</span>
                    <span className="text-[#00D1B2] text-[10px] font-black uppercase tracking-tighter">Submit Evidence →</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card variant="secure" title="Encrypted Connection">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-center p-4 bg-white/5 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00D1B2] animate-pulse" />
                <Lock size={20} className="text-[#00D1B2] mx-auto mb-2" />
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">ANON_WHISPERER_901</p>
                <p className="text-[8px] font-bold text-[#555] uppercase">Tunnel ID: 0x8d...f2a</p>
              </div>
              
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-[#555] uppercase">Security Level</span>
                  <span className="text-[#00D1B2]">MAXIMUM</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-[#555] uppercase">IP Masking</span>
                  <span className="text-[#22C55E]">ACTIVE</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Whisperer Essentials">
            <div className="flex flex-col gap-1">
              <Button variant="primary" size="sm" className="w-full justify-start gap-3">
                <MessageSquare size={14} /> Global Case Search
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start gap-3">
                <Zap size={14} /> Submission Guidelines
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                <Gift size={14} /> Claim Rewards
              </Button>
            </div>
          </Card>

          <div className="bg-[#00D1B2]/5 border border-[#00D1B2]/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={14} className="text-[#00D1B2]" />
              <span className="text-[#00D1B2] text-[10px] font-black uppercase tracking-widest">System Tip</span>
            </div>
            <p className="text-text-secondary text-[10px] leading-relaxed">
              New evidence for "Pharmaceutical Pricing" has a 1.5x reward multiplier for the next 48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
