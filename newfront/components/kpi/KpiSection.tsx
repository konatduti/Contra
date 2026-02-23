import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface KpiSectionProps {
  icon: ReactNode;
  title: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function KpiSection({ icon, title, rightSlot, children, className }: KpiSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-2xl border bg-white p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <span className="text-slate-500">{icon}</span>
          <span>{title}</span>
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      {children}
    </section>
  );
}
