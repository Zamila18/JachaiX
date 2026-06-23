"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  )},
  { href: "/admin/claims", label: "Claims", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  )},
  { href: "/admin/fact-checks", label: "Fact Checks", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
  )},
  { href: "/admin/human-review", label: "Human Review", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { href: "/admin/analytics", label: "Analytics", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
  { href: "/admin/settings", label: "Settings", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.64 13.45l-1.57-1.57a8 8 0 0 0-1.42-10.88z"/><path d="M4.93 19.07a10 10 0 0 1-1.64-13.45l1.57 1.57a8 8 0 0 0 1.42 10.88z"/></svg>
  )},
  { href: "/admin/audit-logs", label: "Audit Logs", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  )},
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { adminEmail, logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); router.push("/login"); };
  const initials = adminEmail ? adminEmail.slice(0, 2).toUpperCase() : "AD";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ padding: collapsed ? "20px 0" : "20px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {!collapsed && (
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
                Jachai<span style={{ color: "#22c55e" }}>X</span>
              </div>
              <div style={{ color: "#64748b", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>AI Verification Platform</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {NAV.map(item => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "10px 0" : "10px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: active ? "#fff" : "#94a3b8",
                background: active ? "rgba(34,197,94,0.12)" : "transparent",
                borderLeft: active ? "3px solid #22c55e" : "3px solid transparent",
                textDecoration: "none", fontSize: 14, fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
                whiteSpace: "nowrap", overflow: "hidden",
              }}>
                <span style={{ flexShrink: 0, color: active ? "#22c55e" : "inherit" }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: collapsed ? "12px 0" : "12px 16px" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initials}</div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adminEmail}</div>
                <div style={{ color: "#22c55e", fontSize: 10 }}>Administrator</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: "100%", background: "rgba(239,68,68,0.1)", border: "none",
            color: "#ef4444", padding: collapsed ? "8px 0" : "8px 12px",
            borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 6, justifyContent: collapsed ? "center" : "flex-start",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: collapsed ? 64 : 220, flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "margin-left 0.2s" }}>
        {/* Topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            {NAV.find(n => pathname === n.href || pathname?.startsWith(n.href + "/"))?.label ?? "Admin"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Admin User</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Administrator</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
