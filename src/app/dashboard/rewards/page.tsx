"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
  Filter
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Transaction {
  id: string;
  type: "payment" | "reward";
  caseId: string;
  caseTitle: string;
  amount: number;
  currency: "USD" | "BTC" | "XMR";
  status: "completed" | "pending" | "failed";
  timestamp: string;
  recipientOrSender: string;
}

const JOURNALIST_TXS: Transaction[] = [
  { id: "TX-9902", type: "payment", caseId: "C-013", caseTitle: "Police Misconduct Investigation", amount: 2500, currency: "USD", status: "completed", timestamp: "2026-04-12 14:30", recipientOrSender: "Anon-7821" },
  { id: "TX-9841", type: "payment", caseId: "C-014", caseTitle: "Government Procurement Leak", amount: 5000, currency: "USD", status: "completed", timestamp: "2026-04-10 09:15", recipientOrSender: "Source A" },
  { id: "TX-9721", type: "payment", caseId: "C-011", caseTitle: "Environmental Violation Report", amount: 1800, currency: "USD", status: "pending", timestamp: "2026-04-08 18:45", recipientOrSender: "Source C" },
  { id: "TX-9610", type: "payment", caseId: "C-008", caseTitle: "Unveiling Shadow Banking", amount: 0.12, currency: "BTC", status: "completed", timestamp: "2026-04-02 22:10", recipientOrSender: "Anon-4420" },
];

const WHISPERER_TXS: Transaction[] = [
  { id: "TX-9902", type: "reward", caseId: "C-013", caseTitle: "Police Misconduct Investigation", amount: 2500, currency: "USD", status: "completed", timestamp: "2026-04-12 14:30", recipientOrSender: "Elena Fischer" },
  { id: "TX-9655", type: "reward", caseId: "C-009", caseTitle: "Corporate Tax Evasion Leak", amount: 0.05, currency: "BTC", status: "completed", timestamp: "2026-04-05 11:20", recipientOrSender: "Global Investigations" },
  { id: "TX-9501", type: "reward", caseId: "C-005", caseTitle: "Election Fraud Discovery", amount: 3200, currency: "USD", status: "completed", timestamp: "2026-03-28 15:40", recipientOrSender: "Marcus Thorne" },
];

const currencySymbol = { USD: "$", BTC: "₿", XMR: "ɱ" } as const;

export default function RewardsPage() {
  const { role } = useAuth();
  const isJournalist = role === "journalist";
  const transactions = isJournalist ? JOURNALIST_TXS : WHISPERER_TXS;
  
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTxs = transactions.filter(tx => 
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.recipientOrSender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUSD = transactions
    .filter(tx => tx.currency === "USD" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalBTC = transactions
    .filter(tx => tx.currency === "BTC" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <DashboardLayout pageTitle="Rewards & Transactions">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="metric" 
          metricLabel={isJournalist ? "Total Paid (USD)" : "Total Earned (USD)"} 
          metricValue={`$${totalUSD.toLocaleString()}`} 
          metricDelta={{ value: isJournalist ? "-12% vs last month" : "+24% vs last month", positive: !isJournalist }}
        />
        <Card variant="metric" 
          metricLabel={isJournalist ? "Active Bounties" : "Pending Rewards"} 
          metricValue={isJournalist ? "12" : "1"} 
        />
        <Card variant="metric" 
          metricLabel="Crypto Assets" 
          metricValue={`${totalBTC} BTC`} 
          metricDelta={{ value: "Secure Escrow Active", positive: true }}
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
              <Button variant="ghost" size="sm" className="flex-1 sm:flex-none border border-[#2A2A2A]">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
              <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
                Export CSV
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
                {filteredTxs.length > 0 ? (
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
                            {currencySymbol[tx.currency]}{tx.currency === "BTC" ? tx.amount : tx.amount.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge 
                          variant={tx.status === "completed" ? "reviewed" : tx.status === "pending" ? "pending" : "urgent"} 
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
                      No transactions found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary */}
          <div className="mt-4 pt-6 border-t border-[#2A2A2A] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#555]">
            <div className="flex gap-6">
              <span>Verified Nodes: 12</span>
              <span>Encrypted Relay: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-[#6C5CE7]" />
              Secure Blockchain Verification Protocol Active
            </div>
          </div>
        </div>
      </Card>

      {/* Extra Info Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card title="Security Protocol">
          <div className="flex gap-4 p-2">
            <div className="w-12 h-12 bg-[#6C5CE7]/10 flex items-center justify-center flex-shrink-0">
              <Shield className="text-[#6C5CE7]" />
            </div>
            <div>
              <p className="text-white text-xs font-bold uppercase mb-1">Zero-Knowledge Payouts</p>
              <p className="text-[#A1A1AA] text-[10px] leading-relaxed">
                All rewards are distributed via our proprietary ZK-Safe protocol. Recipient identities remain encrypted and decoupled from the specific leak source.
              </p>
            </div>
          </div>
        </Card>
        <Card title="Escrow Terminal">
          <div className="flex gap-4 p-2">
            <div className="w-12 h-12 bg-[#00D1B2]/10 flex items-center justify-center flex-shrink-0">
              <Terminal className="text-[#00D1B2]" />
            </div>
            <div>
              <p className="text-white text-xs font-bold uppercase mb-1">Live Relay Status</p>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-[#555]">NETWORK LATENCY</span>
                  <span className="text-[9px] text-[#00D1B2]">12ms</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D1B2] w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
