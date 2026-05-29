"use client";

import { FormEvent, useMemo, useState } from "react";
import { getClaimResult, getClaimStatus, submitHumanReview, submitTextClaim } from "@/lib/api";
import { ClaimResult } from "@/lib/types";

type Phase = "idle" | "submitting" | "processing" | "completed" | "failed";
type ProcessingStage = "queued" | "analyzing" | "finalizing" | null;

const FUTURE_ITEMS = [
  {
    label: "URL Verification",
    status: "Future integration",
    summary: "URL ingestion and article credibility analysis will be added in next sprint.",
  },
  {
    label: "Audio Analysis",
    status: "Future integration",
    summary: "Speech transcript pipeline and source grounding are roadmap items.",
  },
  {
    label: "Video Analysis",
    status: "Future integration",
    summary: "Frame extraction and timeline verification are not wired yet.",
  },
];

function phaseText(phase: Phase, stage: ProcessingStage) {
  if (phase === "idle") return "Ready";
  if (phase === "submitting") return "Submitting claim";
  if (phase === "processing") {
    if (stage === "queued") return "Queued in worker";
    if (stage === "analyzing") return "Analyzing evidence";
    if (stage === "finalizing") return "Fetching verdict";
    return "Analyzing and polling status";
  }
  if (phase === "completed") return "Completed";
  return "Failed";
}

