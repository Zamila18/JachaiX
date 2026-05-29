"use client";

import { useEffect, useState } from "react";
import { getPublicFactCheckDetail } from "@/lib/api";
import type { PublicFactCheckDetail } from "@/lib/types";

function verdictLabel(verdict: string | null) {
  if (!verdict) return "Unverified";
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

export function FactsPage({ slug }: { slug: string }) {
  const [item, setItem] = useState<PublicFactCheckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getPublicFactCheckDetail(slug)
      .then((res) => {
        if (!mounted) return;
        setItem(res.item);
      })
      .catch(() => {
        if (!mounted) return;
        setError("The requested fact page does not exist.");
        setItem(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="page-shell">
        <section className="hero-card reveal">
          <div className="skeleton-box" style={{ width: "120px", height: "16px", marginBottom: "0.8rem" }} />
          <div className="skeleton-box" style={{ width: "70%", height: "32px", marginBottom: "1rem" }} />
          <div className="skeleton-box" style={{ width: "40%", height: "20px" }} />
        </section>
        <section className="panel reveal delay-1">
          <div className="skeleton-box" style={{ width: "150px", height: "20px", marginBottom: "1rem" }} />
          <div className="skeleton-box" style={{ height: "100px", borderRadius: "12px" }} />
        </section>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="page-shell">
        <section className="panel reveal">
          <p className="eyebrow">Fact Checks</p>
          <h1>Fact not found</h1>
          <p className="muted">{error || "The requested fact page does not exist."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">Public Fact Checks</p>
          <div className="live-pill">{item.coverage_scope === "bangladesh" ? "Bangladesh" : "International"}</div>
        </div>
        <h1>{item.title}</h1>
        <p className="muted">
          Verdict: {verdictLabel(item.verdict)} · Source: {item.source_name || (item.origin === "external" ? "External" : "JachaiX Internal")}
          {item.published_at ? ` · Published: ${new Date(item.published_at).toLocaleDateString()}` : ""}
        </p>
      </section>

      <section className="panel reveal delay-1">
        <h2>Summary</h2>
        <p className="explanation">{item.summary || "No summary provided."}</p>
      </section>

      <section className="panel reveal delay-2">
        <h2>Claim</h2>
        <p className="explanation">{item.claim_text || "No claim text provided."}</p>
      </section>

      <section className="panel reveal delay-3">
        <h2>Explanation</h2>
        <p className="explanation">{item.explanation || "No explanation provided."}</p>
      </section>

      <section className="panel reveal delay-4">
        <h2>Sources</h2>
        {Array.isArray(item.sources) && item.sources.length > 0 ? (
          <ul className="result-list">
            {item.sources.map((src, idx) => (
              <li key={`${idx}-${src.url || src.title || "source"}`}>
                <strong>{src.title || "Evidence source"}</strong>
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noreferrer" className="link-inline">{src.url}</a>
                ) : (
                  <span className="muted">No URL</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No linked sources.</p>
        )}
      </section>
    </main>
  );
}
