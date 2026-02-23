import fs from "fs/promises";
import path from "path";
import type { Resource } from "i18next";
import { DEFAULT_NAMESPACE, FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguage } from "./settings";

const LOCALES_BASE_PATH = path.join(process.cwd(), "public", "locales");

export type TranslationDictionary = Record<string, unknown>;
export type TranslationResources = Record<SupportedLanguage, Resource>;

export async function loadTranslationFile(language: SupportedLanguage): Promise<TranslationDictionary> {
  const filePath = path.join(LOCALES_BASE_PATH, `${language}.json`);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as TranslationDictionary;
}

export async function loadTranslations(): Promise<TranslationResources> {
  const result: Partial<TranslationResources> = {};

  await Promise.all(
    SUPPORTED_LANGUAGES.map(async (language) => {
      const dictionary = await loadTranslationFile(language);
      const languageResources: Resource = {
        [DEFAULT_NAMESPACE]: dictionary
      };
      result[language] = languageResources;
    })
  );

  return result as TranslationResources;
}

export function getNamespaceKeys(resources: TranslationResources, language: SupportedLanguage) {
  return resources[language] ?? { [DEFAULT_NAMESPACE]: {} };
}

export function ensureFallback(language: SupportedLanguage | undefined): SupportedLanguage {
  return language && SUPPORTED_LANGUAGES.includes(language) ? language : FALLBACK_LANGUAGE;
}
