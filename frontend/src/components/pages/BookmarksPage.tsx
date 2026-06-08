"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { BookmarkItem, getBookmarks, removeBookmark } from "@/lib/api";
import { relativeTime } from "@/lib/activity";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const VERDICT_CLASS: Record<string, string> = {
  true: "v-true", false: "v-false", misleading: "v-mis", unverified: "v-unv",
};

export function BookmarksPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <Bookmarks />
    </ProtectedRoute>
  );
}

function Bookmarks() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getBookmarks(token, { page, perPage: 12 })
      .then((r) => { setItems(r.items); setLastPage(r.pagination.last_page); setTotal(r.pagination.total); })
      .finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  const onRemove = async (factCheckId: number) => {
    if (!token) return;
    await removeBookmark(token, factCheckId);
    load();
  };

  return (
    <div className="jxu-page">
      <header className="jxu-page-head">
        <h1>{t.userNav.bookmarks} {total > 0 && <span className="jxu-muted">({total})</span>}</h1>
      </header>

      <section className="jxu-card">
        {loading ? <p className="jxu-muted">…</p> : items.length === 0 ? (
          <p className="jxu-muted">No bookmarks yet. <Link href="/facts">{t.userNav.factChecks} →</Link></p>
        ) : (
          <div className="jxu-bm-grid">
            {items.map((b) => b.fact_check && (
              <div key={b.bookmark_id} className="jxu-bm-card">
                <div className="jxu-bm-top">
                  {b.fact_check.verdict && <em className={`jxu-verdict ${VERDICT_CLASS[b.fact_check.verdict] ?? ""}`}>{b.fact_check.verdict}</em>}
                  <button className="jxu-bm-remove" title="Remove" onClick={() => onRemove(b.fact_check!.id)}>✕</button>
                </div>
                <Link href={`/facts/${b.fact_check.slug}`} className="jxu-bm-title">{b.fact_check.title}</Link>
                {b.fact_check.summary && <p className="jxu-bm-summary">{b.fact_check.summary.slice(0, 120)}</p>}
                <small className="jxu-muted">Saved {relativeTime(b.bookmarked_at)}</small>
              </div>
            ))}
          </div>
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
