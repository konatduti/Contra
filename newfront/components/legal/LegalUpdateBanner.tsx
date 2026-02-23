"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LEGAL_BANNER_SETTINGS_KEY,
  LEGAL_BANNER_UPDATED_EVENT,
  loadLegalBannerSettings
} from "@/lib/legal-docs";
import { loadUserSettings } from "@/lib/user-settings";

type Language = "en" | "hu";

const TEXT = {
  en: {
    bothPrefix: "Our Terms & Conditions and Privacy Policy were recently updated. Click",
    singleTermsPrefix: "Our Terms & Conditions were recently updated. Click",
    singlePrivacyPrefix: "Our Privacy Policy was recently updated. Click",
    here: "here",
    and: "and",
    suffix: "to review the changes.",
    dismiss: "Dismiss legal updates banner"
  },
  hu: {
    bothPrefix:
      "Az Általános Szerződési Feltételeink és az Adatvédelmi Tájékoztatónk nemrég frissült. Kattintson",
    singleTermsPrefix: "Az Általános Szerződési Feltételeink nemrég frissültek. Kattintson",
    singlePrivacyPrefix: "Az Adatvédelmi Tájékoztatónk nemrég frissült. Kattintson",
    here: "ide",
    and: "és",
    suffix: "a változások megtekintéséhez.",
    dismiss: "Jogi frissítési értesítés bezárása"
  }
};

export function LegalUpdateBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [bannerSettings, setBannerSettings] = useState(loadLegalBannerSettings);

  useEffect(() => {
    const refreshLanguage = () => setLanguage(loadUserSettings().language);
    const refreshBanner = () => {
      setBannerSettings(loadLegalBannerSettings());
      setDismissed(false);
    };

    refreshLanguage();
    refreshBanner();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LEGAL_BANNER_SETTINGS_KEY) {
        refreshBanner();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LEGAL_BANNER_UPDATED_EVENT, refreshBanner);
    window.addEventListener("focus", refreshLanguage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LEGAL_BANNER_UPDATED_EVENT, refreshBanner);
      window.removeEventListener("focus", refreshLanguage);
    };
  }, []);

  const showTerms = bannerSettings.termsUpdated;
  const showPrivacy = bannerSettings.privacyUpdated;
  const t = useMemo(() => TEXT[language], [language]);

  if (dismissed || (!showTerms && !showPrivacy)) return null;

  return (
    <div className="relative mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 pr-12 text-sm text-amber-900">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 text-amber-900 hover:bg-amber-100"
        onClick={() => setDismissed(true)}
        aria-label={t.dismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      {showTerms && showPrivacy ? (
        <p>
          {t.bothPrefix} <Link href="/terms" className="font-semibold underline">{t.here}</Link> {t.and}{" "}
          <Link href="/privacy" className="font-semibold underline">{t.here}</Link> {t.suffix}
        </p>
      ) : showTerms ? (
        <p>
          {t.singleTermsPrefix} <Link href="/terms" className="font-semibold underline">{t.here}</Link> {t.suffix}
        </p>
      ) : (
        <p>
          {t.singlePrivacyPrefix} <Link href="/privacy" className="font-semibold underline">{t.here}</Link> {t.suffix}
        </p>
      )}
    </div>
  );
}
