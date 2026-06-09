"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { NotificationItem, getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { useClaimWatcher, LocalNotif, clearLocalNotifs } from "@/lib/claimWatcher";
import { relativeTime } from "@/lib/activity";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Exclude VERDICT_READY — show everything else from backend + all local notifications
const BLOCKED_TYPES = new Set(["VERDICT_READY", "verdict_ready"]);

function isAllowed(type: string) {
  return !BLOCKED_TYPES.has(type) && !BLOCKED_TYPES.has(type.toUpperCase());
}

// ── icon/colour registry ─────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: JSX.Element; label: string; color: string; bg: string }> = {
  REVIEW_COMPLETED: {
    label: "Human Review Completed",
    color: "#2563eb", bg: "#eff6ff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  HUMAN_REVIEW_COMPLETED: {
    label: "Human Review Completed",
    color: "#2563eb", bg: "#eff6ff",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  CLAIM_PUBLISHED: {
    label: "Claim Published",
    color: "#16a34a", bg: "#f0fdf4",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  },
  FACT_CHECK_PUBLISHED: {
    label: "Fact Check Published",
    color: "#16a34a", bg: "#f0fdf4",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  },
};

function getMeta(type: string) {
  const key = type.toUpperCase();
  return TYPE_META[key] ?? {
    label: type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    color: "#16a34a", bg: "#f0fdf4",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  };
}

// ── unified row type ─────────────────────────────────────────────────────────

type Row =
  | { source: "backend"; data: NotificationItem }
  | { source: "local";   data: LocalNotif };

function rowId(r: Row)        { return `${r.source}-${r.data.id}`; }
function rowIsRead(r: Row)    { return r.data.is_read; }
function rowType(r: Row)      { return r.data.type; }
function rowTitle(r: Row)     { return r.data.title; }
function rowMessage(r: Row)   { return r.data.message; }
function rowCreatedAt(r: Row) { return r.data.created_at; }
function rowEntityId(r: Row)  {
  if (r.source === "backend") return (r.data as NotificationItem).entity_id ?? null;
  return (r.data as LocalNotif).entity_id;
}

// ── page ─────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <Notifications />
    </ProtectedRoute>
  );
}

function Notifications() {
  const { token, isAdmin } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [backendItems, setBackendItems] = useState<NotificationItem[]>([]);
  const [cleared, setCleared] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const { localNotifs, markLocalRead, markAllLocalRead } = useClaimWatcher(token, !!isAdmin);

  const loadBackend = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getNotifications(token, { page, perPage: 50 })
      .then((r) => { setBackendItems(r.items); setLastPage(r.pagination.last_page); })
      .finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => { loadBackend(); }, [loadBackend]);

  // Filter backend: remove VERDICT_READY
  const filteredBackend = backendItems.filter(n => isAllowed(n.type));

  // Build unified list — local first (newest), then backend
  const rows: Row[] = [
    ...localNotifs.map(n => ({ source: "local" as const, data: n })),
    ...filteredBackend.map(n => ({ source: "backend" as const, data: n })),
  ];

  const hasUnread = rows.some(r => !rowIsRead(r));

  const open = async (r: Row) => {
    if (r.source === "local") {
      markLocalRead(String(r.data.id));
      const eid = rowEntityId(r);
      if (eid) router.push(`/results/${eid}`);
    } else {
      const n = r.data as NotificationItem;
      if (token && !n.is_read) {
        markNotificationRead(token, n.id).catch(() => {}); // ignore deadlock / backend errors
      }
      if (n.entity_type === "claim" && n.entity_id) {
        router.push(`/results/${n.entity_id}`);
      } else {
        loadBackend();
      }
    }
  };

  const markAll = async () => {
    markAllLocalRead();
    if (!token) return;
    markAllNotificationsRead(token).catch(() => {});
    loadBackend();
  };

  const clearAll = async () => {
    clearLocalNotifs();
    markAllLocalRead();
    if (token) markAllNotificationsRead(token).catch(() => {});
    setBackendItems([]);
    setCleared(true);
  };

  return (
    <div className="jxu-page">
      <header className="jxu-page-head jxu-head-row">
        <h1>{t.userNav.notifications}</h1>
        {rows.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {hasUnread && (
              <button className="jxu-btn jxu-btn-ghost jxu-btn-sm" onClick={markAll}>
                {t.userNav.markAllRead}
              </button>
            )}
            <button
              className="jxu-btn jxu-btn-ghost jxu-btn-sm"
              onClick={clearAll}
              style={{ color: "#ef4444", borderColor: "#fecaca" }}
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      <section className="jxu-card">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 12, color: "#64748b" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 20, height: 20, border: "2px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Loading notifications…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5" style={{ display: "block", margin: "0 auto 12px" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p style={{ margin: 0, fontSize: 14 }}>{cleared ? "Notifications cleared" : t.userNav.noNotifications}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#cbd5e1" }}>
              {cleared ? "New notifications will appear here when your claims are reviewed or published" : "You'll be notified when your claims are reviewed or published"}
            </p>
          </div>
        ) : (
          <ul className="jxu-notif-list">
            {rows.map((r) => {
              const meta = getMeta(rowType(r));
              return (
                <li
                  key={rowId(r)}
                  className={rowIsRead(r) ? "read" : "unread"}
                  onClick={() => open(r)}
                >
                  <span className="jxu-notif-icon" style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </span>
                  <div className="jxu-notif-body">
                    <strong style={{ color: meta.color }}>{rowTitle(r) || meta.label}</strong>
                    {rowMessage(r) && <p>{rowMessage(r)}</p>}
                    <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "inline-block" }}>
                      {meta.label}
                      {r.source === "local" && (
                        <span style={{ marginLeft: 6, background: "#f0fdf4", color: "#16a34a", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>NEW</span>
                      )}
                    </span>
                  </div>
                  <div className="jxu-notif-meta">
                    {!rowIsRead(r) && <span className="jxu-dot" />}
                    <time>{relativeTime(rowCreatedAt(r) ?? "")}</time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {lastPage > 1 && (
          <div className="jxu-pager">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span>{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        )}
      </section>
    </div>
  );
}
