"use client";

import { useTranslation } from "react-i18next";

export function HomeHero() {
  const { t } = useTranslation();

  return (
    <section style={{ display: "grid", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "2.5rem", margin: 0 }}>{t("home.title")}</h1>
      <p style={{ fontSize: "1.125rem", lineHeight: 1.6 }}>{t("home.description")}</p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <span
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            background: "#0ea5e9",
            color: "white",
            fontWeight: 600
          }}
        >
          {t("home.cta")}
        </span>
        <span
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            background: "rgba(14, 165, 233, 0.15)",
            color: "#0369a1",
            fontWeight: 600
          }}
        >
          {t("home.secondary")}
        </span>
      </div>
    </section>
  );
}
