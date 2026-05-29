"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  getClaimResult,
  getClaimStatus,
  submitImageClaim,
  submitPdfClaim,
  submitHumanReview,
} from "@/lib/api";
import { ClaimResult } from "@/lib/types";

type ScanMode = "image" | "pdf";
type Phase = "idle" | "submitting" | "processing" | "completed" | "failed";

function phaseText(phase: Phase) {
  if (phase === "idle") return "Ready";
  if (phase === "submitting") return "Uploading";
  if (phase === "processing") return "Analyzing";
  if (phase === "completed") return "Completed";
  return "Failed";
}

export function ScanPageContent() {
  const [mode, setMode] = useState<ScanMode>("image");
  const [language, setLanguage] = useState("auto");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [claimId, setClaimId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSent, setReviewSent] = useState<string | null>(null);

  const accepted = mode === "image" ? ".jpg,.jpeg,.png,.webp" : ".pdf";

  const canSubmit = useMemo(() => {
    return !!file && phase !== "submitting" && phase !== "processing";
  }, [file, phase]);

  function onModeChange(next: ScanMode) {
    setMode(next);
    setFile(null);
    setError(null);
    setResult(null);
    setReviewSent(null);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setReviewSent(null);
    setResult(null);

    if (!file) {
      setError("Please choose a file before submitting.");
      return;
    }

    setPhase("submitting");

    try {
      const submitted =
        mode === "image"
          ? await submitImageClaim(file, language)
          : await submitPdfClaim(file, language);

      const id = Number(submitted.claim_id ?? submitted.job?.id);
      if (!id) throw new Error("Claim id missing in submit response");

      setClaimId(id);
      setPhase("processing");

      const started = Date.now();
      const timeoutMs = 180000;

      while (Date.now() - started < timeoutMs) {
        const status = await getClaimStatus(id);
        const current = status.claim.status;

        if (current === "completed") {
          const finalResult = await getClaimResult(id);
          setResult(finalResult);
          setPhase("completed");
          return;
        }

        if (current === "failed") {
          setPhase("failed");
          setError("Claim processing failed in backend job.");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1800));
      }

      setPhase("failed");
      setError("Timeout while waiting for result. The backend may still complete shortly.");
    } catch (scanError) {
      setPhase("failed");
      setError(scanError instanceof Error ? scanError.message : "Unexpected scan error");
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
          <p className="eyebrow">Scan Center</p>
          <div className="live-pill">Live OCR and PDF Pipeline</div>
        </div>
        <h2>Upload image or PDF, extract claim text, and verify verdict via backend pipeline.</h2>
        <p className="subtitle">
          This page is directly connected to /api/v1/analyze/image and /api/v1/analyze/pdf.
        </p>
      </section>

      <section className="grid">
        <article className="panel reveal delay-1">
          <h2>Upload and Analyze</h2>
          <form onSubmit={onSubmit} className="form-stack">
            <div className="mode-toggle" role="tablist" aria-label="Scan mode">
              <button
                type="button"
                className={mode === "image" ? "tab-btn active" : "tab-btn"}
                onClick={() => onModeChange("image")}
              >
                Image OCR
              </button>
              <button
                type="button"
                className={mode === "pdf" ? "tab-btn active" : "tab-btn"}
                onClick={() => onModeChange("pdf")}
              >
                PDF OCR
              </button>
            </div>

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

            <label>
              <span>{mode === "image" ? "Image File" : "PDF File"}</span>
              <input type="file" accept={accepted} onChange={onFileChange} />
            </label>

            {file && (
              <p className="meta">
                Selected: {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
              </p>
            )}

            <div className="actions">
              <button type="submit" disabled={!canSubmit}>
                Run {mode === "image" ? "Image" : "PDF"} Verification
              </button>
              <div className="phase-chip">{phaseText(phase)}</div>
            </div>
          </form>

          {claimId && <p className="meta">Claim ID: {claimId}</p>}
          {error && <p className="error">{error}</p>}
        </article>

        <article className="panel reveal delay-2">
          <h2>What Happens</h2>
          <ol className="pipeline-list">
            <li>File is uploaded to backend storage.</li>
            <li>OCR extracts text from image or PDF content.</li>
            <li>Extracted claim flows through retrieval and reranking.</li>
            <li>Verdict, confidence, and evidence links are returned.</li>
          </ol>
        </article>
      </section>

      <section className="panel reveal delay-3">
        <h2>Scan Result</h2>
        {phase === "submitting" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="status-dot" style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>Uploading document to secure storage...</p>
            </div>
            <div className="skeleton-box" style={{ height: "16px", width: "40%" }} />
            <div className="skeleton-box" style={{ height: "80px", borderRadius: "12px" }} />
          </div>
        )}
        {phase === "processing" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="status-dot" style={{ background: "var(--warn)", boxShadow: "0 0 12px var(--warn)" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>Running OCR extraction and executing semantic retrieval checks...</p>
            </div>
            <div className="skeleton-box" style={{ height: "16px", width: "60%" }} />
            <div className="skeleton-box" style={{ height: "100px", borderRadius: "12px" }} />
          </div>
        )}
        {phase === "failed" && !result && <p className="error">{error || "Claim verification failed."}</p>}
        {phase === "idle" && !result && <p className="muted">Upload a file to view OCR + verdict result.</p>}

        {result && (
          <>
            <div className="result-grid">
              <div>
                <p className="metric-label">Input Type</p>
                <p className="metric-value">{result.input_type ?? mode}</p>
              </div>
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
            </div>

            {result.extracted_text && <p className="explanation">Extracted Text: {result.extracted_text}</p>}
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
