"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, RotateCcw, Save } from "lucide-react";

import { AdminGate } from "@/components/auth/AdminGate";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type LegalDocsState,
  loadDraftLegalDocs,
  loadPublishedLegalDocs,
  saveDraftLegalDocs,
  savePublishedLegalDocs
} from "@/lib/legal-docs";

export default function PlatformAdminLegalDocsPage() {
  const [savedDocs, setSavedDocs] = useState<LegalDocsState>(loadDraftLegalDocs);
  const [draftDocs, setDraftDocs] = useState<LegalDocsState>(loadDraftLegalDocs);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const publishedDocs = loadPublishedLegalDocs();
    const draft = loadDraftLegalDocs();

    if (!window.localStorage.getItem("contra:legal_docs:draft:v1")) {
      setSavedDocs(publishedDocs);
      setDraftDocs(publishedDocs);
      saveDraftLegalDocs(publishedDocs);
      return;
    }

    setSavedDocs(draft);
    setDraftDocs(draft);
  }, []);

  const triggerToast = (messageText: string) => {
    setToast(messageText);
    window.setTimeout(() => setToast(null), 2200);
  };

  const updateDoc = (key: keyof LegalDocsState, value: string) => {
    setDraftDocs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveDraftLegalDocs(draftDocs);
    setSavedDocs(draftDocs);
    triggerToast("Draft saved.");
  };

  const handleDiscard = () => {
    setDraftDocs(savedDocs);
    triggerToast("Unsaved changes discarded.");
  };

  const handleApply = () => {
    saveDraftLegalDocs(draftDocs);
    savePublishedLegalDocs(draftDocs);
    setSavedDocs(draftDocs);
    triggerToast("Changes applied to legal documents.");
  };

  return (
    <AdminGate>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <TopBar title="Edit Legal Documents" />

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-slate-300">
            <Link href="/platform-admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to admin dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Manage legal document content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="huTerms" className="text-sm font-medium">
                  Hungarian Terms & Conditions
                </label>
                <textarea
                  id="huTerms"
                  value={draftDocs.huTerms}
                  onChange={(event) => updateDoc("huTerms", event.target.value)}
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="huPrivacy" className="text-sm font-medium">
                  Hungarian Privacy Policy
                </label>
                <textarea
                  id="huPrivacy"
                  value={draftDocs.huPrivacy}
                  onChange={(event) => updateDoc("huPrivacy", event.target.value)}
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="enTerms" className="text-sm font-medium">
                  English Terms & Conditions
                </label>
                <textarea
                  id="enTerms"
                  value={draftDocs.enTerms}
                  onChange={(event) => updateDoc("enTerms", event.target.value)}
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="enPrivacy" className="text-sm font-medium">
                  English Privacy Policy
                </label>
                <textarea
                  id="enPrivacy"
                  value={draftDocs.enPrivacy}
                  onChange={(event) => updateDoc("enPrivacy", event.target.value)}
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="bg-amber-400 text-amber-950 hover:bg-amber-300" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </Button>
              <Button variant="outline" className="border-slate-300" onClick={handleDiscard}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Discard changes
              </Button>
              <Button className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={handleApply}>
                <Check className="mr-2 h-4 w-4" />
                Apply changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {toast ? (
          <div className="fixed bottom-6 right-6 rounded-md bg-black px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </AdminGate>
  );
}
