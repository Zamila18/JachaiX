"use client";

import { usePathname } from "next/navigation";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/workspace": "Analyst Workspace",
  "/cases": "Case Management",
  "/modalities": "Multimodal Lab",
  "/audit": "Audit Timeline",
  "/scan": "Scan Center",
  "/docs": "Live Documentation",
  "/admin/publish-queue": "Admin Publish Queue",
  "/admin/docs": "Admin Docs",
  "/reports": "Reports",
  "/analytics": "Analytics",
  "/threatmap": "Threat Map",
  "/alerts": "Alerts",
  "/chat": "Investigator Chat",
  "/investigation": "Investigation",
  "/moderator": "Moderator",
  "/monitor": "Monitoring",
  "/settings": "Settings",
};

export function Navbar() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "JachaiX";

  return (
    <header className="topbar">
      <div>
        <p className="data-label">Command Deck</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-meta">
        <span className="live-chip">Operations Live</span>
      </div>
    </header>
  );
}
