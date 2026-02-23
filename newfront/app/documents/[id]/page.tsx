"use client";

import { useMemo } from "react";
import { Download, FileText, ShieldAlert, Timer } from "lucide-react";

import { useDocuments } from "@/components/document-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clauses, suggestedFixes } from "@/lib/mock-data";

const riskVariant = {
  High: "danger",
  Medium: "warning",
  Low: "success"
} as const;

const statusVariant = {
  Completed: "success",
  Failed: "danger",
  Processing: "muted"
} as const;

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const { documents } = useDocuments();
  const document = useMemo(() => documents.find((doc) => doc.id === params.id), [documents, params.id]);

  if (!document) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Document analysis</p>
        <h1 className="text-2xl font-semibold">Document not found</h1>
        <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
          We couldn&apos;t find this document. Head back to Documents and choose another file.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Document analysis</p>
          <h1 className="text-2xl font-semibold">{document.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[document.status]}>{document.status}</Badge>
            <Badge variant={riskVariant[document.risk]}>{document.risk} Risk</Badge>
            <Badge variant="secondary">{document.confidence ? `${document.confidence}% confidence` : "Pending"}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
          <Button variant="secondary">Mark as Resolved</Button>
          <Button>Request Lawyer Review</Button>
        </div>
      </div>

      {document.status === "Failed" ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardHeader>
            <CardTitle>Analysis failed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-rose-700">
            We could not read this document. Please re-upload a clearer scan.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Contra highlights payment terms, termination triggers, and data processing obligations. The contract has moderate risk
                with two clauses needing updates before signature.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Clauses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {clauses.map((clause) => (
                  <div key={clause} className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    {clause}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flagged Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {document.flaggedIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No issues detected.</p>
                ) : (
                  document.flaggedIssues.map((issue) => (
                    <div key={issue.title} className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                        <p className="text-sm font-medium text-slate-900">{issue.title}</p>
                      </div>
                      <Badge variant={riskVariant[issue.severity]}>{issue.severity}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggested Fixes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {suggestedFixes.map((fix) => (
                  <div key={fix} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
                    {fix}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Credits used</span>
                  <span className="font-medium text-slate-900">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time saved estimate</span>
                  <span className="font-medium text-slate-900">45 mins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last updated</span>
                  <span className="font-medium text-slate-900">{document.uploadedAt}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-slate-400" />
                  Schedule review with legal team.
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-slate-400" />
                  Share report with stakeholders.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
