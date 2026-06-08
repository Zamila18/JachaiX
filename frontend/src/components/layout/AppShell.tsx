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
  const isPublic = pathname === "/" || pathname === "/contact" || pathname === "/scan" || pathname === "/facts" || pathname?.startsWith("/facts/") || pathname?.startsWith("/results/");
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
              <a href="#how">{tx({ en: "How It Works", bn: "যেভাবে কাজ করে" })}</a>
              <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>{tx({ en: "About", bn: "সম্পর্কে" })}</Link>
              <Link href="/contact" className={pathname === "/contact" ? "active" : ""}>{tx({ en: "Contact Us", bn: "যোগাযোগ" })}</Link>
            </nav>

            <div className="jx-nav-actions">
              <LanguageSwitcher />
              <Link href="/dashboard" className="jx-login">{tx({ en: "Log in", bn: "লগ ইন" })}</Link>
              <Link href="/scan" className="jx-submit">{tx({ en: "Submit Claim", bn: "ক্লেম জমা দিন" })}</Link>
            </div>
          </div>
        </header>

        <div className="jx-landing-content">{children}</div>

        <footer className="landing-footer-extended">
          <style dangerouslySetInnerHTML={{ __html: `
            .landing-footer-extended {
              background: #0b1120;
              color: #94a3b8;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
              padding: 2rem 2rem 1rem;
              font-family: 'Inter', sans-serif;
            }
            .jx-footer-grid {
              max-width: 1200px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
              gap: 2rem;
              padding-bottom: 2rem;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .jx-footer-brand h2 {
              color: #ffffff;
              font-size: 1.5rem;
              margin: 0 0 0.5rem;
              display: flex;
              align-items: center;
              font-family: var(--font-display), sans-serif;
            }
            .jx-footer-brand h2 span { color: #00e676; }
            .jx-footer-brand-subtitle {
              font-size: 0.65rem;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: #94a3b8;
              display: block;
              margin-bottom: 1rem;
            }
            .jx-footer-brand p {
              font-size: 0.9rem;
              line-height: 1.6;
              margin-bottom: 1.5rem;
              max-width: 300px;
            }
            .jx-social-icons {
              display: flex;
              gap: 0.75rem;
            }
            .jx-social-icon {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.05);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              text-decoration: none;
              transition: background 0.2s;
            }
            .jx-social-icon:hover { background: rgba(255, 255, 255, 0.1); }
            
            .jx-footer-col h4 {
              color: #ffffff;
              font-size: 0.95rem;
              margin: 0 0 1.5rem;
              font-weight: 600;
            }
            .jx-footer-col ul {
              list-style: none;
              padding: 0;
              margin: 0;
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }
            .jx-footer-col a {
              color: #94a3b8;
              text-decoration: none;
              font-size: 0.9rem;
              transition: color 0.2s;
            }
            .jx-footer-col a:hover { color: #00e676; }
            
            .jx-newsletter p {
              font-size: 0.9rem;
              line-height: 1.5;
              margin: 0 0 1.5rem;
            }
            .jx-newsletter-form {
              display: flex;
              gap: 0.5rem;
            }
            .jx-newsletter-input {
              flex: 1;
              background: transparent;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              padding: 0.6rem 1rem;
              color: #ffffff;
              outline: none;
            }
            .jx-newsletter-input:focus {
              border-color: #00e676;
            }
            .jx-newsletter-btn {
              background: #00e676;
              color: #000000;
              border: none;
              border-radius: 6px;
              padding: 0.6rem 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            }
            .jx-newsletter-btn:hover { background: #00c853; }
            
            .jx-footer-bottom {
              max-width: 1200px;
              margin: 1.5rem auto 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 0.85rem;
            }
            .jx-footer-links {
              display: flex;
              gap: 1.5rem;
              align-items: center;
            }
            .jx-footer-links a {
              color: #94a3b8;
              text-decoration: none;
            }
            .jx-footer-links a:hover { color: #ffffff; }
            .jx-heart { color: #ef4444; }

            @media (max-width: 900px) {
              .jx-footer-grid {
                grid-template-columns: 1fr 1fr;
              }
              .jx-footer-brand {
                grid-column: span 2;
              }
              .jx-footer-bottom {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
              }
            }
            @media (max-width: 600px) {
              .jx-footer-grid {
                grid-template-columns: 1fr;
              }
              .jx-footer-brand {
                grid-column: span 1;
              }
            }
          `}} />
          <div className="jx-footer-grid">
            <div className="jx-footer-brand">
              <h2>Jachai<span>X</span></h2>
              <span className="jx-footer-brand-subtitle">AI VERIFICATION PLATFORM</span>
              <p>Combining AI, retrieval systems, and human expertise to fight misinformation and build a more truthful world.</p>
              <div className="jx-social-icons">
                <a href="#" className="jx-social-icon" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" className="jx-social-icon" aria-label="X (Twitter)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                </a>
                <a href="#" className="jx-social-icon" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href="#" className="jx-social-icon" aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                </a>
              </div>
            </div>
            
            <div className="jx-footer-col">
              <h4>Platform</h4>
              <ul>
                <li><Link href="/facts">Fact Checks</Link></li>
                <li><Link href="/scan">Verify Claim</Link></li>
                <li><Link href="/facts">Evidence Library</Link></li>
                <li><Link href="/#how">How It Works</Link></li>
              </ul>
            </div>
            
            <div className="jx-footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link href="/dashboard">About Us</Link></li>
                <li><Link href="#">Careers</Link></li>
                <li><Link href="#">Blog</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>
            
            <div className="jx-footer-col">
              <h4>Support</h4>
              <ul>
                <li><Link href="#">Help Center</Link></li>
                <li><Link href="#">FAQ</Link></li>
                <li><Link href="#">Report Misinformation</Link></li>
                <li><Link href="#">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div className="jx-footer-col jx-newsletter">
              <h4>Newsletter</h4>
              <p>Stay updated with our latest fact checks and platform updates.</p>
              <form className="jx-newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Enter your email" className="jx-newsletter-input" required />
                <button type="submit" className="jx-newsletter-btn">Subscribe</button>
              </form>
            </div>
          </div>
          
          <div className="jx-footer-bottom">
            <div>© 2026 JachaiX. All rights reserved.</div>
            <div className="jx-footer-links">
              <Link href="#">Terms of Service</Link>
              <span>|</span>
              <Link href="#">Privacy Policy</Link>
              <span>|</span>
              <span>Made with <span className="jx-heart">❤️</span> in Bangladesh</span>
            </div>
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
