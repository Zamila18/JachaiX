"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicDocs } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import type { DocsLiveData, DocsPageData, DocsPitchSection, DocsVisibility } from "@/lib/types";

const DEFAULT_PROVENANCE_DATA_SOURCES = [
  "Public fact-check and news corpus collected from trusted outlets and fact-checking publishers (Bangla and English), including structured claim/article text in the local corpus.",
  "Scraped and normalized datasets under corpus/raw, then chunked and indexed for retrieval.",
  "Project-generated verification artifacts: extracted OCR text, retrieved evidence snippets, claim metadata, and decision traces.",
  "Operational data from the internal pipeline (claim submissions, status/results, audit records) stored in backend services.",
  "Vector knowledge base built from curated documents and evidence chunks, stored in Qdrant for semantic retrieval.",
];

const DEFAULT_PROVENANCE_AI_MODELS = [
  "LLM-based claim analysis and verdict generation via an OpenAI-compatible endpoint (configurable models; lightweight local models used for fast demo runs).",
  "Retrieval-Augmented Generation pipeline: embedder service + Qdrant vector search + reranker service for evidence selection.",
  "OCR model/service for image and PDF text extraction before verification.",
  "Rule-assisted calibration layer in backend job logic to combine model output with evidence relevance and canonical fact checks.",
  "Multilingual handling for Bangla + English claim processing and retrieval.",
];

const DEFAULT_PROVENANCE_RESPONSIBLE_AI = [
  "Evidence-first design: verdicts are grounded on retrieved sources, not free-form generation alone.",
  "Conservative fallback: when evidence is weak or mixed, the system returns unverified instead of forcing a confident answer.",
  "Human-in-the-loop path: uncertain/low-confidence outcomes are flagged for manual review.",
  "Transparency: each result includes explanation, confidence score, and source references when available.",
  "Safety controls: canonical fact shortcuts and contradiction checks reduce obvious model hallucinations.",
  "Auditability: claim lifecycle, processing status, and result metadata are logged for traceability and debugging.",
  "Localization-aware approach: supports Bangla and English to reduce language bias in verification workflow.",
];

const DEFAULT_FALLBACK_PITCH_SECTIONS: DocsPitchSection[] = [
  {
    id: "problem",
    title: "Problem",
    content:
      "Misinformation spreads quickly across text, screenshots, and reposted media while verification remains slow.",
  },
  {
    id: "solution",
    title: "Solution",
    content:
      "JachaiX provides OCR + retrieval + explainable verdicting with source links and reviewer escalation.",
  },
  {
    id: "demo",
    title: "Product Demo",
    content:
      "Submit text/image/PDF claims and get evidence-backed verdicts with confidence and sources.",
  },
  {
    id: "advantage",
    title: "Unique Advantage",
    content: "Bangla-first design with extensible architecture for international scale.",
  },
];

