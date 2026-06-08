"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { TopNav } from "@/components/layout/TopNav";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppShellContent>{children}</AppShellContent>
      </AuthProvider>
    </LanguageProvider>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isLanding =
    pathname === "/" ||
    pathname === "/scan" ||
    pathname === "/facts" ||
    pathname?.startsWith("/facts/") ||
    pathname?.startsWith("/results/");

  const isAuthCard =
    pathname === "/login" || pathname === "/register" || pathname === "/admin/dashboard";

  // User area: homepage TopNav on top + user sidebar + light content.
  const isUserArea = pathname?.startsWith("/user");

  if (isUserArea) {
    return (
      <div className="jxu-shell">
        <TopNav />
        <div className="jxu-body">
          <UserSidebar />
          <main className="jxu-content">{children}</main>
        </div>
      </div>
    );
  }

  if (isAuthCard) {
    return (
      <div className="landing-shell jx-landing">
        <TopNav />
        <div className="jx-landing-content">{children}</div>
      </div>
    );
  }

  if (isLanding) {
    return (
      <div className="landing-shell jx-landing">
        <TopNav />
        <div className="jx-landing-content">{children}</div>
        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <p>{t.footer.landingLine1}</p>
            <small>{t.footer.landingLine2}</small>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <div className="app-content">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
