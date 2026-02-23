import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SettingsNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type SettingsNavProps = {
  items: SettingsNavItem[];
  className?: string;
};

export function SettingsNav({ items, className }: SettingsNavProps) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Settings sections">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
