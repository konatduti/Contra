"use client";

import { Shield } from "lucide-react";

import { useRole } from "@/components/auth/RoleProvider";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AdminToggleIcon() {
  const { role, toggleRole } = useRole();
  const isAdmin = role === "admin";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleRole}
          aria-pressed={isAdmin}
          aria-label="Toggle admin mode"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl transition",
            isAdmin
              ? "bg-[hsl(var(--primary))/0.12] text-[hsl(var(--primary))]"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          )}
        >
          <Shield className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        Admin mode: {isAdmin ? "On" : "Off"}
      </TooltipContent>
    </Tooltip>
  );
}
