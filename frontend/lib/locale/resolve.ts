import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguage, isSupportedLanguage } from "@/i18n/settings";

export interface LanguagePreferenceSources {
  dbLanguage?: string | null;
  cookieLanguage?: string | null;
  headerLanguages?: readonly string[] | null;
}

export function normalizeLanguage(value: string | null | undefined): SupportedLanguage | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (isSupportedLanguage(trimmed)) {
    return trimmed;
  }
  const base = trimmed.split("-")[0];
  return isSupportedLanguage(base) ? base : null;
}

export function resolveLanguagePreference({
  dbLanguage,
  cookieLanguage,
  headerLanguages
}: LanguagePreferenceSources): SupportedLanguage {
  const normalizedDb = normalizeLanguage(dbLanguage ?? undefined);
  if (normalizedDb) {
    return normalizedDb;
  }

  const normalizedCookie = normalizeLanguage(cookieLanguage ?? undefined);
  if (normalizedCookie) {
    return normalizedCookie;
  }

  if (headerLanguages && headerLanguages.length > 0) {
    for (const raw of headerLanguages) {
      const normalized = normalizeLanguage(raw);
      if (normalized) {
        return normalized;
      }
    }
  }

  return FALLBACK_LANGUAGE;
}

export function parseAcceptLanguage(headerValue: string | null | undefined): string[] {
  if (!headerValue) {
    return [];
  }

  return headerValue
    .split(",")
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean)
    .filter((value) => value !== "*");
}

export const SUPPORTED_LANGUAGE_SET = new Set(SUPPORTED_LANGUAGES);
