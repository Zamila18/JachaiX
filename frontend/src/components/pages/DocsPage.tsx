"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicDocs, getPublicFactChecks, getAdminCompletedClaims } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import type { DocsLiveData, DocsPageData, DocsPitchSection, DocsVisibility } from "@/lib/types";

const DEFAULT_PROVENANCE_DATA_SOURCES = [
  "Curated Bangla + English fact-check and news corpus, crawled nightly from 25+ trusted outlets and fact-checkers — Reuters, AP, BBC, UN, WHO, The Daily Star, bdnews24, Prothom Alo, Rumor Scanner, AltNews, BOOM, FullFact, PolitiFact — and stored as normalized articles under corpus/raw.",
  "A hybrid knowledge base: evidence chunks embedded with Jina v3 (1024-dim) into a Qdrant vector index, mirrored into a MySQL BM25 full-text store for combined semantic + keyword retrieval.",
  "Live Auto-RAG web fallback (Google News + Wikipedia) that resolves real publisher URLs, fetches full article bodies, and writes high-value evidence back into the knowledge base.",
  "Project-generated verification artifacts: OCR text, retrieved evidence snippets, reranker scores, claim metadata, and complete decision traces.",
  "Operational data — claim submissions, processing status, verdicts, audit logs, and the publication workflow — stored in MySQL for full traceability.",
];

const DEFAULT_PROVENANCE_AI_MODELS = [
  "Multi-provider LLM verdict consensus pool — Groq (Llama-3.3-70B), OpenRouter (Qwen-2.5-72B / Gemma), Cerebras, and Hugging Face — combined with confidence-tiered agreement so no single model decides a verdict.",
  "Hybrid Retrieval-Augmented Generation: Jina v3 embeddings → Qdrant dense search fused with MySQL BM25, then re-ranked by a BGE cross-encoder tuned for Bangla + English.",
  "Query-understanding layer: claim normalization, HyDE hypothetical-document expansion, multi-perspective query rewriting, and Banglish paraphrasing to lift recall on low-resource Bangla.",
  "EasyOCR-based image and PDF text extraction, with optional image-forensics for manipulation/AI-generation detection.",
  "Self-learning knowledge base: validated web evidence is written back and re-weighted nightly for freshness and source health.",
];

const DEFAULT_PROVENANCE_RESPONSIBLE_AI = [
  "Evidence-first verdicting: every verdict is grounded in retrieved, citable sources — never free-form generation alone.",
  "Consensus over single-model bias: multiple independent LLMs must agree before a high-confidence verdict is issued.",
  "Conservative uncertainty handling: when evidence is weak, mixed, or contradictory, the system returns 'Unverified' instead of forcing a confident answer.",
  "Human-in-the-loop: low-confidence or disputed claims are escalated to a manual review queue.",
  "Transparency: each result ships with a plain-language explanation, a confidence score, a trust label, and clickable source links.",
  "Safety controls: canonical-fact shortcuts and contradiction checks (e.g. actor/place/number mismatches) reduce obvious hallucinations.",
  "Auditability: the full claim lifecycle — submission, status, evidence, verdict — is logged for traceability and debugging.",
  "Localization-aware: first-class Bangla + English handling to reduce the language bias of English-only tools.",
];

