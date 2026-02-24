"use client";

import { Settings } from "lucide-react";

import { DocumentItem } from "@/lib/dashboard-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

export function RecentUploadsList({ documents, interactive = true }: { documents: DocumentItem[]; interactive?: boolean }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Upload time</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Confidence</TableHead>
              {interactive ? <TableHead className="text-right">Settings</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell><p className="text-sm font-medium text-slate-900">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.size}</p></TableCell>
                <TableCell>{doc.uploadedAt}</TableCell>
                <TableCell><Badge variant={riskVariant[doc.risk]}>{doc.risk}</Badge></TableCell>
                <TableCell>{doc.confidence ? `${doc.confidence}%` : "—"}</TableCell>
                {interactive ? <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem>Open analysis</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-3 lg:hidden">
        {documents.map((doc) => (
          <div key={doc.id} className="flex flex-col gap-3 rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-900">{doc.name}</p><Badge variant={riskVariant[doc.risk]}>{doc.risk}</Badge></div>
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{doc.uploadedAt}</span><span>{doc.confidence ? `${doc.confidence}% confidence` : "—"}</span></div>
            {doc.status !== "Completed" ? <Badge variant={statusVariant[doc.status]} className={cn("w-fit")}>{doc.status}</Badge> : null}
          </div>
        ))}
      </div>
    </>
  );
}
