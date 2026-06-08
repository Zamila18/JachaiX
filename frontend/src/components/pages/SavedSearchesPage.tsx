"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { SavedSearchItem, deleteSavedSearch, getSavedSearches } from "@/lib/api";
import { relativeTime } from "@/lib/activity";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SavedSearchesPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <SavedSearches />
    </ProtectedRoute>
  );
}

function SavedSearches() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!token) return;
    setLoading(true);
    getSavedSearches(token).then((r) => setItems(r.items)).finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const onDelete = async (id: number) => {
    if (!token) return;
    await deleteSavedSearch(token, id);
    load();
  };

  const toUrl = (s: SavedSearchItem) => {
    const p = new URLSearchParams();
    p.set("q", s.query);
    const scope = s.filters?.scope;
    if (typeof scope === "string") p.set("scope", scope);
    return `/facts?${p.toString()}`;
  };

  return (
    <div className="jxu-page">
      <header className="jxu-page-head">
        <h1>{t.userNav.savedSearches}</h1>
      </header>

      <section className="jxu-card">
        {loading ? <p className="jxu-muted">…</p> : items.length === 0 ? (
          <p className="jxu-muted">No saved searches yet. Save a search from the <Link href="/facts">{t.userNav.factChecks}</Link> page.</p>
        ) : (
          <ul className="jxu-ss-list">
            {items.map((s) => (
              <li key={s.id}>
                <Link href={toUrl(s)} className="jxu-ss-query">
                  <span className="jxu-ss-icon">🔍</span>
                  <span>{s.query}</span>
                  {s.filters?.scope ? <em className="jxu-ss-filter">{String(s.filters.scope)}</em> : null}
                </Link>
                <div className="jxu-ss-actions">
                  <small className="jxu-muted">{relativeTime(s.created_at)}</small>
                  <button className="jxu-bm-remove" title="Delete" onClick={() => onDelete(s.id)}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
