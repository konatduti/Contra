import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n/settings";
import { parseAcceptLanguage, resolveLanguagePreference } from "@/lib/locale/resolve";
import { getUserLanguage } from "@/lib/db";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function detectRequestLocale(): Promise<SupportedLanguage> {
  const cookieStore = cookies();
  const cookieLanguage = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const headerLanguages = parseAcceptLanguage(headers().get("accept-language"));

  const userId = cookieStore.get("user_id")?.value;
  const dbLanguage = userId ? await getUserLanguage(userId) : null;

  return resolveLanguagePreference({
    dbLanguage,
    cookieLanguage,
    headerLanguages
  });
}

export function applyLocaleCookie(response: NextResponse, locale: SupportedLanguage): void {
  response.cookies.set(COOKIE_NAME, locale, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });
}

export function getStaticLocale(): SupportedLanguage {
  const cookieStore = cookies();
  const cookieLanguage = cookieStore.get(COOKIE_NAME)?.value;
  if (cookieLanguage && SUPPORTED_LANGUAGES.includes(cookieLanguage as SupportedLanguage)) {
    return cookieLanguage as SupportedLanguage;
  }
  return FALLBACK_LANGUAGE;
}
