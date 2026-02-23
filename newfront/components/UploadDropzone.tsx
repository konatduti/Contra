"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { FileText, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface UploadFile {
  file: File;
  id: string;
}

interface UploadDropzoneProps {
  files: UploadFile[];
  onFilesAdded: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
}

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];

export function UploadDropzone({ files, onFilesAdded, onRemoveFile }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Affordance — visual cues that indicate how an element should be used.

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      onFilesAdded(event.dataTransfer.files);
    },
    [onFilesAdded]
  );

  const filteredFiles = useMemo(
    () =>
      files.filter((item) =>
        ACCEPTED_FILE_TYPES.includes(item.file.type)
      ),
    [files]
  );

  const totalSize = useMemo(
    () => filteredFiles.reduce((acc, item) => acc + item.file.size, 0),
    [filteredFiles]
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition",
            isDragging
              ? "border-amber-400 bg-amber-50 shadow-sm"
              : "border-slate-200 bg-slate-50 hover:border-slate-300"
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
            <Upload className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Drag & drop your contract here</p>
            <p className="text-xs text-muted-foreground">or click to browse files</p>
          </div>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={(event) => onFilesAdded(event.target.files)}
          />
          <p className="text-xs text-muted-foreground">PDF, DOCX, TXT (max 50MB)</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-900">
            <span>Selected files</span>
            <span className="text-xs text-muted-foreground">
              {(totalSize / 1024 / 1024).toFixed(2)} MB total
            </span>
          </div>
          {filteredFiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-muted-foreground">
              No files selected yet.
            </div>
          ) : (
            filteredFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemoveFile(item.id)}>
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