const DEFAULT_FALLBACK_PITCH_SECTIONS: DocsPitchSection[] = [
  {
    id: "why-now",
    title: "Why Now",
    content:
      "AI-generated misinformation — deepfakes, fabricated screenshots, and out-of-context media — is exploding faster than newsrooms can debunk it. The problem is acute in Bangla and other low-resource languages, where almost every automated fact-checking tool is English-only. Manual verification simply cannot keep pace, and election cycles, health scares, and viral rumors make the cost of a slow correction enormous. JachaiX exists to make evidence-based truth as fast to access as the lie it answers.",
  },
  {
    id: "solution",
    title: "Solution",
    content:
      "JachaiX is an evidence-first, bilingual (Bangla + English) misinformation verification engine. A user submits a claim as text, an image/screenshot, a PDF, or a URL; the system runs OCR, normalizes the claim, retrieves evidence through a hybrid of dense vector search (Qdrant) and BM25 keyword search, re-ranks it with a cross-encoder, and asks a pool of LLMs for a consensus verdict. The output is a clear verdict — True / False / Misleading / Unverified — with a confidence score, a trust label, a plain-language explanation, and clickable sources. Weak or disputed cases are escalated to human review.",
  },
  {
    id: "demo",
    title: "Product Demo",
    content:
      "Paste a claim or upload a screenshot/PDF and get an evidence-backed verdict in roughly 10–60 seconds — complete with confidence, explanation, and source links. Browse already-verified claims on the public Fact-Check Hub, filter by Bangladesh vs. international scope and verdict, and request human review on any result. Logged-in users get a dashboard with their claim history, bookmarks, saved searches, and notifications.",
  },
  {
    id: "market",
    title: "Market Opportunity",
    content:
      "Over 200 million Bangla speakers are served by almost no automated verification tooling. Primary buyers are newsrooms, election commissions, fact-checking organizations, civic-tech NGOs, and platform trust-and-safety teams across Bangladesh and South Asia — a market that English-first incumbents structurally underserve. As an API and MCP service, JachaiX also addresses the fast-growing need for AI agents and chatbots to fact-check their own outputs.",
  },
  {
    id: "business",
    title: "Business Model",
    content:
      "B2B SaaS: tiered subscriptions (per-seat for analysts + per-verification API quotas), enterprise and on-premise deployments for media houses and government partners with data-residency needs, and a developer API / MCP server billed per call. A free public tier drives awareness and a top-of-funnel for paid integrations.",
  },
  {
    id: "traction",
    title: "Traction",
    content:
      "A fully working end-to-end pipeline is live: text/image/PDF/URL verification, a self-refreshing knowledge base (nightly crawl of trusted outlets at 3 AM), a public fact-check hub, an admin publishing queue, and a multi-provider LLM consensus engine already running in production. Auth, user dashboards, activity logging, bookmarks, notifications, and an MCP server for external AI clients are all implemented.",
  },
  {
    id: "competition",
    title: "Competition",
    content:
      "Most existing tools are English-only, manual, or rely on a single model that is easy to bias or hallucinate. Generic LLM chatbots will confidently answer without citing evidence. JachaiX is differentiated by combining Bangla-first OCR, hybrid (dense + BM25) retrieval with reranking, multi-LLM consensus, a self-learning knowledge base, and transparent source-linked verdicts in one auditable pipeline.",
  },
  {
    id: "advantage",
    title: "Unique Advantage",
    content:
      "Bangla-first by design; hybrid retrieval (semantic + keyword) with cross-encoder reranking for precision; a multi-provider verdict pool that votes for consensus instead of trusting one model; an auto-learning knowledge base that writes back fresh web evidence nightly; and an MCP server so external AI agents can call JachaiX as a verification tool. The architecture is modular and language-extensible for international scale.",
  },
  {
    id: "gtm",
    title: "Go-To-Market",
    content:
      "Pilot with Bangladeshi media and civic partners during high-stakes windows (elections, public-health events) where verification speed matters most. Ship a developer API and an MCP integration so platforms and AI products can embed fact-checking directly. Expand from Bangla to other underserved languages on the same modular pipeline.",
  },
  {
    id: "vision",
    title: "Vision",
    content:
      "Become the trusted, real-time verification layer for multilingual digital ecosystems — an open, evidence-grounded standard that newsrooms, platforms, and AI agents can all rely on to tell truth from manipulation, starting with Bangla and scaling to the world's underserved languages.",
  },
];

const DEFAULT_PROJECT_TEAM_MEMBERS = [
  {
    name: "Zamila Mohammad",
    role: "Leader · Presentation / Communication Lead · Business Analyst / Data Scientist",
    email: "zamila.cse.20230104071@aust.edu",
    image_url: null,
  },
  {
    name: "Samanta Islam",
    role: "Member · Backend / Database / Scraper Engineer · UI/UX / Frontend Developer",
    email: "samsamanta357@gmail.com",
    image_url: null,
  },
  {
    name: "Humayra Binte Kazal",
    role: "Member · Backend / Database / Scraper Engineer · Team Leader / Project Coordinator",
    email: "humayrabintekazal@gmail.com",
    image_url: null,
  },
  {
    name: "Asmita Guha Thakurta",
    role: "Member · UI/UX / Frontend Developer · Backend / Database / Scraper Engineer",
    email: "asmitaesha123@gmail.com",
    image_url: null,
  },
];

const DEFAULT_FALLBACK_METRICS = {
  users: 24,
  claims_total: 146,
  claims_completed: 132,
  claims_processing: 6,
  public_fact_checks: 18,
  published_fact_checks: 12,
  featured_fact_checks: 5,
};

const DEFAULT_FALLBACK_APIS = [
  { method: "POST", path: "/api/v1/analyze/text" },
  { method: "POST", path: "/api/v1/analyze/image" },
  { method: "POST", path: "/api/v1/analyze/pdf" },
  { method: "GET", path: "/api/v1/claims/{id}/status" },
  { method: "GET", path: "/api/v1/claims/{id}/result" },
  { method: "GET", path: "/api/v1/public/fact-checks" },
  { method: "GET", path: "/api/v1/docs" },
];


