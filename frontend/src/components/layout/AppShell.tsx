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
  const isPublic = pathname === "/" || pathname === "/scan" || pathname === "/facts" || pathname?.startsWith("/facts/") || pathname?.startsWith("/results/");
  const { t, tx } = useLanguage();

  if (isPublic) {
    return (
      <div className="landing-shell jx-landing">
        <header className="jx-topnav">
          <div className="jx-topnav-inner">
            <Link href="/" className="jx-brand" aria-label={t.landing.brandAria}>
              <span className="jx-brand-name">Jachai<span className="jx-brand-x">X</span></span>
              <small>{t.landing.aiPlatform}</small>
            </Link>

            <nav className="jx-nav-links" aria-label="Homepage">
              <Link href="/" className={pathname === "/" ? "active" : ""}>{tx({ en: "Home", bn: "হোম" })}</Link>
              <Link href="/facts" className={pathname === "/facts" ? "active" : ""}>{tx({ en: "Fact Checks", bn: "ফ্যাক্ট চেকস" })}</Link>
              <Link href="/scan" className={pathname === "/scan" ? "active" : ""}>{tx({ en: "Verify Claim", bn: "যাচাই করুন" })}</Link>
              <Link href="/facts" className="">{tx({ en: "Evidence Library", bn: "এভিডেন্স লাইব্রেরি" })}</Link>
              <a href="#how">{tx({ en: "How It Works", bn: "যেভাবে কাজ করে" })}</a>
              <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>{tx({ en: "About", bn: "সম্পর্কে" })}</Link>
            </nav>

            <div className="jx-nav-actions">
              <LanguageSwitcher />
              <Link href="/dashboard" className="jx-login">{tx({ en: "Log in", bn: "লগ ইন" })}</Link>
              <Link href="/scan" className="jx-submit">{tx({ en: "Submit Claim", bn: "ক্লেম জমা দিন" })}</Link>
            </div>
          </div>
        </header>

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
