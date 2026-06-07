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
    <aside className="jx-sidebar">
      <Link href="/" className="jx-sidebar-brand" aria-label={t.landing?.brandAria || "JachaiX Home"}>
        <span className="jx-brand-name">Jachai<span className="jx-brand-x">X</span></span>
        <small>{t.nav.trustSuite}</small>
      </Link>

      <nav className="jx-side-nav" aria-label={t.nav.primaryLabel}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""}>
              {t.nav.items[item.key as keyof typeof t.nav.items]}
            </Link>
          );
        })}
      </nav>

      <div className="jx-side-status">
        <strong>{t.nav.system}</strong>
        <p>
          <span className="jx-status-dot" /> {t.nav.connectivity}
        </p>
      </div>
    </aside>
  );
}
