"use client";

import { useMemo, useState } from "react";
import { Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ActivityEntry } from "@/lib/mock-admin";
import { cn } from "@/lib/utils";

const visitTypes = ["All", "Recent visit", "Login", "Credit change", "Credit use"];

type RecentActivityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: ActivityEntry[];
  title?: string;
  description?: string;
};

export function RecentActivityDialog({
  open,
  onOpenChange,
  entries,
  title = "Recent activity",
  description = "Track recent visits, logins, and admin actions.",
  ...props
}: RecentActivityDialogProps) {
  const [selectedType, setSelectedType] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState("recent");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesType = selectedType === "All" || entry.type === selectedType;
      const matchesDate = filterDate ? entry.timestamp.includes(filterDate) : true;
      return matchesType && matchesDate;
    });
  }, [entries, filterDate, selectedType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent className="h-[min(720px,calc(100vh-80px))] w-[min(1100px,calc(100vw-80px))]">
        <DialogHeader className="flex-row items-start justify-between gap-4 text-left">
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === "recent" ? "default" : "outline"}
            className={cn(activeTab === "recent" && "bg-slate-900 text-white")}
            onClick={() => setActiveTab("recent")}
          >
            Recent visits
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            className={cn(activeTab === "all" && "bg-slate-900 text-white")}
            onClick={() => setActiveTab("all")}
          >
            All activity
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Visit type" />
            </SelectTrigger>
            <SelectContent>
              {visitTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={filterDate}
            onChange={(event) => setFilterDate(event.target.value)}
            placeholder="Filter by date (mm/dd/yyyy)"
            className="w-[220px]"
          />
        </div>

        <ScrollArea className="flex-1 rounded-lg border">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User agent</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.timestamp}</TableCell>
                    <TableCell>{entry.ip}</TableCell>
                    <TableCell>{entry.location}</TableCell>
                    <TableCell>{entry.type}</TableCell>
                    <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                      {entry.userAgent}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-rose-500">
                        {entry.paths.map((path) => (
                          <span key={path} className="truncate">
                            {path}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" aria-label="Details">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
