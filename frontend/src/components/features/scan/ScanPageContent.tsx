"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  getClaimResult,
  getClaimStatus,
  submitImageClaim,
  submitPdfClaim,
  submitHumanReview,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ClaimResult } from "@/lib/types";

type ScanMode = "image" | "pdf";
type Phase = "idle" | "submitting" | "processing" | "completed" | "failed";

function phaseText(phase: Phase, tx: (value: string | { en: string; bn: string }) => string) {
  if (phase === "idle") return tx({ en: "Ready", bn: "প্রস্তুত" });
  if (phase === "submitting") return tx({ en: "Uploading", bn: "আপলোড হচ্ছে" });
  if (phase === "processing") return tx({ en: "Analyzing", bn: "বিশ্লেষণ হচ্ছে" });
  if (phase === "completed") return tx({ en: "Completed", bn: "সম্পন্ন" });
  return tx({ en: "Failed", bn: "ব্যর্থ" });
}

export function ScanPageContent() {
  const { tx } = useLanguage();
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
      setError(tx({ en: "Please choose a file before submitting.", bn: "জমা দেওয়ার আগে একটি ফাইল নির্বাচন করুন।" }));
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
      setError(tx({ en: "Timeout while waiting for result. The backend may still complete shortly.", bn: "ফলাফলের জন্য অপেক্ষায় টাইমআউট হয়েছে। ব্যাকএন্ড অল্প সময়ের মধ্যে সম্পন্ন করতে পারে।" }));
    } catch (scanError) {
      setPhase("failed");
      setError(scanError instanceof Error ? scanError.message : tx({ en: "Unexpected scan error", bn: "অপ্রত্যাশিত স্ক্যান ত্রুটি" }));
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
      setReviewSent(sendError instanceof Error ? sendError.message : tx({ en: "Failed to send review request", bn: "রিভিউ অনুরোধ পাঠানো যায়নি" }));
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Scan Center", bn: "স্ক্যান সেন্টার" })}</p>
          <div className="live-pill">{tx({ en: "Live OCR and PDF Pipeline", bn: "লাইভ OCR ও PDF পাইপলাইন" })}</div>
        </div>
        <h2>{tx({ en: "Upload image or PDF, extract claim text, and verify verdict via backend pipeline.", bn: "ইমেজ বা PDF আপলোড করুন, ক্লেম টেক্সট এক্সট্র্যাক্ট করুন এবং ব্যাকএন্ড পাইপলাইনে ভার্ডিক্ট যাচাই করুন।" })}</h2>
        <p className="subtitle">
          {tx({ en: "This page is directly connected to /api/v1/analyze/image and /api/v1/analyze/pdf.", bn: "এই পেজটি সরাসরি /api/v1/analyze/image এবং /api/v1/analyze/pdf এর সাথে সংযুক্ত।" })}
        </p>
      </section>

      <section className="grid">
        <article className="panel reveal delay-1">
          <h2>{tx({ en: "Upload and Analyze", bn: "আপলোড ও বিশ্লেষণ" })}</h2>
          <form onSubmit={onSubmit} className="form-stack">
            <div className="mode-toggle" role="tablist" aria-label={tx({ en: "Scan mode", bn: "স্ক্যান মোড" })}>
              <button
                type="button"
                className={mode === "image" ? "tab-btn active" : "tab-btn"}
                onClick={() => onModeChange("image")}
              >
                {tx({ en: "Image OCR", bn: "ইমেজ OCR" })}
              </button>
              <button
                type="button"
                className={mode === "pdf" ? "tab-btn active" : "tab-btn"}
                onClick={() => onModeChange("pdf")}
              >
                {tx({ en: "PDF OCR", bn: "PDF OCR" })}
              </button>
            </div>

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

            <label>
              <span>{mode === "image" ? tx({ en: "Image File", bn: "ইমেজ ফাইল" }) : tx({ en: "PDF File", bn: "PDF ফাইল" })}</span>
              <input type="file" accept={accepted} onChange={onFileChange} />
            </label>

            {file && (
              <p className="meta">
                {tx({ en: "Selected", bn: "নির্বাচিত" })}: {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
              </p>
            )}

            <div className="actions">
              <button type="submit" disabled={!canSubmit}>
                {tx({ en: "Run", bn: "চালান" })} {mode === "image" ? tx({ en: "Image", bn: "ইমেজ" }) : "PDF"} {tx({ en: "Verification", bn: "ভেরিফিকেশন" })}
              </button>
              <div className="phase-chip">{phaseText(phase, tx)}</div>
            </div>
          </form>

          {claimId && <p className="meta">{tx({ en: "Claim ID", bn: "ক্লেম আইডি" })}: {claimId}</p>}
          {error && <p className="error">{error}</p>}
        </article>

        <article className="panel reveal delay-2">
          <h2>{tx({ en: "What Happens", bn: "কি ঘটে" })}</h2>
          <ol className="pipeline-list">
            <li>{tx({ en: "File is uploaded to backend storage.", bn: "ফাইল ব্যাকএন্ড স্টোরেজে আপলোড হয়।" })}</li>
            <li>{tx({ en: "OCR extracts text from image or PDF content.", bn: "OCR ইমেজ বা PDF থেকে টেক্সট বের করে।" })}</li>
            <li>{tx({ en: "Extracted claim flows through retrieval and reranking.", bn: "এক্সট্র্যাক্ট হওয়া ক্লেম retrieval ও reranking এর মধ্যে যায়।" })}</li>
            <li>{tx({ en: "Verdict, confidence, and evidence links are returned.", bn: "ভার্ডিক্ট, কনফিডেন্স এবং এভিডেন্স লিংক ফেরত আসে।" })}</li>
          </ol>
        </article>
      </section>

      <section className="panel reveal delay-3">
        <h2>{tx({ en: "Scan Result", bn: "স্ক্যান ফলাফল" })}</h2>
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
        {phase === "idle" && !result && <p className="muted">{tx({ en: "Upload a file to view OCR + verdict result.", bn: "OCR + ভার্ডিক্ট ফলাফল দেখতে একটি ফাইল আপলোড করুন।" })}</p>}

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
