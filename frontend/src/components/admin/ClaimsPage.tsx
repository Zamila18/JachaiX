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

function statusBadge(s: string) {
  const map: Record<string, [string, string]> = {
    completed: ["#dcfce7", "#16a34a"], pending: ["#fef3c7", "#d97706"],
    processing: ["#dbeafe", "#2563eb"], failed: ["#fee2e2", "#dc2626"],
  };
  const [bg, color] = map[s] ?? ["#f1f5f9", "#64748b"];
  return <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{s}</span>;
}

function typeBadge(t: string) {
  const map: Record<string, string> = { text: "#3b82f6", image: "#8b5cf6", pdf: "#f97316", url: "#22c55e" };
  const color = map[t] ?? "#64748b";
  return <span style={{ background: color + "20", color, padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{t}</span>;
}

export default function ClaimsPage() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
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
      if (data.success) {
        setClaims(data.items ?? []);
        setTotal(data.pagination?.total ?? (data.items ?? []).length);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let f = [...claims];
    if (statusFilter !== "all") f = f.filter(c => c.status === statusFilter);
    if (verdictFilter !== "all") f = f.filter(c => c.verdict === verdictFilter);
    setFiltered(f);
    setPage(1);
  }, [claims, statusFilter, verdictFilter]);

  const paginated = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Claims</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>All submitted claims across text, image, PDF and URL types</p>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 12px", flex: 1, minWidth: 200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claims…" style={{ border: "none", outline: "none", padding: "9px 0", fontSize: 13, width: "100%", background: "transparent" }} />
        </div>
        {[
          { label: "Status", value: statusFilter, set: setStatusFilter, opts: [["all","All Status"],["pending","Pending"],["processing","Processing"],["completed","Completed"],["failed","Failed"]] },
          { label: "Verdict", value: verdictFilter, set: setVerdictFilter, opts: [["all","All Verdicts"],["true","True"],["false","False"],["misleading","Misleading"],["unverified","Unverified"]] },
        ].map(({ value, set, opts }) => (
          <select key={opts[0][0]} value={value} onChange={e => set(e.target.value)} style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", background: "#fff", cursor: "pointer", outline: "none" }}>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <span style={{ color: "#64748b", fontSize: 12, marginLeft: "auto" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Claim ID", "Content", "Type", "Language", "Status", "Submitted", "AI Verdict", "Confidence", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ width: 24, height: 24, border: "2px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                  Loading…
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No claims match your filters</td></tr>
              ) : paginated.map((c: any) => (
                <tr key={c.claim_id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>#{c.claim_id}</td>
                  <td style={{ padding: "10px 14px", maxWidth: 240 }}>
                    <div style={{ fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(c.claim_text ?? c.title ?? "—").slice(0, 80)}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>{typeBadge("text")}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b", textTransform: "uppercase", fontSize: 11 }}>{c.language ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>{statusBadge(c.status ?? "pending")}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>{verdictBadge(c.verdict)}</td>
                  <td style={{ padding: "10px 14px", color: "#0f172a", fontWeight: 600, fontSize: 12 }}>
                    {c.confidence_score != null ? `${Math.round(c.confidence_score * 100)}%` : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={() => setSelected(c)} style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 12px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: page === 1 ? "#cbd5e1" : "#475569", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12 }}>← Prev</button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = i + 1;
              return <button key={p} onClick={() => setPage(p)} style={{ padding: "5px 10px", border: "1px solid", borderColor: page === p ? "#22c55e" : "#e2e8f0", borderRadius: 6, background: page === p ? "#22c55e" : "#fff", color: page === p ? "#fff" : "#475569", cursor: "pointer", fontSize: 12, fontWeight: page === p ? 700 : 400 }}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 12px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: page === totalPages ? "#cbd5e1" : "#475569", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 12 }}>Next →</button>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} />
          <div style={{ width: 480, background: "#fff", overflowY: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Claim #{selected.claim_id}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13 }}>
              <div><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>STATUS / VERDICT</div>
                <div style={{ display: "flex", gap: 8 }}>{statusBadge(selected.status)}{verdictBadge(selected.verdict)}</div>
              </div>
              <div><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>CLAIM TEXT</div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, color: "#0f172a", lineHeight: 1.6 }}>{selected.claim_text ?? "—"}</div>
              </div>
              {selected.explanation && <div><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>AI EXPLANATION</div>
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, color: "#166534", lineHeight: 1.6 }}>{selected.explanation}</div>
              </div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Language", selected.language], ["Confidence", selected.confidence_score != null ? `${Math.round(selected.confidence_score * 100)}%` : "—"], ["Published", selected.is_published ? "Yes" : "No"], ["Submitted", selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"]].map(([k, v]) => (
                  <div key={k}><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{k}</div><div style={{ color: "#0f172a", fontWeight: 500 }}>{v ?? "—"}</div></div>
                ))}
              </div>
              {(selected.sources ?? []).length > 0 && <div><div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>SOURCES</div>
                {selected.sources.slice(0, 5).map((s: any, i: number) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 500 }}>{s.title ?? s.source ?? s.url}</a>
                  </div>
                ))}
              </div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
