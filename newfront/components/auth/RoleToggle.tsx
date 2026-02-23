"use client";

import { Switch } from "@/components/ui/switch";
import { useRole } from "@/components/auth/RoleProvider";

export function RoleToggle() {
  const { role, setRole } = useRole();
  const isAdmin = role === "admin";

  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <span className="font-medium">Admin mode</span>
      <Switch
        checked={isAdmin}
        onCheckedChange={(checked) => setRole(checked ? "admin" : "user")}
        aria-label="Toggle admin mode"
      />
    </div>
  );
}
