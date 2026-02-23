import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { kpiRegistry } from "@/lib/kpi-registry";

const chartColors = ["#10b981", "#f59e0b", "#ef4444"];

export function CreditHistoryCard() {
  const entry = kpiRegistry.creditHistory;
  const chartData =
    entry.chart.type === "stackedBar"
      ? entry.chart.data.map((point) => ({
          label: point.label,
          high: point.high ?? 0,
          medium: point.medium ?? 0,
          low: point.low ?? 0
        }))
      : [];

  return (
    <Card className="h-full transition group-hover:border-amber-100 group-hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Credit History</p>
            <h3 className="text-lg font-semibold text-slate-900">Quarterly usage</h3>
          </div>
          <div className="rounded-full border bg-white p-2 text-slate-500">
            <LineChart className="h-4 w-4" />
          </div>
        </div>
        <div className="h-[104px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barSize={14}
              barCategoryGap="20%"
              barGap={2}
              margin={{ top: 8, right: 12, left: 4, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} />
              <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
              <Bar dataKey="high" stackId="a" fill={chartColors[2]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="medium" stackId="a" fill={chartColors[1]} />
              <Bar dataKey="low" stackId="a" fill={chartColors[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">Allocation vs usage by risk tier.</p>
      </CardContent>
    </Card>
  );
}
