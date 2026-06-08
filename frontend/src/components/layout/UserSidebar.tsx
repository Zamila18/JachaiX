"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export function UserSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    { href: "/user/dashboard", label: t.userNav.dashboard, icon: "▤" },
    { href: "/user/claims", label: t.userNav.myClaims, icon: "✔" },
    { href: "/facts", label: t.userNav.factChecks, icon: "◎" },
    { href: "/user/bookmarks", label: t.userNav.bookmarks, icon: "🔖" },
    { href: "/user/notifications", label: t.userNav.notifications, icon: "🔔" },
    { href: "/user/saved-searches", label: t.userNav.savedSearches, icon: "🔍" },
    { href: "/facts", label: t.userNav.evidenceLibrary, icon: "▦" },
    { href: "/user/help", label: t.userNav.help, icon: "❔" },
  ];

  return (
    <aside className="jxu-sidebar">
      <nav className="jxu-sidenav" aria-label={t.userNav.dashboard}>
        {items.map((item, i) => {
          const active =
            pathname === item.href ||
            (item.href !== "/facts" && pathname?.startsWith(item.href));
          return (
            <Link key={`${item.href}-${i}`} href={item.href} className={active ? "active" : ""}>
              <span className="jxu-nav-icon" aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
