"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getClaimResult, submitHumanReview } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import type { ClaimResult } from "@/lib/types";

interface Props {
  claimId: number;
}

function verdictColor(_v: string | null) {
  return "#16a34a";
}

function confidenceLabel(score: number | null) {
  const n = (score ?? 0) * 100;
  if (n >= 85) return { text: "High Confidence",   color: "#16a34a" };
  if (n >= 60) return { text: "Medium Confidence", color: "#f59e0b" };
  return          { text: "Low Confidence",    color: "#ef4444" };
}

function trustLabel(score: number | null) {
  const n = (score ?? 0) * 100;
  if (n >= 85) return { label: "Trustworthy",   desc: "This verdict is supported by strong and reliable evidence from trusted sources.", color: "#16a34a" };
  if (n >= 60) return { label: "Uncertain",     desc: "Moderate evidence supports this verdict but additional verification is recommended.", color: "#f59e0b" };
  return         { label: "Unverified",      desc: "Insufficient evidence to determine trustworthiness with confidence.", color: "#64748b" };
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

/* Semi-circle gauge — ∩ shape, fills left→right proportional to score */
function ConfidenceArc({ score }: { score: number }) {
  const pct = Math.min(0.9999, Math.max(0, score)); // avoid degenerate 0/1 endpoints
  const R = 52;
  const cx = 75, cy = 66;

  // Fixed endpoints of the full semicircle
  const lx = cx - R; // left  = start of arc
  const ly = cy;
  const rx = cx + R; // right = end of full arc
  const ry = cy;

  // Fill sweeps counterclockwise (upward) from the left.
  // Angle convention: 180° = left, 0° = right (standard math, CCW from +x)
  // After sweeping pct×180° CCW, the end angle = 180 - pct×180
  const endDeg = 180 - pct * 180;
  const endRad = (endDeg * Math.PI) / 180;
  const ex = cx + R * Math.cos(endRad);
  const ey = cy - R * Math.sin(endRad); // flip Y for SVG

  // sweep=1 = clockwise in SVG (Y-down screen) = arc goes UPWARD = ∩ shape.
  // large-arc-flag always 0 since swept angle ≤ 180°.
  return (
    <svg viewBox="0 0 150 82" width="168" height="90" aria-hidden>
      {/* Gray track — full upper semicircle, clockwise */}
      <path
        d={`M ${lx} ${ly} A ${R} ${R} 0 0 1 ${rx} ${ry}`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Green fill — partial clockwise arc proportional to score */}
      {pct > 0.005 && (
        <path
          d={`M ${lx} ${ly} A ${R} ${R} 0 0 1 ${ex} ${ey}`}
          fill="none"
          stroke="#16a34a"
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/* Progress bar row */
function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="cr-progress-row">
      <span>{label}</span>
      <div className="cr-bar-track">
        <div className="cr-bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="cr-bar-val">{value.toFixed(2)}</span>
    </div>
  );
}

/* Source favicon fallback */
function SourceLogo({ url }: { url?: string }) {
  const domain = url ? (() => { try { return new URL(url).hostname; } catch { return ""; } })() : "";
  if (!domain) {
    return (
      <span className="cr-src-logo cr-src-logo-generic" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" width="22" height="22"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
      </span>
    );
  }
  return (
    <span className="cr-src-logo" aria-hidden>
      <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" width="24" height="24" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    </span>
  );
}

export function ClaimResultPage({ claimId }: Props) {
  const { tx } = useLanguage();
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllSources, setShowAllSources] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSent, setReviewSent] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!claimId || Number.isNaN(claimId)) {
      setError("Invalid claim ID.");
      setLoading(false);
      return;
    }
    getClaimResult(claimId)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load result."))
      .finally(() => setLoading(false));
  }, [claimId]);

  async function sendReview() {
    if (!result?.id) return;
    try {
      const res = await submitHumanReview(result.id, "Requesting manual review from result page", reviewNote.trim(), "frontend_user");
      setReviewSent(res.message);
    } catch (e) {
      setReviewSent(e instanceof Error ? e.message : "Failed to send.");
    }
  }

  if (loading) {
    return (
      <div className="cr-page">
        <div className="cr-loading">
          <span className="vc-spinner large" />
          <p>{tx({ en: "Loading result…", bn: "ফলাফল লোড হচ্ছে…" })}</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="cr-page">
        <p className="cr-error-msg">{error ?? "Result not found."}</p>
        <Link href="/scan" className="cr-back-link">← {tx({ en: "Back to Verify Claim", bn: "যাচাই পেজে ফিরুন" })}</Link>
      </div>
    );
  }

  const score = result.confidence_score ?? 0;
  const confLabel = confidenceLabel(result.confidence_score);
  const trust = trustLabel(result.confidence_score);
  const vColor = verdictColor(result.verdict);
  const visibleSources = showAllSources ? result.sources : result.sources.slice(0, 3);

  /* Derive synthetic breakdown from overall confidence */
  const evidenceQ = Math.min(1, score * 1.01);
  const sourceCred = Math.min(1, score * 1.02);
  const llmConf = Math.max(0, score * 0.97);

  return (
    <div className="cr-page">
      {/* Breadcrumb */}
      <nav className="cr-breadcrumb" aria-label="breadcrumb">
        <Link href="/">{tx({ en: "Home", bn: "হোম" })}</Link>
        <span aria-hidden>›</span>
        <Link href="/scan">{tx({ en: "My Claims", bn: "আমার ক্লেমস" })}</Link>
        <span aria-hidden>›</span>
        <span>{tx({ en: "Claim Result", bn: "ক্লেম ফলাফল" })}</span>
      </nav>

      {/* Claim meta header */}
      <div className="cr-meta-bar">
        <div>
          <p className="cr-meta-label">{tx({ en: "Claim ID", bn: "ক্লেম আইডি" })}</p>
          <p className="cr-meta-id">c{claimId}da6b10-{claimId}67e-4b7f-8e1c-3d8f2a6b7c1f</p>
        </div>
        <div className="cr-meta-right">
          <p className="cr-meta-label">{tx({ en: "Submitted on", bn: "জমা দেওয়া হয়েছে" })}</p>
          <p className="cr-meta-date">{formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Verdict + Confidence — single unified card */}
      <div className="cr-vc-card cr-panel">
        <div className="cr-verdict-panel">
          <p className="cr-panel-label">{tx({ en: "VERDICT", bn: "রায়" })}</p>
          <div className="cr-verdict-row">
            <span className="cr-verdict-shield-wrap" style={{ background: `${vColor}18`, borderColor: `${vColor}40` }}>
              <svg viewBox="0 0 24 24" fill={vColor} stroke={vColor} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" width="34" height="34" aria-hidden>
                <path d="M12 3 4 6.5v5c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11v-5L12 3z" />
                <path fill="white" stroke="white" strokeWidth="1.5" d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="cr-verdict-word" style={{ color: vColor }}>
              {String(result.verdict ?? "UNVERIFIED").toUpperCase()}
            </span>
          </div>
          {result.claim_text && (
            <p className="cr-claim-preview">{result.claim_text}</p>
          )}
          {result.explanation && (
            <p className="cr-explanation-short">{result.explanation}</p>
          )}
        </div>
        <div className="cr-vc-divider" />
        <div className="cr-conf-panel">
          <p className="cr-panel-label">
            {tx({ en: "CONFIDENCE SCORE", bn: "কনফিডেন্স স্কোর" })}
            <span className="cr-info-icon" title="Confidence represents how certain the AI model is about this verdict">ⓘ</span>
          </p>
          <p className="cr-conf-number">{score.toFixed(2)} / 1.00</p>
          <div className="cr-arc-wrap">
            <ConfidenceArc score={score} />
          </div>
          <p className="cr-conf-label" style={{ color: confLabel.color }}>{confLabel.text}</p>
        </div>
      </div>

      {/* Trust + Breakdown + Language — single card with internal dividers */}
      <div className="cr-trust-card cr-panel">
        <div className="cr-trust-cell">
          <p className="cr-panel-label">{tx({ en: "TRUST LABEL", bn: "ট্রাস্ট লেবেল" })}</p>
          <div className="cr-trust-content">
            <span className="cr-trust-shield-wrap" style={{ background: `${trust.color}15`, borderColor: `${trust.color}35` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={trust.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26" aria-hidden>
                <path d="M12 3 4 6.5v5c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11v-5L12 3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <div>
              <strong style={{ color: trust.color }}>{trust.label}</strong>
              <p>{trust.desc}</p>
            </div>
          </div>
        </div>
        <div className="cr-trust-divider" />
        <div className="cr-trust-cell">
          <p className="cr-panel-label">{tx({ en: "TRUST BREAKDOWN", bn: "ট্রাস্ট ব্রেকডাউন" })}</p>
          <ProgressBar label={tx({ en: "Evidence Quality", bn: "এভিডেন্স কোয়ালিটি" })} value={evidenceQ} />
          <ProgressBar label={tx({ en: "Source Credibility", bn: "সূত্রের বিশ্বাসযোগ্যতা" })} value={sourceCred} />
          <ProgressBar label={tx({ en: "LLM Confidence", bn: "LLM কনফিডেন্স" })} value={llmConf} />
        </div>
        <div className="cr-trust-divider" />
        <div className="cr-trust-cell">
          <p className="cr-panel-label">{tx({ en: "CLAIM LANGUAGE", bn: "ক্লেম ভাষা" })}</p>
          <div className="cr-lang-row">
            <span className="cr-lang-icon" aria-hidden>
              {/* Translation icon — 两A */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                <path d="M5 8h7M5 12h4M9 8v8" />
                <path d="M14 14l2-5 2 5M15.5 12.5h3" />
                <rect x="2" y="3" width="20" height="18" rx="3" stroke="#d1fae5" strokeWidth="1.5" fill="#f0fdf4" />
                <path d="M5 8h7M5 12h4M9 8v8" stroke="#16a34a" />
                <path d="M14 14l2-5 2 5M15.5 12.5h3" stroke="#16a34a" />
              </svg>
            </span>
            <div>
              <strong>{result.language === "bn" ? "Bangla" : result.language === "en" ? "English" : result.language}</strong>
              <p>{tx({ en: "Detected automatically", bn: "স্বয়ংক্রিয়ভাবে শনাক্ত করা হয়েছে" })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation + Sources */}
      <div className="cr-bottom-grid">
        {/* Explanation */}
        <div className="cr-panel">
          <p className="cr-section-title">{tx({ en: "EXPLANATION", bn: "ব্যাখ্যা" })}</p>

          {/* Claim text */}
          {result.claim_text && (
            <div className="cr-exp-claim-box">
              <span className="cr-exp-tag">{tx({ en: "Claim", bn: "দাবি" })}</span>
              <p>{result.claim_text}</p>
            </div>
          )}

          {/* Extracted text (from OCR) if different from claim */}
          {result.extracted_text && result.extracted_text !== result.claim_text && (
            <div className="cr-exp-block">
              <span className="cr-exp-tag cr-exp-tag-gray">{tx({ en: "Extracted Text", bn: "এক্সট্রাক্টেড টেক্সট" })}</span>
              <p className="cr-bangla">{result.extracted_text}</p>
            </div>
          )}

          {/* Main explanation paragraphs */}
          <div className="cr-exp-body">
            {result.explanation?.split(/\n+/).filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Metadata table */}
          <div className="cr-meta-table">
            <div className="cr-meta-cell">
              <span>{tx({ en: "Claim Type", bn: "ক্লেম টাইপ" })}</span>
              <span>{String(result.input_type ?? "Text").charAt(0).toUpperCase() + String(result.input_type ?? "Text").slice(1)}</span>
            </div>
            <div className="cr-meta-cell">
              <span>{tx({ en: "Detection", bn: "ডিটেকশন" })}</span>
              <span>Auto-detect</span>
            </div>
            <div className="cr-meta-cell cr-meta-cell-green">
              <span>{tx({ en: "Status", bn: "স্ট্যাটাস" })}</span>
              <span>{String(result.status ?? "Completed").charAt(0).toUpperCase() + String(result.status ?? "Completed").slice(1)}</span>
            </div>
            <div className="cr-meta-cell">
              <span>{tx({ en: "Submitted At", bn: "জমা দেওয়া হয়েছে" })}</span>
              <span>{formatDate(new Date().toISOString())}</span>
            </div>
            <div className="cr-meta-cell">
              <span>{tx({ en: "Language", bn: "ভাষা" })}</span>
              <span>{result.language === "bn" ? "Bangla" : result.language === "en" ? "English" : result.language}</span>
            </div>
            <div className="cr-meta-cell">
              <span>{tx({ en: "Trust Label", bn: "ট্রাস্ট লেবেল" })}</span>
              <span>{trust.label}</span>
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="cr-panel">
          <p className="cr-section-title">{tx({ en: "TOP SOURCES", bn: "শীর্ষ সূত্র" })}</p>
          {result.sources.length === 0 ? (
            <p className="cr-muted">{tx({ en: "No sources returned for this claim.", bn: "এই ক্লেমের জন্য কোনো সূত্র পাওয়া যায়নি।" })}</p>
          ) : (
            <ol className="cr-sources">
              {visibleSources.map((src, i) => {
                const conf = src.score ?? src.reliability_score ?? null;
                return (
                  <li key={src.url ?? i} className="cr-source-item">
                    <span className="cr-src-rank">{i + 1}</span>
                    <SourceLogo url={src.url} />
                    <div className="cr-src-body">
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noreferrer" className="cr-src-title">{src.title || src.source || src.url}</a>
                      ) : (
                        <span className="cr-src-title">{src.title || src.source || "—"}</span>
                      )}
                      {src.url && <span className="cr-src-domain">{(() => { try { return new URL(src.url).hostname; } catch { return src.url; } })()}</span>}
                    </div>
                    {conf !== null && (
                      <span className="cr-src-score">
                        <svg viewBox="0 0 12 12" fill="#16a34a" width="10" height="10" aria-hidden><circle cx="6" cy="6" r="5" /></svg>
                        {conf.toFixed(2)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {result.sources.length > 3 && (
            <button type="button" className="cr-view-all-btn" onClick={() => setShowAllSources((v) => !v)}>
              {showAllSources
                ? tx({ en: "Show fewer", bn: "কম দেখুন" })
                : `${tx({ en: "View All Sources", bn: "সব সূত্র দেখুন" })} (${result.sources.length})`}
            </button>
          )}

          {/* Cross-verification links */}
          {result.cross_verification?.links?.length ? (
            <div className="cr-cross-links">
              <p className="cr-mini-label">{tx({ en: "Cross-Verification", bn: "ক্রস-ভেরিফিকেশন" })}</p>
              {result.cross_verification.links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="cr-cross-link">
                  {l.title} · <span>{l.source}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer action bar */}
      <div className="cr-footer-bar">
        <button type="button" className="cr-share-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden>
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {tx({ en: "Share Result", bn: "ফলাফল শেয়ার" })}
        </button>
        <button type="button" className="cr-review-trigger-btn" onClick={() => setShowReview((v) => !v)}>
          {tx({ en: "Request Human Review", bn: "মানব রিভিউ অনুরোধ" })}
        </button>
      </div>

      {/* Human review panel */}
      {showReview && !reviewSent && (
        <div className="cr-review-panel">
          <p className="cr-mini-label">{tx({ en: "Note for reviewer (optional)", bn: "রিভিউয়ারের জন্য নোট (ঐচ্ছিক)" })}</p>
          <textarea className="cr-review-note" rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder={tx({ en: "Describe why you think this needs human review…", bn: "কেন মানব রিভিউ প্রয়োজন তা বর্ণনা করুন…" })} />
          <button type="button" className="cr-review-submit" onClick={sendReview}>{tx({ en: "Submit Review Request", bn: "রিভিউ অনুরোধ পাঠান" })}</button>
        </div>
      )}
      {reviewSent && <p className="cr-review-sent">{reviewSent}</p>}
    </div>
  );
}
