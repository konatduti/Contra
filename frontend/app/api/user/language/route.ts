import { NextRequest, NextResponse } from "next/server";
import { applyLocaleCookie } from "@/lib/locale/server";
import { updateUserLanguage } from "@/lib/db";
import { SupportedLanguage, isSupportedLanguage } from "@/i18n/settings";

export async function POST(request: NextRequest) {
  let language: unknown;
  try {
    const body = await request.json();
    language = body?.language;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!isSupportedLanguage(typeof language === "string" ? language : null)) {
    return NextResponse.json({ error: "Language must be 'en' or 'hu'" }, { status: 400 });
  }

  const locale = language as SupportedLanguage;
  const response = NextResponse.json({ success: true, language: locale });
  applyLocaleCookie(response, locale);

  const userId = request.cookies.get("user_id")?.value;
  if (userId) {
    await updateUserLanguage(userId, locale);
  }

  return response;
}
