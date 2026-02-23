"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem("theme");
    if (stored) {
      const dark = stored === "dark";
      setIsDark(dark);
      document.body.dataset.theme = dark ? "dark" : "light";
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== "undefined") {
      document.body.dataset.theme = next ? "dark" : "light";
      window.localStorage.setItem("theme", next ? "dark" : "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 0.75rem",
        borderRadius: "999px",
        border: "1px solid rgba(148, 163, 184, 0.6)",
        backgroundColor: "rgba(255,255,255,0.9)",
        cursor: "pointer",
        fontWeight: 600
      }}
    >
      <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
      <span>{isDark ? t("theme.dark") : t("theme.light")}</span>
    </button>
  );
}
