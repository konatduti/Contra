"use client";

import { Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentRisk, DocumentStatus } from "@/lib/mock-data";

const chipOptions = ["All", "Completed", "Failed", "High Risk"] as const;

export interface FilterState {
  risk?: DocumentRisk | "All";
  status?: DocumentStatus | "All";
  range?: "7" | "30" | "90" | "All";
}

interface FiltersBarProps {
  activeChip: (typeof chipOptions)[number];
  onChipChange: (chip: (typeof chipOptions)[number]) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FiltersBar({ activeChip, onChipChange, filters, onFilterChange }: FiltersBarProps) {
  return (
    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <CardTitle>Recent Uploads</CardTitle>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {chipOptions.map((chip) => (
            <Button
              key={chip}
              variant={activeChip === chip ? "default" : "outline"}
              size="sm"
              onClick={() => onChipChange(chip)}
            >
              {chip}
            </Button>
          ))}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filter uploads</DialogTitle>
              <DialogDescription>Refine the list by risk, status, or date range.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Risk</p>
                <Select
                  value={filters.risk}
                  onValueChange={(value) => onFilterChange({ ...filters, risk: value as FilterState["risk"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <Select
                  value={filters.status}
                  onValueChange={(value) => onFilterChange({ ...filters, status: value as FilterState["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Date range</p>
                <Select
                  value={filters.range}
                  onValueChange={(value) => onFilterChange({ ...filters, range: value as FilterState["range"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="30" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="All">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => onFilterChange({ risk: "All", status: "All", range: "30" })}>
                Reset
              </Button>
              <Button>Apply filters</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
  );
}
