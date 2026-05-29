"use client";

import { useEffect, useMemo, useState } from "react";
import { getFeaturedFactChecks, getPublicFactChecks } from "@/lib/api";
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

export function HomepagePage() {
  const [scope, setScope] = useState<Scope>("bangladesh");
  const [featured, setFeatured] = useState<PublicFactCheckListItem[]>([]);
  const [items, setItems] = useState<PublicFactCheckListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    getFeaturedFactChecks()
      .then((res) => {
        if (!mounted) return;
        setFeatured(res.items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setFeatured([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPublicFactChecks({ scope, perPage: 6 })
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
  }, [scope]);

  const featuredTop = useMemo(() => featured.slice(0, 3), [featured]);

  return (
    <main className="homepage-shell">
      <section className="home-hero">
        <p className="home-tag">JachaiX AI Solution</p>
        <h1>Fact-check intelligence for Bangladesh and international misinformation response.</h1>
        <p>
          JachaiX combines OCR, retrieval, reranking, and LLM reasoning with a public card-based fact-check hub so users can
          browse already-verified reports like a newsroom fact-check portal.
        </p>
        <div className="home-actions">
          <a href="/facts" className="home-btn home-btn-primary">Browse Fact Checks</a>
          <a href="/scan" className="home-btn">Submit New Claim</a>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>Featured Fact Checks</h2>
          <a href="/facts" className="home-inline-link">View all</a>
        </div>
        <div className="fact-grid">
          {featuredTop.length === 0 && <p className="muted">No featured items yet. Publish completed claims to show cards here.</p>}
          {featuredTop.map((item) => (
            <article key={item.id} className="fact-card">
              <div className="fact-meta-row">
                <span className={`verdict-chip ${verdictClass(item.verdict)}`}>{verdictLabel(item.verdict)}</span>
                <span className="scope-chip">{item.coverage_scope === "bangladesh" ? "Bangladesh" : "International"}</span>
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

      <section className="home-section">
        <div className="home-section-head">
          <h2>Latest Fact Checks</h2>
          <div className="scope-tabs" role="tablist" aria-label="Coverage scope">
            <button
              className={scope === "bangladesh" ? "active" : ""}
              onClick={() => setScope("bangladesh")}
              type="button"
            >
              Bangladesh
            </button>
            <button
              className={scope === "international" ? "active" : ""}
              onClick={() => setScope("international")}
              type="button"
            >
              International
            </button>
          </div>
        </div>
        {loading && (
          <div className="fact-grid">
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
          </div>
        )}
        {!loading && items.length === 0 && <p className="muted">No published items in this scope yet.</p>}
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

      <section id="capabilities" className="home-section">
        <h2>Core Capabilities</h2>
        <div className="home-card-grid">
          <article className="home-card">
            <h3>Text Claim Verification</h3>
            <p>Live verification pipeline with evidence retrieval, verdict confidence, and human review escalation.</p>
            <span className="home-badge live">Live</span>
          </article>
          <article className="home-card">
            <h3>Image OCR Verification</h3>
            <p>Extract text from uploaded images and route it through the same retrieval and verdict engine.</p>
            <span className="home-badge live">Live</span>
          </article>
          <article className="home-card">
            <h3>PDF OCR Verification</h3>
            <p>Parse PDF content to detect claim statements and generate evidence-backed verification results.</p>
            <span className="home-badge live">Live</span>
          </article>
          <article className="home-card">
            <h3>Audio and Video Modules</h3>
            <p>Planned multimodal expansion with transcription and timeline-based verification in future phases.</p>
            <span className="home-badge future">Roadmap</span>
          </article>
        </div>
      </section>

      <section id="pipeline" className="home-section">
        <h2>Verification Pipeline</h2>
        <ol className="home-pipeline">
          <li>Claim intake from text, image, or PDF endpoints</li>
          <li>OCR and normalization for structured claim text</li>
          <li>Embedding retrieval and reranking against knowledge sources</li>
          <li>LLM verdict generation with confidence and explanation</li>
          <li>Cross-verification links plus human review recommendation</li>
        </ol>
      </section>

      <section className="home-section">
        <h2>Architecture Components</h2>
        <div className="home-card-grid">
          <article className="home-card">
            <h3>Laravel Orchestration Layer</h3>
            <p>API gateway, async jobs, review actions, and claim-state lifecycle management.</p>
          </article>
          <article className="home-card">
            <h3>OCR + Retrieval Services</h3>
            <p>Dedicated microservices for extraction, embedding search, and semantic reranking.</p>
          </article>
          <article className="home-card">
            <h3>Vector Knowledge Access</h3>
            <p>Evidence retrieval against indexed knowledge collections for grounded verdicts.</p>
          </article>
          <article className="home-card">
            <h3>Local LLM Compatibility</h3>
            <p>Supports Ollama-based local models for private, low-latency verification deployments.</p>
          </article>
        </div>
      </section>

      <section id="deployment" className="home-section home-section-compact">
        <h2>Project and Product Scope</h2>
        <p>
          JachaiX is built as a production-oriented architecture with a Laravel backend, queue workers, OCR/embedder/reranker
          services, vector retrieval, and Ollama-based local LLM support. The platform is designed for hackathon demos and
          scalable deployment paths.
        </p>
      </section>
    </main>
  );
}
