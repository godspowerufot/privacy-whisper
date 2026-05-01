"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableColumn } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useWhisperCaseManager, useWhisperVault } from "@/hooks/useContracts";
import { useAuth } from "@/lib/auth-context";
import { ethers } from "ethers";

interface Whisper {
  id: string;
  title: string;
  status: string;
  source: string;
  caseId: string;
  received: string;
  isUrgent: boolean;
  caseTitle: string;
}

const columns: TableColumn<Whisper>[] = [
  { key: "id", label: "ID", sortable: true, width: "w-20" },
  {
    key: "title",
    label: "Subtitle",
    render: (row) => (
      <Link href={`/dashboard/whispers/${row.id}`} className="text-white hover:text-[#6C5CE7] transition-colors font-medium text-xs">
        {row.title}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <Badge variant={row.status as any} dot>{row.status}</Badge>,
  },
  { key: "caseTitle", label: "Target Case" },
  { 
    key: "isUrgent", 
    label: "Priority",
    render: (row) => (
      <span className={row.isUrgent ? "text-error font-bold text-[10px] uppercase" : "text-text-secondary text-[10px] uppercase"}>
        {row.isUrgent ? "Urgent" : "Standard"}
      </span>
    )
  },
  { key: "received", label: "Received", sortable: true },
];

export default function WhispersPage() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Whisper>("received");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { address } = useAccount();
  const { role } = useAuth();
  const caseManager = useWhisperCaseManager();
  const vault = useWhisperVault();

  const fetchWhispers = useCallback(async () => {
    if (!vault || !caseManager || !address) return;
    try {
      setIsLoading(true);
      
      // 1. Fetch Case Titles for context
      const caseCount = await caseManager.getCaseCount();
      const caseTitles: Record<string, string> = { "0": "Platform (Direct)" };
      
      // Load titles for reference
      for (let i = 1; i <= Number(caseCount); i++) {
        try {
          const c = await caseManager.getCase(i);
          caseTitles[i.toString()] = c.title;
        } catch (e) { /* skip */ }
      }

      // 2. Fetch Global Whispers via the new contract functions
      const totalWhispers = await vault.getAllWhispersCount();
      console.log(`[WhispersPage] Fetching ${totalWhispers} global whispers...`);
      
      const chainWhispers: Whisper[] = [];
      for (let i = 0; i < Number(totalWhispers); i++) {
        try {
          const w = await vault.getGlobalWhisper(i);
          
          // Role-based filtering: Whisperers only see their own hashes
          const senderHash = w.senderHash;
          let shouldShow = role === "journalist" || role === "admin";
          
          if (role === "whisperer" && address) {
            const userHash = ethers.keccak256(ethers.solidityPacked(["address"], [address]));
            if (senderHash === userHash) {
              shouldShow = true;
            }
          }

          if (shouldShow) {
            chainWhispers.push({
              id: `W-G-${i}`,
              title: `Intel Packet #${i}`,
              status: w.status || "unread",
              source: role === "whisperer" ? "Your Submission" : "Anonymous Submission",
              caseId: w.caseId.toString(),
              caseTitle: caseTitles[w.caseId.toString()] || `Case #${w.caseId}`,
              received: new Date(Number(w.timestamp) * 1000).toISOString().slice(0, 10),
              isUrgent: w.isUrgent,
            });
          }
        } catch (e) {
          console.warn(`[WhispersPage] Failed to fetch global whisper ${i}:`, e);
        }
      }

      setWhispers(chainWhispers.reverse()); // Show newest first
    } catch (err) {
      console.error("[WhispersPage] Error fetching global whispers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [vault, caseManager, address]);

  useEffect(() => {
    fetchWhispers();
  }, [fetchWhispers]);

  const filtered = whispers.filter(
    (w) => w.title.toLowerCase().includes(query.toLowerCase()) || w.id.includes(query)
  ).sort((a, b) => {
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <DashboardLayout pageTitle="Whispers">
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: whispers.length, color: "text-white" },
          { label: "Urgent", value: whispers.filter(w => w.isUrgent).length, color: "text-[#FF4D4F]" },
          { label: "Pending", value: whispers.filter(w => w.status === "pending" || w.status === "unread").length, color: "text-[#3B82F6]" },
          { label: "Reviewed", value: whispers.filter(w => w.status === "reviewed").length, color: "text-[#22C55E]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#181818] border border-[#2A2A2A] px-4 py-3">
            <p className="text-[#A1A1AA] text-[10px] uppercase tracking-widest">{s.label}</p>
            <p className={["text-2xl font-black tabular-nums", s.color].join(" ")}>{isLoading ? "..." : s.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search whispers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
            />
          </div>
          <Link href="/dashboard/whispers/submit">
            <Button variant="primary" size="sm">
              <Plus size={12} /> Submit Whisper
            </Button>
          </Link>
        </div>
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(k) => {
            setSortDir((d) => (sortKey === k && d === "asc" ? "desc" : "asc"));
            setSortKey(k as keyof Whisper);
          }}
          emptyText={isLoading ? "Loading whispers from blockchain..." : "No whispers match your search."}
        />
      </Card>
    </DashboardLayout>
  );
}
