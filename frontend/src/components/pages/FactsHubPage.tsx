"use client";

import { useEffect, useState } from "react";
import { getPublicFactChecks } from "@/lib/api";
import type { PublicFactCheckListItem } from "@/lib/types";

type Scope = "bangladesh" | "international";

function verdictLabel(verdict: string | null) {
  if (!verdict) return "Unverified";
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

function verdictClass(verdict: string | null) {
  switch ((verdict ?? "").toLowerCase()) {
    case "true":
      return "is-true";
    case "false":
      return "is-false";
    case "misleading":
      return "is-misleading";
    default:
      return "is-unverified";
  }
}

export function FactsHubPage() {
  const [scope, setScope] = useState<Scope>("bangladesh");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PublicFactCheckListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getPublicFactChecks({ scope, q: query.trim() || undefined, perPage: 24 })
      .then((res) => {
        if (!mounted) return;
        setItems(res.items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [scope, query]);

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">Public Fact Checks</p>
          <div className="live-pill">Public fact-check cards</div>
        </div>
        <h1>Browse Already Fact-Checked Claims</h1>
        <p className="muted">Filter by Bangladesh and International scope and open detailed fact pages.</p>
      </section>

      <section className="panel reveal delay-1">
        <div className="home-section-head">
          <div className="scope-tabs" role="tablist" aria-label="Coverage scope">
            <button className={scope === "bangladesh" ? "active" : ""} onClick={() => setScope("bangladesh")} type="button">
              Bangladesh
            </button>
            <button className={scope === "international" ? "active" : ""} onClick={() => setScope("international")} type="button">
              International
            </button>
          </div>
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fact checks"
          />
        </div>

        {loading && (
          <div className="fact-grid">
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
          </div>
        )}
        {!loading && items.length === 0 && <p className="muted">No published fact checks found.</p>}

        <div className="fact-grid">
          {items.map((item) => (
            <article key={item.id} className="fact-card">
              <div className="fact-meta-row">
                <span className={`verdict-chip ${verdictClass(item.verdict)}`}>{verdictLabel(item.verdict)}</span>
                <span className="scope-chip">{item.language.toUpperCase()}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary || "No summary provided."}</p>
              <div className="fact-footer-row">
                <small>{item.source_name || (item.origin === "external" ? "External" : "JachaiX Internal")}</small>
                <a href={`/facts/${item.slug}`}>Read full fact-check</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
