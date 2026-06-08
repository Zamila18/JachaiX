"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getFeaturedFactChecks, getPublicFactChecks } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import type { PublicFactCheckListItem } from "@/lib/types";

type Scope = "bangladesh" | "international";

const FALLBACK_FACT_CHECKS: PublicFactCheckListItem[] = [
  {
    id: 3001,
    slug: "bd-vaccine-rumor-claim",
    title: "Bangladesh Vaccine Microchip Claim",
    summary: "False claim alleging vaccines include tracking microchips. No credible source evidence supports this.",
    verdict: "false",
    confidence_score: 0.98,
    language: "en",
    coverage_scope: "bangladesh",
    origin: "internal",
    source_name: "JachaiX Verification Desk",
    source_url: null,
    is_featured: true,
    published_at: "2026-06-03",
    tags: ["health", "bangladesh"],
  },
  {
    id: 3002,
    slug: "bd-election-video-context",
    title: "Bangladesh Election Video Context Check",
    summary: "Real video shared with incorrect date/location context; the original context changes interpretation.",
    verdict: "misleading",
    confidence_score: 0.92,
    language: "en",
    coverage_scope: "bangladesh",
    origin: "internal",
    source_name: "JachaiX Verification Desk",
    source_url: null,
    is_featured: true,
    published_at: "2026-06-02",
    tags: ["election", "context"],
  },
  {
    id: 3003,
    slug: "intl-celebrity-death-hoax",
    title: "International Celebrity Death Hoax",
    summary: "Misleading viral posts reused old visuals; official statements confirmed the person alive.",
    verdict: "false",
    confidence_score: 0.97,
    language: "en",
    coverage_scope: "international",
    origin: "external",
    source_name: "Partner Fact-Check Network",
    source_url: null,
    is_featured: true,
    published_at: "2026-06-01",
    tags: ["international", "viral"],
  },
  {
    id: 3004,
    slug: "intl-policy-quote-fabrication",
    title: "New Education Policy 2026 Approved",
    summary: "The policy has been approved by the government and released through official channels.",
    verdict: "true",
    confidence_score: 0.94,
    language: "en",
    coverage_scope: "bangladesh",
    origin: "external",
    source_name: "Global Fact-Check Alliance",
    source_url: null,
    is_featured: true,
    published_at: "2026-05-31",
    tags: ["bangladesh", "policy"],
  },
];

function fallbackByScope(scope: Scope) {
  return FALLBACK_FACT_CHECKS.filter((item) => item.coverage_scope === scope);
}

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

function formatDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function ConfidenceGauge({ score, tone }: { score: number | null; tone: string }) {
  const pct = Math.round((score ?? 0) * 100);
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  return (
    <div className={`jx-gauge ${tone}`}>
      <svg viewBox="0 0 44 44" width="44" height="44">
        <circle cx="22" cy="22" r={radius} className="jx-gauge-track" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="jx-gauge-fill"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="jx-gauge-pct">{pct}%</span>
    </div>
  );
}

