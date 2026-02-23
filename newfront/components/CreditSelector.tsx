"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreditSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CreditSelector({ value, onValueChange }: CreditSelectorProps) {
  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Use credits" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="individual-monthly">Use credits: Individual monthly</SelectItem>
          <SelectItem value="team-pool">Use credits: Team pool</SelectItem>
          <SelectItem value="enterprise">Use credits: Enterprise bundle</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        One credit is used per contract. Multi-file uploads consume credits for each document.
      </p>
    </div>
  );
}
