"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";

const BASE = "/api/v1";

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function eventBadge(event: string) {
  const map: Record<string, [string, string]> = {
    claim_submitted: ["#dbeafe", "#2563eb"],
    human_review_requested: ["#fef3c7", "#d97706"],
    error: ["#fee2e2", "#dc2626"],
    completed: ["#dcfce7", "#16a34a"],
  };
  const [bg, color] = map[event] ?? ["#f1f5f9", "#64748b"];
  return <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{event.replace(/_/g, " ")}</span>;
}

export default function AuditLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Audit logs come from the completed claims — each claim has audit events
      const r = await fetch(`${BASE}/admin/fact-checks/completed-claims?per_page=200`, {
        headers: authHeader(token), cache: "no-store",
      });
      const data = await r.json();
      if (data.success) {
        // Build audit log entries from claims
        const entries: any[] = [];
        (data.items ?? []).forEach((claim: any) => {
          const cid = claim.claim_id;
          entries.push({
            id: `${cid}-submitted`,
            event: "claim_submitted",
            entity: `Claim #${cid}`,
            entity_id: cid,
            details: `text claim submitted (${claim.language ?? "unknown"})`,
            timestamp: claim.created_at,
            result: "success",
          });
          if (claim.status === "completed") {
            entries.push({
              id: `${cid}-completed`,
              event: "completed",
              entity: `Claim #${cid}`,
              entity_id: cid,
              details: `Verdict: ${claim.verdict ?? "unverified"} (${claim.confidence_score != null ? Math.round(claim.confidence_score * 100) + "% confidence" : "no score"})`,
              timestamp: claim.created_at,
              result: "success",
            });
          }
          if (claim.status === "completed" && !claim.is_published) {
            entries.push({
              id: `${cid}-review`,
              event: "human_review_requested",
              entity: `Claim #${cid}`,
              entity_id: cid,
              details: "Awaiting human review before publishing",
              timestamp: claim.created_at,
              result: "pending",
            });
          }
          if (claim.status === "failed") {
            entries.push({
              id: `${cid}-error`,
              event: "error",
              entity: `Claim #${cid}`,
              entity_id: cid,
              details: claim.failure_reason ?? "Processing error",
              timestamp: claim.created_at,
              result: "error",
            });
          }
        });
        entries.sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());
        setLogs(entries);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let f = [...logs];
    if (eventFilter !== "all") f = f.filter(l => l.event === eventFilter);
    if (search) f = f.filter(l => l.entity?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(f);
    setPage(1);
  }, [logs, eventFilter, search]);

  const paginated = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Audit Logs</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Platform activity trail — claim submissions, completions, review flags, and errors</p>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 12px", flex: 1, minWidth: 200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…" style={{ border: "none", outline: "none", padding: "9px 0", fontSize: 13, width: "100%", background: "transparent" }} />
        </div>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", background: "#fff", outline: "none" }}>
          <option value="all">All Events</option>
          <option value="claim_submitted">Claim Submitted</option>
          <option value="completed">Completed</option>
          <option value="human_review_requested">Human Review</option>
          <option value="error">Error</option>
        </select>
        <button onClick={load} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
          Refresh
        </button>
        <span style={{ color: "#64748b", fontSize: 12, marginLeft: "auto" }}>{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Event", "Entity", "Details", "Timestamp", "Result"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ width: 24, height: 24, border: "2px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />Loading…
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No audit logs found</td></tr>
              ) : paginated.map((l: any) => (
                <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "10px 14px" }}>{eventBadge(l.event)}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a", fontSize: 12 }}>{l.entity}</td>
                  <td style={{ padding: "10px 14px", color: "#475569", maxWidth: 320 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.details}</div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>
                    {l.timestamp ? new Date(l.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      background: l.result === "success" ? "#dcfce7" : l.result === "error" ? "#fee2e2" : "#fef3c7",
                      color: l.result === "success" ? "#16a34a" : l.result === "error" ? "#dc2626" : "#d97706",
                      padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                    }}>{l.result}</span>
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
    </div>
  );
}
