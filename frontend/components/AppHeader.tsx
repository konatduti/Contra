"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <header style={{ padding: "1rem 2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          maxWidth: "960px",
          margin: "0 auto"
        }}
      >
        <nav style={{ display: "flex", gap: "1rem", fontWeight: 600 }}>
          <Link href="/">{t("navigation.home")}</Link>
          <Link href="/terms">{t("navigation.terms")}</Link>
          <Link href="/privacy">{t("navigation.privacy")}</Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
