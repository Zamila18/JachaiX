"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  {
    key: "dashboard",
    href: "/user/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: "myClaims",
    href: "/user/claims",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key: "factChecks",
    href: "/facts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    key: "notifications",
    href: "/user/notifications",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    key: "bookmarks",
    href: "/user/bookmarks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    key: "savedSearches",
    href: "/user/saved-searches",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    key: "profile",
    href: "/user/profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const LABEL_MAP: Record<string, { en: string; bn: string }> = {
  dashboard:    { en: "Dashboard",      bn: "ড্যাশবোর্ড" },
  myClaims:     { en: "My Claims",      bn: "আমার ক্লেম" },
  factChecks:   { en: "Fact Checks",    bn: "ফ্যাক্ট চেক" },
  notifications:{ en: "Notifications",  bn: "বিজ্ঞপ্তি" },
  bookmarks:    { en: "Bookmarks",      bn: "বুকমার্ক" },
  savedSearches:{ en: "Saved Searches", bn: "সেভড সার্চ" },
  profile:      { en: "Profile",        bn: "প্রোফাইল" },
};

export function UserSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const lang = (t as any)?.lang ?? "en";

  return (
    <aside className="jxu-sidebar">
      {/* Brand */}
      <div style={{
        padding: "20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
            Jachai<span style={{ color: "#22c55e" }}>X</span>
          </div>
          <div style={{ color: "#64748b", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            AI Verification Platform
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="jxu-sidenav" aria-label="User navigation">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/facts" && pathname?.startsWith(item.href));
          const label = LABEL_MAP[item.key]?.[lang as "en" | "bn"] ?? LABEL_MAP[item.key]?.en ?? item.key;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : ""}
              style={{ borderRadius: 0 }}
            >
              <span
                className="jxu-nav-icon"
                style={{ color: active ? "#22c55e" : "inherit" }}
                aria-hidden
              >
                {item.icon}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#22c55e", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name ?? user?.email ?? "User"}
            </div>
            <div style={{ color: "#22c55e", fontSize: 10 }}>Member</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
