"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutGrid, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/documents", label: "Docs", icon: FileText }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-white/95 py-2 shadow-soft lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-medium",
              isActive ? "text-slate-900" : "text-slate-500"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "text-slate-900")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
