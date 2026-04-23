export interface WhisperAttachment {
  name: string;
  type: string;
  size: string;
}

export interface WhisperRecord {
  id: string;
  caseId: string;
  content: string;
  timestamp: string;
  attachments: WhisperAttachment[];
  status: "unread" | "reviewed" | "flagged";
  isUrgent: boolean;
}

export const MOCK_WHISPERS: WhisperRecord[] = [
  // Whispers for C-014 (Municipal Contract Fraud - Owner: Elena Fischer)
  {
    id: "W-8821",
    caseId: "C-014",
    content: "I've been working in the procurement office for 5 years. I've noticed that 'Vertex Solutions' always wins the bidding even when their price is 20% higher. Here is a scan of the internal scoring sheet that was manually overridden by the director.",
    timestamp: "2026-04-11 14:30",
    attachments: [
      { name: "scoring_override.pdf", type: "application/pdf", size: "2.4 MB" }
    ],
    status: "unread",
    isUrgent: true
  },
  {
    id: "W-7712",
    caseId: "C-014",
    content: "The CEO of Vertex is the brother-in-law of the Planning Commissioner. They meet every Tuesday at 'The Gilded Cage' to discuss which contracts are coming up next.",
    timestamp: "2026-04-10 09:15",
    attachments: [],
    status: "reviewed",
    isAnonymous: true,
    isUrgent: false
  } as any, // Temporary fix for missing isAnonymous in type if needed, but type doesn't have it
  
  // Whispers for C-013 (Police Misconduct - Owner: Marcus Webb)
  {
    id: "W-9901",
    caseId: "C-013",
    content: "Found a burner phone in the evidence locker that wasn't logged. It contains messages between officers coordinating their stories after the March incident. I've uploaded a zip of the exported text logs.",
    timestamp: "2026-04-12 11:20",
    attachments: [
      { name: "burner_dump.zip", type: "application/zip", size: "15.8 MB" }
    ],
    status: "unread",
    isUrgent: true
  },
  
  // Whispers for C-011 (Pharmaceutical Pricing - Owner: Amara Diallo)
  {
    id: "W-4450",
    caseId: "C-011",
    content: "The pricing algorithms are designed to sync with competitors via a shared API endpoint. It's called 'OptiPrice'. If you look at the source code for the pricing engine, you'll see a hardcoded reference to a secure tunnel.",
    timestamp: "2026-04-08 16:45",
    attachments: [
      { name: "api_config_capture.png", type: "image/png", size: "840 KB" }
    ],
    status: "reviewed",
    isUrgent: false
  }
];
