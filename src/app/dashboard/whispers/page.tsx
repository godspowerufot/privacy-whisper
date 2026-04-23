"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableColumn } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Whisper {
  id: string;
  title: string;
  status: "open" | "reviewed" | "urgent" | "pending";
  source: string;
  caseId: string;
  received: string;
  words: number;
}

const WHISPERS: Whisper[] = [
  { id: "W-042", title: "Budget Manipulation — Public Works Q1", status: "urgent", source: "Anonymous", caseId: "C-014", received: "2026-04-10", words: 847 },
  { id: "W-041", title: "Falsified Use-of-Force Reports", status: "open", source: "Source A", caseId: "C-013", received: "2026-04-09", words: 420 },
  { id: "W-040", title: "Illegal Discharge Near River Delta", status: "reviewed", source: "Anonymous", caseId: "C-012", received: "2026-04-07", words: 312 },
  { id: "W-039", title: "Insulin Price Fixing Agreement", status: "pending", source: "Source C", caseId: "C-011", received: "2026-04-05", words: 1100 },
  { id: "W-038", title: "PTA Fund Misappropriation", status: "reviewed", source: "Anonymous", caseId: "C-010", received: "2026-04-02", words: 256 },
];

const columns: TableColumn<Whisper>[] = [
  { key: "id", label: "ID", sortable: true, width: "w-20" },
  {
    key: "title",
    label: "Title",
    render: (row) => (
      <Link href={`/dashboard/whispers/${row.id}`} className="text-white hover:text-[#6C5CE7] transition-colors font-medium text-xs">
        {row.title}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <Badge variant={row.status} dot>{row.status}</Badge>,
  },
  { key: "source", label: "Source" },
  { key: "caseId", label: "Case" },
  { key: "words", label: "Words", sortable: true },
  { key: "received", label: "Received", sortable: true },
];

export default function WhispersPage() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Whisper>("received");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = WHISPERS.filter(
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
          { label: "Total", value: WHISPERS.length, color: "text-white" },
          { label: "Urgent", value: WHISPERS.filter(w => w.status === "urgent").length, color: "text-[#FF4D4F]" },
          { label: "Open", value: WHISPERS.filter(w => w.status === "open").length, color: "text-[#3B82F6]" },
          { label: "Reviewed", value: WHISPERS.filter(w => w.status === "reviewed").length, color: "text-[#22C55E]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#181818] border border-[#2A2A2A] px-4 py-3">
            <p className="text-[#A1A1AA] text-[10px] uppercase tracking-widest">{s.label}</p>
            <p className={["text-2xl font-black tabular-nums", s.color].join(" ")}>{s.value}</p>
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
          emptyText="No whispers match your search."
        />
      </Card>
    </DashboardLayout>
  );
}
