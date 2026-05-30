"use client";

import { useEffect, useMemo, useState } from "react";
import { getFeaturedFactChecks, getPublicFactChecks } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import type { PublicFactCheckListItem } from "@/lib/types";

type Scope = "bangladesh" | "international";

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

export function HomepagePage() {
  const { language, tx } = useLanguage();
  const [scope, setScope] = useState<Scope>("bangladesh");
  const [featured, setFeatured] = useState<PublicFactCheckListItem[]>([]);
  const [items, setItems] = useState<PublicFactCheckListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    getFeaturedFactChecks()
      .then((res) => {
        if (!mounted) return;
        setFeatured(res.items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setFeatured([]);
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
        setItems(res.items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [scope]);

  const featuredTop = useMemo(() => featured.slice(0, 3), [featured]);

  return (
    <main className="homepage-shell">
      <section className="home-hero">
        <p className="home-tag">{tx({ en: "JachaiX AI Solution", bn: "জাচাইএক্স এআই সলিউশন" })}</p>
        <h1>{tx({ en: "Fact-check intelligence for Bangladesh and international misinformation response.", bn: "বাংলাদেশ ও আন্তর্জাতিক ভ্রান্ততথ্য প্রতিরোধে ফ্যাক্ট-চেক বুদ্ধিমত্তা।" })}</h1>
        <p>
          {tx({ en: "JachaiX combines OCR, retrieval, reranking, and LLM reasoning with a public card-based fact-check hub so users can browse already-verified reports like a newsroom fact-check portal.", bn: "JachaiX OCR, retrieval, reranking এবং LLM reasoning একত্র করে একটি পাবলিক কার্ড-ভিত্তিক ফ্যাক্ট-চেক হাব তৈরি করেছে, যাতে ব্যবহারকারীরা নিউজরুম ফ্যাক্ট-চেক পোর্টালের মতো যাচাইকৃত রিপোর্ট ব্রাউজ করতে পারেন।" })}
        </p>
        <div className="home-actions">
          <a href="/facts" className="home-btn home-btn-primary">{tx({ en: "Browse Fact Checks", bn: "ফ্যাক্ট চেক দেখুন" })}</a>
          <a href="/scan" className="home-btn">{tx({ en: "Submit New Claim", bn: "নতুন ক্লেম জমা দিন" })}</a>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>{tx({ en: "Featured Fact Checks", bn: "ফিচার্ড ফ্যাক্ট চেকস" })}</h2>
          <a href="/facts" className="home-inline-link">{tx({ en: "View all", bn: "সব দেখুন" })}</a>
        </div>
        <div className="fact-grid">
          {featuredTop.length === 0 && <p className="muted">{tx({ en: "No featured items yet. Publish completed claims to show cards here.", bn: "এখনো কোনো ফিচার্ড আইটেম নেই। সম্পন্ন ক্লেম পাবলিশ করলে এখানে কার্ড দেখা যাবে।" })}</p>}
          {featuredTop.map((item) => (
            <article key={item.id} className="fact-card">
              <div className="fact-meta-row">
                <span className={`verdict-chip ${verdictClass(item.verdict)}`}>{language === "bn" && !item.verdict ? "অযাচাইকৃত" : verdictLabel(item.verdict)}</span>
                <span className="scope-chip">{item.coverage_scope === "bangladesh" ? tx({ en: "Bangladesh", bn: "বাংলাদেশ" }) : tx({ en: "International", bn: "আন্তর্জাতিক" })}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary || tx({ en: "No summary provided.", bn: "কোনো সারসংক্ষেপ দেওয়া হয়নি।" })}</p>
              <div className="fact-footer-row">
                <small>{item.source_name || (item.origin === "external" ? tx({ en: "External", bn: "বাহ্যিক" }) : tx({ en: "JachaiX Internal", bn: "জাচাইএক্স অভ্যন্তরীণ" }))}</small>
                <a href={`/facts/${item.slug}`}>{tx({ en: "Read full fact-check", bn: "সম্পূর্ণ ফ্যাক্ট-চেক পড়ুন" })}</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>{tx({ en: "Latest Fact Checks", bn: "সর্বশেষ ফ্যাক্ট চেকস" })}</h2>
          <div className="scope-tabs" role="tablist" aria-label={tx({ en: "Coverage scope", bn: "কভারেজ স্কোপ" })}>
            <button
              className={scope === "bangladesh" ? "active" : ""}
              onClick={() => setScope("bangladesh")}
              type="button"
            >
              {tx({ en: "Bangladesh", bn: "বাংলাদেশ" })}
            </button>
            <button
              className={scope === "international" ? "active" : ""}
              onClick={() => setScope("international")}
              type="button"
            >
              {tx({ en: "International", bn: "আন্তর্জাতিক" })}
            </button>
          </div>
        </div>
        {loading && (
          <div className="fact-grid">
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
          </div>
        )}
        {!loading && items.length === 0 && <p className="muted">{tx({ en: "No published items in this scope yet.", bn: "এই স্কোপে এখনো কোনো প্রকাশিত আইটেম নেই।" })}</p>}
        <div className="fact-grid">
          {items.map((item) => (
            <article key={item.id} className="fact-card">
              <div className="fact-meta-row">
                <span className={`verdict-chip ${verdictClass(item.verdict)}`}>{language === "bn" && !item.verdict ? "অযাচাইকৃত" : verdictLabel(item.verdict)}</span>
                <span className="scope-chip">{item.language.toUpperCase()}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary || tx({ en: "No summary provided.", bn: "কোনো সারসংক্ষেপ দেওয়া হয়নি।" })}</p>
              <div className="fact-footer-row">
                <small>{item.source_name || (item.origin === "external" ? tx({ en: "External", bn: "বাহ্যিক" }) : tx({ en: "JachaiX Internal", bn: "জাচাইএক্স অভ্যন্তরীণ" }))}</small>
                <a href={`/facts/${item.slug}`}>{tx({ en: "Read full fact-check", bn: "সম্পূর্ণ ফ্যাক্ট-চেক পড়ুন" })}</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="capabilities" className="home-section">
        <h2>{tx({ en: "Core Capabilities", bn: "মূল সক্ষমতাসমূহ" })}</h2>
        <div className="home-card-grid">
          <article className="home-card">
            <h3>{tx({ en: "Text Claim Verification", bn: "টেক্সট ক্লেম ভেরিফিকেশন" })}</h3>
            <p>{tx({ en: "Live verification pipeline with evidence retrieval, verdict confidence, and human review escalation.", bn: "এভিডেন্স রিট্রিভাল, ভার্ডিক্ট কনফিডেন্স ও মানব রিভিউ এসকেলেশনসহ লাইভ ভেরিফিকেশন পাইপলাইন।" })}</p>
            <span className="home-badge live">{tx({ en: "Live", bn: "লাইভ" })}</span>
          </article>
          <article className="home-card">
            <h3>{tx({ en: "Image OCR Verification", bn: "ইমেজ OCR ভেরিফিকেশন" })}</h3>
            <p>{tx({ en: "Extract text from uploaded images and route it through the same retrieval and verdict engine.", bn: "আপলোড করা ছবি থেকে টেক্সট বের করে একই রিট্রিভাল ও ভার্ডিক্ট ইঞ্জিনে পাঠানো হয়।" })}</p>
            <span className="home-badge live">{tx({ en: "Live", bn: "লাইভ" })}</span>
          </article>
          <article className="home-card">
            <h3>{tx({ en: "PDF OCR Verification", bn: "PDF OCR ভেরিফিকেশন" })}</h3>
            <p>{tx({ en: "Parse PDF content to detect claim statements and generate evidence-backed verification results.", bn: "PDF কনটেন্ট পার্স করে ক্লেম শনাক্ত করা এবং এভিডেন্সভিত্তিক ভেরিফিকেশন ফল তৈরি করা হয়।" })}</p>
            <span className="home-badge live">{tx({ en: "Live", bn: "লাইভ" })}</span>
          </article>
          <article className="home-card">
            <h3>{tx({ en: "Audio and Video Modules", bn: "অডিও ও ভিডিও মডিউল" })}</h3>
            <p>{tx({ en: "Planned multimodal expansion with transcription and timeline-based verification in future phases.", bn: "ভবিষ্যৎ ধাপে ট্রান্সক্রিপশন ও টাইমলাইনভিত্তিক ভেরিফিকেশনসহ মাল্টিমডাল সম্প্রসারণ পরিকল্পিত।" })}</p>
            <span className="home-badge future">{tx({ en: "Roadmap", bn: "রোডম্যাপ" })}</span>
          </article>
        </div>
      </section>

      <section id="pipeline" className="home-section">
        <h2>{tx({ en: "Verification Pipeline", bn: "ভেরিফিকেশন পাইপলাইন" })}</h2>
        <ol className="home-pipeline">
          <li>{tx({ en: "Claim intake from text, image, or PDF endpoints", bn: "টেক্সট, ইমেজ বা PDF এন্ডপয়েন্ট থেকে ক্লেম গ্রহণ" })}</li>
          <li>{tx({ en: "OCR and normalization for structured claim text", bn: "স্ট্রাকচার্ড ক্লেম টেক্সটের জন্য OCR ও নরমালাইজেশন" })}</li>
          <li>{tx({ en: "Embedding retrieval and reranking against knowledge sources", bn: "জ্ঞানভান্ডার সূত্রের বিপরীতে এমবেডিং রিট্রিভাল ও রির্যাংকিং" })}</li>
          <li>{tx({ en: "LLM verdict generation with confidence and explanation", bn: "কনফিডেন্স ও ব্যাখ্যাসহ LLM ভার্ডিক্ট তৈরি" })}</li>
          <li>{tx({ en: "Cross-verification links plus human review recommendation", bn: "ক্রস-ভেরিফিকেশন লিংক এবং মানব রিভিউ সুপারিশ" })}</li>
        </ol>
      </section>

      <section className="home-section">
        <h2>{tx({ en: "Architecture Components", bn: "আর্কিটেকচার কম্পোনেন্টস" })}</h2>
        <div className="home-card-grid">
          <article className="home-card">
            <h3>{tx({ en: "Laravel Orchestration Layer", bn: "Laravel Orchestration Layer" })}</h3>
            <p>{tx({ en: "API gateway, async jobs, review actions, and claim-state lifecycle management.", bn: "API গেটওয়ে, async jobs, review actions এবং claim-state lifecycle management।" })}</p>
          </article>
          <article className="home-card">
            <h3>{tx({ en: "OCR + Retrieval Services", bn: "OCR + Retrieval Services" })}</h3>
            <p>{tx({ en: "Dedicated microservices for extraction, embedding search, and semantic reranking.", bn: "Extraction, embedding search এবং semantic reranking এর জন্য নিবেদিত মাইক্রোসার্ভিস।" })}</p>
          </article>
          <article className="home-card">
            <h3>{tx({ en: "Vector Knowledge Access", bn: "Vector Knowledge Access" })}</h3>
            <p>{tx({ en: "Evidence retrieval against indexed knowledge collections for grounded verdicts.", bn: "গ্রাউন্ডেড ভার্ডিক্টের জন্য indexed knowledge collections থেকে evidence retrieval।" })}</p>
          </article>
          <article className="home-card">
            <h3>{tx({ en: "Local LLM Compatibility", bn: "Local LLM Compatibility" })}</h3>
            <p>{tx({ en: "Supports Ollama-based local models for private, low-latency verification deployments.", bn: "প্রাইভেট, লো-লেটেন্সি ভেরিফিকেশনের জন্য Ollama-ভিত্তিক লোকাল মডেল সমর্থন করে।" })}</p>
          </article>
        </div>
      </section>

      <section id="deployment" className="home-section home-section-compact">
        <h2>{tx({ en: "Project and Product Scope", bn: "প্রকল্প ও পণ্যের পরিধি" })}</h2>
        <p>
          {tx({ en: "JachaiX is built as a production-oriented architecture with a Laravel backend, queue workers, OCR/embedder/reranker services, vector retrieval, and Ollama-based local LLM support. The platform is designed for hackathon demos and scalable deployment paths.", bn: "JachaiX একটি production-oriented architecture হিসেবে তৈরি, যেখানে Laravel backend, queue workers, OCR/embedder/reranker services, vector retrieval এবং Ollama-ভিত্তিক local LLM support রয়েছে। প্ল্যাটফর্মটি hackathon demo এবং scalable deployment path এর জন্য ডিজাইন করা।" })}
        </p>
      </section>
    </main>
  );
}
