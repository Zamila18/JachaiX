"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { NotificationItem, getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { relativeTime } from "@/lib/activity";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ICON: Record<string, string> = {
  VERDICT_READY: "✅", REVIEW_REQUESTED: "🧑‍⚖️", REVIEW_COMPLETED: "📋",
};

export function NotificationsPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <Notifications />
    </ProtectedRoute>
  );
}

function Notifications() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getNotifications(token, { page, perPage: 20 })
      .then((r) => { setItems(r.items); setLastPage(r.pagination.last_page); })
      .finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  const open = async (n: NotificationItem) => {
    if (token && !n.is_read) await markNotificationRead(token, n.id);
    if (n.entity_type === "claim" && n.entity_id) {
      router.push(`/results/${n.entity_id}`);
    } else {
      load();
    }
  };

  const markAll = async () => {
    if (!token) return;
    await markAllNotificationsRead(token);
    load();
  };

  return (
    <div className="jxu-page">
      <header className="jxu-page-head jxu-head-row">
        <h1>{t.userNav.notifications}</h1>
        <button className="jxu-btn jxu-btn-ghost jxu-btn-sm" onClick={markAll}>{t.userNav.markAllRead}</button>
      </header>

      <section className="jxu-card">
        {loading ? <p className="jxu-muted">…</p> : items.length === 0 ? (
          <p className="jxu-muted">{t.userNav.noNotifications}</p>
        ) : (
          <ul className="jxu-notif-list">
            {items.map((n) => (
              <li key={n.id} className={n.is_read ? "read" : "unread"} onClick={() => open(n)}>
                <span className="jxu-notif-icon">{ICON[n.type] ?? "🔔"}</span>
                <div className="jxu-notif-body">
                  <strong>{n.title}</strong>
                  {n.message && <p>{n.message}</p>}
                </div>
                <div className="jxu-notif-meta">
                  {!n.is_read && <span className="jxu-dot" />}
                  <time>{relativeTime(n.created_at)}</time>
                </div>
              </li>
            ))}
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
