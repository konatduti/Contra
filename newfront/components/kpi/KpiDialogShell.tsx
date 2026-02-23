"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface KpiDialogShellProps {
  title: string;
  meta?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function KpiDialogShell({ title, meta, open, onOpenChange, children }: KpiDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col p-0">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
            {meta ? (
              <DialogDescription className="truncate text-xs text-muted-foreground">{meta}</DialogDescription>
            ) : null}
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label={`Close ${title}`}>
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
