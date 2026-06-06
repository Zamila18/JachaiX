"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClaimResult,
  getClaimStatus,
  submitHumanReview,
  submitImageClaim,
  submitPdfClaim,
  submitTextClaim,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ClaimResult } from "@/lib/types";

type Tab = "text" | "image" | "pdf";
type Phase = "idle" | "submitting" | "processing" | "completed" | "failed";
type ProcessingStage = "queued" | "analyzing" | "finalizing" | null;

const HOW_STEPS = [
  {
    title: { en: "Claim Submitted", bn: "ক্লেম জমা" },
    desc: { en: "You submit a claim, image, or document.", bn: "আপনি একটি ক্লেম, ইমেজ বা ডকুমেন্ট জমা দেন।" },
  },
  {
    title: { en: "Content Processing", bn: "কন্টেন্ট প্রসেসিং" },
    desc: { en: "Our AI extracts text and understands the context.", bn: "আমাদের এআই টেক্সট বের করে এবং প্রসঙ্গ বোঝে।" },
  },
  {
    title: { en: "Evidence Retrieval", bn: "এভিডেন্স রিট্রিভাল" },
    desc: { en: "We search across trusted sources and databases.", bn: "আমরা বিশ্বস্ত সূত্র ও ডেটাবেজ খোঁজি।" },
  },
  {
    title: { en: "AI Analysis", bn: "এআই বিশ্লেষণ" },
    desc: { en: "AI analyzes evidence and compares context.", bn: "এআই এভিডেন্স বিশ্লেষণ ও প্রসঙ্গ তুলনা করে।" },
  },
  {
    title: { en: "Human Review", bn: "মানব রিভিউ" },
    desc: { en: "Experts review high-impact claims.", bn: "বিশেষজ্ঞরা গুরুত্বপূর্ণ ক্লেম যাচাই করেন।" },
  },
  {
    title: { en: "Final Verdict", bn: "চূড়ান্ত রায়" },
    desc: { en: "You get a transparent verdict with evidence and sources.", bn: "এভিডেন্স ও সূত্রসহ স্বচ্ছ রায় পান।" },
  },
];

const MAX_TEXT = 1000;

function verdictColor(v: string | null) {
  switch ((v ?? "").toLowerCase()) {
    case "true": return "#16a34a";
    case "false": return "#ef4444";
    case "misleading": return "#f59e0b";
    default: return "#64748b";
  }
}

