"use client";

import { FormEvent, useMemo, useState } from "react";
import { getClaimResult, getClaimStatus, submitHumanReview, submitTextClaim } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ClaimResult } from "@/lib/types";

type Phase = "idle" | "submitting" | "processing" | "completed" | "failed";
type ProcessingStage = "queued" | "analyzing" | "finalizing" | null;

const FUTURE_ITEMS = [
  {
    label: { en: "URL Verification", bn: "ইউআরএল ভেরিফিকেশন" },
    status: { en: "Future integration", bn: "ভবিষ্যৎ ইন্টিগ্রেশন" },
    summary: { en: "URL ingestion and article credibility analysis will be added in next sprint.", bn: "পরবর্তী স্প্রিন্টে URL ingestion ও article credibility analysis যোগ হবে।" },
  },
  {
    label: { en: "Audio Analysis", bn: "অডিও বিশ্লেষণ" },
    status: { en: "Future integration", bn: "ভবিষ্যৎ ইন্টিগ্রেশন" },
    summary: { en: "Speech transcript pipeline and source grounding are roadmap items.", bn: "Speech transcript pipeline এবং source grounding রোডম্যাপ আইটেম।" },
  },
  {
    label: { en: "Video Analysis", bn: "ভিডিও বিশ্লেষণ" },
    status: { en: "Future integration", bn: "ভবিষ্যৎ ইন্টিগ্রেশন" },
    summary: { en: "Frame extraction and timeline verification are not wired yet.", bn: "Frame extraction এবং timeline verification এখনো সংযুক্ত নয়।" },
  },
];

function phaseText(phase: Phase, stage: ProcessingStage, tx: (v: string | { en: string; bn: string }) => string) {
  if (phase === "idle") return tx({ en: "Ready", bn: "প্রস্তুত" });
  if (phase === "submitting") return tx({ en: "Submitting claim", bn: "ক্লেম জমা দেওয়া হচ্ছে" });
  if (phase === "processing") {
    if (stage === "queued") return tx({ en: "Queued in worker", bn: "ওয়ার্কারে কিউড" });
    if (stage === "analyzing") return tx({ en: "Analyzing evidence", bn: "এভিডেন্স বিশ্লেষণ হচ্ছে" });
    if (stage === "finalizing") return tx({ en: "Fetching verdict", bn: "ভার্ডিক্ট আনা হচ্ছে" });
    return tx({ en: "Analyzing and polling status", bn: "বিশ্লেষণ ও স্ট্যাটাস পোলিং চলছে" });
  }
  if (phase === "completed") return tx({ en: "Completed", bn: "সম্পন্ন" });
  return tx({ en: "Failed", bn: "ব্যর্থ" });
}