export function WorkspacePageContent() {
  const [text, setText] = useState("WHO says COVID-19 vaccines do not contain microchips.");
  const [language, setLanguage] = useState("international");
  const [phase, setPhase] = useState<Phase>("idle");
  const [claimId, setClaimId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSent, setReviewSent] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => text.trim().length >= 8 && phase !== "submitting" && phase !== "processing",
    [text, phase]
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setReviewSent(null);
    setResult(null);
    setProcessingStage(null);
    setPhase("submitting");

    try {
      const submitted = await submitTextClaim(text.trim(), language);
      const id = Number(submitted.claim_id ?? submitted.job?.id);
      if (!id) throw new Error("Claim id missing in submit response");

      setClaimId(id);
      setPhase("processing");
      setProcessingStage("queued");

      const started = Date.now();
      const timeoutMs = 180000;

      while (Date.now() - started < timeoutMs) {
        const status = await getClaimStatus(id);
        const current = status.claim.status;

        if (current === "pending") {
          setProcessingStage("queued");
        }

        if (current === "processing") {
          setProcessingStage("analyzing");
        }

        if (current === "completed") {
          setProcessingStage("finalizing");
          const finalResult = await getClaimResult(id);
          setResult(finalResult);
          setProcessingStage(null);
          setPhase("completed");
          return;
        }

        if (current === "failed") {
          setProcessingStage(null);
          setPhase("failed");
          const reason = status.claim.failure_reason?.trim();
          setError(reason ? `Claim processing failed: ${reason}` : "Claim processing failed in backend job.");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1800));
      }

      setPhase("failed");
      setProcessingStage(null);
      setError("Timeout while waiting for result. The backend may still complete shortly.");
    } catch (submissionError) {
      setPhase("failed");
      setProcessingStage(null);
      setError(submissionError instanceof Error ? submissionError.message : "Unexpected submit error");
    }
  }

  async function onSendReviewRequest() {
    if (!result?.id) return;

    try {
      const response = await submitHumanReview(
        result.id,
        "Evidence appears weak, requesting manual review",
        reviewNote.trim(),
        "frontend_user"
      );
      setReviewSent(response.message);
    } catch (sendError) {
      setReviewSent(sendError instanceof Error ? sendError.message : "Failed to send review request");
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">Analyst Workspace</p>
          <div className="live-pill">Live Text Pipeline</div>
        </div>
        <h1>Run claim verification and escalate uncertain cases in one workspace.</h1>
      </section>

      <section className="grid">
        <article className="panel reveal delay-1">
          <h2>Text Claim Verification</h2>
          <p className="muted">This form is fully connected to backend processing.</p>
          <form onSubmit={onSubmit} className="form-stack">
            <label>
              <span>Claim Text</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Write the claim you want to verify"
              />
            </label>

            <label>
              <span>Language Route</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="bn">Bangla</option>
                <option value="en">English</option>
                <option value="banglish">Banglish</option>
                <option value="international">International</option>
                <option value="auto">Auto</option>
              </select>
            </label>

            <div className="actions">
              <button type="submit" disabled={!canSubmit}>
                Analyze Claim
              </button>
              <div className="phase-chip">{phaseText(phase, processingStage)}</div>
            </div>
          </form>

          {claimId && <p className="meta">Claim ID: {claimId}</p>}
          {error && <p className="error">{error}</p>}
        </article>

        <article className="panel reveal delay-2">
          <h2>Multimodal Queue</h2>
          <p className="muted">Image and PDF verification are live in Scan Center. Workspace is text-only.</p>
          <div className="future-list">
            <div className="future-item">
              <div>
                <p>Image OCR Verification</p>
                <small>Live now in Scan Center with file upload and OCR extraction.</small>
              </div>
              <b>Live in /scan</b>
            </div>
            <div className="future-item">
              <div>
                <p>PDF OCR Verification</p>
                <small>Live now in Scan Center with PDF parsing and backend analysis.</small>
              </div>
              <b>Live in /scan</b>
            </div>
          </div>

          <p className="muted">Roadmap modules:</p>
          <div className="future-list">
            {FUTURE_ITEMS.map((item) => (
              <div key={item.label} className="future-item">
                <div>
                  <p>{item.label}</p>
                  <small>{item.summary}</small>
                </div>
                <b>{item.status}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel reveal delay-3">
        <h2>Verification Result</h2>
        {phase === "submitting" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="status-dot" style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>Submitting claim text to pipeline...</p>
            </div>
            <div className="skeleton-box" style={{ height: "16px", width: "40%" }} />
            <div className="skeleton-box" style={{ height: "80px", borderRadius: "12px" }} />
          </div>
        )}
        {phase === "processing" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="status-dot" style={{ background: "var(--warn)", boxShadow: "0 0 12px var(--warn)" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>
                Analyzing evidence (Stage: {processingStage === "queued" ? "Queued in worker" : processingStage === "analyzing" ? "Analyzing evidence" : "Finalizing verdict"})...
              </p>
            </div>
            <div className="skeleton-box" style={{ height: "16px", width: "60%" }} />
            <div className="skeleton-box" style={{ height: "100px", borderRadius: "12px" }} />
          </div>
        )}
        {phase === "failed" && !result && <p className="error">{error || "Claim verification failed."}</p>}
        {phase === "idle" && !result && <p className="muted">Submit a text claim to view result payload and evidence.</p>}

        {result && (
          <>
            <div className="result-grid">
              <div>
                <p className="metric-label">Verdict</p>
                <p className="metric-value">{String(result.verdict ?? "unverified").toUpperCase()}</p>
              </div>
              <div>
                <p className="metric-label">Confidence</p>
                <p className="metric-value">{result.confidence_score ?? 0}</p>
              </div>
              <div>
                <p className="metric-label">Language</p>
                <p className="metric-value">{result.language}</p>
              </div>
              <div>
                <p className="metric-label">Sources</p>
                <p className="metric-value">{result.sources?.length ?? 0}</p>
              </div>
            </div>

            <p className="explanation">{result.explanation}</p>

            <h3>Cross Verification</h3>
            {result.cross_verification?.links?.length ? (
              <ul className="links">
                {result.cross_verification.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.title} · {link.source}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No link suggestions returned for this claim.</p>
            )}

            <h3>Human Verification</h3>
            <p className="muted">{result.human_verification?.reason ?? "No recommendation returned"}</p>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Optional note for admin/human reviewer"
            />
            <button type="button" className="secondary" onClick={onSendReviewRequest}>
              Send To Human Review
            </button>
            {reviewSent && <p className="meta">{reviewSent}</p>}
          </>
        )}
      </section>
    </main>
  );
}
