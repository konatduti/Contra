import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocument } from "@/lib/api";

const riskVariant = { High: "danger", Medium: "warning", Low: "success" } as const;
const statusVariant = { Completed: "success", Failed: "danger", Processing: "muted" } as const;

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const result = await getDocument(params.id);

  if (!result.ok) {
    if (result.status === 401) {
      return <p>Not logged in. <Link className="underline" href="/login">Go to login</Link>.</p>;
    }
    if (result.status === 404) {
      return <p>Document not found.</p>;
    }
    return <p>Backend not reachable (HTTP {result.status}).</p>;
  }

  const document = result.data?.document;
  if (!document) return <p>No documents found.</p>;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <p className="text-sm text-muted-foreground">Document analysis</p>
        <h1 className="text-2xl font-semibold">{document.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant[document.status]}>{document.status}</Badge>
          <Badge variant={riskVariant[document.risk]}>{document.risk} Risk</Badge>
          <Badge variant="secondary">{document.confidence ? `${document.confidence}% confidence` : "—"}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Flagged Issues</CardTitle></CardHeader>
        <CardContent>
          {document.flaggedIssues.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : document.flaggedIssues.map((issue) => (
            <div key={issue.title} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <p className="text-sm font-medium text-slate-900">{issue.title}</p>
              <Badge variant={riskVariant[issue.severity]}>{issue.severity}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