function buildFallbackDocsPageData(): DocsPageData {
  return {
    team_name: "Musketeers",
    pitch_sections: DEFAULT_FALLBACK_PITCH_SECTIONS,
    technical_sections: {
      architecture_diagram: "flowchart TB\\n  UI[\"Next.js Frontend (Vercel)\"] --> NGINX[\"Nginx Gateway\"]\\n  NGINX --> API[\"Laravel API  /api/v1\"]\\n  API --> REDIS[(\"Redis Queue\")]\\n  REDIS --> WORKER[\"Queue Worker — ProcessAnalysisJob\"]\\n  SCHED[\"Scheduler — nightly 3AM Dhaka\"] --> CRAWL[\"KB Crawler + Chunker\"]\\n  subgraph AISVC[AI Microservices]\\n    OCR[\"OCR — EasyOCR\"]\\n    EMB[\"Embedder — Jina v3 (1024d)\"]\\n    RERANK[\"Reranker — BGE cross-encoder\"]\\n  end\\n  subgraph STORE[Data Stores]\\n    MYSQL[(\"MySQL — Claims + BM25\")]\\n    QDRANT[(\"Qdrant — Vector KB\")]\\n  end\\n  subgraph POOL[LLM Verdict Pool — consensus]\\n    LLM[\"Groq | OpenRouter | Cerebras | HuggingFace\"]\\n  end\\n  WORKER --> OCR\\n  WORKER --> EMB --> QDRANT\\n  WORKER --> RERANK\\n  WORKER --> MYSQL\\n  WORKER --> LLM\\n  WORKER --> WEB[\"Auto-RAG — GNews + Wikipedia\"]\\n  CRAWL --> QDRANT\\n  CRAWL --> MYSQL",
      data_flow_diagram: "flowchart TB\\n  IN[\"Claim — text / image / PDF / URL\"] --> NORM[\"OCR + Language Detect + Claim Normalization\"]\\n  NORM --> QEXP[\"Query Expansion — HyDE + multi-perspective + Banglish\"]\\n  QEXP --> RET[\"Hybrid Retrieval — Qdrant dense + MySQL BM25\"]\\n  RET --> RERANK[\"Cross-encoder Rerank (top evidence)\"]\\n  RERANK --> GAP{\"Enough evidence?\"}\\n  GAP -->|no| WEB[\"Auto-RAG — GNews + Wikipedia\"]\\n  WEB --> RERANK\\n  GAP -->|yes| POOL[\"Multi-LLM Verdict Pool + Consensus\"]\\n  POOL --> TRUST[\"Trust Scoring + Confidence + Label\"]\\n  TRUST --> OUT[\"Verdict + Explanation + Sources\"]\\n  OUT --> REVIEW{\"Low confidence?\"}\\n  REVIEW -->|yes| HUMAN[\"Human Review Queue\"]\\n  REVIEW -->|no| PUB[\"Public Fact-Check Hub\"]",
      provenance_data_sources: DEFAULT_PROVENANCE_DATA_SOURCES,
      provenance_ai_models: DEFAULT_PROVENANCE_AI_MODELS,
      provenance_responsible_ai: DEFAULT_PROVENANCE_RESPONSIBLE_AI,
    },
    team_members: DEFAULT_PROJECT_TEAM_MEMBERS,
    updated_by: "fallback",
    version: 1,
    updated_at: new Date().toISOString(),
  };
}

function buildFallbackLiveData(): DocsLiveData {
  return {
    metrics: DEFAULT_FALLBACK_METRICS,
    features: [],
    apis: DEFAULT_FALLBACK_APIS,
    events: [],
  };
}

function resolvePageData(page: DocsPageData): DocsPageData {
  const fallback = buildFallbackDocsPageData();
  const incomingTechnical = page.technical_sections || {};
  const hasTechnical = Object.keys(incomingTechnical).length > 0;
  const incomingTeamMembers = page.team_members || [];
  const hasPlaceholderTeam =
    incomingTeamMembers.length === 1 &&
    incomingTeamMembers[0]?.email === "team@jachaix.local";

  return {
    ...page,
    team_name: page.team_name?.trim() ? page.team_name : fallback.team_name,
    pitch_sections: page.pitch_sections?.length ? page.pitch_sections : fallback.pitch_sections,
    technical_sections: hasTechnical
      ? { ...(fallback.technical_sections || {}), ...incomingTechnical }
      : fallback.technical_sections,
    team_members: incomingTeamMembers.length && !hasPlaceholderTeam
      ? incomingTeamMembers
      : fallback.team_members,
  };
}

function resolveMetrics(metrics: DocsLiveData["metrics"]): DocsLiveData["metrics"] {
  const noRealData =
    metrics.users === 0 &&
    metrics.claims_total === 0 &&
    metrics.claims_completed === 0 &&
    metrics.published_fact_checks === 0;

  return noRealData ? DEFAULT_FALLBACK_METRICS : metrics;
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function resolveProvenanceLists(technicalSections: Record<string, unknown>) {
  const dataSources = normalizeStringList(technicalSections.provenance_data_sources);
  const aiModels = normalizeStringList(technicalSections.provenance_ai_models);
  const responsibleAi = normalizeStringList(technicalSections.provenance_responsible_ai);

  return {
    dataSources: dataSources.length ? dataSources : DEFAULT_PROVENANCE_DATA_SOURCES,
    aiModels: aiModels.length ? aiModels : DEFAULT_PROVENANCE_AI_MODELS,
    responsibleAi: responsibleAi.length ? responsibleAi : DEFAULT_PROVENANCE_RESPONSIBLE_AI,
  };
}

function normalizeDiagramText(value: unknown, fallbackText: string): string {
  const raw = String(value || fallbackText);
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function isTransientNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("aborted") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("failed to fetch") ||
    message.includes("network")
  );
}

