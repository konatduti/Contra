import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-full animate-pulse rounded-xl border bg-white p-6 shadow-soft", className)}>
      <div className="h-4 w-1/2 rounded bg-slate-200" />
      <div className="mt-6 h-8 w-3/4 rounded bg-slate-200" />
      <div className="mt-4 h-3 w-full rounded bg-slate-100" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-white p-6 shadow-soft">
      <div className="mb-4 h-4 w-1/3 rounded bg-slate-200" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
