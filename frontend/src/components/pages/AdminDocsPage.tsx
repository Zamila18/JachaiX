"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminDocs,
  setAdminDocsSchedule,
  setAdminDocsVisibility,
  updateAdminDocs,
} from "@/lib/api";
import type { DocsPageData, DocsPitchSection, DocsTeamMember, DocsVisibility } from "@/lib/types";

const DEFAULT_PROJECT_PITCH_SECTIONS: DocsPitchSection[] = [
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

const DEFAULT_PROJECT_TEAM: DocsTeamMember[] = [
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

const DEFAULT_PROJECT_TECHNICAL = {
  architecture_diagram:
    "flowchart LR\\nUI[Next.js UI] --> API[Laravel API]\\nAPI --> Q[Queue Worker]\\nQ --> OCR[OCR Service]\\nQ --> EMB[Embedder Service]\\nQ --> RERANK[Reranker Service]\\nQ --> DB[(MySQL)]\\nEMB --> VDB[(Vector Index)]",
  data_flow_diagram:
    "flowchart LR\\nIN[Input] --> NORM[Normalization/OCR]\\nNORM --> RET[Retrieval]\\nRET --> RERANK[Rerank]\\nRERANK --> LLM[Verdict Generation]\\nLLM --> OUT[Result + Sources]\\nOUT --> FB[Human Review Feedback]",
  provenance_data_sources: [
    "Public fact-check and news corpus from trusted outlets (Bangla + English).",
    "Normalized corpus data under crawler/chunker pipelines.",
    "OCR outputs, retrieved evidence snippets, and decision traces from verification jobs.",
    "Operational metadata from claims, audits, and publication workflows.",
    "Vectorized evidence knowledge base indexed for semantic retrieval.",
  ],
  provenance_ai_models: [
    "LLM-based claim analysis via configurable OpenAI-compatible endpoints.",
    "RAG stack with embedder + Qdrant retrieval + reranker services.",
    "OCR services for image and PDF extraction.",
    "Rule-assisted backend calibration for evidence-grounded verdict quality.",
    "Multilingual processing support for Bangla and English claims.",
  ],
  provenance_responsible_ai: [
    "Evidence-first verdicting with transparent source references.",
    "Conservative uncertainty handling with unverified fallback.",
    "Human review path for low-confidence and disputed outputs.",
    "Auditability through claim/job/event metadata tracking.",
    "Safety checks for contradiction and canonical fact alignment.",
  ],
};

function buildAdminFallbackPageData(): DocsPageData {
  return {
    team_name: "JachaiX Core Team",
    pitch_sections: DEFAULT_PROJECT_PITCH_SECTIONS,
    technical_sections: DEFAULT_PROJECT_TECHNICAL,
    team_members: DEFAULT_PROJECT_TEAM,
    updated_by: "frontend_fallback",
    version: 1,
    updated_at: new Date().toISOString(),
  };
}

function resolveAdminPageData(page: DocsPageData): DocsPageData {
  const fallback = buildAdminFallbackPageData();
  const technical = page.technical_sections || {};
  const hasTechnical = Object.keys(technical).length > 0;
  const teamMembers = page.team_members || [];

  return {
    ...page,
    team_name: page.team_name?.trim() ? page.team_name : fallback.team_name,
    pitch_sections: page.pitch_sections?.length ? page.pitch_sections : fallback.pitch_sections,
    technical_sections: hasTechnical
      ? { ...(fallback.technical_sections || {}), ...technical }
      : fallback.technical_sections,
    team_members: teamMembers.length ? teamMembers : fallback.team_members,
  };
}

function buildAdminFallbackVisibility(): DocsVisibility {
  return {
    is_enabled: true,
    available_from: null,
    available_until: null,
    is_visible_now: true,
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

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminDocsPageView() {
  const [page, setPage] = useState<DocsPageData | null>(null);
  const [visibility, setVisibility] = useState<DocsVisibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | "info">("info");

  const [teamName, setTeamName] = useState("");
  const [pitchSections, setPitchSections] = useState<DocsPitchSection[]>([]);
  const [teamMembers, setTeamMembers] = useState<DocsTeamMember[]>([]);
  const [technicalJson, setTechnicalJson] = useState("{}");

  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");

  async function load() {
    setLoading(true);
    setMessage(null);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await getAdminDocs();
        const resolvedPage = resolveAdminPageData(res.page);

        setPage(resolvedPage);
        setVisibility(res.visibility);
        setTeamName(resolvedPage.team_name || "");
        setPitchSections(resolvedPage.pitch_sections || []);
        setTeamMembers(resolvedPage.team_members || []);
        setTechnicalJson(JSON.stringify(resolvedPage.technical_sections || {}, null, 2));
        setAvailableFrom(toLocalInput(res.visibility.available_from));
        setAvailableUntil(toLocalInput(res.visibility.available_until));
        break;
      } catch (error) {
        if (attempt === 0 && isTransientNetworkError(error)) {
          continue;
        }

        const fallbackPage = buildAdminFallbackPageData();
        const fallbackVisibility = buildAdminFallbackVisibility();

        setPage(fallbackPage);
        setVisibility(fallbackVisibility);
        setTeamName(fallbackPage.team_name || "");
        setPitchSections(fallbackPage.pitch_sections || []);
        setTeamMembers(fallbackPage.team_members || []);
        setTechnicalJson(JSON.stringify(fallbackPage.technical_sections || {}, null, 2));
        setAvailableFrom("");
        setAvailableUntil("");

        setMsgType("info");
        setMessage(
          isTransientNetworkError(error)
            ? "Backend unavailable. Loaded project documentation defaults in frontend mode."
            : "Loaded frontend fallback documentation defaults."
        );
        break;
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const canSave = useMemo(() => {
    if (!pitchSections.length) return false;
    return pitchSections.every((section) => section.id.trim() && section.title.trim() && section.content.trim());
  }, [pitchSections]);

  function updateSection(index: number, field: keyof DocsPitchSection, value: string) {
    setPitchSections((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function moveSection(index: number, direction: -1 | 1) {
    setPitchSections((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  }

  function addSection() {
    setPitchSections((current) => [
      ...current,
      { id: `section-${current.length + 1}`, title: "New Section", content: "Add content" },
    ]);
  }

  function removeSection(index: number) {
    setPitchSections((current) => current.filter((_, i) => i !== index));
  }

  function updateTeamMember(index: number, field: keyof DocsTeamMember, value: string) {
    setTeamMembers((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addTeamMember() {
    setTeamMembers((current) => [...current, { name: "", role: "", email: "", image_url: "" }]);
  }

  function removeTeamMember(index: number) {
    setTeamMembers((current) => current.filter((_, i) => i !== index));
  }

  async function onSaveContent() {
    try {
      setMessage(null);
      const technical_sections = JSON.parse(technicalJson || "{}");
      const res = await updateAdminDocs({
        team_name: teamName,
        pitch_sections: pitchSections,
        team_members: teamMembers,
        technical_sections,
        updated_by: "admin_docs",
      });
      setPage(res.page);
      setVisibility(res.visibility);
      setMsgType("success");
      setMessage("Documentation content saved successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMsgType("error");
      setMessage(error instanceof Error ? error.message : "Failed to save docs content.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function onToggleVisibility(enabled: boolean) {
    try {
      setMessage(null);
      const res = await setAdminDocsVisibility({ is_enabled: enabled, updated_by: "admin_docs" });
      setPage(res.page);
      setVisibility(res.visibility);
      setMsgType("success");
      setMessage(`Documentation module is now ${enabled ? "LIVE" : "HIDDEN"}.`);
    } catch (error) {
      setMsgType("error");
      setMessage(error instanceof Error ? error.message : "Failed to update visibility.");
    }
  }

  async function onSaveSchedule() {
    try {
      setMessage(null);
      const res = await setAdminDocsSchedule({
        available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
        available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
        updated_by: "admin_docs",
      });
      setPage(res.page);
      setVisibility(res.visibility);
      setMsgType("success");
      setMessage("Documentation access schedule updated.");
    } catch (error) {
      setMsgType("error");
      setMessage(error instanceof Error ? error.message : "Failed to update schedule.");
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="panel reveal">
          <div className="skeleton-box" style={{ width: "160px", height: "18px", marginBottom: "1rem" }} />
          <div className="skeleton-box" style={{ width: "40%", height: "28px" }} />
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card reveal" style={{ borderBottom: "2px solid var(--accent)", background: "radial-gradient(circle at 90% 10%, rgba(83, 230, 196, 0.08), transparent 45%), linear-gradient(170deg, var(--card-bright), var(--card))" }}>
        <div className="hero-top">
          <p className="eyebrow">Admin Console</p>
          <div className="live-pill" style={{
            background: visibility?.is_visible_now ? "rgba(20, 63, 58, 0.42)" : "rgba(63, 20, 20, 0.42)",
            borderColor: visibility?.is_visible_now ? "rgba(87, 225, 195, 0.48)" : "rgba(255, 138, 138, 0.48)",
            color: visibility?.is_visible_now ? "#c7fff2" : "#ffd4d4"
          }}>
            {visibility?.is_visible_now ? "Currently Public" : "Currently Hidden"}
          </div>
        </div>
        <h1 style={{ fontSize: "2rem", marginTop: "0.5rem" }}>Documentation Configurator</h1>
        <p className="subtitle" style={{ marginTop: "0.5rem" }}>
          Control access schedules, visibility overrides, pitch sections, and tech diagrams for the public documentation route.
        </p>
      </section>

      {message && (
        <section className={`panel reveal`} style={{
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: msgType === "success" ? "1px solid rgba(83, 230, 196, 0.3)" : msgType === "error" ? "1px solid rgba(255, 138, 138, 0.3)" : "1px solid rgba(126, 188, 230, 0.3)",
          background: msgType === "success" ? "rgba(83, 230, 196, 0.06)" : msgType === "error" ? "rgba(255, 138, 138, 0.06)" : "rgba(12, 28, 52, 0.5)",
          color: msgType === "success" ? "#8ffff0" : msgType === "error" ? "#ffd4d4" : "#eff5ff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "600" }}>
            {msgType === "success" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            {msgType === "error" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            <span>{message}</span>
          </div>
        </section>
      )}

      {/* Visibility and Scheduling */}
      <section className="panel reveal delay-1" style={{ display: "grid", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", borderBottom: "1px solid rgba(126, 188, 230, 0.15)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
          Visibility & Availability Range
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <div className="actions" style={{ gap: "0.55rem" }}>
            <button
              type="button"
              onClick={() => onToggleVisibility(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "linear-gradient(130deg, #53e6c4, #87f1d9)", color: "#081325" }}
            >
              Enable Override (ON)
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => onToggleVisibility(false)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              Disable Override (OFF)
            </button>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Manual override takes precedence over scheduled start/end dates.
          </div>
        </div>

        <div className="admin-inline-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem", marginTop: "0.5rem" }}>
          <label>
            <span>Available From Date/Time</span>
            <input
              className="search-input"
              type="datetime-local"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              style={{ width: "100%", marginTop: "0.3rem" }}
            />
          </label>
          <label>
            <span>Available Until Date/Time</span>
            <input
              className="search-input"
              type="datetime-local"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
              style={{ width: "100%", marginTop: "0.3rem" }}
            />
          </label>
        </div>
        <div>
          <button
            type="button"
            onClick={onSaveSchedule}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", fontSize: "0.88rem" }}
          >
            Apply Availability Schedule
          </button>
        </div>
      </section>

      {/* Pitch Deck Sections */}
      <section className="panel reveal delay-2" style={{ display: "grid", gap: "1.2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderBottom: "1px solid rgba(126, 188, 230, 0.15)", paddingBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Pitch Deck Configuration</h2>
          <button
            type="button"
            onClick={addSection}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.84rem", padding: "0.45rem 0.85rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Section Card</span>
          </button>
        </div>

        <div className="docs-section-list" style={{ gap: "1.2rem" }}>
          {pitchSections.length === 0 && (
            <p className="muted" style={{ padding: "2rem", textAlign: "center", border: "1px dashed rgba(126, 188, 230, 0.2)", borderRadius: "12px" }}>
              No sections exist. Create one using the button above.
            </p>
          )}
          {pitchSections.map((section, index) => (
            <article
              className="docs-section-card"
              key={`${section.id}-${index}`}
              style={{
                display: "grid",
                gap: "1rem",
                border: "1px solid rgba(126, 188, 230, 0.2)",
                background: "rgba(9, 20, 35, 0.5)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(126, 188, 230, 0.1)", paddingBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--accent)" }}>Card #{index + 1}</span>
                <div className="actions" style={{ gap: "0.4rem" }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    style={{ padding: "0.28rem 0.5rem", display: "inline-flex", alignItems: "center" }}
                    title="Move section up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => moveSection(index, 1)}
                    disabled={index === pitchSections.length - 1}
                    style={{ padding: "0.28rem 0.5rem", display: "inline-flex", alignItems: "center" }}
                    title="Move section down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => removeSection(index)}
                    style={{ padding: "0.28rem 0.5rem", display: "inline-flex", alignItems: "center", borderColor: "rgba(255, 138, 138, 0.3)", color: "#ff8a8a" }}
                    title="Delete section"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              <div className="admin-inline-grid" style={{ gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                <label>
                  <span>Anchor/Section ID</span>
                  <input
                    className="search-input"
                    value={section.id}
                    onChange={(e) => updateSection(index, "id", e.target.value)}
                    placeholder="e.g. problem-section"
                    style={{ width: "100%", marginTop: "0.3rem" }}
                  />
                </label>
                <label>
                  <span>Card Title</span>
                  <input
                    className="search-input"
                    value={section.title}
                    onChange={(e) => updateSection(index, "title", e.target.value)}
                    placeholder="e.g. The Problem"
                    style={{ width: "100%", marginTop: "0.3rem" }}
                  />
                </label>
              </div>

              <label>
                <span>Content Body</span>
                <textarea
                  rows={4}
                  value={section.content}
                  onChange={(e) => updateSection(index, "content", e.target.value)}
                  placeholder="Card presentation content detail..."
                  style={{ width: "100%", marginTop: "0.3rem" }}
                />
              </label>
            </article>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="panel reveal delay-3" style={{ display: "grid", gap: "1.2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderBottom: "1px solid rgba(126, 188, 230, 0.15)", paddingBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Team & Organization</h2>
            <input
              className="search-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team/Company Name"
              style={{ width: "240px" }}
            />
          </div>
          <button
            type="button"
            onClick={addTeamMember}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.84rem", padding: "0.45rem 0.85rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Member</span>
          </button>
        </div>

        <div className="team-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
          {teamMembers.map((member, index) => (
            <article
              className="team-card"
              key={`${member.email}-${index}`}
              style={{
                alignItems: "stretch",
                textAlign: "left",
                border: "1px solid rgba(126, 188, 230, 0.2)",
                background: "rgba(9, 20, 35, 0.5)",
                display: "grid",
                gap: "0.85rem",
                padding: "1.25rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(126, 188, 230, 0.1)", paddingBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--accent-2)" }}>Member #{index + 1}</span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => removeTeamMember(index)}
                  style={{ padding: "0.22rem 0.45rem", fontSize: "0.76rem", borderColor: "rgba(255, 138, 138, 0.3)", color: "#ff8a8a", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  <span>Remove</span>
                </button>
              </div>

              <div style={{ display: "grid", gap: "0.75rem" }}>
                <label>
                  <span style={{ fontSize: "0.76rem" }}>Full Name</span>
                  <input
                    className="search-input"
                    value={member.name}
                    onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                    placeholder="Name"
                    style={{ width: "100%", marginTop: "0.2rem" }}
                  />
                </label>
                <label>
                  <span style={{ fontSize: "0.76rem" }}>Role/Title</span>
                  <input
                    className="search-input"
                    value={member.role}
                    onChange={(e) => updateTeamMember(index, "role", e.target.value)}
                    placeholder="e.g. Lead Engineer"
                    style={{ width: "100%", marginTop: "0.2rem" }}
                  />
                </label>
                <label>
                  <span style={{ fontSize: "0.76rem" }}>Contact Email</span>
                  <input
                    className="search-input"
                    value={member.email}
                    onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                    placeholder="Email"
                    style={{ width: "100%", marginTop: "0.2rem" }}
                  />
                </label>
                <label>
                  <span style={{ fontSize: "0.76rem" }}>Avatar Image URL (Optional)</span>
                  <input
                    className="search-input"
                    value={member.image_url || ""}
                    onChange={(e) => updateTeamMember(index, "image_url", e.target.value)}
                    placeholder="https://..."
                    style={{ width: "100%", marginTop: "0.2rem" }}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Technical Diagrams JSON */}
      <section className="panel reveal delay-4" style={{ display: "grid", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", borderBottom: "1px solid rgba(126, 188, 230, 0.15)", paddingBottom: "0.5rem" }}>
          Technical Diagrams & Whitepaper Data (JSON)
        </h2>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "-0.5rem" }}>
          Customize technical fields in this JSON block. For live provenance on public docs, use: provenance_data_sources (array), provenance_ai_models (array), and provenance_responsible_ai (array).
        </p>
        <textarea
          rows={12}
          value={technicalJson}
          onChange={(e) => setTechnicalJson(e.target.value)}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.86rem", background: "rgba(5, 12, 22, 0.85)" }}
        />
      </section>

      {/* Save Trigger Panel */}
      <section className="panel reveal delay-4" style={{ display: "flex", justifyContent: "flex-end", padding: "1.25rem" }}>
        <button
          type="button"
          onClick={onSaveContent}
          disabled={!canSave}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.75rem",
            fontSize: "1rem",
            background: "linear-gradient(130deg, #f0bf6b, #ffdfaa)",
            boxShadow: "0 4px 14px rgba(240, 191, 107, 0.25)"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Save Document Settings</span>
        </button>
      </section>
    </main>
  );
}
