"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { getNotifications } from "@/lib/api";
import { useClaimWatcher } from "@/lib/claimWatcher";

const EXCLUDED_TYPES = new Set(["VERDICT_READY", "verdict_ready"]);

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, tx } = useLanguage();
  const { isAuthenticated, isAdmin, user, adminEmail, token, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [backendUnread, setBackendUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { localUnreadCount } = useClaimWatcher(token, !!isAdmin);
  const unread = backendUnread + localUnreadCount;

  // Close avatar dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close mobile nav on route change.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Poll unread notification count.
  useEffect(() => {
    if (!token || isAdmin) return;
    let active = true;
    const load = () =>
      getNotifications(token, { page: 1, perPage: 50 })
        .then((r) => {
          if (!active) return;
          const count = r.items.filter(
            (n) => !n.is_read && !EXCLUDED_TYPES.has(n.type) && !EXCLUDED_TYPES.has(n.type.toUpperCase())
          ).length;
          setBackendUnread(count);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [token, isAdmin, pathname]);

  const handleLogout = () => {
    setMenuOpen(false);
    setMobileNavOpen(false);
    logout();
    router.push("/");
  };

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}` || "U";

  const navLinks = [
    { href: "/", label: tx({ en: "Home", bn: "হোম" }) },
    { href: "/facts", label: tx({ en: "Fact Checks", bn: "ফ্যাক্ট চেকস" }) },
    { href: "/scan", label: tx({ en: "Verify Claim", bn: "যাচাই করুন" }) },
    { href: "/how-it-works", label: tx({ en: "About", bn: "সম্পর্কে" }) },
    { href: "/contact", label: tx({ en: "Contact Us", bn: "যোগাযোগ" }) },
  ];

  return (
    <>
      <header className="jx-topnav">
        <div className="jx-topnav-inner">
          <div className="jx-brand-group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/AUST IDC - White (1).png" alt="AUST IDC" className="jx-aust-logo" />
            <Link href="/" className="jx-brand" aria-label={t.landing.brandAria}>
              <span className="jx-brand-name">Jachai<span className="jx-brand-x">X</span></span>
              <small>{t.landing.aiPlatform}</small>
            </Link>
          </div>

          <nav className="jx-nav-links" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="jx-nav-actions">
            <LanguageSwitcher />

            {!isAuthenticated && (
              <>
                <Link href="/login" className="jx-login">{tx({ en: "Log in", bn: "লগ ইন" })}</Link>
                <Link href="/scan" className="jx-submit">{tx({ en: "Submit Claim", bn: "ক্লেম জমা দিন" })}</Link>
              </>
            )}

            {isAuthenticated && !isAdmin && (
              <>
                <Link href="/user/notifications" className="jx-bell" aria-label={t.userNav.notifications}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unread > 0 && <span className="jx-bell-badge">{unread > 99 ? "99+" : unread}</span>}
                </Link>

                <div className="jx-avatar-menu" ref={menuRef}>
                  <button className="jx-avatar-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="User menu">
                    {user?.profile_picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profile_picture} alt="" className="jx-avatar-img" />
                    ) : (
                      <span className="jx-avatar-circle">{initials}</span>
                    )}
                  </button>
                  {menuOpen && (
                    <div className="jx-avatar-dropdown">
                      <div className="jx-avatar-dropdown-head">
                        <strong>{user?.first_name} {user?.last_name}</strong>
                        <small>@{user?.username}</small>
                      </div>
                      <Link href="/user/profile" onClick={() => setMenuOpen(false)}>{t.userNav.viewProfile}</Link>
                      <Link href="/user/dashboard" onClick={() => setMenuOpen(false)}>{t.userNav.userDashboard}</Link>
                      <button onClick={handleLogout}>{t.userNav.logout}</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {isAuthenticated && isAdmin && (
              <div className="jx-avatar-menu" ref={menuRef}>
                <button className="jx-avatar-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Admin menu">
                  <span className="jx-avatar-circle jx-avatar-circle--admin">A</span>
                </button>
                {menuOpen && (
                  <div className="jx-avatar-dropdown">
                    <div className="jx-avatar-dropdown-head">
                      <strong>Admin</strong>
                      <small>{adminEmail}</small>
                    </div>
                    <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}>{t.userNav.userDashboard}</Link>
                    <button onClick={handleLogout}>{t.userNav.logout}</button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger — visible only on mobile */}
            <button
              className="jx-hamburger"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              <span className={`jx-hamburger-bar${mobileNavOpen ? " open" : ""}`} />
              <span className={`jx-hamburger-bar${mobileNavOpen ? " open" : ""}`} />
              <span className={`jx-hamburger-bar${mobileNavOpen ? " open" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="jx-mobile-nav" role="dialog" aria-label="Mobile navigation">
          <div className="jx-mobile-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`jx-mobile-nav-link${pathname === link.href ? " active" : ""}`}
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link href="/login" className="jx-mobile-nav-link" onClick={() => setMobileNavOpen(false)}>
                  {tx({ en: "Log in", bn: "লগ ইন" })}
                </Link>
                <Link href="/scan" className="jx-mobile-nav-cta" onClick={() => setMobileNavOpen(false)}>
                  {tx({ en: "Submit Claim", bn: "ক্লেম জমা দিন" })}
                </Link>
              </>
            )}
            {isAuthenticated && (
              <button className="jx-mobile-nav-link jx-mobile-nav-logout" onClick={handleLogout}>
                {t.userNav.logout}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
