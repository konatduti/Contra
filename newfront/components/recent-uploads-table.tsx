"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import { DocumentItem } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FiltersBar, FilterState } from "@/components/recent-uploads-filters";
import { RecentUploadsList } from "@/components/recent-uploads-list";

const chipOptions = ["All", "Completed", "Failed", "High Risk"] as const;

export function RecentUploadsTable({
  documents,
  mode = "full",
  onOpenDetail
}: {
  documents: DocumentItem[];
  mode?: "summary" | "full";
  onOpenDetail?: () => void;
}) {
  const [activeChip, setActiveChip] = useState<"All" | "Completed" | "Failed" | "High Risk">("All");
  const [filters, setFilters] = useState<FilterState>({
    risk: "All",
    status: "All",
    range: "30"
  });

  const chipCounts = useMemo(
    () => ({
      All: documents.length,
      Completed: documents.filter((doc) => doc.status === "Completed").length,
      Failed: documents.filter((doc) => doc.status === "Failed").length,
      "High Risk": documents.filter((doc) => doc.risk === "High").length
    }),
    [documents]
  );

  const filteredDocs = useMemo(() => {
    let items = [...documents];
    if (activeChip === "Completed") {
      items = items.filter((doc) => doc.status === "Completed");
    }
    if (activeChip === "Failed") {
      items = items.filter((doc) => doc.status === "Failed");
    }
    if (activeChip === "High Risk") {
      items = items.filter((doc) => doc.risk === "High");
    }
    if (filters.risk && filters.risk !== "All") {
      items = items.filter((doc) => doc.risk === filters.risk);
    }
    if (filters.status && filters.status !== "All") {
      items = items.filter((doc) => doc.status === filters.status);
    }
    return items;
  }, [activeChip, documents, filters]);

  const summaryDocs = filteredDocs.slice(0, 4);

  return (
    <Card className="h-full transition group-hover:border-amber-100 group-hover:shadow-md">
      {mode === "full" ? (
        <FiltersBar
          activeChip={activeChip}
          onChipChange={setActiveChip}
          filters={filters}
          onFilterChange={setFilters}
        />
      ) : (
        <div className="flex flex-col gap-4 px-6 pb-2 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Recent Uploads</p>
              <h2 className="text-lg font-semibold text-slate-900">Latest activity</h2>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={onOpenDetail}>
              View detail
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {chipOptions.map((chip) => (
              <Button
                key={chip}
                variant={activeChip === chip ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveChip(chip);
                  onOpenDetail?.();
                }}
              >
                {chip} · {chipCounts[chip]}
              </Button>
            ))}
          </div>
        </div>
      )}
      <CardContent className={mode === "summary" ? "pt-0" : undefined}>
        {filteredDocs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No documents match these filters.
          </div>
        ) : (
          <RecentUploadsList documents={mode === "summary" ? summaryDocs : filteredDocs} interactive={mode === "full"} />
        )}
      </CardContent>
    </Card>
  );
}
