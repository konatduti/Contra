import { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  compact?: boolean;
  className?: string;
  contentClassName?: string;
  icon?: ReactNode;
};

export function SettingsSection({
  title,
  description,
  children,
  compact = false,
  className,
  contentClassName,
  icon
}: SettingsSectionProps) {
  const headerSpacing = "p-4 sm:p-6";
  const contentSpacing = "p-4 pt-0 sm:p-6 sm:pt-0";
  return (
    <Card className={cn("border-slate-200/80 bg-white", className)}>
      <CardHeader className={cn(headerSpacing)}>
        <div className="flex items-center gap-2">
          {icon ? <span className="text-slate-500">{icon}</span> : null}
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn(contentSpacing, contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
