import Link from "next/link";

import { RecentUploadsTable } from "@/components/recent-uploads-table";
import { getDocuments } from "@/lib/api";

export default async function DocumentsPage() {
  const result = await getDocuments();

  if (!result.ok) {
    if (result.status === 401) {
      return <div className="space-y-4"><h1 className="text-2xl font-semibold">Documents</h1><p>Not logged in. <Link className="underline" href="/login">Go to login</Link>.</p></div>;
    }
    return <div className="space-y-4"><h1 className="text-2xl font-semibold">Documents</h1><p>Backend not reachable (HTTP {result.status}).</p></div>;
  }

  const documents = result.data?.documents ?? [];

  return (
    <div className="space-y-6 pb-20">
      <div>
        <p className="text-sm text-muted-foreground">All uploads</p>
        <h1 className="text-2xl font-semibold">Documents</h1>
      </div>
      {documents.length === 0 ? <p className="text-sm text-muted-foreground">No documents found.</p> : null}
      <RecentUploadsTable documents={documents} />
    </div>
  );
}
