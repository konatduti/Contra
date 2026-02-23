export type DocumentStatus = "Completed" | "Failed" | "Processing";
export type DocumentRisk = "High" | "Medium" | "Low";

export interface FlaggedIssue {
  title: string;
  severity: DocumentRisk;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: DocumentStatus;
  risk: DocumentRisk;
  confidence: number;
  flaggedIssues: FlaggedIssue[];
  requiresAction: boolean;
}

export interface CreditModel {
  totalCredits: number;
  usedCredits: number;
  resetsInDays: number;
}

export interface TimeSavedModel {
  minutesSaved: number;
  manualBaselineMinutes: number;
}

export const initialDocuments: DocumentItem[] = [
  {
    id: "doc-291",
    name: "Partnership Agreement.pdf",
    size: "2.4 MB",
    uploadedAt: "2h ago",
    status: "Completed",
    risk: "High",
    confidence: 92,
    flaggedIssues: [
      { title: "Indemnity clause is overly broad", severity: "High" },
      { title: "Termination window unclear", severity: "Medium" }
    ],
    requiresAction: true
  },
  {
    id: "doc-292",
    name: "Vendor MSA.docx",
    size: "1.1 MB",
    uploadedAt: "5h ago",
    status: "Completed",
    risk: "Medium",
    confidence: 88,
    flaggedIssues: [
      { title: "Missing data retention policy", severity: "Medium" }
    ],
    requiresAction: true
  },
  {
    id: "doc-293",
    name: "Employment Contract.pdf",
    size: "890 KB",
    uploadedAt: "Yesterday",
    status: "Completed",
    risk: "Low",
    confidence: 97,
    flaggedIssues: [],
    requiresAction: false
  },
  {
    id: "doc-294",
    name: "NDA - Temp Staff.pdf",
    size: "640 KB",
    uploadedAt: "Yesterday",
    status: "Failed",
    risk: "High",
    confidence: 0,
    flaggedIssues: [
      { title: "Document unreadable", severity: "High" }
    ],
    requiresAction: true
  },
  {
    id: "doc-295",
    name: "Lease Addendum.pdf",
    size: "1.9 MB",
    uploadedAt: "2 days ago",
    status: "Completed",
    risk: "Medium",
    confidence: 84,
    flaggedIssues: [
      { title: "Escalation clause missing", severity: "Medium" }
    ],
    requiresAction: false
  },
  {
    id: "doc-296",
    name: "Marketing SOW.pdf",
    size: "1.2 MB",
    uploadedAt: "3 days ago",
    status: "Completed",
    risk: "Low",
    confidence: 95,
    flaggedIssues: [],
    requiresAction: false
  }
];

export const credits: CreditModel = {
  totalCredits: 120,
  usedCredits: 74,
  resetsInDays: 12
};

export const timeSaved: TimeSavedModel = {
  minutesSaved: 420,
  manualBaselineMinutes: 640
};

export const clauses = [
  "Liability caps and indemnities",
  "Payment terms and net deadlines",
  "Confidentiality scope and exclusions",
  "Termination triggers and cure periods"
];

export const suggestedFixes = [
  "Add a mutual limitation of liability cap aligned to contract value.",
  "Clarify termination notice period to 30 days with written notice.",
  "Include a data retention clause aligned with GDPR requirements."
];