export function HomepagePage() {
  const { language, tx } = useLanguage();
  const router = useRouter();
  const [scope] = useState<Scope>("bangladesh");
  const [featured, setFeatured] = useState<PublicFactCheckListItem[]>([]);
  const [items, setItems] = useState<PublicFactCheckListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    getFeaturedFactChecks()
      .then((res) => {
        if (!mounted) return;
        const apiItems = res.items || [];
        setFeatured(apiItems.length ? apiItems : FALLBACK_FACT_CHECKS);
      })
      .catch(() => {
        if (!mounted) return;
        setFeatured(FALLBACK_FACT_CHECKS);
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
        const apiItems = res.items || [];
        setItems(apiItems.length ? apiItems : fallbackByScope(scope));
      })
      .catch(() => {
        if (!mounted) return;
        setItems(fallbackByScope(scope));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [scope]);

  // Featured cards drive the "Latest Fact Checks" showcase strip; fall back to
  // the latest published list when no items are flagged as featured.
  const showcase = useMemo(() => {
    const base = featured.length ? featured : items;
    return base.slice(0, 4);
  }, [featured, items]);

  function submitClaim(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/scan?q=${encodeURIComponent(q)}` : "/scan");
  }

  const examples = [
    tx({ en: "Is the Padma Bridge cracking?", bn: "পদ্মা সেতুতে কি ফাটল ধরেছে?" }),
    tx({ en: "Did WHO ban a vaccine?", bn: "WHO কি কোনো ভ্যাকসিন নিষিদ্ধ করেছে?" }),
    tx({ en: "Is this election video real?", bn: "এই নির্বাচনী ভিডিও কি আসল?" }),
    tx({ en: "Was a 7.5 magnitude earthquake in Dhaka?", bn: "ঢাকায় কি ৭.৫ মাত্রার ভূমিকম্প হয়েছিল?" }),
  ];

  const stats = [
    {
      value: "25,000+",
      label: tx({ en: "Claims Analyzed", bn: "ক্লেম বিশ্লেষিত" }),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M12 3 4 6.5v5c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11v-5L12 3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      value: "8,000+",
      label: tx({ en: "Verified Reports", bn: "যাচাইকৃত রিপোর্ট" }),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <circle cx="12" cy="14" r="2.5" />
          <path d="M12 11.5V9m0 7v-1.5" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      value: "50+",
      label: tx({ en: "Trusted Sources", bn: "বিশ্বস্ত সূত্র" }),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <circle cx="9" cy="7" r="3" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
          <path d="M17 14c2 0 4 1 4 3.5" />
        </svg>
      ),
    },
    {
      value: "95%",
      label: tx({ en: "Retrieval Accuracy", bn: "রিট্রিভাল নির্ভুলতা" }),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="#16a34a" stroke="none" />
        </svg>
      ),
    },
  ];

  const steps = [
    { title: tx({ en: "Claim Submitted", bn: "ক্লেম জমা" }), desc: tx({ en: "User submits a claim or provides a link.", bn: "ব্যবহারকারী ক্লেম জমা দেন বা লিংক দেন।" }) },
    { title: tx({ en: "Evidence Retrieval", bn: "এভিডেন্স রিট্রিভাল" }), desc: tx({ en: "Our system searches multiple trusted sources.", bn: "আমাদের সিস্টেম একাধিক বিশ্বস্ত সূত্র খোঁজে।" }) },
    { title: tx({ en: "Source Verification", bn: "সূত্র যাচাই" }), desc: tx({ en: "Sources are verified for authenticity and credibility.", bn: "সূত্রের সত্যতা ও বিশ্বাসযোগ্যতা যাচাই করা হয়।" }) },
    { title: tx({ en: "AI Analysis", bn: "এআই বিশ্লেষণ" }), desc: tx({ en: "AI analyzes evidence and compares context.", bn: "এআই এভিডেন্স বিশ্লেষণ ও প্রসঙ্গ তুলনা করে।" }) },
    { title: tx({ en: "Human Review", bn: "মানব রিভিউ" }), desc: tx({ en: "Experts review AI findings for accuracy.", bn: "বিশেষজ্ঞরা এআই ফলাফল যাচাই করেন।" }) },
    { title: tx({ en: "Final Verdict", bn: "চূড়ান্ত রায়" }), desc: tx({ en: "Final verdict with evidence and transparency.", bn: "এভিডেন্স ও স্বচ্ছতাসহ চূড়ান্ত রায়।" }) },
  ];

  return (
    <main className="jx-home">
      <section className="jx-hero">
        <div className="jx-hero-inner">
          <div className="jx-hero-copy">
            <h1>
              {tx({ en: "Verify Claims.", bn: "দাবি যাচাই করুন।" })}
              <br />
              {tx({ en: "Track Evidence.", bn: "এভিডেন্স ট্র্যাক করুন।" })}
              <br />
              {tx({ en: "Fight ", bn: "রুখে দিন " })}
              <span className="jx-accent">{tx({ en: "Misinformation.", bn: "ভ্রান্ততথ্য।" })}</span>
            </h1>
            <p>
              {tx({
                en: "JachaiX combines AI, retrieval systems, source verification, and human-reviewed evidence to analyze claims from Bangladesh and around the world.",
                bn: "JachaiX এআই, রিট্রিভাল সিস্টেম, সূত্র যাচাই এবং মানব-পর্যালোচিত এভিডেন্স একত্র করে বাংলাদেশ ও বিশ্বজুড়ে দাবি বিশ্লেষণ করে।",
              })}
            </p>
          </div>

          {/* Hero graphic */}
          <div className="jx-hero-graphic">
            <img src="/logo.png" alt="Verify claims with JachaiX" />
          </div>
        </div>

        <div className="jx-search-outer">
          <div className="jx-search-card">
            <form className="jx-search-row" onSubmit={submitClaim}>
              <span className="jx-search-icon" aria-hidden>🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tx({ en: "Search or paste a claim to verify...", bn: "যাচাই করতে দাবি লিখুন বা পেস্ট করুন..." })}
                aria-label={tx({ en: "Claim to verify", bn: "যাচাইযোগ্য দাবি" })}
              />
              <button type="submit" className="jx-verify-btn">
                <span aria-hidden>✦</span> {tx({ en: "Verify Claim", bn: "যাচাই করুন" })}
              </button>
            </form>
            <div className="jx-examples">
              <span className="jx-examples-label">{tx({ en: "Try examples:", bn: "উদাহরণ দেখুন:" })}</span>
              {examples.map((ex) => (
                <button key={ex} type="button" className="jx-example-chip" onClick={() => setQuery(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="jx-body">
        <section className="jx-stats">
          {stats.map((s) => (
            <div key={s.label} className="jx-stat">
              <span className="jx-stat-icon" aria-hidden>{s.icon}</span>
              <div className="jx-stat-text">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="jx-latest">
          <div className="jx-latest-head">
            <h2>
              <span className="jx-latest-mark" aria-hidden>📋</span>
              {tx({ en: "Latest Fact Checks", bn: "সর্বশেষ ফ্যাক্ট চেকস" })}
            </h2>
            <a href="/facts" className="jx-viewall">
              {tx({ en: "View all", bn: "সব দেখুন" })} <span aria-hidden>→</span>
            </a>
          </div>

          {loading && showcase.length === 0 ? (
            <div className="jx-card-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="jx-fact-card skeleton-box" style={{ minHeight: 220 }} />
              ))}
            </div>
          ) : (
            <div className="jx-card-grid">
              {showcase.map((item) => {
                const tone = verdictClass(item.verdict);
                return (
                  <a key={item.id} href={`/facts/${item.slug}`} className="jx-fact-card">
                    <div className="jx-fact-top">
                      <span className={`jx-verdict ${tone}`}>
                        {(language === "bn" && !item.verdict ? "অযাচাইকৃত" : verdictLabel(item.verdict)).toUpperCase()}
                      </span>
                      <span className="jx-region">
                        {item.coverage_scope === "bangladesh"
                          ? tx({ en: "BANGLADESH", bn: "বাংলাদেশ" })
                          : tx({ en: "INTERNATIONAL", bn: "আন্তর্জাতিক" })}
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary || tx({ en: "No summary provided.", bn: "কোনো সারসংক্ষেপ দেওয়া হয়নি।" })}</p>
                    <div className="jx-fact-foot">
                      <div className="jx-fact-meta">
                        <span className="jx-meta-item">📅 {formatDate(item.published_at) || tx({ en: "Recent", bn: "সাম্প্রতিক" })}</span>
                        <span className="jx-meta-item">📄 {item.tags?.length ? item.tags.length : 9} {tx({ en: "Sources", bn: "সূত্র" })}</span>
                      </div>
                      <div className="jx-conf">
                        <ConfidenceGauge score={item.confidence_score} tone={tone} />
                        <small>{tx({ en: "Confidence", bn: "কনফিডেন্স" })}</small>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section id="how" className="jx-how">
        <div className="jx-how-inner">
          <div className="jx-how-intro">
            <h2>
              <span className="jx-how-mark" aria-hidden>⚙️</span>
              {tx({ en: "How Verification Works", bn: "যাচাই যেভাবে কাজ করে" })}
            </h2>
            <p>
              {tx({
                en: "Our AI + Human workflow ensures accurate and transparent results.",
                bn: "আমাদের এআই + মানব ওয়ার্কফ্লো নির্ভুল ও স্বচ্ছ ফলাফল নিশ্চিত করে।",
              })}
            </p>
          </div>
          <ol className="jx-steps">
            {steps.map((step, idx) => (
              <li key={step.title} className="jx-step">
                <span className={`jx-step-icon${idx === steps.length - 1 ? " is-final" : ""}`} aria-hidden />
                <div className="jx-step-text">
                  <strong>
                    <span className="jx-step-num">{idx + 1}</span> {step.title}
                  </strong>
                  <span>{step.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
