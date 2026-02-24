import Link from "next/link";
import { Clock, CreditCard, FileCheck } from "lucide-react";

import { CreditHistoryCard } from "@/components/credit-history-card";
import { FlaggedIssuesCard } from "@/components/flagged-issues-card";
import { RecentUploadsTable } from "@/components/recent-uploads-table";
import { RequiresActionCard } from "@/components/requires-action-card";
import { RiskBreakdownCard } from "@/components/risk-breakdown-card";
import { StatCard } from "@/components/stat-card";
import { TopBar } from "@/components/topbar";
import { getDashboard } from "@/lib/api";

export default async function DashboardPage() {
  const result = await getDashboard();

  if (!result.ok) {
    console.error("[DashboardPage] dashboard fetch failed", { status: result.status });
    if (result.status === 401) {
      return <div className="space-y-4"><TopBar title="Contra Dashboard" /><p>Not logged in. <Link className="underline" href="/login">Go to login</Link>.</p></div>;
    }
    return <div className="space-y-4"><TopBar title="Contra Dashboard" /><p>Backend not reachable (HTTP {result.status}).</p></div>;
  }

  const data = result.data;
  if (!data || data.documents.length === 0) {
    console.error("[DashboardPage] dashboard returned empty data", { status: result.status });
  }

  const high = data?.documents.filter((d) => d.risk === "High").length ?? 0;
  const medium = data?.documents.filter((d) => d.risk === "Medium").length ?? 0;
  const low = data?.documents.filter((d) => d.risk === "Low").length ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <TopBar title="Contra Dashboard" />
      <div className="flex flex-1 min-h-0 flex-col gap-4">
        <section className="grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
          <RiskBreakdownCard high={high} medium={medium} low={low} />
          <StatCard title="Documents" value={String(data?.kpis.totalDocuments ?? 0)} description="Total uploaded" icon={<FileCheck className="h-4 w-4" />} />
          <StatCard title="Credits" value={`${data?.kpis.remainingCredits ?? 0}`} description="Remaining credits" icon={<CreditCard className="h-4 w-4" />} />
          <StatCard title="Processing" value={String(data?.kpis.processingDocuments ?? 0)} description="In progress" icon={<Clock className="h-4 w-4" />} />
          <CreditHistoryCard used={data?.kpis.monthlyUsed ?? 0} remaining={data?.kpis.remainingCredits ?? 0} />
        </section>
        <section className="grid gap-4 grid-cols-1 xl:grid-cols-2">
          <FlaggedIssuesCard documents={data?.documents ?? []} />
          <RequiresActionCard documents={data?.documents ?? []} />
        </section>
        <div className="group min-w-0 rounded-2xl">
          <RecentUploadsTable documents={data?.documents ?? []} mode="summary" />
        </div>
      </div>
      {data?.documents.length === 0 ? <p className="text-sm text-muted-foreground">No documents found.</p> : null}
    </div>
  );
}