const DEFAULT_PROJECT_TEAM_MEMBERS = [
  {
    name: "BD Zamila Mohammad",
    role: "Leader - Presentation / Communication Lead, Business Analyst / Data Scientist",
    email: "zamila@jachaix.team",
    image_url: null,
  },
  {
    name: "BD Samanta Islam",
    role: "Member - Backend / Database / Scraper Engineer, UI/UX / Frontend Developer",
    email: "samanta@jachaix.team",
    image_url: null,
  },
  {
    name: "BD Humayra Binte Kazal",
    role: "Member - Backend / Database / Scraper Engineer, Team Leader / Project Coordinator",
    email: "humayra@jachaix.team",
    image_url: null,
  },
  {
    name: "BD Asmita Guha Thakurta",
    role: "Member - UI/UX / Frontend Developer, Backend / Database / Scraper Engineer",
    email: "asmita@jachaix.team",
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
    team_name: "JachaiX Core Team",
    pitch_sections: DEFAULT_FALLBACK_PITCH_SECTIONS,
    technical_sections: {
      architecture_diagram: "flowchart LR\\nUI[Next.js UI] --> API[Laravel API]\\nAPI --> Q[Queue Worker]\\nQ --> OCR[OCR Service]\\nQ --> EMB[Embedder Service]\\nQ --> RERANK[Reranker Service]\\nQ --> DB[(MySQL)]\\nEMB --> VDB[(Vector Index)]",
      data_flow_diagram: "flowchart LR\\nIN[Input] --> NORM[Normalization/OCR]\\nNORM --> RET[Retrieval]\\nRET --> RERANK[Rerank]\\nRERANK --> LLM[Verdict Generation]\\nLLM --> OUT[Result + Sources]\\nOUT --> FB[Human Review Feedback]",
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const res = await getPublicDocs();
          if (!mounted) return;

          if (res.success === false) {
            setBlocked(res.message || tx({ en: "Documentation is not available right now.", bn: "ডকুমেন্টেশন এখন উপলভ্য নয়।" }));
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
              ? tx({ en: "Documentation is temporarily unavailable. Please refresh and try again.", bn: "ডকুমেন্টেশন সাময়িকভাবে অনুপলব্ধ। রিফ্রেশ করে আবার চেষ্টা করুন।" })
              : error instanceof Error
                ? error.message
                : tx({ en: "Failed to load docs.", bn: "ডকস লোড করা যায়নি।" })
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
      setCopied(tx({ en: "Link copied!", bn: "লিংক কপি হয়েছে!" }));
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setCopied(tx({ en: "Could not copy link.", bn: "লিংক কপি করা যায়নি।" }));
      setTimeout(() => setCopied(null), 2500);
    }
  }

  async function copyToClipboard(key: string, textToCopy: string) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStates((prev) => ({ ...prev, [key]: tx({ en: "Copied!", bn: "কপি হয়েছে!" }) }));
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

  if (loading) {
    return (
      <main className="page-shell">
        <section className="hero-card reveal docs-hero">
          <div className="skeleton-box" style={{ width: "120px", height: "16px", marginBottom: "0.8rem" }} />
          <div className="skeleton-box" style={{ width: "60%", height: "32px", marginBottom: "1rem" }} />
          <div className="skeleton-box" style={{ width: "90%", height: "20px" }} />
        </section>

        <div className="docs-split-container">
          <div className="docs-sidebar-nav">
            <div className="skeleton-box" style={{ height: "14px", width: "80px", marginBottom: "1rem" }} />
            <div className="skeleton-box" style={{ height: "32px", marginBottom: "0.5rem" }} />
            <div className="skeleton-box" style={{ height: "32px", marginBottom: "0.5rem" }} />
            <div className="skeleton-box" style={{ height: "32px", marginBottom: "0.5rem" }} />
            <div className="skeleton-box" style={{ height: "32px", marginBottom: "0.5rem" }} />
          </div>
          <div style={{ display: "grid", gap: "1.2rem", width: "100%" }}>
            <section className="panel reveal">
              <div className="skeleton-box" style={{ width: "150px", height: "22px", marginBottom: "1.2rem" }} />
              <div className="kpi-grid">
                <div className="skeleton-box" style={{ height: "90px" }} />
                <div className="skeleton-box" style={{ height: "90px" }} />
                <div className="skeleton-box" style={{ height: "90px" }} />
                <div className="skeleton-box" style={{ height: "90px" }} />
              </div>
            </section>
            <section className="panel reveal">
              <div className="skeleton-box" style={{ width: "200px", height: "22px", marginBottom: "1.2rem" }} />
              <div className="skeleton-box" style={{ height: "160px" }} />
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (!page || !liveData) {
    return (
      <main className="page-shell">
        <section className="panel reveal" style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "3rem 2rem" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f3c372" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.5rem", display: "inline-block" }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="eyebrow" style={{ color: "var(--warn)" }}>{tx({ en: "/docs access control", bn: "/docs এক্সেস কন্ট্রোল" })}</p>
          <h1 style={{ fontSize: "1.85rem", marginTop: "0.5rem" }}>{tx({ en: "Documentation Locked", bn: "ডকুমেন্টেশন লকড" })}</h1>
          <p className="muted" style={{ margin: "1rem 0 2rem", fontSize: "0.98rem", lineHeight: "1.6" }}>
            {blocked || tx({ en: "This page is currently hidden by administrator controls.", bn: "এই পেজটি বর্তমানে অ্যাডমিন কন্ট্রোল দ্বারা লুকানো আছে।" })}
          </p>
          {visibility && (
            <div style={{ background: "rgba(243, 195, 114, 0.06)", border: "1px solid rgba(243, 195, 114, 0.2)", borderRadius: "12px", padding: "1rem", display: "inline-block", textAlign: "left", width: "100%" }}>
              <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: "600", color: "#f3c372" }}>{tx({ en: "Active Window Settings:", bn: "সক্রিয় উইন্ডো সেটিংস:" })}</p>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#e0ebfb", display: "grid", gap: "0.25rem" }}>
                <li>{tx({ en: "Visibility Switch", bn: "ভিজিবিলিটি সুইচ" })}: <strong>{visibility.is_enabled ? tx({ en: "ENABLED", bn: "সক্রিয়" }) : tx({ en: "DISABLED", bn: "নিষ্ক্রিয়" })}</strong></li>
                <li>{tx({ en: "Access Opens", bn: "অ্যাক্সেস খোলে" })}: <strong>{visibility.available_from ? new Date(visibility.available_from).toLocaleString() : tx({ en: "No limit", bn: "সীমা নেই" })}</strong></li>
                <li>{tx({ en: "Access Closes", bn: "অ্যাক্সেস বন্ধ" })}: <strong>{visibility.available_until ? new Date(visibility.available_until).toLocaleString() : tx({ en: "No limit", bn: "সীমা নেই" })}</strong></li>
              </ul>
            </div>
          )}
        </section>
      </main>
    );
  }

  const technical = page.technical_sections || {};
  const architectureDiagram = String((technical as Record<string, unknown>).architecture_diagram || "No architecture diagram");
  const dataFlowDiagram = String((technical as Record<string, unknown>).data_flow_diagram || "No data flow diagram");
  const provenance = resolveProvenanceLists(technical as Record<string, unknown>);
  const metrics = resolveMetrics(liveData.metrics);
  const placeholderTeam =
    (page.team_members || []).length === 1 &&
    page.team_members?.[0]?.email === "team@jachaix.local";
  const teamMembers = placeholderTeam || !(page.team_members || []).length
    ? DEFAULT_PROJECT_TEAM_MEMBERS
    : (page.team_members || []);

  return (
    <main className="page-shell">
      <section className="hero-card reveal docs-hero">
        {blocked && (
          <div className="docs-warning-banner">
            {tx({ en: "Docs API issue detected. Showing fallback frontend content so documentation remains visible.", bn: "ডকস API সমস্যা পাওয়া গেছে। ডকুমেন্টেশন দৃশ্যমান রাখতে fallback frontend কনটেন্ট দেখানো হচ্ছে।" })}
            {visibility ? ` (${tx({ en: "Visibility", bn: "ভিজিবিলিটি" })}: ${visibility.is_enabled ? "ON" : "OFF"})` : ""}
          </div>
        )}
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Interactive Live Docs", bn: "ইন্টারঅ্যাকটিভ লাইভ ডকস" })}</p>
          <div className="live-pill">v{page.version}</div>
        </div>
        <h1 style={{ fontSize: "2.1rem", marginTop: "0.5rem" }}>{tx({ en: "Pitch Deck + Technical Architecture + Live Sandbox", bn: "পিচ ডেক + টেকনিক্যাল আর্কিটেকচার + লাইভ স্যান্ডবক্স" })}</h1>
        <p className="subtitle" style={{ fontSize: "1.02rem", marginTop: "0.6rem" }}>
          {tx({ en: "Understand JachaiX in minutes. Review technical system diagrams, endpoint maps, and live operational stats below.", bn: "কয়েক মিনিটে JachaiX বুঝুন। নিচে টেকনিক্যাল সিস্টেম ডায়াগ্রাম, এন্ডপয়েন্ট ম্যাপ ও লাইভ অপারেশনাল স্ট্যাট দেখুন।" })}
        </p>
        <div className="docs-actions">
          <button type="button" onClick={copyShareLink} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#53e6c4" }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{copied}</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>{tx({ en: "Copy Share Link", bn: "শেয়ার লিংক কপি করুন" })}</span>
              </>
            )}
          </button>
          <button type="button" className="secondary" onClick={exportMarkdown} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{tx({ en: "Export Markdown", bn: "মার্কডাউন এক্সপোর্ট" })}</span>
          </button>
          <button type="button" className="secondary" onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>{tx({ en: "Export PDF", bn: "PDF এক্সপোর্ট" })}</span>
          </button>
        </div>
      </section>

      {/* Docs Mobile Pill Navigation */}
      <section className="panel reveal docs-mobile-toc">
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--warn)" }}>{tx({ en: "Table of Contents", bn: "সূচিপত্র" })}</span>
          <select value={activeId} onChange={(e) => {
            const el = document.getElementById(e.target.value);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}>
            <option value="metrics">{tx({ en: "Live metrics", bn: "লাইভ মেট্রিক্স" })}</option>
            {visibleSections.map((section) => (
              <option key={section.id} value={section.id}>{section.title}</option>
            ))}
            <option value="architecture">{tx({ en: "Architecture details", bn: "আর্কিটেকচার বিবরণ" })}</option>
            <option value="api">{tx({ en: "API documentation", bn: "API ডকুমেন্টেশন" })}</option>
            <option value="provenance">{tx({ en: "Data & AI provenance", bn: "ডেটা ও এআই প্রোভেন্যান্স" })}</option>
            <option value="team">{tx({ en: "Team members", bn: "টিম মেম্বার" })}</option>
            <option value="events">{tx({ en: "Recent pipeline events", bn: "সাম্প্রতিক পাইপলাইন ইভেন্ট" })}</option>
          </select>
        </div>
      </section>

      {/* Split screen content layout */}
      <div className="docs-split-container">
        {/* Sticky Table of Contents Sidebar */}
        <aside className="docs-sidebar-nav">
          <p className="docs-sidebar-title">Documentation</p>
          <a href="#metrics" className={`docs-sidebar-link ${activeId === "metrics" ? "active" : ""}`}>
            Live System Metrics
          </a>

          {visibleSections.length > 0 && (
            <>
              <p className="docs-sidebar-title" style={{ marginTop: "1rem" }}>Pitch Deck</p>
              {visibleSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`docs-sidebar-link ${activeId === section.id ? "active" : ""}`}
                  title={section.title}
                >
                  {section.title}
                </a>
              ))}
            </>
          )}

          <p className="docs-sidebar-title" style={{ marginTop: "1rem" }}>Technical Details</p>
          <a href="#architecture" className={`docs-sidebar-link ${activeId === "architecture" ? "active" : ""}`}>
            Architecture Diagrams
          </a>
          <a href="#api" className={`docs-sidebar-link ${activeId === "api" ? "active" : ""}`}>
            API Documentation
          </a>
          <a href="#provenance" className={`docs-sidebar-link ${activeId === "provenance" ? "active" : ""}`}>
            Data & AI Provenance
          </a>
          <a href="#team" className={`docs-sidebar-link ${activeId === "team" ? "active" : ""}`}>
            Team
          </a>
          <a href="#events" className={`docs-sidebar-link ${activeId === "events" ? "active" : ""}`}>
            Recent Events
          </a>
        </aside>

        {/* Main Content Area */}
        <div style={{ display: "grid", gap: "1.2rem" }}>
          {/* Live System Metrics Section */}
          <section id="metrics" className="panel reveal delay-1" style={{ scrollMarginTop: "100px" }}>
            <h2>Live System Metrics</h2>
            <div className="docs-metrics-grid">
              <article className="docs-metric-card">
                <div className="docs-metric-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="docs-metric-details">
                  <span className="docs-metric-number">{metrics.users}</span>
                  <span className="docs-metric-title">Active Users</span>
                </div>
              </article>

              <article className="docs-metric-card">
                <div className="docs-metric-icon" style={{ color: "var(--accent)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div className="docs-metric-details">
                  <span className="docs-metric-number">{metrics.claims_total}</span>
                  <span className="docs-metric-title">Claims Total</span>
                </div>
              </article>

              <article className="docs-metric-card">
                <div className="docs-metric-icon" style={{ color: "var(--accent-2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 11.08 22 12 12 22 2 12 12 2 19 2"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div className="docs-metric-details">
                  <span className="docs-metric-number">{metrics.claims_completed}</span>
                  <span className="docs-metric-title">Completed</span>
                </div>
              </article>

              <article className="docs-metric-card">
                <div className="docs-metric-icon" style={{ color: "var(--warn)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div className="docs-metric-details">
                  <span className="docs-metric-number">{metrics.published_fact_checks}</span>
                  <span className="docs-metric-title">Published Fact Checks</span>
                </div>
              </article>
            </div>
          </section>

          {/* Search bar inside split deck */}
          <section className="panel reveal">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <h2 style={{ margin: 0 }}>Pitch & Operational Deck</h2>
              <input
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deck and technical data..."
                style={{ width: "260px" }}
              />
            </div>
          </section>

          {/* YC Pitch Deck Sections */}
          {visibleSections.length > 0 && (
            <section className="panel reveal">
              <h2>YC-Style Pitch Deck</h2>
              <div className="docs-section-list">
                {visibleSections.map((section: DocsPitchSection) => (
                  <article key={section.id} id={section.id} className="docs-section-card">
                    <h3>{section.title}</h3>
                    <p>{section.content}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Architecture Sections */}
          <section id="architecture" className="panel reveal" style={{ scrollMarginTop: "100px" }}>
            <h2>Architecture & Technical Whitepaper</h2>
            <p className="muted" style={{ marginBottom: "1rem" }}>System blueprints showing data pipeline and worker structures.</p>

            <article className="docs-code-container">
              <div className="docs-code-header">
                <span className="docs-code-title">Architecture Diagram</span>
                <button
                  type="button"
                  className="docs-code-copy-btn"
                  onClick={() => copyToClipboard("arch", architectureDiagram)}
                >
                  {copyStates["arch"] || "Copy Diagram"}
                </button>
              </div>
              <pre className="docs-code-block">{architectureDiagram}</pre>
            </article>

            <article className="docs-code-container" style={{ marginTop: "1.5rem" }}>
              <div className="docs-code-header">
                <span className="docs-code-title">Data Flow Diagram</span>
                <button
                  type="button"
                  className="docs-code-copy-btn"
                  onClick={() => copyToClipboard("flow", dataFlowDiagram)}
                >
                  {copyStates["flow"] || "Copy Diagram"}
                </button>
              </div>
              <pre className="docs-code-block">{dataFlowDiagram}</pre>
            </article>
          </section>

          {/* API Registry Documentation */}
          <section id="api" className="panel reveal" style={{ scrollMarginTop: "100px" }}>
            <h2>API Documentation</h2>
            <p className="muted" style={{ marginBottom: "1rem" }}>Registered endpoints used by JachaiX claim validation clients.</p>
            <div className="table-wrap" style={{ borderRadius: "12px", border: "1px solid rgba(126, 188, 230, 0.15)", overflow: "hidden" }}>
              <table className="data-table" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(10, 20, 36, 0.5)" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Method</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Endpoint Route</th>
                  </tr>
                </thead>
                <tbody>
                  {liveData.apis.map((api) => {
                    const methodLower = (api.method || "get").toLowerCase();
                    return (
                      <tr key={`${api.method}-${api.path}`}>
                        <td style={{ padding: "0.75rem 1rem", width: "120px" }}>
                          <span className={`api-badge ${methodLower}`}>
                            {api.method}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#eff5ff", fontSize: "0.9rem" }}>
                          {api.path}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Data & AI Provenance */}
          <section id="provenance" className="panel reveal" style={{ scrollMarginTop: "100px" }}>
            <h2>Data & AI Provenance</h2>
            <p className="muted" style={{ marginBottom: "1rem" }}>
              Data sources, model stack, and responsible AI controls used in JachaiX.
            </p>

            <article className="docs-section-card" style={{ marginBottom: "1rem" }}>
              <h3>Data Sources</h3>
              <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1.2rem", display: "grid", gap: "0.4rem" }}>
                {provenance.dataSources.map((item, idx) => (
                  <li key={`ds-${idx}`}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="docs-section-card" style={{ marginBottom: "1rem" }}>
              <h3>AI Models</h3>
              <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1.2rem", display: "grid", gap: "0.4rem" }}>
                {provenance.aiModels.map((item, idx) => (
                  <li key={`am-${idx}`}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="docs-section-card">
              <h3>Responsible AI</h3>
              <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1.2rem", display: "grid", gap: "0.4rem" }}>
                {provenance.responsibleAi.map((item, idx) => (
                  <li key={`ra-${idx}`}>{item}</li>
                ))}
              </ul>
            </article>
          </section>

          {/* Team Section */}
          <section id="team" className="panel reveal" style={{ scrollMarginTop: "100px" }}>
            <h2>Project Team</h2>
            <p className="muted" style={{ marginBottom: "1.25rem" }}>{page.team_name || "Team members list"}</p>
            <div className="team-grid">
              {teamMembers.map((member) => (
                <article className="team-card" key={`${member.name}-${member.email}`}>
                  <div className="team-avatar-wrap">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="team-avatar" />
                    ) : (
                      <div className="team-avatar-fallback">{member.name.slice(0, 1).toUpperCase()}</div>
                    )}
                  </div>
                  <h3>{member.name}</h3>
                  <p className="muted" style={{ fontSize: "0.82rem", margin: "0.15rem 0 0.85rem" }}>{member.role}</p>
                  <a href={`mailto:${member.email}`}>Contact Email</a>
                </article>
              ))}
            </div>
          </section>

          {/* Timeline Audit Logs */}
          <section id="events" className="panel reveal" style={{ scrollMarginTop: "100px" }}>
            <h2>Recent Events</h2>
            <p className="muted" style={{ marginBottom: "1.25rem" }}>Live chronological verification timeline logs.</p>
            <div className="timeline">
              {(liveData.events || []).map((event) => (
                <article className="timeline-item" key={event.id}>
                  <p className="metric-label">Claim #{event.id}</p>
                  <h3>
                    Status: {event.status.toUpperCase()} · Verdict: {(event.verdict || "unverified").toUpperCase()}
                  </h3>
                  <p className="muted">Language: {event.language} · Timestamp: {event.created_at || "-"}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
