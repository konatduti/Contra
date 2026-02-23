import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
  accent?: string;
}

export function StatCard({ title, value, description, icon, accent }: StatCardProps) {
  return (
    <Card className="h-full transition group-hover:border-amber-100 group-hover:shadow-md">
      <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-semibold text-slate-900">{value}</h3>
          </div>
          <div className={cn("rounded-full border bg-white p-2 text-slate-500", accent)}>{icon}</div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
