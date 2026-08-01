"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const BASE = "/api/v1";
const VERDICT_COLORS: Record<string, string> = {
  true: "#22c55e", false: "#ef4444", misleading: "#f97316", unverified: "#94a3b8",
};

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url: string, token: string | null) {
  const r = await fetch(url, {
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

function StatCard({ label, value, sub, color = "#22c55e" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
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

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ totalClaims: 0, reviewed: 0, published: 0, queue: 0 });
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [verdictDist, setVerdictDist] = useState<{ name: string; value: number; color: string }[]>([]);
  const [claimTypes, setClaimTypes] = useState<{ name: string; value: number; color: string }[]>([]);
  const [claimsOverview, setClaimsOverview] = useState<{ date: string; submitted: number; completed: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [completedRes, factChecksRes] = await Promise.allSettled([
        apiFetch(`${BASE}/admin/fact-checks/completed-claims?per_page=100`, token),
        apiFetch(`${BASE}/public/fact-checks?per_page=100`, token),
      ]);

      let allClaims: any[] = [];
      let totalClaims = 0;
      if (completedRes.status === "fulfilled" && completedRes.value?.success) {
        allClaims = completedRes.value.items ?? [];
        totalClaims = completedRes.value.pagination?.total ?? allClaims.length;
      }

      let published = 0;
      if (factChecksRes.status === "fulfilled" && factChecksRes.value?.success) {
        published = factChecksRes.value.pagination?.total ?? (factChecksRes.value.items ?? []).length;
      }

      // Verdict distribution
      const vCount: Record<string, number> = { true: 0, false: 0, misleading: 0, unverified: 0 };
      allClaims.forEach((c: any) => {
        const v = c.verdict ?? "unverified";
        if (v in vCount) vCount[v]++;
        else vCount.unverified++;
      });
      setVerdictDist(Object.entries(vCount).map(([name, value]) => ({
        name: name.toUpperCase(), value, color: VERDICT_COLORS[name] ?? "#94a3b8",
      })));

      // Type distribution — input_type is not returned by admin endpoint; show all as "Text"
      setClaimTypes([
        { name: "Text", value: allClaims.length, color: "#3b82f6" },
        { name: "Image", value: 0, color: "#8b5cf6" },
        { name: "PDF", value: 0, color: "#f97316" },
        { name: "URL", value: 0, color: "#22c55e" },
      ]);

      // Claims overview by date (last 7 unique dates)
      const byDate: Record<string, { submitted: number; completed: number }> = {};
      allClaims.forEach((c: any) => {
        const d = c.created_at
          ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Unknown";
        if (!byDate[d]) byDate[d] = { submitted: 0, completed: 0 };
        byDate[d].submitted++;
        if (c.status === "completed") byDate[d].completed++;
      });
      const overview = Object.entries(byDate).slice(-7).map(([date, v]) => ({ date, ...v }));
      setClaimsOverview(overview.length ? overview : [{ date: "No data", submitted: 0, completed: 0 }]);

      const queueCount = allClaims.filter((c: any) => c.status === "completed" && !c.is_published).length;
      setStats({ totalClaims, reviewed: allClaims.filter((c: any) => c.status === "completed").length, published, queue: queueCount });
      setRecentClaims(allClaims.slice(0, 8));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Admin Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Overview of platform activity and system performance</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Claims" value={stats.totalClaims.toLocaleString()} sub="All submitted claims" />
        <StatCard label="Reviewed Claims" value={stats.reviewed.toLocaleString()} sub="AI-completed reviews" />
        <StatCard label="Published Fact-Checks" value={stats.published.toLocaleString()} sub="Live on public hub" />
        <StatCard label="Human Review Queue" value={stats.queue} sub="Pending human review" color="#f97316" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card title="Claims Overview">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={claimsOverview}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="submitted" stroke="#3b82f6" strokeWidth={2} dot={false} name="Submitted" />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={false} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Verdict Distribution">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={verdictDist} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={2}>
                  {verdictDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
              {verdictDist.map(v => (
                <div key={v.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color, flexShrink: 0 }} />
                  <span style={{ color: "#64748b", flex: 1 }}>{v.name}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{v.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Claims by Type">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={claimTypes} layout="vertical" margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {claimTypes.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent claims table */}
      <Card title="Recent Claims">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                {["Claim ID", "Content", "Type", "Language", "Submitted", "Status", "Verdict"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentClaims.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No claims found</td></tr>
              ) : recentClaims.map((c: any) => (
                <tr key={c.claim_id} style={{ borderBottom: "1px solid #f8fafc" }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>#{c.claim_id}</td>
                  <td style={{ padding: "10px 12px", maxWidth: 220 }}>
                    <div style={{ fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(c.claim_text ?? c.title ?? "—").slice(0, 70)}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>text</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", textTransform: "uppercase", fontSize: 11 }}>{c.language ?? "—"}</td>
                  <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap", fontSize: 11 }}>
                    {c.created_at ? new Date(c.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>{statusBadge(c.status ?? "pending")}</td>
                  <td style={{ padding: "10px 12px" }}>{verdictBadge(c.verdict)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
