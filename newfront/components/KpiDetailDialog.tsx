"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AlertTriangle, ChevronDown, Clock, CreditCard, FileCheck, ShieldAlert } from "lucide-react";

import { useDocuments } from "@/components/document-provider";
import { KpiDialogShell } from "@/components/kpi/KpiDialogShell";
import { KpiSection } from "@/components/kpi/KpiSection";
import { KpiTable } from "@/components/kpi/KpiTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { credits, DocumentItem, DocumentRisk, timeSaved } from "@/lib/mock-data";
import { KpiChart, KpiKey, kpiRegistry } from "@/lib/kpi-registry";
import { cn } from "@/lib/utils";

interface KpiDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiKey: KpiKey;
}

const chartColors = ["#0f172a", "#f59e0b", "#ef4444", "#10b981"];

const formatHoursMinutes = (value: number, unit: "minutes" | "seconds" = "minutes") => {
  const totalMinutes = unit === "seconds" ? Math.floor(value / 60) : Math.floor(value);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const riskVariantMap: Record<DocumentRisk, "danger" | "warning" | "success"> = {
  High: "danger",
  Medium: "warning",
  Low: "success"
};

const renderSimpleChart = (data: KpiChart, height = 160) => {
  if (data.type === "line") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={chartColors[0]} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (data.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill={chartColors[0]} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip />
        <Pie data={data.data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80}>
          {data.data.map((entry, index) => (
            <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

const renderIssueBadges = (issues: DocumentItem["flaggedIssues"]) => {
  const counts = issues.reduce(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    { High: 0, Medium: 0, Low: 0 }
  );

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(counts) as DocumentRisk[]).map((risk) =>
        counts[risk] ? (
          <Badge key={risk} variant={riskVariantMap[risk]}>
            {risk}: {counts[risk]}
          </Badge>
        ) : null
      )}
    </div>
  );
};

export function KpiDetailDialog({ open, onOpenChange, kpiKey }: KpiDetailDialogProps) {
  const entry = kpiRegistry[kpiKey];
  const { documents } = useDocuments();
  const [analysisStatus, setAnalysisStatus] = useState("All");
  const [analysisRisk, setAnalysisRisk] = useState("All");
  const [analysisQuery, setAnalysisQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const documentsByRisk = useMemo(
    () =>
      documents.reduce(
        (acc, doc) => {
          acc[doc.risk].push(doc);
          return acc;
        },
        { High: [], Medium: [], Low: [] } as Record<DocumentRisk, DocumentItem[]>
      ),
    [documents]
  );

  const documentsRequiringAction = useMemo(
    () => documents.filter((doc) => doc.requiresAction),
    [documents]
  );

  const documentsWithFlaggedIssues = useMemo(
    () => documents.filter((doc) => doc.flaggedIssues.length > 0),
    [documents]
  );

  const analysisDocuments = useMemo(
    () => documents.filter((doc) => ["Completed", "Processing", "Failed"].includes(doc.status)),
    [documents]
  );

  const filteredRiskDocuments = useMemo(() => {
    if (riskFilter === "All") return documents;
    return documents.filter((doc) => doc.risk === riskFilter);
  }, [documents, riskFilter]);

  const filteredAnalysisDocuments = useMemo(() => {
    return analysisDocuments.filter((doc) => {
      if (analysisStatus !== "All" && doc.status !== analysisStatus) return false;
      if (analysisRisk !== "All" && doc.risk !== analysisRisk) return false;
      if (analysisQuery && !doc.name.toLowerCase().includes(analysisQuery.toLowerCase())) return false;
      return true;
    });
  }, [analysisDocuments, analysisQuery, analysisRisk, analysisStatus]);

  const totalDocuments = documents.length || 1;
  const riskSegments = (["High", "Medium", "Low"] as DocumentRisk[]).map((risk) => ({
    risk,
    count: documentsByRisk[risk].length,
    percent: Math.round((documentsByRisk[risk].length / totalDocuments) * 100)
  }));

  const creditHistoryData = useMemo(() => {
    if (entry.chart.type !== "stackedBar") return [];
    return entry.chart.data.map((point) => ({
      label: point.label,
      high: point.high ?? 0,
      medium: point.medium ?? 0,
      low: point.low ?? 0
    }));
  }, [entry.chart]);

  const usageBreakdown = [
    { label: "Bulk analysis", value: 28 },
    { label: "Team reviews", value: 22 },
    { label: "Re-runs", value: 14 }
  ];

  const renderContent = () => {
    switch (kpiKey) {
      case "riskBreakdown": {
        return (
          <div className="flex h-full flex-col gap-3">
            <KpiSection icon={<ShieldAlert className="h-4 w-4" />} title="Portfolio risk mix">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full">
                  {riskSegments.map((segment) => (
                    <div
                      key={segment.risk}
                      className={cn(
                        "h-full",
                        segment.risk === "High" && "bg-rose-500",
                        segment.risk === "Medium" && "bg-amber-400",
                        segment.risk === "Low" && "bg-emerald-400"
                      )}
                      style={{ width: `${segment.percent}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {riskSegments.map((segment) => (
                  <div key={segment.risk} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={riskVariantMap[segment.risk]}>{segment.risk}</Badge>
                      <span className="text-muted-foreground">{segment.percent}%</span>
                    </div>
                    <span className="font-medium text-slate-900">{segment.count}</span>
                  </div>
                ))}
              </div>
            </KpiSection>

            <KpiSection
              icon={<FileCheck className="h-4 w-4" />}
              title="Documents"
              className="flex-1 min-h-0"
              rightSlot={
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder="Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    {["All", "High", "Medium", "Low"].map((risk) => (
                      <SelectItem key={risk} value={risk}>
                        {risk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            >
              <KpiTable>
                <TableHeader className="sticky top-0 z-10 bg-slate-50/95">
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRiskDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="py-2 font-medium text-slate-900">{doc.name}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{doc.uploadedAt}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={riskVariantMap[doc.risk]}>{doc.risk}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {doc.confidence ? `${doc.confidence}%` : "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{doc.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </KpiTable>
            </KpiSection>
          </div>
        );
      }
      case "analyses": {
        return (
          <div className="flex h-full flex-col gap-3">
            <KpiSection
              icon={<FileCheck className="h-4 w-4" />}
              title="Documents"
              className="flex-1 min-h-0"
              rightSlot={
                <span className="text-xs text-muted-foreground">
                  {filteredAnalysisDocuments.length} documents
                </span>
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={analysisQuery}
                  onChange={(event) => setAnalysisQuery(event.target.value)}
                  placeholder="Search documents"
                  className="h-8 min-w-[200px] flex-1"
                />
                <Select value={analysisStatus} onValueChange={setAnalysisStatus}>
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["All", "Completed", "Processing", "Failed"].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={analysisRisk} onValueChange={setAnalysisRisk}>
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue placeholder="Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    {["All", "High", "Medium", "Low"].map((risk) => (
                      <SelectItem key={risk} value={risk}>
                        {risk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <KpiTable>
                <TableHeader className="sticky top-0 z-10 bg-slate-50/95">
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalysisDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="py-2 font-medium text-slate-900">{doc.name}</TableCell>
                      <TableCell className="py-2">{doc.status}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{doc.uploadedAt}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={riskVariantMap[doc.risk]}>{doc.risk}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {doc.confidence ? `${doc.confidence}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </KpiTable>
            </KpiSection>
          </div>
        );
      }
      case "flaggedIssues": {
        return (
          <div className="flex h-full flex-col gap-3">
            <KpiSection
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              title="Flagged issues"
              className="flex-1 min-h-0"
              rightSlot={<Badge variant="warning">{documentsWithFlaggedIssues.length} docs</Badge>}
            >
              <KpiTable>
                <TableHeader className="sticky top-0 z-10 bg-slate-50/95">
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsWithFlaggedIssues.map((doc) => {
                    const expanded = expandedIssueId === doc.id;
                    return (
                      <Fragment key={doc.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpandedIssueId(expanded ? null : doc.id)}
                        >
                          <TableCell className="py-2 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <ChevronDown
                                className={cn("h-4 w-4 text-slate-400 transition", expanded && "rotate-180")}
                              />
                              {doc.name}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">{doc.flaggedIssues.length}</TableCell>
                          <TableCell className="py-2">{renderIssueBadges(doc.flaggedIssues)}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant={riskVariantMap[doc.risk]}>{doc.risk}</Badge>
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">{doc.uploadedAt}</TableCell>
                        </TableRow>
                        {expanded ? (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-slate-50 py-2">
                              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                {doc.flaggedIssues.map((issue) => (
                                  <Badge key={issue.title} variant={riskVariantMap[issue.severity]}>
                                    {issue.title}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </KpiTable>
            </KpiSection>
          </div>
        );
      }
      case "requiresAction": {
        return (
          <div className="flex h-full flex-col gap-3">
            <KpiSection
              icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}
              title="Action required"
              className="flex-1 min-h-0"
              rightSlot={<Badge variant="danger">{documentsRequiringAction.length} docs</Badge>}
            >
              <KpiTable>
                <TableHeader className="sticky top-0 z-10 bg-slate-50/95">
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsRequiringAction.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="py-2 font-medium text-slate-900">{doc.name}</TableCell>
                      <TableCell className="py-2">{doc.status}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={riskVariantMap[doc.risk]}>{doc.risk}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{doc.uploadedAt}</TableCell>
                      <TableCell className="py-2 text-right">
                        <Button size="sm" variant="outline">
                          View Analysis
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </KpiTable>
            </KpiSection>
          </div>
        );
      }
      case "credits": {
        return (
          <div className="grid gap-3 lg:grid-cols-[1.1fr,1fr]">
            <KpiSection
              icon={<CreditCard className="h-4 w-4" />}
              title="Credits remaining"
              rightSlot={
                <Badge variant="success">
                  {credits.totalCredits - credits.usedCredits} / {credits.totalCredits}
                </Badge>
              }
            >
              <p className="text-xs text-muted-foreground">Resets in {credits.resetsInDays} days</p>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Used credits</span>
                  <span className="font-medium text-slate-900">{credits.usedCredits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Available credits</span>
                  <span className="font-medium text-slate-900">
                    {credits.totalCredits - credits.usedCredits}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Usage breakdown</p>
                <div className="mt-2 grid gap-2">
                  {usageBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">{item.value} credits</span>
                    </div>
                  ))}
                </div>
              </div>
            </KpiSection>
            <KpiSection icon={<CreditCard className="h-4 w-4" />} title="Credit usage trend">
              <div className="h-[200px]">{renderSimpleChart(entry.chart, 200)}</div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="success">Remaining</Badge>
                <Badge variant="muted">Consumed</Badge>
              </div>
            </KpiSection>
          </div>
        );
      }
      case "timeSaved": {
        return (
          <div className="flex h-full flex-col gap-3">
            <KpiSection icon={<Clock className="h-4 w-4" />} title="Time saved this month">
              <p className="text-xs text-muted-foreground">vs manual review</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-slate-900">
                  {formatHoursMinutes(timeSaved.minutesSaved)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {formatHoursMinutes(timeSaved.manualBaselineMinutes)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Automated analysis saves 45 minutes per review.</p>
            </KpiSection>
            <KpiSection icon={<Clock className="h-4 w-4" />} title="Trend vs manual baseline">
              <div className="h-[220px]">{renderSimpleChart(entry.chart, 220)}</div>
            </KpiSection>
          </div>
        );
      }
      case "creditHistory": {
        return (
          <div className="flex h-full flex-col gap-3">
            <KpiSection
              icon={<CreditCard className="h-4 w-4" />}
              title="Credit history"
              rightSlot={<Badge variant="muted">Quarter to date</Badge>}
            >
              <p className="text-xs text-muted-foreground">Allocation vs usage by risk tier.</p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={creditHistoryData}
                    barSize={16}
                    barCategoryGap="20%"
                    barGap={3}
                    margin={{ top: 10, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                    />
                    <Tooltip />
                    <Bar dataKey="high" stackId="a" fill={chartColors[2]} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="medium" stackId="a" fill={chartColors[1]} />
                    <Bar dataKey="low" stackId="a" fill={chartColors[3]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="danger">High tier</Badge>
                <Badge variant="warning">Medium tier</Badge>
                <Badge variant="success">Low tier</Badge>
              </div>
            </KpiSection>
          </div>
        );
      }
      default: {
        return null;
      }
    }
  };

  return (
    <KpiDialogShell open={open} onOpenChange={onOpenChange} title={entry.title} meta={entry.description}>
      {renderContent()}
    </KpiDialogShell>
  );
}
