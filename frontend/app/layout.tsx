import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { detectRequestLocale } from "@/lib/locale/server";
import { loadTranslations } from "@/i18n/server";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "Contra Internationalization",
  description: "Demo application showcasing EN/HU language switching with persistence"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await detectRequestLocale();
  const resources = await loadTranslations();

  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale} resources={resources}>
          <AppHeader />
          <main>{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
