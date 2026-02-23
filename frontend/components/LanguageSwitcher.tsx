"use client";

import { useTransition, type ChangeEvent } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n/settings";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const optionLabels = t("language.options", {
    returnObjects: true
  }) as Record<SupportedLanguage, string>;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as SupportedLanguage;
    startTransition(async () => {
      await setLocale(nextLocale);
      router.refresh();
    });
  };

  return (
    <label style={{ display: "inline-flex", flexDirection: "column", fontSize: "0.75rem", gap: "0.25rem" }}>
      <span style={{ fontWeight: 500 }}>{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        style={{
          appearance: "none",
          padding: "0.4rem 2rem 0.4rem 0.75rem",
          borderRadius: "999px",
          border: "1px solid rgba(148, 163, 184, 0.6)",
          backgroundColor: "rgba(255,255,255,0.9)",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {optionLabels?.[code] ?? code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
