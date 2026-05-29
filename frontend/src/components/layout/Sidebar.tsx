"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Homepage", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Workspace", href: "/workspace" },
  { label: "Cases", href: "/cases" },
  { label: "Modalities", href: "/modalities" },
  { label: "Audit", href: "/audit" },
  { label: "Scan", href: "/scan" },
  { label: "Fact Checks", href: "/facts" },
  { label: "Admin Queue", href: "/admin/publish-queue" },
  { label: "Docs", href: "/docs" },
  { label: "Admin Docs", href: "/admin/docs" },
  { label: "Reports", href: "/reports" },
  { label: "Analytics", href: "/analytics" },
  { label: "Threat Map", href: "/threatmap" },
  { label: "Alerts", href: "/alerts" },
  { label: "Chat", href: "/chat" },
  { label: "Investigation", href: "/investigation" },
  { label: "Moderator", href: "/moderator" },
  { label: "Monitor", href: "/monitor" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <p>JachaiX</p>
        <span>Trust Intelligence Suite</span>
      </div>

      <nav className="side-nav" aria-label="Primary">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="side-status">
        <strong>System</strong>
        <p>
          <span className="status-dot" /> Live backend connectivity
        </p>
      </div>
    </aside>
  );
}
