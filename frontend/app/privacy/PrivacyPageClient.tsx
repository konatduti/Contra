"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { useLocale } from "@/hooks/useLocale";
import { useTranslation } from "react-i18next";
import { SupportedLanguage } from "@/i18n/settings";

interface Props {
  contentByLanguage: Record<SupportedLanguage, MDXRemoteSerializeResult>;
}

export function PrivacyPageClient({ contentByLanguage }: Props) {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const content = contentByLanguage[locale];

  return (
    <article style={{ display: "grid", gap: "1rem" }}>
      <h1>{t("legal.privacy.title")}</h1>
      {content ? <MDXRemote {...content} /> : null}
    </article>
  );
}
