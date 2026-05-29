"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <div className="landing-shell">
        <header className="landing-topnav">
          <div className="landing-topnav-inner">
            <Link href="/" className="landing-brand" aria-label="JachaiX Home">
              <span>JachaiX</span>
              <small>AI Verification Platform</small>
            </Link>

            <nav className="landing-links" aria-label="Homepage">
              <a href="#capabilities">Capabilities</a>
              <a href="#pipeline">Pipeline</a>
              <a href="#deployment">Deployment</a>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
          </div>
        </header>

        <div className="landing-content">{children}</div>

        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <p>JachaiX is a Bangla-first misinformation verification solution for text, image, and PDF claims.</p>
            <small>Built with Laravel, asynchronous job processing, OCR, embedding retrieval, reranking, and LLM verdict orchestration.</small>
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
