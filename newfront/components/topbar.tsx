"use client";

import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

type TopBarProps = {
  title: string;
  showWelcome?: boolean;
};

export function TopBar({ title, showWelcome = false }: TopBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-2">
        {showWelcome ? (
          <p className="text-sm text-muted-foreground">Welcome back, Amara</p>
        ) : null}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm md:flex">
          <Search className="h-4 w-4" />
          Search documents...
        </div>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
