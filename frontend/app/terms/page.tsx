import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { extractLegalMarkdown } from "@/lib/legalContent";
import { loadTranslationFile } from "@/i18n/server";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n/settings";
import { TermsPageClient } from "./TermsPageClient";

export default async function TermsPage() {
  const contentByLanguageEntries = await Promise.all(
    SUPPORTED_LANGUAGES.map(async (language) => {
      const dictionary = await loadTranslationFile(language);
      const markdown = extractLegalMarkdown(dictionary, "terms");
      const serialized = await serialize(markdown, {
        mdxOptions: { remarkPlugins: [remarkGfm] }
      });
      return [language, serialized] as const;
    })
  );

  const contentByLanguage = Object.fromEntries(
    contentByLanguageEntries
  ) as Record<SupportedLanguage, MDXRemoteSerializeResult>;

  return <TermsPageClient contentByLanguage={contentByLanguage} />;
}
