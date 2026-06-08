"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { HistoryItem, getMyClaims } from "@/lib/api";
import { relativeTime } from "@/lib/activity";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const VERDICT_CLASS: Record<string, string> = {
  true: "v-true", false: "v-false", misleading: "v-mis", unverified: "v-unv",
};
const FILTERS = ["", "true", "false", "misleading", "unverified"];

export function MyClaimsPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <MyClaims />
    </ProtectedRoute>
  );
}

function MyClaims() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getMyClaims(token, { page, perPage: 15, verdict: verdict || undefined })
      .then((r) => { setItems(r.items); setLastPage(r.pagination.last_page); setTotal(r.pagination.total); })
      .finally(() => setLoading(false));
  }, [token, page, verdict]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="jxu-page">
      <header className="jxu-page-head">
        <h1>{t.userNav.myClaims} {total > 0 && <span className="jxu-muted">({total})</span>}</h1>
      </header>

      <div className="jxu-chip-row">
        {FILTERS.map((f) => (
          <button key={f || "all"} className={`jxu-chip ${verdict === f ? "active" : ""}`}
            onClick={() => { setVerdict(f); setPage(1); }}>
            {f === "" ? "All" : f}
          </button>
        ))}
      </div>

      <section className="jxu-card">
        {loading ? <p className="jxu-muted">…</p> : items.length === 0 ? (
          <p className="jxu-muted">{t.dash.noClaims} <Link href="/scan">{t.dash.verifyNew} →</Link></p>
        ) : (
          <div className="jxu-table">
            <div className="jxu-table-head">
              <span>{t.dash.recentClaims}</span><span>{t.dash.verdict}</span><span>{t.dash.confidence}</span><span>{t.dash.submitted}</span>
            </div>
            {items.map((c) => (
              <Link href={`/results/${c.id}`} key={c.id} className="jxu-table-row">
                <span className="jxu-cell-claim">
                  <em className="jxu-type">{c.input_type}</em>
                  {c.claim_text ? (c.claim_text.length > 80 ? c.claim_text.slice(0, 80) + "…" : c.claim_text) : "—"}
                </span>
                <span>{c.verdict
                  ? <em className={`jxu-verdict ${VERDICT_CLASS[c.verdict] ?? ""}`}>{c.verdict}</em>
                  : <em className="jxu-verdict v-pending">{c.status}</em>}</span>
                <span>{c.confidence_score != null ? c.confidence_score.toFixed(2) : "—"}</span>
                <span title={c.created_at ?? ""}>{relativeTime(c.created_at)}</span>
              </Link>
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
