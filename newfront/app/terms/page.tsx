"use client";

import { useEffect, useState } from "react";

import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTermsByLanguage, loadPublishedLegalDocs, type LegalDocsState } from "@/lib/legal-docs";
import { loadUserSettings } from "@/lib/user-settings";

export default function TermsPage() {
  const [language, setLanguage] = useState<"en" | "hu">("en");
  const [docs, setDocs] = useState<LegalDocsState>(loadPublishedLegalDocs);

  useEffect(() => {
    setLanguage(loadUserSettings().language);
    setDocs(loadPublishedLegalDocs());
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <TopBar title={language === "hu" ? "Általános Szerződési Feltételek" : "Terms & Conditions"} />
      <Card>
        <CardHeader>
          <CardTitle>{language === "hu" ? "Jelenlegi verzió" : "Current version"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{getTermsByLanguage(docs, language)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
