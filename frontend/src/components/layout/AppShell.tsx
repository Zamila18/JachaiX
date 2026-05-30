"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AppShellContent>{children}</AppShellContent>
    </LanguageProvider>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { t } = useLanguage();

  if (isLanding) {
    return (
      <div className="landing-shell">
        <header className="landing-topnav">
          <div className="landing-topnav-inner">
            <Link href="/" className="landing-brand" aria-label={t.landing.brandAria}>
              <span>JachaiX</span>
              <small>{t.landing.aiPlatform}</small>
            </Link>

            <nav className="landing-links" aria-label="Homepage">
              <a href="#capabilities">{t.landing.capabilities}</a>
              <a href="#pipeline">{t.landing.pipeline}</a>
              <a href="#deployment">{t.landing.deployment}</a>
              <Link href="/dashboard">{t.landing.dashboard}</Link>
            </nav>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="landing-content">{children}</div>

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
