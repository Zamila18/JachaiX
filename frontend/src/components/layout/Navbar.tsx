"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const titleMap: Record<string, string> = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/workspace": "workspace",
  "/cases": "cases",
  "/modalities": "modalities",
  "/audit": "audit",
  "/scan": "scan",
  "/docs": "docs",
  "/admin/publish-queue": "adminQueue",
  "/admin/docs": "adminDocs",
  "/reports": "reports",
  "/analytics": "analytics",
  "/threatmap": "threatMap",
  "/alerts": "alerts",
  "/chat": "chat",
  "/investigation": "investigation",
  "/moderator": "moderator",
  "/monitor": "monitor",
  "/settings": "settings",
};

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const routeKey = titleMap[pathname] as keyof typeof t.topbar.routeTitles | undefined;
  const title = routeKey ? t.topbar.routeTitles[routeKey] : "JachaiX";

  return (
    <header className="topbar">
      <div>
        <p className="data-label">{t.topbar.commandDeck}</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-meta">
        <LanguageSwitcher />
        <span className="live-chip">{t.topbar.operationsLive}</span>
      </div>
    </header>
  );
}
