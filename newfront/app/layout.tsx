import type { Metadata } from "next";

import "@/styles/globals.css";
import { RoleProvider } from "@/components/auth/RoleProvider";
import { DocumentProvider } from "@/components/document-provider";
import { LegalUpdateBanner } from "@/components/legal/LegalUpdateBanner";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Contra Dashboard",
  description: "Contra legal document analysis dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <RoleProvider>
          <DocumentProvider>
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <main className="flex min-h-screen min-w-0 flex-1 flex-col px-4 py-4 lg:ml-20 lg:px-8 lg:py-6">
                <LegalUpdateBanner />
                {children}
              </main>
            </div>
            <MobileNav />
          </DocumentProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
