"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { Clock, CreditCard, FileCheck } from "lucide-react";
import { CreditHistoryCard } from "@/components/credit-history-card";
import { FlaggedIssuesCard } from "@/components/flagged-issues-card";
import { KpiDetailDialog } from "@/components/KpiDetailDialog";
import { CardSkeleton, TableSkeleton } from "@/components/loading-skeletons";
import { RecentUploadsTable } from "@/components/recent-uploads-table";
import { RequiresActionCard } from "@/components/requires-action-card";
import { RiskBreakdownCard } from "@/components/risk-breakdown-card";
import { StatCard } from "@/components/stat-card";
import { TopBar } from "@/components/topbar";
import { useDocuments } from "@/components/document-provider";
import { KpiKey } from "@/lib/kpi-registry";
import { credits, timeSaved } from "@/lib/mock-data";

const formatHoursMinutes = (value: number, unit: "minutes" | "seconds" = "minutes") => {
  const totalMinutes = unit === "seconds" ? Math.floor(value / 60) : Math.floor(value);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export default function DashboardPage() {
  const { documents } = useDocuments();
  const [loading, setLoading] = useState(true);
  const [activeKpiKey, setActiveKpiKey] = useState<KpiKey | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const welcomeKey = "contra:dashboard:welcome_seen";
    const hasSeenWelcome = window.localStorage.getItem(welcomeKey);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      window.localStorage.setItem(welcomeKey, "true");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const riskCounts = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        acc[doc.risk] += 1;
        return acc;
      },
      { High: 0, Medium: 0, Low: 0 }
    );
  }, [documents]);

  const clickableKpis = useMemo(
    () =>
      new Set<KpiKey>([
        "riskBreakdown",
        "credits",
        "timeSaved",
        "analyses",
        "flaggedIssues",
        "requiresAction",
        "creditHistory"
      ]),
    []
  );

  const handleOpenKpi = useCallback((key: KpiKey) => {
    setActiveKpiKey(key);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, key: KpiKey) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveKpiKey(key);
      }
    },
    []
  );

  const getCardProps = useCallback(
    (key: KpiKey) => {
      if (!clickableKpis.has(key)) {
        return {
          className: "group h-full min-w-0 rounded-2xl"
        };
      }

      return {
        role: "button" as const,
        tabIndex: 0,
        className:
          "group h-full min-w-0 cursor-pointer rounded-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
        onClick: () => handleOpenKpi(key),
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => handleKeyDown(event, key)
      };
    },
    [clickableKpis, handleKeyDown, handleOpenKpi]
  );

  const riskCardProps = getCardProps("riskBreakdown");

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <TopBar title="Contra Dashboard" showWelcome={showWelcome} />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <TopBar title="Contra Dashboard" showWelcome={showWelcome} />
      <div className="flex flex-1 min-h-0 flex-col gap-4">
        <section className="grid auto-rows-[220px] items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-5">
          <div {...riskCardProps}>
            <RiskBreakdownCard high={riskCounts.High} medium={riskCounts.Medium} low={riskCounts.Low} />
          </div>
          <div {...getCardProps("timeSaved")}>
            <StatCard
              title="Time Saved"
              value={formatHoursMinutes(timeSaved.minutesSaved)}
              description={`Versus manual review (${formatHoursMinutes(timeSaved.manualBaselineMinutes)})`}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
          <div {...getCardProps("credits")}>
            <StatCard
              title="Credits"
              value={`${credits.totalCredits - credits.usedCredits} remaining`}
              description={`Resets in ${credits.resetsInDays} days`}
              icon={<CreditCard className="h-4 w-4" />}
            />
          </div>
          <div {...getCardProps("analyses")}>
            <StatCard
              title="Analyses"
              value={`${documents.length} docs`}
              description="Processed across teams this month"
              icon={<FileCheck className="h-4 w-4" />}
            />
          </div>
          <div {...getCardProps("creditHistory")}>
            <CreditHistoryCard />
          </div>
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <div {...getCardProps("flaggedIssues")}>
            <FlaggedIssuesCard documents={documents} />
          </div>
          <div {...getCardProps("requiresAction")}>
            <RequiresActionCard documents={documents} />
          </div>
        </section>
        <div className="group min-w-0 rounded-2xl">
          <RecentUploadsTable documents={documents} mode="summary" />
        </div>
      </div>
      {activeKpiKey ? (
        <KpiDetailDialog
          open={Boolean(activeKpiKey)}
          onOpenChange={(open) => {
            if (!open) setActiveKpiKey(null);
          }}
          kpiKey={activeKpiKey}
        />
      ) : null}
    </div>
  );
}
