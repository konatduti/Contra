"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CreditSelector } from "@/components/CreditSelector";
import { UploadDropzone, UploadFile } from "@/components/UploadDropzone";
import { UploadInfoPanel } from "@/components/UploadInfoPanel";
import { useDocuments } from "@/components/document-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentItem } from "@/lib/mock-data";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [creditPlan, setCreditPlan] = useState("individual-monthly");
  const { addDocuments, updateDocument } = useDocuments();

  const onFilesAdded = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const accepted = Array.from(incoming).filter((file) => ACCEPTED_TYPES.includes(file.type));
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, id: `${file.name}-${file.lastModified}` }))
    ]);
  }, []);

  const totalSize = useMemo(
    () => files.reduce((acc, item) => acc + item.file.size, 0),
    [files]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAnalyze = () => {
    if (files.length === 0) return;
    const newDocs: DocumentItem[] = files.map((item, index) => ({
      id: `new-${Date.now()}-${index}`,
      name: item.file.name,
      size: `${(item.file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedAt: "Just now",
      status: "Processing",
      risk: "Medium",
      confidence: 0,
      flaggedIssues: [],
      requiresAction: false
    }));

    addDocuments(newDocs);
    router.push("/");

    newDocs.forEach((doc) => {
      setTimeout(() => {
        updateDocument(doc.id, {
          status: "Completed",
          risk: Math.random() > 0.5 ? "High" : "Low",
          confidence: Math.floor(80 + Math.random() * 18),
          uploadedAt: "Moments ago",
          flaggedIssues: [
            { title: "Payment terms missing escalation", severity: "Medium" },
            { title: "Data processing clause incomplete", severity: "High" }
          ],
          requiresAction: true
        });
      }, 1000 + Math.random() * 1000);
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Upload & analyze</p>
        <h1 className="text-2xl font-semibold">Upload contract</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Get a clear summary of risks, obligations, and clause gaps in minutes with AI-powered
          analysis built for legal teams.
        </p>
      </div>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-4">
          <UploadDropzone files={files} onFilesAdded={onFilesAdded} onRemoveFile={removeFile} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Credits and billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <CreditSelector value={creditPlan} onValueChange={setCreditPlan} />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Total upload size: {(totalSize / 1024 / 1024).toFixed(2)} MB · Plan: {creditPlan}
              </div>
              <p className="text-xs text-muted-foreground">
                Credits are consumed only after analysis completes successfully.
              </p>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
            onClick={handleAnalyze}
            disabled={files.length === 0}
          >
            Upload and analyze
          </Button>
        </div>

        <div className="min-h-0">
          <UploadInfoPanel />
        </div>
      </div>
    </div>
  );
}
