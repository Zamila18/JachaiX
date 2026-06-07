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
  const isPublic =
    pathname === "/" ||
    pathname === "/scan" ||
    pathname === "/facts" ||
    pathname?.startsWith("/facts/") ||
    pathname?.startsWith("/results/");

  const isAuth = pathname === "/login" || pathname === "/register";
  const { t, tx } = useLanguage();

  // Shared top-nav used on both public and auth pages
  const TopNav = ({ activeAuth }: { activeAuth?: boolean }) => (
    <header className="jx-topnav">
      <div className="jx-topnav-inner">
        <Link href="/" className="jx-brand" aria-label={t.landing.brandAria}>
          <span className="jx-brand-name">
            Jachai<span className="jx-brand-x">X</span>
          </span>
          <small>{t.landing.aiPlatform}</small>
        </Link>

        <nav className="jx-nav-links" aria-label="Main navigation">
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            {tx({ en: "Home", bn: "হোম" })}
          </Link>
          <Link href="/facts" className={pathname === "/facts" ? "active" : ""}>
            {tx({ en: "Fact Checks", bn: "ফ্যাক্ট চেকস" })}
          </Link>
          <Link href="/scan" className={pathname === "/scan" ? "active" : ""}>
            {tx({ en: "Verify Claim", bn: "যাচাই করুন" })}
          </Link>
          <a href={pathname === "/" ? "#how" : "/#how"}>
            {tx({ en: "How It Works", bn: "যেভাবে কাজ করে" })}
          </a>
          {!activeAuth && (
            <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>
              {tx({ en: "About", bn: "সম্পর্কে" })}
            </Link>
          )}
        </nav>

        <div className="jx-nav-actions">
          <LanguageSwitcher />
          <Link
            href="/login"
            className={`jx-login${pathname === "/login" ? " jx-login--active" : ""}`}
            id="nav-login-btn"
          >
            {tx({ en: "Log in", bn: "লগ ইন" })}
          </Link>
          <Link href="/register" className="jx-submit" id="nav-register-btn">
            {tx({ en: "Register", bn: "নিবন্ধন" })}
          </Link>
        </div>
      </div>
    </header>
  );

  if (isPublic || isAuth) {
    return (
      <div className="landing-shell jx-landing">
        <TopNav activeAuth={isAuth} />
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
    <div className="jx-landing jx-app-shell">
      <Sidebar />
      <div className="jx-app-main">
        <Navbar />
        <div className="jx-app-content">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
