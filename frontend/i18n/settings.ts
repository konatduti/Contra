export const SUPPORTED_LANGUAGES = ["en", "hu"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = "en";
export const DEFAULT_NAMESPACE = "app";

export const COOKIE_NAME = "lang";

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}