function toMarkdown(page: DocsPageData, live: DocsLiveData): string {
  const technical = (page.technical_sections || {}) as Record<string, unknown>;
  const provenance = resolveProvenanceLists(technical);
  const metrics = resolveMetrics(live.metrics);
  const pitch = (page.pitch_sections || [])
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n");

  const placeholderTeam =
    (page.team_members || []).length === 1 &&
    page.team_members?.[0]?.email === "team@jachaix.local";
  const teamMembers = placeholderTeam || !(page.team_members || []).length
    ? DEFAULT_PROJECT_TEAM_MEMBERS
    : (page.team_members || []);

  const team = teamMembers
    .map((m) => `- ${m.name} | ${m.role} | ${m.email}`)
    .join("\n");

  return [
    "# JachaiX Documentation",
    "",
    `Version: ${page.version}`,
    "",
    "## Pitch Deck",
    "",
    pitch,
    "",
    "## Team",
    "",
    team,
    "",
    "## Data & AI Provenance",
    "",
    "### Data Sources",
    ...provenance.dataSources.map((item) => `- ${item}`),
    "",
    "### AI Models",
    ...provenance.aiModels.map((item) => `- ${item}`),
    "",
    "### Responsible AI",
    ...provenance.responsibleAi.map((item) => `- ${item}`),
    "",
    "## Live Metrics",
    "",
    `- Users: ${metrics.users}`,
    `- Claims Total: ${metrics.claims_total}`,
    `- Claims Completed: ${metrics.claims_completed}`,
    `- Published Fact Checks: ${metrics.published_fact_checks}`,
  ].join("\n");
}

