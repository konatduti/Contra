import { AlertTriangle } from "lucide-react";

import { DocumentItem } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RequiresActionCard({ documents }: { documents: DocumentItem[] }) {
  const actionDocs = documents.filter((doc) => doc.requiresAction).slice(0, 4);

  return (
    <Card className="h-full transition group-hover:border-amber-100 group-hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Documents Requiring Action</CardTitle>
        <div className="rounded-full bg-amber-50 p-2 text-amber-500">
          <AlertTriangle className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everything looks good.</p>
        ) : (
          actionDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 transition group-hover:border-amber-200"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                <p className="text-xs text-muted-foreground">Uploaded {doc.uploadedAt}</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Needs review</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
