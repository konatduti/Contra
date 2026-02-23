import type { ReactNode } from "react";

import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface KpiTableProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function KpiTable({ children, className, containerClassName }: KpiTableProps) {
  return (
    <div className={cn("flex-1 min-h-0 overflow-auto rounded-2xl border bg-white", containerClassName)}>
      <Table className={cn("min-w-full text-sm", className)}>{children}</Table>
    </div>
  );
}
