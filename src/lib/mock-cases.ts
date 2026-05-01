export interface CaseRecord {
  id: string;
  title: string;
  status: "open" | "reviewed" | "urgent" | "pending";
  priority: "High" | "Medium" | "Low";
  whispers: number;
  created: string;
  tags: string[];
  background: string;
  whisperBrief: string;
  prizePool: number;
  reporterName: string;
  isAnonymous: boolean;
}

export const MOCK_CASES: CaseRecord[] = [
  {
    id: "C-015",
    title: "Crypto Exchange Insolvency",
    status: "urgent",
    priority: "High",
    whispers: 4,
    created: "2026-04-29",
    tags: ["crypto", "exchange", "insolvency", "fraud"],
    background:
      "A prominent decentralized finance platform and exchange is suspected of commingling user funds with high-risk lending protocols. Internal chats suggest executive management is aware of a $45M deficit that could result in an imminent liquidity crunch and withdrawal freeze.",
    whisperBrief:
      "We are investigating potential insolvency and misuse of user deposits at the platform. If you have access to internal balance sheets, transaction logs, commingling evidence, or developer communications, please submit here securely.",
    prizePool: 12000,
    reporterName: "Alex Thorne",
    isAnonymous: true,
  },
  {
    id: "C-014",
    title: "Municipal Contract Fraud",
    status: "urgent",
    priority: "High",
    whispers: 7,
    created: "2026-04-10",
    tags: ["corruption", "procurement", "local-gov"],
    background:
      "Multiple tip-offs suggest that the city's Department of Public Works has been systematically awarding infrastructure contracts to companies with undisclosed ties to senior officials. Three major contracts totalling $14.2M are under scrutiny for Q1 2026.",
    whisperBrief:
      "We are investigating potential bid-rigging in municipal contracts. If you have access to procurement documents, scoring sheets, emails, or firsthand knowledge of irregular award decisions, please submit here. Your identity is never stored or logged.",
    prizePool: 5000,
    reporterName: "Elena Fischer",
    isAnonymous: true,
  },
  {
    id: "C-013",
    title: "Police Misconduct #88B",
    status: "open",
    priority: "High",
    whispers: 12,
    created: "2026-04-09",
    tags: ["police", "misconduct", "civil-rights"],
    background:
      "A pattern of falsified use-of-force reports has been identified across Precinct 88B. Internal complaint records show a sustained cover-up spanning at least 18 months. Multiple officers are implicated.",
    prizePool: 7500,
    reporterName: "Marcus Webb",
    isAnonymous: false,
    whisperBrief:
      "We are investigating falsified police reports at Precinct 88B. If you are a current or former officer, legal observer, or affected civilian with relevant documents or direct accounts, submit securely here. All submissions are encrypted end-to-end.",
  },
  {
    id: "C-012",
    title: "Environmental Dumping",
    status: "reviewed",
    priority: "Medium",
    whispers: 3,
    created: "2026-04-07",
    tags: ["environment", "industrial", "epa"],
    background:
      "A manufacturing plant near the River Delta corridor has been illegally disposing of chemical waste since late 2025. EPA filings appear to have been manipulated. Local residents report health complaints.",
    prizePool: 3000,
    reporterName: "Sarah Chen",
    isAnonymous: true,
    whisperBrief:
      "We are investigating illegal chemical dumping near the River Delta. If you have satellite data, internal safety reports, shipping manifests, or witness accounts, submit them here. Submissions are anonymous and encrypted.",
  },
  {
    id: "C-011",
    title: "Pharmaceutical Pricing",
    status: "pending",
    priority: "Medium",
    whispers: 5,
    created: "2026-04-05",
    tags: ["pharma", "pricing", "healthcare"],
    background:
      "Evidence points to a coordinated price-fixing agreement between three major insulin manufacturers. Internal memos from a whistleblower suggest executive knowledge at the highest levels.",
    prizePool: 10000,
    reporterName: "Amara Diallo",
    isAnonymous: false,
    whisperBrief:
      "We are investigating insulin price-fixing. If you work in pharma, insurance, or healthcare procurement and have documents, emails, or recordings, please submit here. You are fully protected.",
  },
  {
    id: "C-010",
    title: "School Board Embezzlement",
    status: "reviewed",
    priority: "Low",
    whispers: 2,
    created: "2026-04-02",
    tags: ["education", "finance", "embezzlement"],
    background:
      "Financial audits suggest more than $400K in school district funds were redirected to personal accounts linked to two board members over a three-year period.",
    prizePool: 1500,
    reporterName: "Yusuf Okafor",
    isAnonymous: true,
    whisperBrief:
      "We need financial records, communications, or firsthand accounts related to school board fund misuse. Any documentation — budgets, invoices, emails — is valuable.",
  },
  {
    id: "C-009",
    title: "Immigration Detention Conditions",
    status: "open",
    priority: "High",
    whispers: 9,
    created: "2026-03-28",
    tags: ["immigration", "detention", "human-rights"],
    background:
      "Multiple sources from inside a private detention facility allege systematic denial of medical care, prolonged solitary confinement, and document destruction to conceal complaints.",
    prizePool: 8000,
    reporterName: "Rosa Martinez",
    isAnonymous: false,
    whisperBrief:
      "We are documenting conditions inside ICE detention facilities. If you are a detainee, guard, contractor, nurse, or lawyer with access to internal records or firsthand accounts, submit securely here.",
  },
];
