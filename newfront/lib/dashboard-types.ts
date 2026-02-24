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

export interface DashboardKpis {
  totalDocuments: number;
  completedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  remainingCredits: number;
  monthlyQuota: number;
  monthlyUsed: number;
  extraCredits: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  documents: DocumentItem[];
  flaggedIssues: Array<FlaggedIssue & { documentId: string; documentName: string }>;
  requiresAction: DocumentItem[];
}
