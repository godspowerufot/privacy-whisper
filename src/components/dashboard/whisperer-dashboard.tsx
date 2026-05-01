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
  Clock,
  Loader2
} from "lucide-react";
import { useAccount } from "wagmi";
import { useWhisperStats, useWhisperCaseManager, useWhisperVault } from "@/hooks/useContracts";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

export function WhispererDashboard() {
  const { address } = useAccount();
  const statsContract = useWhisperStats();
  const caseManager = useWhisperCaseManager();
  const vault = useWhisperVault();
  const router = useRouter();
  
  const [stats, setStats] = React.useState({
    totalWhispers: 0,
    trustLevel: "BETA",
    impactScore: 0,
    totalEarned: 0
  });
  const [openCases, setOpenCases] = React.useState<any[]>([]);
  const [myWhispers, setMyWhispers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchStats() {
      if (!statsContract || !address) return;
      
      try {
        setIsLoading(true);
        const userStats = await statsContract.userStats(address);
        
        let trustLevel = "BETA";
        const impactScore = Number(userStats.impactScore);
        if (impactScore > 100) trustLevel = "GAMMA";
        if (impactScore > 500) trustLevel = "OMEGA";

        setStats({
          totalWhispers: Number(userStats.totalWhispers),
          trustLevel: trustLevel,
          impactScore: impactScore,
          totalEarned: Number(userStats.totalEarned)
        });
      } catch (err) {
        console.error("[WhispererDashboard] Error fetching stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, [statsContract, address]);

  React.useEffect(() => {
    async function fetchData() {
      if (!caseManager || !vault || !address) return;
      try {
        // Fetch Open Cases
        const nextIdBig = await caseManager.nextCaseId();
        const nextId = Number(nextIdBig);
        const casePromises = [];
        for (let i = 1; i < nextId; i++) {
          casePromises.push(caseManager.getCase(i).catch(() => null));
        }
        const caseResults = await Promise.all(casePromises);
        const activeBounties = caseResults
          .filter(c => c !== null && c.caseId.toString() !== "0" && c.isOpen)
          .map(c => ({
            id: `C-${c.caseId.toString()}`,
            caseId: c.caseId.toString(),
            title: c.title,
            urgency: c.priority,
            pool: ethers.formatEther(c.prizePool) + " ETH"
          }));
        setOpenCases(activeBounties.reverse());

        // Fetch My Whispers
        const senderHash = ethers.solidityPackedKeccak256(["address"], [address]);
        const whisperCountBig = await vault.getAllWhispersCount();
        const whisperCount = Number(whisperCountBig);
        const whisperPromises = [];
        for (let i = 0; i < whisperCount; i++) {
          whisperPromises.push(vault.getGlobalWhisper(i).then((w: any) => ({ index: i, whisper: w })).catch(() => null));
        }
        const whisperResults = await Promise.all(whisperPromises);
        const userWhispers = whisperResults
          .filter(res => res !== null && res.whisper.senderHash === senderHash)
          .map(res => ({
            id: `W-${res.index}`,
            case: `Case C-${res.whisper.caseId.toString()}`,
            date: new Date(Number(res.whisper.timestamp) * 1000).toISOString().slice(0, 10),
            status: res.whisper.status,
            reward: "Pending"
          }));
        setMyWhispers(userWhispers.reverse());
      } catch (err) {
        console.error("Error fetching whisperer data:", err);
      }
    }
    fetchData();
  }, [caseManager, vault, address]);

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          variant="metric"
          metricLabel="Total Whispers"
          metricValue={isLoading ? "..." : stats.totalWhispers.toString()}
          metricDelta={{ value: "2 pending", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Trust Level"
          metricValue={isLoading ? "..." : stats.trustLevel}
          metricDelta={{ value: "+150 XP", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Impact Score"
          metricValue={isLoading ? "..." : stats.impactScore.toString()}
          metricDelta={{ value: "Top 15%", positive: true }}
        />
        <Card
          variant="metric"
          metricLabel="Total Earned"
          metricValue={isLoading ? "..." : `$${stats.totalEarned}`}
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
                <Button variant="primary" size="sm" onClick={() => router.push('/dashboard/whispers/submit')}>Submit First Tip</Button>
              </div>
            )}
          </Card>

          <Card title="Open Bounties" subtitle="Browse cases requiring evidence">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openCases.map((b: any) => (
                <div key={b.id} onClick={() => router.push(`/dashboard/whispers/submit`)} className="p-4 bg-white/2 border border-white/5 hover:border-[#00D1B2]/30 transition-all cursor-pointer">
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
            {openCases.length === 0 && (
              <div className="py-12 text-center bg-white/2 border border-dashed border-white/10">
                <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest mb-4">No open investigations</p>
                <Button variant="primary" size="xs" onClick={() => router.push('/dashboard/cases')}>Browse Cases</Button>
              </div>
            )}
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
              <Button variant="secondary" size="sm" className="w-full justify-start gap-3" onClick={() => setIsGuidelinesOpen(true)}>
                <Zap size={14} /> Submission Guidelines
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3" onClick={() => router.push('/dashboard/rewards')}>
                <Gift size={14} /> Rewards
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

      {isGuidelinesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={() => setIsGuidelinesOpen(false)}>
          <div className="bg-[#121212] border border-[#2A2A2A] max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-lg font-black uppercase tracking-widest mb-4">Submission Guidelines</h3>
            <div className="text-[#A1A1AA] text-xs leading-relaxed flex flex-col gap-4">
              <p><strong>1. Privacy First:</strong> Your identity is protected using Zama's Fully Homomorphic Encryption. The platform cannot decrypt your identity without a cryptographic reveal request approved by the journalist.</p>
              <p><strong>2. Provide Evidence:</strong> Unsubstantiated claims will likely be ignored. Always try to provide documents, photos, or data to back up your tip.</p>
              <p><strong>3. Monitor the Status:</strong> Check the status of your whispers regularly. If a journalist reviews and approves your evidence, you may be eligible for a reward.</p>
              <p><strong>4. Claiming Rewards:</strong> When a reward is approved, the payout is processed confidentially through our smart contracts. Your Ethereum address will be revealed at the payout step to receive funds.</p>
            </div>
            <div className="mt-8 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setIsGuidelinesOpen(false)}>Understood</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
