"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const navItems = [
  { key: "homepage", href: "/" },
  { key: "dashboard", href: "/dashboard" },
  { key: "workspace", href: "/workspace" },
  { key: "cases", href: "/cases" },
  { key: "modalities", href: "/modalities" },
  { key: "audit", href: "/audit" },
  { key: "scan", href: "/scan" },
  { key: "factChecks", href: "/facts" },
  { key: "adminQueue", href: "/admin/publish-queue" },
  { key: "docs", href: "/docs" },
  { key: "adminDocs", href: "/admin/docs" },
  { key: "reports", href: "/reports" },
  { key: "analytics", href: "/analytics" },
  { key: "threatMap", href: "/threatmap" },
  { key: "alerts", href: "/alerts" },
  { key: "chat", href: "/chat" },
  { key: "investigation", href: "/investigation" },
  { key: "moderator", href: "/moderator" },
  { key: "monitor", href: "/monitor" },
  { key: "settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <p>JachaiX</p>
        <span>{t.nav.trustSuite}</span>
      </div>

      <nav className="side-nav" aria-label={t.nav.primaryLabel}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""}>
              {t.nav.items[item.key as keyof typeof t.nav.items]}
            </Link>
          );
        })}
      </nav>

      <div className="side-status">
        <strong>{t.nav.system}</strong>
        <p>
          <span className="status-dot" /> {t.nav.connectivity}
        </p>
      </div>
    </aside>
  );
}
