"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { HistoryItem, getFactCheckHistory } from "@/lib/api";
import { relativeTime } from "@/lib/activity";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const VERDICT_CLASS: Record<string, string> = {
  true: "verdict-true",
  false: "verdict-false",
  misleading: "verdict-misleading",
  unverified: "verdict-unverified",
};

export function FactCheckHistoryPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <FactCheckHistory />
    </ProtectedRoute>
  );
}

function FactCheckHistory() {
  const { token } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getFactCheckHistory(token, { page, perPage: 15 })
      .then((r) => {
        setItems(r.items);
        setLastPage(r.pagination.last_page);
        setTotal(r.pagination.total);
      })
      .finally(() => setLoading(false));
  }, [token, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="jx-dash">
      <div className="jx-dash-topbar">
        <Link href="/user/dashboard" className="jx-back-link">← Dashboard</Link>
        <h1 className="jx-page-title">Fact Check History {total > 0 && <span className="jx-muted">({total})</span>}</h1>
      </div>

      <section className="jx-panel">
        {loading ? (
          <p className="jx-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="jx-muted">You haven&apos;t submitted any claims yet. <Link href="/scan">Verify your first claim →</Link></p>
        ) : (
          <div className="jx-history-table">
            <div className="jx-history-head">
              <span>Claim</span>
              <span>Verdict</span>
              <span>Confidence</span>
              <span>Submitted</span>
            </div>
            {items.map((c) => (
              <Link href={`/results/${c.id}`} key={c.id} className="jx-history-row">
                <span className="jx-history-claim">
                  <em className="jx-history-type">{c.input_type}</em>
                  {c.claim_text ? (c.claim_text.length > 90 ? c.claim_text.slice(0, 90) + "…" : c.claim_text) : "—"}
                </span>
                <span>
                  {c.verdict ? (
                    <em className={`jx-verdict-badge ${VERDICT_CLASS[c.verdict] ?? ""}`}>{c.verdict}</em>
                  ) : (
                    <em className="jx-verdict-badge verdict-pending">{c.status}</em>
                  )}
                </span>
                <span>{c.confidence_score != null ? `${(c.confidence_score).toFixed(2)}` : "—"}</span>
                <span title={c.created_at ?? ""}>{relativeTime(c.created_at)}</span>
              </Link>
            ))}
          </div>
        )}

        {lastPage > 1 && (
          <div className="jx-pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span>Page {page} of {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        )}
      </section>
    </div>
  );
}
