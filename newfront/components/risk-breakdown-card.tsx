import { ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RiskBreakdownCardProps {
  high: number;
  medium: number;
  low: number;
}

export function RiskBreakdownCard({ high, medium, low }: RiskBreakdownCardProps) {
  const total = high + medium + low;
  const safeTotal = total === 0 ? 1 : total;
  const highPercent = (high / safeTotal) * 100;
  const mediumPercent = (medium / safeTotal) * 100;
  const lowPercent = (low / safeTotal) * 100;

  return (
    <Card className="h-full transition group-hover:border-amber-100 group-hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Risk Breakdown</CardTitle>
        <div className="rounded-full bg-rose-50 p-2 text-rose-500">
          <ShieldAlert className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full">
            <div className="h-full bg-rose-500" style={{ width: `${highPercent}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${mediumPercent}%` }} />
            <div className="h-full bg-emerald-400" style={{ width: `${lowPercent}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">High Risk</p>
            <p className="font-semibold text-slate-900">{high}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Medium Risk</p>
            <p className="font-semibold text-slate-900">{medium}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Low Risk</p>
            <p className="font-semibold text-slate-900">{low}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
