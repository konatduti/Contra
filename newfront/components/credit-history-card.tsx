"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function CreditHistoryCard({ used, remaining }: { used: number; remaining: number }) {
  const chartData = [{ label: "Current", used, remaining: Math.max(remaining, 0) }];

  return (
    <Card className="h-full transition group-hover:border-amber-100 group-hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Credit History</p>
            <h3 className="text-lg font-semibold text-slate-900">Current usage</h3>
          </div>
          <div className="rounded-full border bg-white p-2 text-slate-500"><LineChart className="h-4 w-4" /></div>
        </div>
        <div className="h-[104px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={14} margin={{ top: 8, right: 12, left: 4, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
              <Bar dataKey="used" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="remaining" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">Used vs remaining credits from backend.</p>
      </CardContent>
    </Card>
  );
}
