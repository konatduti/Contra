import { TranslationDictionary } from "@/i18n/server";

type LegalSlug = "terms" | "privacy";

type NestedRecord = Record<string, unknown>;

export function extractLegalMarkdown(dictionary: TranslationDictionary, slug: LegalSlug): string {
  const legal = (dictionary as NestedRecord).legal;
  if (!legal || typeof legal !== "object") {
    return "";
  }

  const entry = (legal as NestedRecord)[slug];
  if (!entry || typeof entry !== "object") {
    return "";
  }

  const content = (entry as NestedRecord).content;
  return typeof content === "string" ? content : "";
}
