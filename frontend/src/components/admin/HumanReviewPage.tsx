"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";

const BASE = "/api/v1";

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function priorityBadge(score: number | null) {
  if (score == null) return <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Low</span>;
  if (score >= 0.8) return <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>High</span>;
  if (score >= 0.5) return <span style={{ background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Medium</span>;
  return <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Low</span>;
}

function verdictBadge(v: string | null) {
  const map: Record<string, [string, string]> = {
    true: ["#dcfce7", "#16a34a"], false: ["#fee2e2", "#dc2626"],
    misleading: ["#ffedd5", "#ea580c"], unverified: ["#f1f5f9", "#64748b"],
  };
  const [bg, color] = map[v ?? ""] ?? ["#f1f5f9", "#64748b"];
  return <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{v ? v.toUpperCase() : "—"}</span>;
}

const VERDICTS = ["true", "false", "misleading", "unverified"] as const;

export default function HumanReviewPage() {
  const { token } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [reviewVerdict, setReviewVerdict] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/fact-checks/completed-claims?per_page=100`, {
        headers: authHeader(token), cache: "no-store",
      });
      const data = await r.json();
      if (data.success) {
        // Show completed claims not yet published as the human review queue
        const needsReview = (data.items ?? []).filter((c: any) => c.status === "completed" && !c.is_published);
        setQueue(needsReview);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (priorityFilter === "all") { setFiltered(queue); return; }
    setFiltered(queue.filter((c: any) => {
      const score = c.confidence_score ?? 0;
      if (priorityFilter === "high") return score >= 0.8;
      if (priorityFilter === "medium") return score >= 0.5 && score < 0.8;
      return score < 0.5;
    }));
  }, [queue, priorityFilter]);

  useEffect(() => {
    if (selected) { setReviewVerdict(selected.verdict ?? ""); setReviewNotes(""); setSubmitMsg(""); }
  }, [selected]);

  const submitReview = async () => {
    if (!selected || !reviewVerdict) return;
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const r = await fetch(`${BASE}/admin/fact-checks/from-claim/${selected.claim_id}`, {
        method: "POST",
        headers: { ...authHeader(token), "Content-Type": "application/json" },
        body: JSON.stringify({ verdict: reviewVerdict, status: "published", summary: reviewNotes || undefined }),
      });
      if (r.ok) { setSubmitMsg("Review submitted successfully."); await load(); setTimeout(() => setSelected(null), 1200); }
      else setSubmitMsg("Failed to submit review. Please try again.");
    } catch { setSubmitMsg("Network error. Please try again."); } finally { setSubmitting(false); }
  };

  const high = queue.filter(c => (c.confidence_score ?? 0) >= 0.8).length;
  const medium = queue.filter(c => { const s = c.confidence_score ?? 0; return s >= 0.5 && s < 0.8; }).length;
  const low = queue.filter(c => (c.confidence_score ?? 0) < 0.5).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Human Review</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Claims flagged by AI for human verification — sourced from the admin queue</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 14 }}>
        {[
          { label: "High Priority", count: high, color: "#ef4444", bg: "#fee2e2" },
          { label: "Medium Priority", count: medium, color: "#f97316", bg: "#ffedd5" },
          { label: "Low Priority", count: low, color: "#64748b", bg: "#f1f5f9" },
          { label: "Total in Queue", count: queue.length, color: "#2563eb", bg: "#dbeafe" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", flex: 1 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{count}</div>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: color, marginTop: 8 }} />
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 20px", display: "flex", gap: 8 }}>
        {[["all","All"], ["high","High Priority"], ["medium","Medium Priority"], ["low","Low Priority"]].map(([v, l]) => (
          <button key={v} onClick={() => setPriorityFilter(v)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
            borderColor: priorityFilter === v ? "#22c55e" : "#e2e8f0",
            background: priorityFilter === v ? "#f0fdf4" : "#fff",
            color: priorityFilter === v ? "#16a34a" : "#475569",
          }}>{l}</button>
        ))}
        <span style={{ marginLeft: "auto", color: "#64748b", fontSize: 12, alignSelf: "center" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Queue table */}
        <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: 24, height: 24, border: "2px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />Loading queue…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              No items in review queue
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Claim ID", "Content", "Type", "AI Verdict", "Confidence", "Priority", "Submitted"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c.claim_id} onClick={() => setSelected(c)}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: selected?.claim_id === c.claim_id ? "#f0fdf4" : "" }}
                    onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = ""; }}>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>#{c.claim_id}</td>
                    <td style={{ padding: "10px 14px", maxWidth: 200 }}>
                      <div style={{ fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(c.claim_text ?? "—").slice(0, 60)}
                      </div>
                      {c.review_request && (c.review_request.reason || c.review_request.notes) && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, background: "#eff6ff", color: "#2563eb", padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          User asked
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 7px", borderRadius: 4, fontSize: 11 }}>text</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>{verdictBadge(c.verdict)}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12, color: "#0f172a" }}>
                      {c.confidence_score != null ? `${Math.round(c.confidence_score * 100)}%` : "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>{priorityBadge(c.confidence_score)}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Review panel */}
        {selected ? (
          <div style={{ width: 380, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, flexShrink: 0, position: "sticky", top: 80 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Review Claim #{selected.claim_id}</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>CLAIM CONTENT</div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, color: "#0f172a", lineHeight: 1.6, fontSize: 12, maxHeight: 120, overflowY: "auto" }}>{selected.claim_text ?? "—"}</div>
              </div>
              {selected.review_request && (selected.review_request.reason || selected.review_request.notes) && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#2563eb", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    USER&apos;S REVIEW REQUEST
                  </div>
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 10, color: "#1e3a8a", fontSize: 12, lineHeight: 1.6, maxHeight: 140, overflowY: "auto" }}>
                    {selected.review_request.reason && (
                      <div style={{ fontWeight: 600, marginBottom: selected.review_request.notes ? 6 : 0 }}>{selected.review_request.reason}</div>
                    )}
                    {selected.review_request.notes && <div>{selected.review_request.notes}</div>}
                  </div>
                </div>
              )}
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>AI REASON FOR FLAGGING</div>
                <div style={{ background: "#fef9c3", borderRadius: 8, padding: 10, color: "#854d0e", fontSize: 12, lineHeight: 1.5 }}>AI confidence: {selected.confidence_score != null ? `${Math.round(selected.confidence_score * 100)}%` : "—"}. Requires human verification before publishing.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, fontSize: 12 }}>
                {[["AI Verdict", verdictBadge(selected.verdict)], ["Confidence", `${Math.round((selected.confidence_score ?? 0) * 100)}%`], ["Language", selected.language ?? "—"], ["Published", selected.is_published ? "Yes" : "No"]].map(([k, v]) => (
                  <div key={k as string}><div style={{ color: "#64748b", fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{k}</div><div>{typeof v === "string" ? <span style={{ color: "#0f172a", fontWeight: 500 }}>{v}</span> : v}</div></div>
                ))}
              </div>
              {selected.explanation && <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>AI EXPLANATION</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}>{selected.explanation}</div>
              </div>}
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>YOUR VERDICT</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 6 }}>
                  {VERDICTS.map(v => (
                    <button key={v} onClick={() => setReviewVerdict(v)} style={{
                      padding: "8px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "2px solid",
                      borderColor: reviewVerdict === v ? "#22c55e" : "#e2e8f0",
                      background: reviewVerdict === v ? "#f0fdf4" : "#fff",
                      color: reviewVerdict === v ? "#16a34a" : "#475569",
                    }}>{v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  {selected.review_request ? "YOUR REPLY (published to the user)" : "REVIEW NOTES (published to the user)"}
                </div>
                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder={selected.review_request ? "Reply to the user's question…" : "Add notes for this review…"} rows={3} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 10, fontSize: 12, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              </div>
              {submitMsg && <div style={{ background: submitMsg.includes("success") ? "#f0fdf4" : "#fee2e2", color: submitMsg.includes("success") ? "#16a34a" : "#dc2626", padding: 10, borderRadius: 6, fontSize: 12 }}>{submitMsg}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submitReview} disabled={!reviewVerdict || submitting} style={{ flex: 1, background: reviewVerdict && !submitting ? "#22c55e" : "#e2e8f0", color: reviewVerdict && !submitting ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: reviewVerdict && !submitting ? "pointer" : "not-allowed" }}>
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
                <button onClick={() => setSelected(null)} style={{ padding: "10px 14px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: 280, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, flexShrink: 0, textAlign: "center", color: "#94a3b8" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <div style={{ fontSize: 13 }}>Select a claim to begin review</div>
          </div>
        )}
      </div>
    </div>
  );
}
