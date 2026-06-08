"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import {
  ActivityItem, ActivityStatistics, HistoryItem,
  getActivityStatistics, getRecentActivity, getMyClaims, getFeaturedFactChecks,
} from "@/lib/api";
import { PublicFactCheckListItem } from "@/lib/types";
import { activityIcon, activityTone, relativeTime } from "@/lib/activity";
import Link from "next/link";
import { useEffect, useState } from "react";

export function UserDashboardPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <Dashboard />
    </ProtectedRoute>
  );
}

const VERDICT_CLASS: Record<string, string> = {
  true: "v-true", false: "v-false", misleading: "v-mis", unverified: "v-unv",
};

function Dashboard() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<ActivityStatistics | null>(null);
  const [recent, setRecent] = useState<ActivityItem[]>([]);
  const [claims, setClaims] = useState<HistoryItem[]>([]);
  const [trending, setTrending] = useState<PublicFactCheckListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      getActivityStatistics(token),
      getRecentActivity(token, 6),
      getMyClaims(token, { perPage: 5 }),
      getFeaturedFactChecks().catch(() => ({ items: [] as PublicFactCheckListItem[] })),
    ])
      .then(([s, r, c, f]) => {
        if (!active) return;
        setStats(s.statistics);
        setRecent(r.items);
        setClaims(c.items);
        setTrending((f.items ?? []).slice(0, 4));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  const tot = stats?.totals;
  const v = stats?.verdicts;
  const m = stats?.usage_this_month;
  const pct = tot?.claims_change_pct ?? 0;

  return (
    <div className="jxu-page">
      <header className="jxu-dash-head">
        <div>
          <h1>{t.dash.welcomeBack}, {user?.first_name}! 👋</h1>
          <p>{t.dash.subtitle}</p>
        </div>
        <Link href="/scan" className="jxu-btn">+ {t.dash.verifyNew}</Link>
      </header>

      {/* Stat cards */}
      <div className="jxu-stat-grid">
        <StatCard label={t.dash.claimsVerified} value={tot?.claims_verified} tone="green" loading={loading}
          sub={`${pct >= 0 ? "↑" : "↓"} ${Math.abs(pct)}% ${t.dash.vsLastMonth}`} subTone={pct >= 0 ? "up" : "down"} />
        <StatCard label={t.dash.verdictTrue} value={v?.true} tone="green" loading={loading} sub={proportion(v?.true, tot?.claims)} />
        <StatCard label={t.dash.verdictFalse} value={v?.false} tone="red" loading={loading} sub={proportion(v?.false, tot?.claims)} />
        <StatCard label={t.dash.verdictMisleading} value={v?.misleading} tone="amber" loading={loading} sub={proportion(v?.misleading, tot?.claims)} />
        <StatCard label={t.dash.verdictUnverified} value={v?.unverified} tone="gray" loading={loading} sub={proportion(v?.unverified, tot?.claims)} />
      </div>

      <div className="jxu-dash-cols">
        {/* Recent claims */}
        <section className="jxu-card">
          <div className="jxu-card-head">
            <h2>{t.dash.recentClaims}</h2>
            <Link href="/user/claims">{t.dash.viewAll}</Link>
          </div>
          {loading ? <p className="jxu-muted">…</p> : claims.length === 0 ? (
            <p className="jxu-muted">{t.dash.noClaims}</p>
          ) : (
            <div className="jxu-mini-table">
              {claims.map((c) => (
                <Link href={`/results/${c.id}`} key={c.id} className="jxu-mini-row">
                  <span className="jxu-mini-claim">{c.claim_text ? trunc(c.claim_text, 60) : "—"}</span>
                  <span>
                    {c.verdict
                      ? <em className={`jxu-verdict ${VERDICT_CLASS[c.verdict] ?? ""}`}>{c.verdict}</em>
                      : <em className="jxu-verdict v-pending">{c.status}</em>}
                  </span>
                  <span className="jxu-mini-conf">{c.confidence_score != null ? c.confidence_score.toFixed(2) : "—"}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Your activity */}
        <section className="jxu-card">
          <div className="jxu-card-head">
            <h2>{t.dash.yourActivity}</h2>
            <Link href="/user/activity">{t.dash.viewAll}</Link>
          </div>
          {loading ? <p className="jxu-muted">…</p> : recent.length === 0 ? (
            <p className="jxu-muted">{t.dash.noActivity}</p>
          ) : (
            <ul className="jxu-activity">
              {recent.map((a) => (
                <li key={a.id} className={`tone-${activityTone(a.type)}`}>
                  <span className="jxu-act-icon">{activityIcon(a.type)}</span>
                  <div>
                    <strong>{a.title}</strong>
                    {a.description && <p>{trunc(a.description, 70)}</p>}
                  </div>
                  <time>{relativeTime(a.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Usage this month */}
      <section className="jxu-card">
        <div className="jxu-card-head">
          <h2>{t.dash.usageThisMonth}</h2>
          <span className="jxu-muted">{stats?.month_label}</span>
        </div>
        <div className="jxu-usage-grid">
          <Usage label={t.dash.claimsSubmitted} value={m?.claims_submitted} loading={loading} />
          <Usage label={t.dash.reviewsRequested} value={m?.reviews_requested} loading={loading} />
          <Usage label={t.dash.factsViewed} value={m?.fact_views} loading={loading} />
          <Usage label={t.dash.bookmarksAdded} value={m?.bookmarks_added} loading={loading} />
          <Usage label={t.dash.signIns} value={m?.logins} loading={loading} />
        </div>
      </section>

      {/* Trending fact checks (live) */}
      <section className="jxu-card">
        <div className="jxu-card-head">
          <h2>{t.dash.trending}</h2>
          <Link href="/facts">{t.dash.viewAll}</Link>
        </div>
        {loading ? <p className="jxu-muted">…</p> : trending.length === 0 ? (
          <p className="jxu-muted">{t.dash.noTrending}</p>
        ) : (
          <div className="jxu-trend-grid">
            {trending.map((f) => (
              <Link href={`/facts/${f.slug}`} key={f.id} className="jxu-trend-card">
                {f.verdict && <em className={`jxu-verdict ${VERDICT_CLASS[f.verdict] ?? ""}`}>{f.verdict}</em>}
                <strong>{trunc(f.title, 70)}</strong>
                <small>{f.coverage_scope} · {f.language}</small>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function proportion(part?: number, total?: number): string {
  if (!total || total === 0 || part == null) return "0% of claims";
  return `${Math.round((part / total) * 100)}% of claims`;
}

function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }

function StatCard({ label, value, sub, tone, subTone, loading }: {
  label: string; value?: number; sub?: string; tone: string; subTone?: string; loading: boolean;
}) {
  return (
    <div className={`jxu-stat tone-${tone}`}>
      <span className="jxu-stat-label">{label}</span>
      <span className="jxu-stat-value">{loading ? "—" : value ?? 0}</span>
      {sub && <span className={`jxu-stat-sub ${subTone ?? ""}`}>{sub}</span>}
    </div>
  );
}

function Usage({ label, value, loading }: { label: string; value?: number; loading: boolean }) {
  return (
    <div className="jxu-usage-item">
      <span className="jxu-usage-val">{loading ? "—" : value ?? 0}</span>
      <span className="jxu-usage-label">{label}</span>
    </div>
  );
}
