"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Shield, 
  Terminal,
  ExternalLink,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRewardManager, useWhisperCaseManager } from "@/hooks/useContracts";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

interface Transaction {
  id: string;
  type: "payment" | "reward";
  caseId: string;
  caseTitle: string;
  amount: string; // Changed to string for ETH
  status: "completed" | "pending";
  timestamp: string;
  recipientOrSender: string;
}

export default function RewardsPage() {
  const { role } = useAuth();
  const { address } = useAccount();
  const isJournalist = role === "journalist";
  
  const rewardManager = useRewardManager();
  const caseManager = useWhisperCaseManager();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTransactions = useCallback(async () => {
    if (!rewardManager || !caseManager || !address) return;

    try {
      setIsLoading(true);

      // 1. Fetch Case Titles for context
      const nextIdBig = await caseManager.nextCaseId();
      const nextId = Number(nextIdBig);
      const caseMetadata: Record<string, { title: string; prizePool: string }> = {};

      const casePromises = [];
      const rewardPromises = [];
      
      for (let i = 1; i < nextId; i++) {
        casePromises.push(caseManager.getCase(i).then((c: any) => ({ caseId: i, caseData: c })).catch(() => null));
        rewardPromises.push(rewardManager.rewards(i).then((r: any) => ({ caseId: i, rewardData: r })).catch(() => null));
      }
      
      const caseResults = await Promise.all(casePromises);
      caseResults.forEach((res: any) => {
        if (res && res.caseData) {
           caseMetadata[res.caseId.toString()] = {
             title: res.caseData.title,
             prizePool: ethers.formatEther(res.caseData.prizePool)
           };
        }
      });

      const rewardResults = await Promise.all(rewardPromises);
      const approvedTxs: Transaction[] = [];
      const distributedTxs: Transaction[] = [];
      
      rewardResults.forEach((res: any) => {
        if (res && res.rewardData) {
          const { caseId, rewardData: r } = res;
          if (r.approved && !r.paid) {
            approvedTxs.push({
               id: `TX-A-${caseId}`,
               type: "payment",
               caseId: caseId.toString(),
               caseTitle: caseMetadata[caseId.toString()]?.title || "Investigation",
               amount: caseMetadata[caseId.toString()]?.prizePool || "0.00",
               status: "pending",
               timestamp: "Recent",
               recipientOrSender: "Pending Reveal"
            });
          } else if (r.approved && r.paid) {
            distributedTxs.push({
               id: `TX-D-${caseId}`,
               type: "payment",
               caseId: caseId.toString(),
               caseTitle: caseMetadata[caseId.toString()]?.title || "Investigation",
               amount: caseMetadata[caseId.toString()]?.prizePool || "0.00",
               status: "completed",
               timestamp: "Confirmed",
               recipientOrSender: "Anonymous Source"
            });
          }
        }
      });

      // Combine and filter by user-involved cases if journalist
      const combined = [...distributedTxs, ...approvedTxs].reverse();
      setTransactions(combined);
    } catch (err) {
      console.error("[RewardsPage] Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [rewardManager, caseManager, address]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTxs = transactions.filter(tx => 
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.recipientOrSender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalETH = transactions
    .filter(tx => tx.status === "completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const activeBounties = transactions.filter(tx => tx.status === "pending").length;

  return (
    <DashboardLayout pageTitle="Rewards & Transactions">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="metric" 
          metricLabel={isJournalist ? "Total Distributed (ETH)" : "Total Earned (ETH)"} 
          metricValue={isLoading ? "..." : `${totalETH.toFixed(4)} ETH`} 
          metricDelta={{ value: "On-chain settlements", positive: true }}
        />
        <Card variant="metric" 
          metricLabel={isJournalist ? "Active Bounties" : "Pending Rewards"} 
          metricValue={isLoading ? "..." : activeBounties.toString()} 
        />
        <Card variant="metric" 
          metricLabel="Escrow Security" 
          metricValue="ZK-SAFE" 
          metricDelta={{ value: "Protocol Active", positive: true }}
        />
      </div>

      {/* Main Tx Table Card */}
      <Card title={isJournalist ? "Payment History" : "Reward History"}>
        <div className="flex flex-col gap-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input 
                type="text" 
                placeholder="Filter transactions..." 
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="flex-1 sm:flex-none border border-[#2A2A2A]" onClick={fetchTransactions}>
                {isLoading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Filter size={14} className="mr-2" />} 
                {isLoading ? "Syncing..." : "Sync Chain"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#0F0F0F]">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555]">Tx ID</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555]">Description / Case</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555]">{isJournalist ? "Recipient" : "Sender"}</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555]">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555]">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555]">Date</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#555]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#555] italic text-xs">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={24} />
                        Syncing with blockchain Ledger...
                      </div>
                    </td>
                  </tr>
                ) : filteredTxs.length > 0 ? (
                  filteredTxs.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <span className="text-white text-xs font-mono font-bold">{tx.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-bold truncate max-w-[200px]">{tx.caseTitle}</span>
                          <span className="text-[#555] text-[10px] font-mono">{tx.caseId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-[#A1A1AA] text-xs font-semibold">
                          <div className={["w-5 h-5 flex items-center justify-center text-[8px] font-black", isJournalist ? "bg-[#3A3A3A]" : "bg-[#6C5CE7]/20 text-[#6C5CE7]"].join(" ")}>
                            {tx.recipientOrSender.slice(0, 2).toUpperCase()}
                          </div>
                          {tx.recipientOrSender}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-black text-sm whitespace-nowrap">
                          {isJournalist ? (
                            <ArrowUpRight size={14} className="text-[#FF4D4F]" />
                          ) : (
                            <ArrowDownLeft size={14} className="text-[#00D1B2]" />
                          )}
                          <span className={isJournalist ? "text-white" : "text-[#00D1B2]"}>
                            {tx.amount} ETH
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge 
                          variant={tx.status === "completed" ? "reviewed" : "pending"} 
                          dot
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-[#555] text-[10px] font-bold whitespace-nowrap">
                        {tx.timestamp}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-[#3A3A3A] hover:text-[#6C5CE7] transition-colors" title="View Transaction Detail">
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#555] italic text-xs">
                      No transactions found on-chain.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary */}
          <div className="mt-4 pt-6 border-t border-[#2A2A2A] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#555]">
            <div className="flex gap-6">
              <span>Verified Nodes: Active</span>
              <span>Encrypted Relay: Syncing</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-[#6C5CE7]" />
              Secure Blockchain Verification Protocol Active
            </div>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