export function WorkspacePageContent() {
  const { tx } = useLanguage();
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
          <p className="eyebrow">{tx({ en: "Analyst Workspace", bn: "অ্যানালিস্ট ওয়ার্কস্পেস" })}</p>
          <div className="live-pill">{tx({ en: "Live Text Pipeline", bn: "লাইভ টেক্সট পাইপলাইন" })}</div>
        </div>
        <h1>{tx({ en: "Run claim verification and escalate uncertain cases in one workspace.", bn: "একটি ওয়ার্কস্পেসে ক্লেম ভেরিফিকেশন চালান এবং অনিশ্চিত কেস এসকেলেট করুন।" })}</h1>
      </section>

      <section className="grid">
        <article className="panel reveal delay-1">
          <h2>{tx({ en: "Text Claim Verification", bn: "টেক্সট ক্লেম ভেরিফিকেশন" })}</h2>
          <p className="muted">{tx({ en: "This form is fully connected to backend processing.", bn: "এই ফর্মটি সম্পূর্ণভাবে ব্যাকএন্ড প্রসেসিংয়ের সাথে সংযুক্ত।" })}</p>
          <form onSubmit={onSubmit} className="form-stack">
            <label>
              <span>{tx({ en: "Claim Text", bn: "ক্লেম টেক্সট" })}</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder={tx({ en: "Write the claim you want to verify", bn: "যে ক্লেম যাচাই করতে চান তা লিখুন" })}
              />
            </label>

            <label>
              <span>{tx({ en: "Language Route", bn: "ভাষার রুট" })}</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="bn">{tx({ en: "Bangla", bn: "বাংলা" })}</option>
                <option value="en">{tx({ en: "English", bn: "ইংরেজি" })}</option>
                <option value="banglish">Banglish</option>
                <option value="international">{tx({ en: "International", bn: "আন্তর্জাতিক" })}</option>
                <option value="auto">{tx({ en: "Auto", bn: "অটো" })}</option>
              </select>
            </label>

            <div className="actions">
              <button type="submit" disabled={!canSubmit}>
                {tx({ en: "Analyze Claim", bn: "ক্লেম বিশ্লেষণ করুন" })}
              </button>
              <div className="phase-chip">{phaseText(phase, processingStage, tx)}</div>
            </div>
          </form>

          {claimId && <p className="meta">{tx({ en: "Claim ID", bn: "ক্লেম আইডি" })}: {claimId}</p>}
          {error && <p className="error">{error}</p>}
        </article>

        <article className="panel reveal delay-2">
          <h2>{tx({ en: "Multimodal Queue", bn: "মাল্টিমডাল কিউ" })}</h2>
          <p className="muted">{tx({ en: "Image and PDF verification are live in Scan Center. Workspace is text-only.", bn: "ইমেজ ও PDF ভেরিফিকেশন Scan Center-এ লাইভ। Workspace শুধুমাত্র টেক্সট।" })}</p>
          <div className="future-list">
            <div className="future-item">
              <div>
                <p>Image OCR Verification</p>
                <small>{tx({ en: "Live now in Scan Center with file upload and OCR extraction.", bn: "ফাইল আপলোড ও OCR extraction সহ এখন Scan Center-এ লাইভ।" })}</small>
              </div>
              <b>{tx({ en: "Live in /scan", bn: "/scan এ লাইভ" })}</b>
            </div>
            <div className="future-item">
              <div>
                <p>PDF OCR Verification</p>
                <small>{tx({ en: "Live now in Scan Center with PDF parsing and backend analysis.", bn: "PDF parsing ও backend analysis সহ এখন Scan Center-এ লাইভ।" })}</small>
              </div>
              <b>{tx({ en: "Live in /scan", bn: "/scan এ লাইভ" })}</b>
            </div>
          </div>

          <p className="muted">{tx({ en: "Roadmap modules:", bn: "রোডম্যাপ মডিউল:" })}</p>
          <div className="future-list">
            {FUTURE_ITEMS.map((item) => (
              <div key={item.label.en} className="future-item">
                <div>
                  <p>{tx(item.label)}</p>
                  <small>{tx(item.summary)}</small>
                </div>
                <b>{tx(item.status)}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel reveal delay-3">
          <h2>{tx({ en: "Verification Result", bn: "ভেরিফিকেশন ফলাফল" })}</h2>
        {phase === "submitting" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="status-dot" style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
              <p style={{ margin: 0, fontWeight: "600" }}>{tx({ en: "Submitting claim text to pipeline...", bn: "পাইপলাইনে ক্লেম টেক্সট জমা দেওয়া হচ্ছে..." })}</p>
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
        {phase === "idle" && !result && <p className="muted">{tx({ en: "Submit a text claim to view result payload and evidence.", bn: "ফলাফল payload এবং evidence দেখতে একটি টেক্সট ক্লেম জমা দিন।" })}</p>}

        {result && (
          <>
            <div className="result-grid">
              <div>
                <p className="metric-label">{tx({ en: "Verdict", bn: "ভার্ডিক্ট" })}</p>
                <p className="metric-value">{String(result.verdict ?? "unverified").toUpperCase()}</p>
              </div>
              <div>
                <p className="metric-label">{tx({ en: "Confidence", bn: "কনফিডেন্স" })}</p>
                <p className="metric-value">{result.confidence_score ?? 0}</p>
              </div>
              <div>
                <p className="metric-label">{tx({ en: "Language", bn: "ভাষা" })}</p>
                <p className="metric-value">{result.language}</p>
              </div>
              <div>
                <p className="metric-label">{tx({ en: "Sources", bn: "সূত্র" })}</p>
                <p className="metric-value">{result.sources?.length ?? 0}</p>
              </div>
            </div>

            <p className="explanation">{result.explanation}</p>

            <h3>{tx({ en: "Cross Verification", bn: "ক্রস ভেরিফিকেশন" })}</h3>
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
              <p className="muted">{tx({ en: "No link suggestions returned for this claim.", bn: "এই ক্লেমের জন্য কোনো লিংক সুপারিশ পাওয়া যায়নি।" })}</p>
            )}

            <h3>{tx({ en: "Human Verification", bn: "মানব ভেরিফিকেশন" })}</h3>
            <p className="muted">{result.human_verification?.reason ?? tx({ en: "No recommendation returned", bn: "কোনো সুপারিশ পাওয়া যায়নি" })}</p>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder={tx({ en: "Optional note for admin/human reviewer", bn: "অ্যাডমিন/মানব রিভিউয়ারের জন্য ঐচ্ছিক নোট" })}
            />
            <button type="button" className="secondary" onClick={onSendReviewRequest}>
              {tx({ en: "Send To Human Review", bn: "মানব রিভিউতে পাঠান" })}
            </button>
            {reviewSent && <p className="meta">{reviewSent}</p>}
          </>
        )}
      </section>
    </main>
  );
}
