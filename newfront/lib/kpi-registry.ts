import {
  Activity,
  AlertTriangle,
  Clock,
  CreditCard,
  FileText,
  LineChart,
  ShieldAlert
} from "lucide-react";
import type { ComponentType } from "react";

export type KpiKey =
  | "riskBreakdown"
  | "timeSaved"
  | "credits"
  | "creditHistory"
  | "flaggedIssues"
  | "requiresAction"
  | "analyses";

export type KpiChart =
  | {
      type: "line";
      data: { label: string; value: number }[];
    }
  | {
      type: "bar";
      data: { label: string; value: number }[];
    }
  | {
      type: "stackedBar";
      data: { label: string; high: number; medium: number; low: number }[];
    }
  | {
      type: "pie";
      data: { label: string; value: number }[];
    };

export interface KpiRegistryEntry {
  title: string;
  description: string;
  subtitle?: string;
  chart: KpiChart;
  icon: ComponentType<{ className?: string }>;
}

export const kpiRegistry: Record<KpiKey, KpiRegistryEntry> = {
  riskBreakdown: {
    title: "Risk Breakdown",
    description: "Contract risk concentration across the portfolio.",
    subtitle: "Risk distribution",
    chart: {
      type: "pie",
      data: [
        { label: "High", value: 18 },
        { label: "Medium", value: 32 },
        { label: "Low", value: 44 }
      ]
    },
    icon: ShieldAlert
  },
  timeSaved: {
    title: "Time Saved",
    description: "Hours saved compared with manual review cycles.",
    subtitle: "Weekly efficiency gains",
    chart: {
      type: "bar",
      data: [
        { label: "Week 1", value: 6 },
        { label: "Week 2", value: 8 },
        { label: "Week 3", value: 10 },
        { label: "Week 4", value: 12 }
      ]
    },
    icon: Clock
  },
  credits: {
    title: "Credits",
    description: "Track remaining and consumed credits in your workspace.",
    subtitle: "Credits usage over time",
    chart: {
      type: "line",
      data: [
        { label: "Jan", value: 78 },
        { label: "Feb", value: 70 },
        { label: "Mar", value: 62 },
        { label: "Apr", value: 58 },
        { label: "May", value: 46 }
      ]
    },
    icon: CreditCard
  },
  creditHistory: {
    title: "Credit History",
    description: "Monthly credit allocations versus usage.",
    subtitle: "Allocations vs usage",
    chart: {
      type: "stackedBar",
      data: [
        { label: "Jan", high: 28, medium: 20, low: 12 },
        { label: "Feb", high: 24, medium: 18, low: 14 },
        { label: "Mar", high: 20, medium: 16, low: 12 },
        { label: "Apr", high: 22, medium: 14, low: 10 }
      ]
    },
    icon: LineChart
  },
  flaggedIssues: {
    title: "Top Flagged Issues",
    description: "Severity breakdown of the most frequent issues.",
    subtitle: "Issue severity mix",
    chart: {
      type: "bar",
      data: [
        { label: "High", value: 12 },
        { label: "Medium", value: 18 },
        { label: "Low", value: 9 }
      ]
    },
    icon: AlertTriangle
  },
  requiresAction: {
    title: "Documents Requiring Action",
    description: "Contracts needing review attention or follow-up.",
    subtitle: "Actionable documents trend",
    chart: {
      type: "line",
      data: [
        { label: "Week 1", value: 6 },
        { label: "Week 2", value: 4 },
        { label: "Week 3", value: 7 },
        { label: "Week 4", value: 5 },
        { label: "Week 5", value: 3 }
      ]
    },
    icon: Activity
  },
  analyses: {
    title: "Analyses",
    description: "Documents processed and completed by Contra AI.",
    subtitle: "Monthly processing trend",
    chart: {
      type: "line",
      data: [
        { label: "Jan", value: 42 },
        { label: "Feb", value: 48 },
        { label: "Mar", value: 52 },
        { label: "Apr", value: 58 },
        { label: "May", value: 64 }
      ]
    },
    icon: FileText
  }
};
