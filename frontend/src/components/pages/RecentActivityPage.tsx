"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { ActivityItem, getActivityFeed } from "@/lib/api";
import { activityIcon, activityTone, relativeTime } from "@/lib/activity";
import { useCallback, useEffect, useState } from "react";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "CLAIM_SUBMITTED", label: "Claims" },
  { value: "HUMAN_REVIEW_REQUESTED", label: "Reviews" },
  { value: "USER_LOGGED_IN", label: "Sign-ins" },
  { value: "BOOKMARK_CREATED", label: "Bookmarks" },
  { value: "PROFILE_UPDATED", label: "Profile" },
];

export function RecentActivityPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <RecentActivity />
    </ProtectedRoute>
  );
}

function RecentActivity() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getActivityFeed(token, { page, perPage: 20, type: type || undefined, q: search || undefined })
      .then((r) => {
        setItems(r.items);
        setLastPage(r.pagination.last_page);
      })
      .finally(() => setLoading(false));
  }, [token, page, type, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="jxu-page">
      <header className="jxu-page-head">
        <h1>{t.dash.yourActivity}</h1>
      </header>

      <div className="jxu-filter-bar">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }} className="jxu-search-form">
          <input type="search" placeholder="Search activity…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="jxu-btn jxu-btn-sm">{t.auth.search}</button>
        </form>
        <div className="jxu-chip-row">
          {TYPE_FILTERS.map((f) => (
            <button key={f.value || "all"} className={`jxu-chip ${type === f.value ? "active" : ""}`}
              onClick={() => { setType(f.value); setPage(1); }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="jxu-card">
        {loading ? (
          <p className="jxu-muted">…</p>
        ) : items.length === 0 ? (
          <p className="jxu-muted">{t.dash.noActivity}</p>
        ) : (
          <ul className="jxu-activity">
            {items.map((a) => (
              <li key={a.id} className={`tone-${activityTone(a.type)}`}>
                <span className="jxu-act-icon">{activityIcon(a.type)}</span>
                <div>
                  <strong>{a.title}</strong>
                  {a.description && <p>{a.description}</p>}
                  <small className="jxu-muted">{new Date(a.created_at).toLocaleString()}</small>
                </div>
                <time>{relativeTime(a.created_at)}</time>
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
