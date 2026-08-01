"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";

const BASE = "/api/v1";

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function verdictBadge(v: string | null) {
  const map: Record<string, [string, string]> = {
    true: ["#dcfce7", "#16a34a"], false: ["#fee2e2", "#dc2626"],
    misleading: ["#ffedd5", "#ea580c"], unverified: ["#f1f5f9", "#64748b"],
  };
  const [bg, color] = map[v ?? ""] ?? ["#f1f5f9", "#64748b"];
  return <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{v ? v.toUpperCase() : "—"}</span>;
}

function publishedBadge(status: string) {
  const published = status === "published";
  return <span style={{ background: published ? "#dcfce7" : "#f1f5f9", color: published ? "#16a34a" : "#64748b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{published ? "Published" : status}</span>;
}

export default function FactChecksPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [publishing, setPublishing] = useState<number | null>(null);
  const PER = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "100" });
      if (search) params.set("q", search);
      const r = await fetch(`${BASE}/admin/fact-checks/completed-claims?${params}`, {
        headers: authHeader(token), cache: "no-store",
      });
      const data = await r.json();
      if (data.success) setItems(data.items ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let f = items.filter(c => c.status === "completed");
    if (verdictFilter !== "all") f = f.filter(c => c.verdict === verdictFilter);
    if (statusFilter !== "all") f = f.filter(c => {
      if (statusFilter === "published") return c.is_published === true;
      if (statusFilter === "draft") return !c.is_published;
      return true;
    });
    setFiltered(f);
    setPage(1);
  }, [items, verdictFilter, statusFilter]);

  const paginated = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));

  const publish = async (claimId: number | string) => {
    setPublishing(claimId as number);
    try {
      const r = await fetch(`${BASE}/admin/fact-checks/from-claim/${claimId}`, {
        method: "POST",
        headers: { ...authHeader(token), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (r.ok) { await load(); setSelected(null); }
    } catch { /* ignore */ } finally {
      setPublishing(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Fact Checks</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>All completed AI fact-check results ready for review and publishing</p>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 12px", flex: 1, minWidth: 200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fact checks…" style={{ border: "none", outline: "none", padding: "9px 0", fontSize: 13, width: "100%", background: "transparent" }} />
        </div>
        <select value={verdictFilter} onChange={e => setVerdictFilter(e.target.value)} style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", background: "#fff", outline: "none" }}>
          <option value="all">All Verdicts</option>
          <option value="true">True</option>
          <option value="false">False</option>
          <option value="misleading">Misleading</option>
          <option value="unverified">Unverified</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", background: "#fff", outline: "none" }}>
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <span style={{ color: "#64748b", fontSize: 12, marginLeft: "auto" }}>{filtered.length} completed fact checks</span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["ID", "Claim", "Final Verdict", "Confidence", "Sources", "Reviewed", "Published", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ width: 24, height: 24, border: "2px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />Loading…
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No completed fact checks found</td></tr>
              ) : paginated.map((c: any) => (
                <tr key={c.claim_id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>#{c.claim_id}</td>
                  <td style={{ padding: "10px 14px", maxWidth: 260 }}>
                    <div style={{ fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(c.claim_text ?? "—").slice(0, 80)}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase" }}>{c.input_type ?? "text"} · {c.language ?? "—"}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>{verdictBadge(c.verdict)}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a", fontSize: 12 }}>
                    {c.confidence_score != null ? `${Math.round(c.confidence_score * 100)}%` : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>{(c.sources ?? []).length}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>{publishedBadge(c.is_published ? "published" : "draft")}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setSelected(c)} style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>View</button>
                      {!c.is_published && (
                        <button onClick={() => publish(c.claim_id)} disabled={publishing === c.claim_id} style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          {publishing === c.claim_id ? "…" : "Publish"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 6, justifyContent: "center" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 12px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: page === 1 ? "#cbd5e1" : "#475569", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12 }}>← Prev</button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ padding: "5px 10px", border: "1px solid", borderColor: page === p ? "#22c55e" : "#e2e8f0", borderRadius: 6, background: page === p ? "#22c55e" : "#fff", color: page === p ? "#fff" : "#475569", cursor: "pointer", fontSize: 12, fontWeight: page === p ? 700 : 400 }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 12px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: page === totalPages ? "#cbd5e1" : "#475569", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 12 }}>Next →</button>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} />
          <div style={{ width: 520, background: "#fff", overflowY: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Fact Check #{selected.claim_id}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13 }}>
              <div style={{ display: "flex", gap: 8 }}>{verdictBadge(selected.verdict)}{publishedBadge(selected.is_published ? "published" : "draft")}</div>
              <div><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>ORIGINAL CLAIM</div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, color: "#0f172a", lineHeight: 1.6 }}>{selected.claim_text ?? "—"}</div>
              </div>
              {selected.explanation && <div><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>AI ANALYSIS</div>
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, color: "#166534", lineHeight: 1.6 }}>{selected.explanation}</div>
              </div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {[["Language", selected.language], ["Confidence", selected.confidence_score != null ? `${Math.round(selected.confidence_score * 100)}%` : "—"], ["Published", selected.is_published ? "Yes" : "No"], ["Reviewed", selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "—"]].map(([k, v]) => (
                  <div key={k}><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{k}</div><div style={{ color: "#0f172a", fontWeight: 500 }}>{v ?? "—"}</div></div>
                ))}
              </div>
              {(selected.sources ?? []).length > 0 && <div><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>EVIDENCE SOURCES ({selected.sources.length})</div>
                {selected.sources.map((s: any, i: number) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 500, fontSize: 12 }}>{s.title ?? s.source ?? s.url}</a>
                    {s.reliability_score && <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 8 }}>Reliability: {Math.round(s.reliability_score * 100)}%</span>}
                  </div>
                ))}
              </div>}
              {selected.public_fact_check?.status !== "published" && (
                <button onClick={() => publish(selected.claim_id)} disabled={publishing === selected.claim_id} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                  {publishing === selected.id ? "Publishing…" : "Publish Fact Check"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
