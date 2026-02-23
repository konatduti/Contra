"use client";

import { useDocuments } from "@/components/document-provider";
import { RecentUploadsTable } from "@/components/recent-uploads-table";

export default function DocumentsPage() {
  const { documents } = useDocuments();

  return (
    <div className="space-y-6 pb-20">
      <div>
        <p className="text-sm text-muted-foreground">All uploads</p>
        <h1 className="text-2xl font-semibold">Documents</h1>
      </div>
      <RecentUploadsTable documents={documents} />
    </div>
  );
}
