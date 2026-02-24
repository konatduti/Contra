import { DashboardData, DocumentItem, DocumentRisk, DocumentStatus, FlaggedIssue } from "@/lib/dashboard-types";

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

type DashboardResponse = {
  stats?: {
    totalDocuments?: number;
    completedDocuments?: number;
    processingDocuments?: number;
    failedDocuments?: number;
  };
  credits?: {
    monthlyQuota?: number;
    monthlyUsed?: number;
    extraCredits?: number;
  };
  recentDocuments?: Array<Record<string, unknown>>;
};

const toStatus = (value: string | null | undefined): DocumentStatus => {
  if (value === "done") return "Completed";
  if (value === "failed") return "Failed";
  return "Processing";
};

const toRisk = (status: DocumentStatus): DocumentRisk => {
  if (status === "Failed") return "High";
  if (status === "Completed") return "Low";
  return "Medium";
};

const prettyTime = (raw: string | null | undefined): string => {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const prettySize = (raw: unknown): string => {
  if (typeof raw !== "number") return "—";
  if (raw < 1024) return `${raw} B`;
  if (raw < 1024 * 1024) return `${(raw / 1024).toFixed(1)} KB`;
  return `${(raw / (1024 * 1024)).toFixed(1)} MB`;
};

const mapDocument = (doc: Record<string, unknown>): DocumentItem => {
  const status = toStatus(typeof doc.status === "string" ? doc.status : undefined);
  return {
    id: String(doc.id ?? ""),
    name: String(doc.filename ?? "Untitled"),
    size: prettySize(doc.fileSize),
    uploadedAt: prettyTime(typeof doc.uploadedAt === "string" ? doc.uploadedAt : undefined),
    status,
    risk: toRisk(status),
    confidence: 0,
    flaggedIssues: [],
    requiresAction: status !== "Completed"
  };
};

async function requestBff<T>(path: string): Promise<ApiResult<T>> {
  const response = await fetch(`/api/bff/${path}`, { cache: "no-store" });
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Request failed with status ${response.status}`
    };
  }

  return {
    ok: true,
    status: response.status,
    data: (await response.json()) as T
  };
}

export async function getDashboard(): Promise<ApiResult<DashboardData>> {
  const result = await requestBff<DashboardResponse>("dashboard");
  if (!result.ok || !result.data) return { ok: false, status: result.status, error: result.error };

  const response = result.data;
  const documents = (response.recentDocuments ?? []).map((doc) => mapDocument(doc));
  const flaggedIssues: Array<FlaggedIssue & { documentId: string; documentName: string }> = [];

  return {
    ok: true,
    status: result.status,
    data: {
      kpis: {
        totalDocuments: response.stats?.totalDocuments ?? 0,
        completedDocuments: response.stats?.completedDocuments ?? 0,
        processingDocuments: response.stats?.processingDocuments ?? 0,
        failedDocuments: response.stats?.failedDocuments ?? 0,
        monthlyQuota: response.credits?.monthlyQuota ?? 0,
        monthlyUsed: response.credits?.monthlyUsed ?? 0,
        extraCredits: response.credits?.extraCredits ?? 0,
        remainingCredits: (response.credits?.monthlyQuota ?? 0) - (response.credits?.monthlyUsed ?? 0) + (response.credits?.extraCredits ?? 0)
      },
      documents,
      flaggedIssues,
      requiresAction: documents.filter((doc) => doc.requiresAction)
    }
  };
}


export async function getDocuments(): Promise<ApiResult<{ documents: DocumentItem[] }>> {
  const result = await requestBff<{ documents?: Array<Record<string, unknown>> }>("documents");
  if (!result.ok || !result.data) return { ok: false, status: result.status, error: result.error };

  return {
    ok: true,
    status: result.status,
    data: {
      documents: (result.data.documents ?? []).map((doc) => mapDocument(doc))
    }
  };
}

export async function getDocument(id: string): Promise<ApiResult<{ document: DocumentItem }>> {
  const result = await requestBff<{ document?: Record<string, unknown> }>(`documents/${id}`);
  if (!result.ok || !result.data || !result.data.document) return { ok: false, status: result.status, error: result.error ?? "Document missing" };

  return {
    ok: true,
    status: result.status,
    data: {
      document: mapDocument(result.data.document)
    }
  };
}
