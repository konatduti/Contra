"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileText, LayoutGrid, Settings, Shield, Upload } from "lucide-react";

import { AdminToggleIcon } from "@/components/auth/AdminToggleIcon";
import { useRole } from "@/components/auth/RoleProvider";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings }
];

const adminNavItems = [
  { href: "/company-organizer/1", label: "Company dashboard", icon: Building2 },
  { href: "/platform-admin", label: "Platform admin", icon: Shield }
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const visibleNavItems = role === "admin" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-20 flex-col items-center gap-6 overflow-y-auto bg-slate-950 py-6 text-slate-200 lg:flex">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-lg font-semibold">
        C
      </div>
      <TooltipProvider delayDuration={200}>
        <nav className="flex flex-1 flex-col items-center gap-4">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl transition",
                      isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800"
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2 pb-2">
          <AdminToggleIcon />
        </div>
      </TooltipProvider>
    </aside>
  );
}