export function DocsPageView() {
  const { tx } = useLanguage();
  const [page, setPage] = useState<DocsPageData | null>(null);
  const [liveData, setLiveData] = useState<DocsLiveData | null>(null);
  const [visibility, setVisibility] = useState<DocsVisibility | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [copyStates, setCopyStates] = useState<Record<string, string>>({});
  const [liveFactChecks, setLiveFactChecks] = useState<number | null>(null);
  const [liveClaims, setLiveClaims] = useState<number | null>(null);

  useEffect(() => {
    getPublicFactChecks({ perPage: 1 })
      .then(r => { const t = r.pagination?.total; if (t && t > 0) setLiveFactChecks(t); })
      .catch(() => {});
    getAdminCompletedClaims({ perPage: 1 })
      .then(r => { const t = r.pagination?.total; if (t && t > 0) setLiveClaims(t); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const res = await getPublicDocs();
          if (!mounted) return;

          if (res.success === false) {
            setBlocked(res.message || tx({ en: "Documentation is not available right now.", bn: "ডকুমেন্টেশন এখন উপলভ্য নয়।" }));
            setVisibility(res.visibility);
            setPage(buildFallbackDocsPageData());
            setLiveData(buildFallbackLiveData());
            return;
          }

          setPage(resolvePageData(res.page));
          setLiveData(res.live_data);
          return;
        } catch (error) {
          if (!mounted) return;
          if (attempt === 0 && isTransientNetworkError(error)) {
            continue;
          }

          setBlocked(
            isTransientNetworkError(error)
              ? tx({ en: "Documentation is temporarily unavailable. Please refresh and try again.", bn: "ডকুমেন্টেশন সাময়িকভাবে অনুপলব্ধ। রিফ্রেশ করে আবার চেষ্টা করুন।" })
              : error instanceof Error
                ? error.message
                : tx({ en: "Failed to load docs.", bn: "ডকস লোড করা যায়নি।" })
          );
          setPage(buildFallbackDocsPageData());
          setLiveData(buildFallbackLiveData());
          return;
        }
      }
    };

    load().finally(() => {
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleSections = useMemo(() => {
    if (!page) return [];
    const q = query.trim().toLowerCase();
    if (!q) return page.pitch_sections || [];

    return (page.pitch_sections || []).filter(
      (section) =>
        section.title.toLowerCase().includes(q) || section.content.toLowerCase().includes(q)
    );
  }, [page, query]);

  // Scroll active section tracking
  useEffect(() => {
    if (!page || loading || blocked) return;

    const sections = [
      "metrics",
      ...(visibleSections || []).map((s) => s.id),
      "architecture",
      "api",
      "provenance",
      "team",
      "events",
    ];

    const handleScroll = () => {
      let currentActive = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            currentActive = id;
          }
        }
      }
      setActiveId(currentActive || "metrics");
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, visibleSections, loading, blocked]);

  function exportMarkdown() {
    if (!page || !liveData) return;
    const blob = new Blob([toMarkdown(page, liveData)], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "jachaix-docs.md";
    a.click();
    URL.revokeObjectURL(href);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(tx({ en: "Link copied!", bn: "লিংক কপি হয়েছে!" }));
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setCopied(tx({ en: "Could not copy link.", bn: "লিংক কপি করা যায়নি।" }));
      setTimeout(() => setCopied(null), 2500);
    }
  }

  async function copyToClipboard(key: string, textToCopy: string) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStates((prev) => ({ ...prev, [key]: tx({ en: "Copied!", bn: "কপি হয়েছে!" }) }));
      setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [key]: "" }));
      }, 2000);
    } catch {
      setCopyStates((prev) => ({ ...prev, [key]: tx({ en: "Error", bn: "ত্রুটি" }) }));
      setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [key]: "" }));
      }, 2000);
    }
  }

  // ── shared inline style tokens matching homepage ──────────────────────────
  const S = {
    white:   "#ffffff",
    light:   "#f1f5f9",
    border:  "#e8eef5",
    dark:    "#0f172a",
    mid:     "#475569",
    muted:   "#64748b",
    green:   "#16a34a",
    greenBg: "#e8f5ee",
    greenBd: "#c8e8d4",
    card: {
      background: "#ffffff",
      border: "1px solid #e8eef5",
      borderRadius: 14,
      boxShadow: "0 4px 18px rgba(15,23,42,0.06)",
    } as React.CSSProperties,
  };

  // ── skeleton loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ background: S.light, minHeight: "100vh" }}>
        <div style={{ background: "#0a1628", padding: "3rem 0 2.5rem" }}>
          <div style={{ width: "min(1200px,94vw)", margin: "0 auto" }}>
            <div style={{ width: 120, height: 12, background: "rgba(255,255,255,.12)", borderRadius: 6, marginBottom: 16 }} />
            <div style={{ width: "55%", height: 36, background: "rgba(255,255,255,.1)", borderRadius: 8, marginBottom: 14 }} />
            <div style={{ width: "80%", height: 16, background: "rgba(255,255,255,.07)", borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ width: "min(1200px,94vw)", margin: "0 auto", padding: "2rem 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: S.border, borderRadius: 14, overflow: "hidden", marginBottom: "2rem" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ background: S.white, padding: "1.4rem 1.5rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: S.greenBg }} />
                <div>
                  <div style={{ width: 60, height: 20, background: S.border, borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: 80, height: 12, background: S.border, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem" }}>
            <div style={{ background: S.white, borderRadius: 14, border: `1px solid ${S.border}`, padding: "1.5rem", height: 320 }} />
            <div style={{ display: "grid", gap: "1rem" }}>
              {[180, 240, 140].map((h,i) => <div key={i} style={{ background: S.white, borderRadius: 14, border: `1px solid ${S.border}`, height: h }} />)}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── access blocked ────────────────────────────────────────────────────────
  if (!page || !liveData) {
    return (
      <main style={{ background: S.light, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...S.card, maxWidth: 520, width: "90%", padding: "3rem 2.5rem", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: S.dark, margin: "0 0 0.75rem" }}>
            {tx({ en: "Documentation Unavailable", bn: "ডকুমেন্টেশন অনুপলব্ধ" })}
          </h1>
          <p style={{ color: S.muted, fontSize: "0.95rem", lineHeight: 1.65, margin: "0 0 1.5rem" }}>
            {blocked || tx({ en: "This page is currently hidden by administrator controls.", bn: "এই পেজটি বর্তমানে অ্যাডমিন কন্ট্রোল দ্বারা লুকানো আছে।" })}
          </p>
          {visibility && (
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "1rem 1.25rem", textAlign: "left" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", fontWeight: 700, color: "#92400e" }}>Schedule:</p>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "#78350f", display: "grid", gap: "0.2rem" }}>
                <li>Enabled: <strong>{visibility.is_enabled ? "Yes" : "No"}</strong></li>
                <li>Opens: <strong>{visibility.available_from ? new Date(visibility.available_from).toLocaleString() : "No limit"}</strong></li>
                <li>Closes: <strong>{visibility.available_until ? new Date(visibility.available_until).toLocaleString() : "No limit"}</strong></li>
              </ul>
            </div>
          )}
        </div>
      </main>
    );
  }

  const technical       = page.technical_sections || {};
  const architectureDiagram = normalizeDiagramText((technical as Record<string,unknown>).architecture_diagram, "No architecture diagram");
  const dataFlowDiagram     = normalizeDiagramText((technical as Record<string,unknown>).data_flow_diagram, "No data flow diagram");
  const provenance      = resolveProvenanceLists(technical as Record<string,unknown>);
  const metrics         = resolveMetrics(liveData.metrics);
  const placeholderTeam = (page.team_members || []).length === 1 && page.team_members?.[0]?.email === "team@jachaix.local";
  const teamMembers     = placeholderTeam || !(page.team_members || []).length ? DEFAULT_PROJECT_TEAM_MEMBERS : (page.team_members || []);

  const tocLink = (id: string, label: string) => (
    <a
      key={id}
      href={`#${id}`}
      onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}
      style={{
        display: "block", padding: "0.45rem 0.85rem", borderRadius: 8, textDecoration: "none",
        fontSize: "0.85rem", fontWeight: activeId === id ? 600 : 400,
        color: activeId === id ? S.green : S.mid,
        background: activeId === id ? S.greenBg : "transparent",
        borderLeft: `3px solid ${activeId === id ? S.green : "transparent"}`,
        transition: "all .15s",
      }}
    >{label}</a>
  );

  const SectionCard = ({ id, heading, sub, children }: { id: string; heading: string; sub?: string; children: React.ReactNode }) => (
    <section id={id} style={{ ...S.card, padding: "1.75rem 2rem", scrollMarginTop: 90 }}>
      <div style={{ marginBottom: sub ? "0.4rem" : "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: S.dark }}>{heading}</h2>
        {sub && <p style={{ margin: "0.35rem 0 1.25rem", color: S.muted, fontSize: "0.88rem" }}>{sub}</p>}
      </div>
      {children}
    </section>
  );

  const methodColor: Record<string, string> = { GET: "#2563eb", POST: "#16a34a", PATCH: "#d97706", PUT: "#7c3aed", DELETE: "#dc2626" };

  return (
    <main style={{ background: S.light, minHeight: "100vh" }}>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#0a1628",
        backgroundImage: "radial-gradient(ellipse 50% 90% at 90% 50%,rgba(5,30,15,.9) 0%,transparent 65%),radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px)",
        backgroundSize: "auto,26px 26px",
      }}>
        <div style={{ width: "min(1200px,94vw)", margin: "0 auto", padding: "3rem 0 2.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1 style={{ margin: "0 0 0.85rem", fontFamily: "var(--font-display),sans-serif", fontSize: "clamp(1.7rem,3vw,2.4rem)", fontWeight: 800, color: "#ffffff", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
                {tx({ en: "Pitch Deck + Technical Architecture", bn: "পিচ ডেক + টেকনিক্যাল আর্কিটেকচার" })}<br />
                <span style={{ color: "#22c55e" }}>{tx({ en: "+ Live System Metrics", bn: "+ লাইভ সিস্টেম মেট্রিক্স" })}</span>
              </h1>
              <p style={{ margin: "0 0 1.5rem", color: "#9fb9d4", fontSize: "0.92rem", lineHeight: 1.65, maxWidth: 520 }}>
                {tx({ en: "Understand JachaiX in minutes. Review technical system diagrams, endpoint maps, and live operational stats below.", bn: "কয়েক মিনিটে JachaiX বুঝুন। নিচে টেকনিক্যাল সিস্টেম ডায়াগ্রাম, এন্ডপয়েন্ট ম্যাপ ও লাইভ অপারেশনাল স্ট্যাট দেখুন।" })}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
                <button type="button" onClick={copyShareLink} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: S.green, color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: 8, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
                  {copied
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{copied}</>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>{tx({ en: "Copy Link", bn: "লিংক কপি" })}</>
                  }
                </button>
                <button type="button" onClick={exportMarkdown} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "transparent", color: "#9fb9d4", border: "1px solid rgba(159,185,212,.25)", padding: "0.6rem 1.2rem", borderRadius: 8, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {tx({ en: "Export MD", bn: "MD এক্সপোর্ট" })}
                </button>
                <button type="button" onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "transparent", color: "#9fb9d4", border: "1px solid rgba(159,185,212,.25)", padding: "0.6rem 1.2rem", borderRadius: 8, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  {tx({ en: "Print PDF", bn: "PDF প্রিন্ট" })}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
      <div style={{ width: "min(1200px,94vw)", margin: "0 auto", padding: "2rem 0 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", background: S.white, border: `1px solid ${S.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 18px rgba(15,23,42,.06)", marginBottom: "2rem" }}>
          {[
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, val: metrics.users, label: tx({ en: "Active Users", bn: "সক্রিয় ব্যবহারকারী" }) },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, val: metrics.claims_total, label: tx({ en: "Claims Total", bn: "মোট ক্লেম" }) },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>, val: liveClaims ?? metrics.claims_completed, label: tx({ en: "Verified Claims", bn: "যাচাইকৃত ক্লেম" }) },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="#16a34a" stroke="none"/></svg>, val: liveFactChecks ?? metrics.published_fact_checks, label: tx({ en: "Published Checks", bn: "প্রকাশিত চেকস" }) },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "1.4rem 1.5rem", borderRight: i < 3 ? `1px solid ${S.border}` : "none" }}>
              <span style={{ width: 46, height: 46, borderRadius: "50%", background: S.greenBg, border: `1px solid ${S.greenBd}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</span>
              <div style={{ lineHeight: 1.2 }}>
                <strong style={{ display: "block", fontSize: "1.5rem", fontWeight: 800, color: S.dark }}>{s.val}</strong>
                <span style={{ color: S.muted, fontSize: "0.88rem" }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── BODY: sidebar + content ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem", alignItems: "start", paddingBottom: "3rem" }}>

          {/* ── STICKY SIDEBAR TOC ───────────────────────────────────────── */}
          <aside style={{ position: "sticky", top: 90, background: S.white, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.25rem 1rem", boxShadow: "0 2px 8px rgba(15,23,42,.04)" }}>
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={tx({ en: "Search docs…", bn: "ডকস খুঁজুন…" })}
                style={{ width: "100%", border: `1px solid ${S.border}`, borderRadius: 8, padding: "0.45rem 0.7rem 0.45rem 2rem", fontSize: "0.8rem", color: S.dark, outline: "none", boxSizing: "border-box" }}
              />
              <svg style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: S.muted }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>

            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: S.muted, margin: "0 0 0.5rem 0.85rem" }}>Overview</p>
            {tocLink("metrics", tx({ en: "Live Metrics", bn: "লাইভ মেট্রিক্স" }))}

            {visibleSections.length > 0 && (
              <>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: S.muted, margin: "1rem 0 0.5rem 0.85rem" }}>Pitch Deck</p>
                {visibleSections.map(s => tocLink(s.id, s.title))}
              </>
            )}

            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: S.muted, margin: "1rem 0 0.5rem 0.85rem" }}>Technical</p>
            {tocLink("architecture", tx({ en: "Architecture", bn: "আর্কিটেকচার" }))}
            {tocLink("api", tx({ en: "API Docs", bn: "API ডকস" }))}
            {tocLink("provenance", tx({ en: "Data & AI", bn: "ডেটা ও এআই" }))}
            {tocLink("team", tx({ en: "Team", bn: "টিম" }))}
            {(liveData.events?.length ?? 0) > 0 && tocLink("events", tx({ en: "Events", bn: "ইভেন্ট" }))}
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
          <div style={{ display: "grid", gap: "1.25rem" }}>

            {/* Live Metrics */}
            <SectionCard id="metrics" heading={tx({ en: "Live System Metrics", bn: "লাইভ সিস্টেম মেট্রিক্স" })} sub={tx({ en: "Real-time operational stats from the JachaiX platform.", bn: "JachaiX প্ল্যাটফর্মের রিয়েল-টাইম অপারেশনাল স্ট্যাট।" })}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "0.75rem" }}>
                {[
                  { label: tx({ en: "Active Users", bn: "সক্রিয় ব্যবহারকারী" }), val: metrics.users, color: "#2563eb" },
                  { label: tx({ en: "Claims Total", bn: "মোট ক্লেম" }), val: metrics.claims_total, color: "#7c3aed" },
                  { label: tx({ en: "Verified Claims", bn: "যাচাইকৃত ক্লেম" }), val: liveClaims ?? metrics.claims_completed, color: S.green },
                  { label: tx({ en: "Published Fact Checks", bn: "প্রকাশিত ফ্যাক্ট চেকস" }), val: liveFactChecks ?? metrics.published_fact_checks, color: "#d97706" },
                ].map(m => (
                  <div key={m.label} style={{ background: S.light, border: `1px solid ${S.border}`, borderRadius: 10, padding: "1.1rem 1.25rem", borderTop: `3px solid ${m.color}` }}>
                    <strong style={{ display: "block", fontSize: "1.8rem", fontWeight: 800, color: S.dark, lineHeight: 1 }}>{m.val}</strong>
                    <span style={{ fontSize: "0.8rem", color: S.muted, marginTop: 4, display: "block" }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Pitch Deck */}
            {visibleSections.length > 0 && (
              <SectionCard id={visibleSections[0].id} heading={tx({ en: "Pitch Deck", bn: "পিচ ডেক" })} sub={tx({ en: "Business overview and product narrative.", bn: "ব্যবসায়িক সংক্ষিপ্তসার ও পণ্য বিবরণ।" })}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1rem" }}>
                  {visibleSections.map((s: DocsPitchSection) => (
                    <div key={s.id} id={s.id} style={{ background: S.light, border: `1px solid ${S.border}`, borderRadius: 12, padding: "1.25rem 1.5rem", scrollMarginTop: 90 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: S.green, flexShrink: 0 }} />
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: S.dark }}>{s.title}</h3>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.87rem", color: S.mid, lineHeight: 1.65 }}>{s.content}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Architecture */}
            <SectionCard id="architecture" heading={tx({ en: "Architecture & Technical Whitepaper", bn: "আর্কিটেকচার ও টেকনিক্যাল হোয়াইটপেপার" })} sub={tx({ en: "System blueprints showing the data pipeline and worker structures.", bn: "ডেটা পাইপলাইন ও ওয়ার্কার স্ট্রাকচারের সিস্টেম ব্লুপ্রিন্ট।" })}>
              {[
                { key: "arch", label: tx({ en: "Architecture Diagram", bn: "আর্কিটেকচার ডায়াগ্রাম" }), content: architectureDiagram },
                { key: "flow", label: tx({ en: "Data Flow Diagram", bn: "ডেটা ফ্লো ডায়াগ্রাম" }), content: dataFlowDiagram },
              ].map(block => (
                <div key={block.key} style={{ background: S.light, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1rem", borderBottom: `1px solid ${S.border}`, background: "#f8fafc" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: S.dark, fontFamily: "monospace" }}>{block.label}</span>
                    <button type="button" onClick={() => copyToClipboard(block.key, block.content)} style={{ fontSize: "0.75rem", color: S.green, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      {copyStates[block.key] || tx({ en: "Copy", bn: "কপি" })}
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: "1rem", fontSize: "0.8rem", color: S.mid, fontFamily: "monospace", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{block.content}</pre>
                </div>
              ))}
            </SectionCard>

            {/* API Docs */}
            <SectionCard id="api" heading={tx({ en: "API Documentation", bn: "API ডকুমেন্টেশন" })} sub={tx({ en: "Registered endpoints used by JachaiX claim validation clients.", bn: "JachaiX ক্লেম ভ্যালিডেশন ক্লায়েন্ট দ্বারা ব্যবহৃত এন্ডপয়েন্ট।" })}>
              <div style={{ border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "0.65rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: S.muted, borderBottom: `1px solid ${S.border}`, width: 90 }}>Method</th>
                      <th style={{ padding: "0.65rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: S.muted, borderBottom: `1px solid ${S.border}` }}>Endpoint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveData.apis.map((api, i) => (
                      <tr key={`${api.method}-${api.path}`} style={{ borderBottom: i < liveData.apis.length - 1 ? `1px solid ${S.border}` : "none" }}>
                        <td style={{ padding: "0.6rem 1rem" }}>
                          <span style={{ background: `${methodColor[api.method] || "#64748b"}18`, color: methodColor[api.method] || "#64748b", border: `1px solid ${methodColor[api.method] || "#64748b"}30`, borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 700, fontFamily: "monospace" }}>
                            {api.method}
                          </span>
                        </td>
                        <td style={{ padding: "0.6rem 1rem", fontFamily: "monospace", fontSize: "0.85rem", color: S.dark }}>{api.path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Data & AI Provenance */}
            <SectionCard id="provenance" heading={tx({ en: "Data & AI Provenance", bn: "ডেটা ও এআই প্রোভেন্যান্স" })} sub={tx({ en: "Data sources, model stack, and responsible AI controls used in JachaiX.", bn: "JachaiX-এ ব্যবহৃত ডেটা সোর্স, মডেল স্ট্যাক ও দায়িত্বশীল এআই নিয়ন্ত্রণ।" })}>
              {[
                { title: tx({ en: "Data Sources", bn: "ডেটা সোর্স" }), items: provenance.dataSources, color: "#2563eb" },
                { title: tx({ en: "AI Models", bn: "এআই মডেল" }), items: provenance.aiModels, color: "#7c3aed" },
                { title: tx({ en: "Responsible AI", bn: "দায়িত্বশীল এআই" }), items: provenance.responsibleAi, color: S.green },
              ].map(g => (
                <div key={g.title} style={{ background: S.light, border: `1px solid ${S.border}`, borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: S.dark, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: g.color, flexShrink: 0 }} />{g.title}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "grid", gap: "0.45rem" }}>
                    {g.items.map((item, idx) => <li key={idx} style={{ fontSize: "0.87rem", color: S.mid, lineHeight: 1.6 }}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </SectionCard>

            {/* Team */}
            <SectionCard id="team" heading={tx({ en: "Project Team", bn: "প্রজেক্ট টিম" })} sub={page.team_name || "JachaiX Core Team"}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
                {teamMembers.map(member => (
                  <div key={`${member.name}-${member.email}`} style={{ background: S.light, border: `1px solid ${S.border}`, borderRadius: 12, padding: "1.5rem 1.25rem", textAlign: "center" }}>
                    {member.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.image_url} alt={member.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${S.greenBd}`, marginBottom: "0.85rem" }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: S.greenBg, border: `2px solid ${S.greenBd}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.85rem", fontSize: "1.4rem", fontWeight: 800, color: S.green }}>
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <h3 style={{ margin: "0 0 0.35rem", fontSize: "0.95rem", fontWeight: 700, color: S.dark }}>{member.name}</h3>
                    <p style={{ margin: "0 0 0.85rem", fontSize: "0.78rem", color: S.muted, lineHeight: 1.5 }}>{member.role}</p>
                    <a href={`mailto:${member.email}`} title={member.email} style={{ fontSize: "0.76rem", color: S.green, textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "0.35rem", maxWidth: "100%" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "0.2rem" }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span style={{ wordBreak: "break-all", lineHeight: 1.4, minWidth: 0 }}>{member.email}</span>
                    </a>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Recent Events */}
            {(liveData.events?.length ?? 0) > 0 && (
              <SectionCard id="events" heading={tx({ en: "Recent Pipeline Events", bn: "সাম্প্রতিক পাইপলাইন ইভেন্ট" })} sub={tx({ en: "Live chronological verification timeline.", bn: "লাইভ ক্রোনোলজিক্যাল ভেরিফিকেশন টাইমলাইন।" })}>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {liveData.events.map(event => {
                    const v = (event.verdict || "unverified").toLowerCase();
                    const vColors: Record<string, [string, string]> = { true: ["#dcfce7","#16a34a"], false: ["#fee2e2","#dc2626"], misleading: ["#fff7ed","#c2410c"], unverified: ["#f1f5f9","#64748b"] };
                    const [vBg, vCol] = vColors[v] || vColors.unverified;
                    return (
                      <div key={event.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: S.light, border: `1px solid ${S.border}`, borderRadius: 10, padding: "0.85rem 1.25rem" }}>
                        <span style={{ background: vBg, color: vCol, border: `1px solid ${vCol}40`, borderRadius: 6, padding: "3px 9px", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
                          {v.toUpperCase()}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: S.dark }}>Claim #{event.id}</span>
                          <span style={{ fontSize: "0.8rem", color: S.muted, marginLeft: "0.75rem" }}>{event.status} · {event.language}</span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: S.muted, flexShrink: 0 }}>{event.created_at ? new Date(event.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
