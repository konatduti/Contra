"use client";

import { useLocaleContext } from "@/providers/LocaleProvider";

export function useLocale() {
  return useLocaleContext();
}
