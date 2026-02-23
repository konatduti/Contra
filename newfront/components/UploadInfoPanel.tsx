import { Clock, FileText, ShieldCheck, Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    title: "Text extraction",
    description: "We capture every clause and key term from your contract.",
    icon: FileText
  },
  {
    title: "AI analysis",
    description: "Contra identifies obligations, gaps, and negotiation points.",
    icon: Upload
  },
  {
    title: "Risk & clause assessment",
    description: "Get a risk score plus highlights for missing or unusual language.",
    icon: ShieldCheck
  }
];

export function UploadInfoPanel() {
  const stepsContent = (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.title} className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <step.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Step {index + 1} — {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
          {index < steps.length - 1 ? <Separator /> : null}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>{stepsContent}</CardContent>
        </Card>
      </div>

      <div className="lg:hidden">
        <Card>
          <CardContent className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-6 py-4 text-sm font-semibold text-slate-900">
                What happens next?
                <span className="text-xs text-muted-foreground transition group-open:-rotate-180">▾</span>
              </summary>
              <div className="px-6 pb-4">{stepsContent}</div>
            </details>
          </CardContent>
        </Card>
      </div>

      <Alert className="py-3">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Your documents are private</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>Encrypted in transit and at rest.</li>
            <li>No sharing without explicit consent.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Analysis takes ~30–90 seconds</p>
              <p className="text-xs text-muted-foreground">
                We will notify you once the report is ready.
              </p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Credits remaining</p>
            <p>46 credits available in your workspace.</p>
            <p className="text-xs text-muted-foreground">Estimated time saved: ~2 hours per review.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
