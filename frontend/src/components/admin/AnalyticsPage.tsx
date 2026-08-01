"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const BASE = "/api/v1";
const FONT = "var(--font-body, 'IBM Plex Sans', 'Inter', sans-serif)";
const FONT_DISPLAY = "var(--font-display, 'Space Grotesk', sans-serif)";

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", fontFamily: FONT_DISPLAY }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

const KPI_META = [
  { key: "claims",      bg: "#f0fdf4", stroke: "#22c55e", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { key: "check",       bg: "#eff6ff", stroke: "#3b82f6", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg> },
  { key: "confidence",  bg: "#f5f3ff", stroke: "#8b5cf6", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
  { key: "pending",     bg: "#fff7ed", stroke: "#f97316", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { key: "failed",      bg: "#fef2f2", stroke: "#ef4444", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  { key: "human",       bg: "#eef2ff", stroke: "#6366f1", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

function KPICard({ metaKey, label, value, sub }: { metaKey: string; label: string; value: string | number; sub: string }) {
  const m = KPI_META.find(k => k.key === metaKey)!;
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px", flex: 1, minWidth: 140, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.icon}</div>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5, fontFamily: FONT_DISPLAY }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function LegendItem({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: FONT }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ color: "#475569", flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#0f172a", minWidth: 24, textAlign: "right" }}>{value}</span>
      <span style={{ color: "#94a3b8", fontSize: 11, width: 44, textAlign: "right" }}>({pct}%)</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontFamily: FONT }}>
      <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          {p.name}: <span style={{ fontWeight: 700, color: "#0f172a", marginLeft: 4 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// Fetch ALL pages from the API
async function fetchAllClaims(token: string | null): Promise<any[]> {
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const first = await fetch(`${BASE}/admin/fact-checks/completed-claims?per_page=100&page=1`, {
    headers, cache: "no-store",
  });
  if (!first.ok) throw new Error(`${first.status}`);
  const data = await first.json();
  const items: any[] = data.items ?? [];
  const lastPage: number = data.pagination?.last_page ?? 1;

  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        fetch(`${BASE}/admin/fact-checks/completed-claims?per_page=100&page=${i + 2}`, { headers, cache: "no-store" })
          .then(r => r.json())
          .then(d => d.items ?? [])
          .catch(() => [])
      )
    );
    rest.forEach(page => items.push(...page));
  }
  return items;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7 Days");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAllClaims(token);
      setClaims(items);
    } catch (e: any) {
      setError(e.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // ── Derived metrics ──────────────────────────────────────────────
  // API field: claim_id, status, claim_text, language, verdict,
  //            confidence_score, explanation, created_at, is_published, fact_check

  const total = claims.length;
  const completed = claims.filter(c => c.status === "completed");
  const pending   = claims.filter(c => c.status === "pending" || c.status === "processing");
  const failed    = claims.filter(c => c.status === "failed");
  const published = claims.filter(c => c.is_published);
  const avgConf   = completed.length
    ? Math.round(completed.reduce((a, c) => a + (c.confidence_score ?? 0), 0) / completed.length * 100)
    : 0;

  const pct = (n: number, of = total) => of ? Math.round(n / of * 100) : 0;

  const verdictData = [
    { name: "True",         value: claims.filter(c => c.verdict === "true").length,        color: "#22c55e" },
    { name: "False",        value: claims.filter(c => c.verdict === "false").length,       color: "#ef4444" },
    { name: "Misleading",   value: claims.filter(c => c.verdict === "misleading").length,  color: "#f97316" },
    { name: "Unverified",   value: claims.filter(c => !c.verdict || c.verdict === "unverified").length, color: "#94a3b8" },
    { name: "Under Review", value: 0, color: "#8b5cf6" }, // populated below
  ];

  // Language normalisation using actual backend codes
  const langMap: Record<string, number> = {};
  claims.forEach(c => {
    const l = (c.language ?? "").toLowerCase();
    const name = l === "bn" || l === "bangla" ? "Bangla"
      : l === "en" || l === "english" ? "English"
      : l === "banglish" ? "Bengali (Romanized)"
      : l ? l.toUpperCase() : "Unknown";
    langMap[name] = (langMap[name] ?? 0) + 1;
  });
  const langEntries = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
  const LANG_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6"];
  const langData = langEntries.slice(0, 6).map(([name, value], i) => ({ name, value, color: LANG_COLORS[i] ?? "#94a3b8" }));
  const langTotal = langData.reduce((a, b) => a + b.value, 0);

  // Volume over time ─ seed every day in range
  const rangeDays = dateRange === "7 Days" ? 7 : dateRange === "30 Days" ? 30 : 90;
  const now = new Date();
  const cutoff = new Date(now.getTime() - rangeDays * 86_400_000);
  const buckets: Record<string, { date: string; submitted: number; completed: number; failed: number }> = {};
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets[key] = { date: key, submitted: 0, completed: 0, failed: 0 };
  }
  claims.forEach(c => {
    if (!c.created_at) return;
    const dt = new Date(c.created_at);
    if (dt < cutoff) return;
    const key = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!buckets[key]) buckets[key] = { date: key, submitted: 0, completed: 0, failed: 0 };
    buckets[key].submitted++;
    if (c.status === "completed") buckets[key].completed++;
    if (c.status === "failed")    buckets[key].failed++;
  });
  const volumeData = Object.values(buckets);

  // Confidence buckets (completed only)
  const confBuckets = [
    { range: "0-20%",   count: completed.filter(c => (c.confidence_score ?? 0) < 0.2).length },
    { range: "20-40%",  count: completed.filter(c => { const s = c.confidence_score ?? 0; return s >= 0.2 && s < 0.4; }).length },
    { range: "40-60%",  count: completed.filter(c => { const s = c.confidence_score ?? 0; return s >= 0.4 && s < 0.6; }).length },
    { range: "60-80%",  count: completed.filter(c => { const s = c.confidence_score ?? 0; return s >= 0.6 && s < 0.8; }).length },
    { range: "80-100%", count: completed.filter(c => (c.confidence_score ?? 0) >= 0.8).length },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, fontFamily: FONT }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center", color: "#64748b" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        Loading analytics…
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, fontFamily: FONT }}>
      <div style={{ textAlign: "center", color: "#ef4444" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to load: {error}</div>
        <button onClick={load} style={{ marginTop: 12, background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: FONT }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: FONT_DISPLAY }}>Analytics</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Platform performance metrics · <strong style={{ color: "#0f172a" }}>{total}</strong> total claims loaded
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <KPICard metaKey="claims"     label="Total Claims"            value={total.toLocaleString()}         sub="All time" />
        <KPICard metaKey="check"      label="Completed Reviews"       value={completed.length.toLocaleString()} sub={`${pct(completed.length)}% completion rate`} />
        <KPICard metaKey="confidence" label="Avg Confidence"          value={`${avgConf}%`}                  sub="Across completed claims" />
        <KPICard metaKey="pending"    label="Pending / Processing"    value={pending.length}                 sub="In queue" />
        <KPICard metaKey="failed"     label="Failed"                  value={failed.length}                  sub={`${pct(failed.length)}% failure rate`} />
        <KPICard metaKey="human"      label="Published Fact Checks"   value={published.length}               sub="Live on public hub" />
      </div>

      {/* Volume chart */}
      <Card title="Claims Volume Over Time" action={
        <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
          {["7 Days", "30 Days", "90 Days"].map(r => (
            <button key={r} onClick={() => setDateRange(r)} style={{
              padding: "5px 12px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
              background: dateRange === r ? "#f0fdf4" : "#fff",
              color: dateRange === r ? "#16a34a" : "#64748b",
              borderRight: r !== "90 Days" ? "1px solid #e2e8f0" : "none",
            }}>{r}</button>
          ))}
        </div>
      }>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={volumeData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontFamily: FONT, paddingTop: 8 }} />
            <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Completed" activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="failed"    stroke="#ef4444" strokeWidth={2}   dot={false} name="Failed"    strokeDasharray="4 2" activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="submitted" stroke="#3b82f6" strokeWidth={2}   dot={false} name="Submitted" activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Verdict + Language */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <Card title="Verdict Distribution">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <PieChart width={150} height={150}>
              <Pie data={verdictData} cx={70} cy={70} innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}>
                {verdictData.map((e, i) => <Cell key={i} fill={e.value > 0 ? e.color : "#e2e8f0"} />)}
              </Pie>
            </PieChart>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {verdictData.map(v => (
                <LegendItem key={v.name} color={v.color} label={v.name} value={v.value} pct={pct(v.value)} />
              ))}
            </div>
          </div>
        </Card>

        <Card title="Claims by Language">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <PieChart width={150} height={150}>
              <Pie data={langData.length ? langData : [{ name: "No data", value: 1, color: "#e2e8f0" }]} cx={70} cy={70} innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}>
                {(langData.length ? langData : [{ color: "#e2e8f0" }]).map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {langData.map(v => (
                <LegendItem key={v.name} color={v.color} label={v.name} value={v.value} pct={pct(v.value, langTotal)} />
              ))}
              {langData.length === 0 && <div style={{ color: "#94a3b8", fontSize: 12 }}>No data</div>}
            </div>
          </div>
        </Card>
      </div>

      {/* Confidence + Status breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <Card title="Confidence Score Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confBuckets} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Claims" maxBarSize={52} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Status Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: "Completed", value: completed.length, fill: "#22c55e" },
                { name: "Pending",   value: pending.length,   fill: "#f97316" },
                { name: "Failed",    value: failed.length,    fill: "#ef4444" },
                { name: "Published", value: published.length, fill: "#3b82f6" },
              ]}
              margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: FONT }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} maxBarSize={52}>
                {[{ fill: "#22c55e" }, { fill: "#f97316" }, { fill: "#ef4444" }, { fill: "#3b82f6" }].map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
