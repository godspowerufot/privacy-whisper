"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Folder,
  MessageSquare,
  Gift,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useWhisperCaseManager, useWhisperVault, useWhisperStats } from "@/hooks/useContracts";
import { CaseRecord } from "@/lib/mock-cases";

export function JournalistDashboard() {
  const router = useRouter();
  const { address } = useAccount();
  const caseManager = useWhisperCaseManager();
  const vault = useWhisperVault();
  const statsContract = useWhisperStats();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [whispers, setWhispers] = useState<any[]>([]);
  const [stats, setStats] = useState({ managedCases: 0, totalBountiesPaid: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!caseManager || !vault || !address) return;

    try {
      setIsLoading(true);

      if (statsContract && address) {
        const userStats = await statsContract.userStats(address);
        setStats({
          managedCases: Number(userStats.managedCases),
          totalBountiesPaid: Number(userStats.totalBountiesPaid)
        });
      }

      // 1. Fetch Cases created by this journalist
      const nextIdBig = await caseManager.nextCaseId();
      const nextId = Number(nextIdBig);
      const casePromises = [];
      for (let i = 1; i < nextId; i++) {
        casePromises.push(caseManager.getCase(i).catch(() => null));
      }
      
      const results = await Promise.all(casePromises);
      const chainCases = results
        .filter(c => c !== null && c.caseId.toString() !== "0" && c.journalist === address)
        .map(c => ({
           id: `C-${c.caseId.toString()}`,
           title: c.title,
           status: c.status,
           priority: c.priority,
           whispers: Number(c.whisperCount),
           created: new Date(Number(c.createdAt) * 1000).toISOString().slice(0, 10),
           prizePool: ethers.formatEther(c.prizePool),
        }));

      // 2. Fetch Platform Whispers (caseId 0)
      const whisperCountBig = await vault.getAllWhispersCount();
      const whisperCount = Number(whisperCountBig);
      const whisperPromises = [];
      for (let i = Math.max(0, whisperCount - 20); i < whisperCount; i++) {
        whisperPromises.push(vault.getGlobalWhisper(i).then((w: any) => ({ index: i, whisper: w })).catch(() => null));
      }
      const whisperResults = await Promise.all(whisperPromises);
      const chainWhispers = whisperResults
        .filter(res => res !== null && res.whisper.caseId.toString() === "0")
        .map(res => ({
           id: `W-P${res.index.toString()}`,
           content: `Platform Whisper #${res.index.toString()}`,
           time: "Recent",
           status: "pending" as const,
        }))
        .reverse()
        .slice(0, 5);

      setCases(chainCases.reverse() as any);
      setWhispers(chainWhispers);
    } catch (err) {
      console.error("[JournalistDashboard] Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [caseManager, vault, address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          variant="metric"
          metricLabel="Managed Cases"
          metricValue={isLoading ? "..." : stats.managedCases.toString()}
          metricDelta={{ value: "+1 this week", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Pending Whispers"
          metricValue={isLoading ? "..." : whispers.length.toString()}
          metricDelta={{ value: "Platform Queue", positive: false }}
        />

        <Card
          variant="metric"
          metricLabel="Bounties Paid"
          metricValue={isLoading ? "..." : `${stats.totalBountiesPaid} ETH`}
          metricDelta={{ value: "Total Distributed", positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="Incoming Intel Queue" subtitle="Verify and take action on platform-wide whispers">
            <div className="flex flex-col gap-1">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : whispers.length > 0 ? (
                whispers.map((w) => (
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
                ))
              ) : (
                <div className="py-8 text-center bg-white/2 border border-dashed border-white/10">
                  <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest">No incoming intel</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
              <Button variant="secondary" size="sm" className="w-full">Open Intel Matrix</Button>
            </div>
          </Card>

          <Card title="Active Investigations" subtitle="Cases you are currently leading">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-full py-12 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : cases.length > 0 ? (
                cases.map((c: any) => (
                  <div key={c.id} className="p-4 bg-white/5 border border-white/10 hover:border-[#6C5CE7]/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-[10px] text-[#6C5CE7]">{c.id}</span>
                      <span className={["text-[9px] font-black uppercase tracking-tighter",
                        c.priority === "High" ? "text-[#FF4D4F]" : "text-warning"
                      ].join(" ")}>{c.priority} Priority</span>
                    </div>
                    <h4 className="text-white text-sm font-black uppercase mb-3 leading-tight">{c.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#555] text-[10px] font-bold">
                        <MessageSquare size={12} /> {c.whispers} Whispers
                      </div>
                      <Button variant="ghost" size="xs" onClick={() => router.push(`/dashboard/cases/${c.id}`)}>View Details</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white/2 border border-dashed border-white/10">
                  <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest mb-4">No active investigations</p>
                  <Button variant="primary" size="xs" onClick={() => router.push("/dashboard/cases")}>Start a Case</Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Quick Actions">
            <div className="flex flex-col gap-1">
              <Button variant="primary" size="sm" className="w-full justify-start gap-3" onClick={() => router.push("/dashboard/cases")}>
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
              New whispers require immediate validation. High probability of leak expiration in 4 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