export function VerifyClaimPage() {
  const { tx } = useLanguage();
  const router = useRouter();

  // Tab
  const [tab, setTab] = useState<Tab>("text");

  // Text claim state
  const [text, setText] = useState("");
  const [textLang, setTextLang] = useState("auto");

  // File claim state
  const [file, setFile] = useState<File | null>(null);
  const [fileLang, setFileLang] = useState("auto");
  const [dragging, setDragging] = useState(false);

  // Shared pipeline state
  const [phase, setPhase] = useState<Phase>("idle");
  const [stage, setStage] = useState<ProcessingStage>(null);
  const [claimId, setClaimId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSent, setReviewSent] = useState<string | null>(null);

  const busy = phase === "submitting" || phase === "processing";

  const canSubmitText = useMemo(
    () => text.trim().length >= 4 && !busy,
    [text, busy]
  );
  const canSubmitFile = useMemo(
    () => !!file && !busy,
    [file, busy]
  );

  function resetState() {
    setError(null);
    setResult(null);
    setReviewSent(null);
    setStage(null);
    setClaimId(null);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setFile(null);
    resetState();
    setPhase("idle");
  }

  async function pollUntilDone(id: number, redirect = false) {
    const started = Date.now();
    while (Date.now() - started < 180000) {
      const status = await getClaimStatus(id);
      const current = status.claim.status;

      if (current === "pending") setStage("queued");
      if (current === "processing") setStage("analyzing");

      if (current === "completed") {
        setStage("finalizing");
        if (redirect) {
          router.push(`/results/${id}`);
          return;
        }
        const final = await getClaimResult(id);
        setResult(final);
        setStage(null);
        setPhase("completed");
        return;
      }

      if (current === "failed") {
        setStage(null);
        setPhase("failed");
        const reason = status.claim.failure_reason?.trim();
        setError(reason ? `Processing failed: ${reason}` : "Claim processing failed.");
        return;
      }

      await new Promise((r) => setTimeout(r, 1800));
    }

    setPhase("failed");
    setStage(null);
    setError("Timeout waiting for result. The backend may still complete shortly.");
  }

  async function submitText(e: FormEvent) {
    e.preventDefault();
    resetState();
    setPhase("submitting");
    try {
      const res = await submitTextClaim(text.trim(), textLang);
      const id = Number(res.claim_id ?? res.job?.id);
      if (!id) throw new Error("Claim ID missing in response");
      setClaimId(id);
      setPhase("processing");
      setStage("queued");
      await pollUntilDone(id, true);
    } catch (err) {
      setPhase("failed");
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  async function submitFile(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    resetState();
    setPhase("submitting");
    try {
      const res =
        tab === "image"
          ? await submitImageClaim(file, fileLang)
          : await submitPdfClaim(file, fileLang);
      const id = Number(res.claim_id ?? res.job?.id);
      if (!id) throw new Error("Claim ID missing in response");
      setClaimId(id);
      setPhase("processing");
      setStage("queued");
      await pollUntilDone(id, true);
    } catch (err) {
      setPhase("failed");
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  function onFilePick(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    resetState();
    setPhase("idle");
  }

  function onDrop(e: React.DragEvent, accept: "image" | "pdf") {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    const isPdf = dropped.type === "application/pdf";
    if (accept === "pdf" && !isPdf) return;
    if (accept === "image" && isPdf) return;
    setFile(dropped);
    resetState();
    setPhase("idle");
    setTab(accept);
  }

  async function sendReview() {
    if (!result?.id) return;
    try {
      const res = await submitHumanReview(result.id, "Requesting manual review", reviewNote.trim(), "frontend_user");
      setReviewSent(res.message);
    } catch (err) {
      setReviewSent(err instanceof Error ? err.message : "Failed to send review request");
    }
  }

  const examples = [
    tx({ en: "Is the Padma Bridge cracking?", bn: "পদ্মা সেতুতে কি ফাটল ধরেছে?" }),
    tx({ en: "Did WHO ban a vaccine?", bn: "WHO কি কোনো ভ্যাকসিন নিষিদ্ধ করেছে?" }),
    tx({ en: "Is this election video real?", bn: "এই নির্বাচনী ভিডিও কি আসল?" }),
    tx({ en: "Was a 7.5 magnitude earthquake in Dhaka?", bn: "ঢাকায় কি ৭.৫ মাত্রার ভূমিকম্প হয়েছিল?" }),
  ];

  const stageLabel =
    stage === "queued" ? tx({ en: "Queued…", bn: "কিউড…" })
    : stage === "analyzing" ? tx({ en: "Analyzing evidence…", bn: "এভিডেন্স বিশ্লেষণ হচ্ছে…" })
    : stage === "finalizing" ? tx({ en: "Fetching verdict…", bn: "রায় আনা হচ্ছে…" })
    : phase === "submitting" ? tx({ en: "Uploading…", bn: "আপলোড হচ্ছে…" })
    : "";

  return (
    <div className="vc-page">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="vc-header">
        <h1>{tx({ en: "Verify a Claim", bn: "একটি ক্লেম যাচাই করুন" })}</h1>
        <p>{tx({ en: "Submit a claim, upload an image or document, and let JachaiX analyze the evidence from trusted sources.", bn: "একটি ক্লেম জমা দিন, ইমেজ বা ডকুমেন্ট আপলোড করুন এবং JachaiX-কে বিশ্বস্ত সূত্র থেকে এভিডেন্স বিশ্লেষণ করতে দিন।" })}</p>
      </div>

      {/* ── Two-column layout ──────────────────────────── */}
      <div className="vc-layout">
        {/* Main column */}
        <div className="vc-main">

          {/* Primary input card */}
          <div className="vc-card">
            {/* Tabs */}
            <div className="vc-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "text"}
                className={`vc-tab${tab === "text" ? " active" : ""}`}
                onClick={() => switchTab("text")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h7" /></svg>
                {tx({ en: "Text Claim", bn: "টেক্সট ক্লেম" })}
                <small>{tx({ en: "Enter claim as text", bn: "টেক্সট হিসেবে ক্লেম লিখুন" })}</small>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "image"}
                className={`vc-tab${tab === "image" ? " active" : ""}`}
                onClick={() => switchTab("image")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                {tx({ en: "Image Scan", bn: "ইমেজ স্ক্যান" })}
                <small>{tx({ en: "Scan image for text", bn: "ইমেজ থেকে টেক্সট স্ক্যান" })}</small>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "pdf"}
                className={`vc-tab${tab === "pdf" ? " active" : ""}`}
                onClick={() => switchTab("pdf")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /></svg>
                {tx({ en: "PDF / Document", bn: "PDF / ডকুমেন্ট" })}
                <small>{tx({ en: "Upload PDF for text retrieval", bn: "টেক্সট রিট্রিভালের জন্য PDF আপলোড" })}</small>
              </button>
            </div>

            {/* ── Text Claim tab ── */}
            {tab === "text" && (
              <form className="vc-text-form" onSubmit={submitText}>
                <div className="vc-form-label-row">
                  <label htmlFor="vc-claim-text">{tx({ en: "Enter the claim you want to verify", bn: "যে ক্লেম যাচাই করতে চান তা লিখুন" })}</label>
                  <span className="vc-tip">{tx({ en: "Tips for better results", bn: "ভালো ফলাফলের টিপস" })} ⓘ</span>
                </div>
                <textarea
                  id="vc-claim-text"
                  className="vc-textarea"
                  rows={8}
                  maxLength={MAX_TEXT}
                  placeholder={tx({ en: "Example: Did WHO ban the AstraZeneca vaccine?", bn: "উদাহরণ: WHO কি AstraZeneca ভ্যাকসিন নিষিদ্ধ করেছে?" })}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="vc-char-row">
                  <div className="vc-examples">
                    <span>{tx({ en: "Try examples:", bn: "উদাহরণ:" })}</span>
                    {examples.map((ex) => (
                      <button key={ex} type="button" className="vc-chip" onClick={() => setText(ex)}>{ex}</button>
                    ))}
                  </div>
                  <span className="vc-counter">{text.length}/{MAX_TEXT}</span>
                </div>

                <div className="vc-lang-row">
                  <label htmlFor="vc-lang">{tx({ en: "Language", bn: "ভাষা" })}</label>
                  <select id="vc-lang" value={textLang} onChange={(e) => setTextLang(e.target.value)}>
                    <option value="auto">Auto</option>
                    <option value="en">English</option>
                    <option value="bn">Bangla</option>
                    <option value="banglish">Banglish</option>
                    <option value="international">International</option>
                  </select>
                </div>

                <button type="submit" className="vc-submit-btn" disabled={!canSubmitText}>
                  {busy ? (
                    <><span className="vc-spinner" /> {stageLabel}</>
                  ) : (
                    <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" /></svg> {tx({ en: "Verify Claim", bn: "যাচাই করুন" })}</>
                  )}
                </button>
              </form>
            )}

            {/* ── Image Scan tab ── */}
            {tab === "image" && (
              <form className="vc-file-form" onSubmit={submitFile}>
                <div
                  className={`vc-dropzone${dragging ? " dragging" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => onDrop(e, "image")}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  {file ? (
                    <p className="vc-filename">{file.name} <button type="button" className="vc-clear" onClick={() => setFile(null)}>✕</button></p>
                  ) : (
                    <>
                      <p>{tx({ en: "Drag & drop an image here", bn: "এখানে ইমেজ টেনে আনুন" })}</p>
                      <p>{tx({ en: "or", bn: "অথবা" })} <label className="vc-browse"><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onFilePick} />{tx({ en: "click to browse", bn: "ক্লিক করে বেছে নিন" })}</label></p>
                    </>
                  )}
                </div>
                <p className="vc-format-note">{tx({ en: "Supports: JPG, PNG, WEBP (Max 10MB)", bn: "সমর্থিত: JPG, PNG, WEBP (সর্বোচ্চ ১০MB)" })}</p>
                <div className="vc-lang-row">
                  <label htmlFor="vc-img-lang">{tx({ en: "Language", bn: "ভাষা" })}</label>
                  <select id="vc-img-lang" value={fileLang} onChange={(e) => setFileLang(e.target.value)}>
                    <option value="auto">Auto</option>
                    <option value="en">English</option>
                    <option value="bn">Bangla</option>
                    <option value="banglish">Banglish</option>
                    <option value="international">International</option>
                  </select>
                </div>
                <button type="submit" className="vc-submit-btn" disabled={!canSubmitFile}>
                  {busy ? (
                    <><span className="vc-spinner" /> {stageLabel}</>
                  ) : (
                    <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" /></svg> {tx({ en: "Verify Claim", bn: "যাচাই করুন" })}</>
                  )}
                </button>
              </form>
            )}

            {/* ── PDF tab ── */}
            {tab === "pdf" && (
              <form className="vc-file-form" onSubmit={submitFile}>
                <div
                  className={`vc-dropzone${dragging ? " dragging" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => onDrop(e, "pdf")}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  {file ? (
                    <p className="vc-filename">{file.name} <button type="button" className="vc-clear" onClick={() => setFile(null)}>✕</button></p>
                  ) : (
                    <>
                      <p>{tx({ en: "Drag & drop a PDF here", bn: "এখানে PDF টেনে আনুন" })}</p>
                      <p>{tx({ en: "or", bn: "অথবা" })} <label className="vc-browse"><input type="file" accept=".pdf" onChange={onFilePick} />{tx({ en: "click to browse", bn: "ক্লিক করে বেছে নিন" })}</label></p>
                    </>
                  )}
                </div>
                <p className="vc-format-note">{tx({ en: "Supports: PDF (Max 50MB)", bn: "সমর্থিত: PDF (সর্বোচ্চ ৫০MB)" })}</p>
                <div className="vc-lang-row">
                  <label htmlFor="vc-pdf-lang">{tx({ en: "Language", bn: "ভাষা" })}</label>
                  <select id="vc-pdf-lang" value={fileLang} onChange={(e) => setFileLang(e.target.value)}>
                    <option value="auto">Auto</option>
                    <option value="en">English</option>
                    <option value="bn">Bangla</option>
                    <option value="banglish">Banglish</option>
                    <option value="international">International</option>
                  </select>
                </div>
                <button type="submit" className="vc-submit-btn" disabled={!canSubmitFile}>
                  {busy ? (
                    <><span className="vc-spinner" /> {stageLabel}</>
                  ) : (
                    <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" /></svg> {tx({ en: "Verify Claim", bn: "যাচাই করুন" })}</>
                  )}
                </button>
              </form>
            )}

            {/* Status / error inside card */}
            {claimId && <p className="vc-meta">Claim ID: {claimId}</p>}
            {error && <p className="vc-error">{error}</p>}
          </div>

          {/* Secondary upload cards (always visible under text tab) */}
          {tab === "text" && (
            <div className="vc-upload-grid">
              <div className="vc-upload-card">
                <div className="vc-upload-card-head">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                  <div>
                    <strong>{tx({ en: "Image Scan", bn: "ইমেজ স্ক্যান" })}</strong>
                    <span>{tx({ en: "Upload an image to extract text and verify the claim.", bn: "ইমেজ আপলোড করে টেক্সট বের করুন।" })}</span>
                  </div>
                </div>
                <div
                  className="vc-mini-drop"
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => onDrop(e, "image")}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  <p>{tx({ en: "Drag & drop an image here", bn: "এখানে ইমেজ টেনে আনুন" })}</p>
                  <p>{tx({ en: "or", bn: "অথবা" })} <label className="vc-browse"><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { onFilePick(e); setTab("image"); }} />{tx({ en: "click to browse", bn: "ক্লিক করে বেছে নিন" })}</label></p>
                </div>
                <p className="vc-format-note">{tx({ en: "Supports: JPG, PNG, WEBP (Max 10MB)", bn: "সমর্থিত: JPG, PNG, WEBP (সর্বোচ্চ ১০MB)" })}</p>
              </div>

              <div className="vc-upload-card">
                <div className="vc-upload-card-head">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /></svg>
                  <div>
                    <strong>{tx({ en: "PDF / Document Scan", bn: "PDF / ডকুমেন্ট স্ক্যান" })}</strong>
                    <span>{tx({ en: "Upload a PDF document to extract text and retrieve relevant information.", bn: "PDF আপলোড করে টেক্সট বের করুন।" })}</span>
                  </div>
                </div>
                <div
                  className="vc-mini-drop"
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => onDrop(e, "pdf")}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  <p>{tx({ en: "Drag & drop a PDF here", bn: "এখানে PDF টেনে আনুন" })}</p>
                  <p>{tx({ en: "or", bn: "অথবা" })} <label className="vc-browse"><input type="file" accept=".pdf" onChange={(e) => { onFilePick(e); setTab("pdf"); }} />{tx({ en: "click to browse", bn: "ক্লিক করে বেছে নিন" })}</label></p>
                </div>
                <p className="vc-format-note">{tx({ en: "Supports: PDF (Max 50MB)", bn: "সমর্থিত: PDF (সর্বোচ্চ ৫০MB)" })}</p>
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="vc-privacy">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <div>
              <strong>{tx({ en: "Your privacy is important", bn: "আপনার গোপনীয়তা গুরুত্বপূর্ণ" })}</strong>
              <p>{tx({ en: "All uploads and claims are processed securely. We do not store personal data or share your submissions.", bn: "সমস্ত আপলোড ও ক্লেম নিরাপদে প্রসেস হয়। আমরা ব্যক্তিগত ডেটা সংরক্ষণ করি না।" })}</p>
            </div>
          </div>

          {/* ── Result section ── */}
          {(phase === "completed" || phase === "failed") && (
            <div className="vc-result-card">
              <h2 className="vc-result-heading">{tx({ en: "Verification Result", bn: "যাচাইয়ের ফলাফল" })}</h2>

              {phase === "failed" && !result && (
                <p className="vc-error">{error || tx({ en: "Verification failed.", bn: "যাচাই ব্যর্থ হয়েছে।" })}</p>
              )}

              {result && (
                <>
                  <div className="vc-verdict-row">
                    <span className="vc-verdict-badge" style={{ background: verdictColor(result.verdict) }}>
                      {String(result.verdict ?? "unverified").toUpperCase()}
                    </span>
                    <span className="vc-conf-label">{tx({ en: "Confidence", bn: "কনফিডেন্স" })}: <strong>{Math.round((result.confidence_score ?? 0) * 100)}%</strong></span>
                    {result.language && <span className="vc-lang-badge">{result.language}</span>}
                    {result.sources?.length ? <span className="vc-src-count">{result.sources.length} {tx({ en: "sources", bn: "সূত্র" })}</span> : null}
                  </div>

                  {result.extracted_text && (
                    <div className="vc-extracted">
                      <p className="vc-section-label">{tx({ en: "Extracted Text", bn: "এক্সট্র্যাক্টেড টেক্সট" })}</p>
                      <p>{result.extracted_text}</p>
                    </div>
                  )}

                  <div className="vc-explanation">
                    <p className="vc-section-label">{tx({ en: "Explanation", bn: "ব্যাখ্যা" })}</p>
                    <p>{result.explanation}</p>
                  </div>

                  {result.cross_verification?.links?.length ? (
                    <div className="vc-links">
                      <p className="vc-section-label">{tx({ en: "Cross-Verification Sources", bn: "ক্রস-ভেরিফিকেশন সূত্র" })}</p>
                      <ul>
                        {result.cross_verification.links.map((link) => (
                          <li key={link.url}>
                            <a href={link.url} target="_blank" rel="noreferrer">{link.title} · {link.source}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="vc-review-section">
                    <p className="vc-section-label">{tx({ en: "Request Human Review", bn: "মানব রিভিউ অনুরোধ" })}</p>
                    {result.human_verification?.reason && (
                      <p className="vc-review-reason">{result.human_verification.reason}</p>
                    )}
                    <textarea
                      className="vc-review-note"
                      rows={3}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder={tx({ en: "Optional note for reviewer…", bn: "রিভিউয়ারের জন্য ঐচ্ছিক নোট…" })}
                    />
                    <button type="button" className="vc-review-btn" onClick={sendReview}>
                      {tx({ en: "Send to Human Review", bn: "মানব রিভিউতে পাঠান" })}
                    </button>
                    {reviewSent && <p className="vc-meta">{reviewSent}</p>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Processing skeleton */}
          {busy && (
            <div className="vc-result-card">
              <div className="vc-processing">
                <span className="vc-spinner large" />
                <p>{stageLabel}</p>
              </div>
              <div className="skeleton-box" style={{ height: 14, width: "55%", marginTop: "1rem" }} />
              <div className="skeleton-box" style={{ height: 90, borderRadius: 12, marginTop: "0.6rem" }} />
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────── */}
        <aside className="vc-sidebar">
          <div className="vc-sidebar-card">
            <h3 className="vc-sidebar-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3 4 6.5v5c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11v-5L12 3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              {tx({ en: "How Verification Works", bn: "যাচাই যেভাবে কাজ করে" })}
            </h3>
            <ol className="vc-steps">
              {HOW_STEPS.map((step, i) => (
                <li key={step.title.en} className="vc-step">
                  {/* Number + connector column */}
                  <div className="vc-step-left">
                    <span className="vc-step-num">{i + 1}</span>
                    {i < HOW_STEPS.length - 1 && <span className="vc-step-line" />}
                  </div>
                  {/* Icon box */}
                  <span className="vc-step-icon-box" aria-hidden>
                    {i === 0 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12h6M9 16h4M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" />
                      </svg>
                    )}
                    {i === 1 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12h6M9 16h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" />
                      </svg>
                    )}
                    {i === 2 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12h6M9 16h4M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /><circle cx="18" cy="18" r="3" /><path d="M21 21l-1.5-1.5" />
                      </svg>
                    )}
                    {i === 3 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                        <path d="M8 12s1-2 4-2 4 2 4 2" />
                        <path d="M9 9h.01M15 9h.01" />
                        <path d="M7 16s2 2 5 2 5-2 5-2" />
                      </svg>
                    )}
                    {i === 4 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="7" r="3" />
                        <path d="M3 20c0-3.3 2.7-6 6-6" />
                        <circle cx="17" cy="10" r="2.5" />
                        <path d="M14 20c0-2.8 1.3-5 3-5s3 2.2 3 5" />
                      </svg>
                    )}
                    {i === 5 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3 4 6.5v5c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11v-5L12 3z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    )}
                  </span>
                  {/* Text */}
                  <div className="vc-step-text">
                    <strong>{tx(step.title)}</strong>
                    <span>{tx(step.desc)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="vc-sidebar-card vc-formats">
            <h3 className="vc-sidebar-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" aria-hidden><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              {tx({ en: "Supported Formats", bn: "সমর্থিত ফরম্যাট" })}
            </h3>
            <div className="vc-format-list">
              <div className="vc-format-item">
                <span className="vc-format-badge img">IMG</span>
                <div>
                  <strong>{tx({ en: "Images", bn: "ইমেজ" })}</strong>
                  <span>JPG, PNG, WEBP</span>
                </div>
              </div>
              <div className="vc-format-item">
                <span className="vc-format-badge pdf">PDF</span>
                <div>
                  <strong>{tx({ en: "PDF Documents", bn: "PDF ডকুমেন্ট" })}</strong>
                  <span>PDF (Max 50MB)</span>
                </div>
              </div>
              <div className="vc-format-item">
                <span className="vc-format-badge txt">T</span>
                <div>
                  <strong>{tx({ en: "Text", bn: "টেক্সট" })}</strong>
                  <span>{tx({ en: "Up to 1000 characters", bn: "সর্বোচ্চ ১০০০ অক্ষর" })}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
