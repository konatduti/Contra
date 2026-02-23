"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18next, { Resource } from "i18next";
import { DEFAULT_NAMESPACE, FALLBACK_LANGUAGE, SupportedLanguage, isSupportedLanguage } from "@/i18n/settings";
import type { TranslationResources } from "@/i18n/server";

interface LocaleContextValue {
  locale: SupportedLanguage;
  setLocale: (nextLocale: SupportedLanguage) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  locale: SupportedLanguage;
  resources: TranslationResources;
  children: React.ReactNode;
}

const API_ENDPOINT = "/api/user/language";

export function LocaleProvider({ locale, resources, children }: LocaleProviderProps) {
  const [currentLocale, setCurrentLocale] = useState<SupportedLanguage>(locale);
  const i18nRef = useRef<i18next.i18n | null>(null);

  if (!i18nRef.current) {
    const instance = i18next.createInstance();
    instance.use(initReactI18next);
    instance.init({
      resources: resources as Record<string, Resource>,
      lng: locale,
      fallbackLng: FALLBACK_LANGUAGE,
      defaultNS: DEFAULT_NAMESPACE,
      interpolation: { escapeValue: false },
      initImmediate: false
    });
    i18nRef.current = instance;
  }

  useEffect(() => {
    setCurrentLocale(locale);
    void i18nRef.current?.changeLanguage(locale);
  }, [locale]);

  const changeLocale = useCallback(
    async (nextLocale: SupportedLanguage, shouldPersist: boolean = true) => {
      if (nextLocale === currentLocale) {
        return;
      }
      setCurrentLocale(nextLocale);
      const instance = i18nRef.current;
      if (instance) {
        await instance.changeLanguage(nextLocale);
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lang", nextLocale);
      }
      if (shouldPersist) {
        try {
          await fetch(API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: nextLocale })
          });
        } catch (error) {
          console.error("Failed to persist language", error);
        }
      }
    },
    [currentLocale]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem("lang");
    if (stored && isSupportedLanguage(stored) && stored !== currentLocale) {
      void changeLocale(stored as SupportedLanguage, false);
    }
  }, [changeLocale, currentLocale]);

  useEffect(() => {
    const instance = i18nRef.current;
    if (instance) {
      instance.services.resourceStore.data = resources as Record<string, Resource>;
      if (instance.language !== currentLocale) {
        void instance.changeLanguage(currentLocale);
      }
    }
  }, [resources, currentLocale]);

  const contextValue = useMemo<LocaleContextValue>(
    () => ({
      locale: currentLocale,
      setLocale: async (nextLocale: SupportedLanguage) => changeLocale(nextLocale)
    }),
    [changeLocale, currentLocale]
  );

  return (
    <LocaleContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18nRef.current!}>{children}</I18nextProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return value;
}
