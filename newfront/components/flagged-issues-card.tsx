import { ShieldAlert } from "lucide-react";

import { DocumentItem } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const riskVariant = {
  High: "danger",
  Medium: "warning",
  Low: "success"
} as const;

export function FlaggedIssuesCard({ documents }: { documents: DocumentItem[] }) {
  const issues = documents
    .flatMap((doc) =>
      doc.flaggedIssues.map((issue) => ({
        ...issue,
        documentId: doc.id,
        documentName: doc.name
      }))
    )
    .slice(0, 4);

  return (
    <Card className="h-full transition group-hover:border-amber-100 group-hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Top Flagged Issues</CardTitle>
        <div className="rounded-full bg-rose-50 p-2 text-rose-500">
          <ShieldAlert className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No flagged issues yet.</p>
        ) : (
          issues.map((issue) => (
            <div
              key={`${issue.documentId}-${issue.title}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 transition group-hover:border-amber-200"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{issue.title}</p>
                <p className="text-xs text-muted-foreground">{issue.documentName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={riskVariant[issue.severity]}>{issue.severity}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
