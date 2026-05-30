"use client";

import { useEffect, useState } from "react";
import { getPublicFactCheckDetail } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import type { PublicFactCheckDetail } from "@/lib/types";

function verdictLabel(verdict: string | null) {
  if (!verdict) return "Unverified";
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

export function FactsPage({ slug }: { slug: string }) {
  const { language, tx } = useLanguage();
  const [item, setItem] = useState<PublicFactCheckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getPublicFactCheckDetail(slug)
      .then((res) => {
        if (!mounted) return;
        setItem(res.item);
      })
      .catch(() => {
        if (!mounted) return;
        setError(tx({ en: "The requested fact page does not exist.", bn: "অনুরোধকৃত ফ্যাক্ট পেজটি পাওয়া যায়নি।" }));
        setItem(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="page-shell">
        <section className="hero-card reveal">
          <div className="skeleton-box" style={{ width: "120px", height: "16px", marginBottom: "0.8rem" }} />
          <div className="skeleton-box" style={{ width: "70%", height: "32px", marginBottom: "1rem" }} />
          <div className="skeleton-box" style={{ width: "40%", height: "20px" }} />
        </section>
        <section className="panel reveal delay-1">
          <div className="skeleton-box" style={{ width: "150px", height: "20px", marginBottom: "1rem" }} />
          <div className="skeleton-box" style={{ height: "100px", borderRadius: "12px" }} />
        </section>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="page-shell">
        <section className="panel reveal">
          <p className="eyebrow">Fact Checks</p>
          <h1>{tx({ en: "Fact not found", bn: "ফ্যাক্ট পাওয়া যায়নি" })}</h1>
          <p className="muted">{error || tx({ en: "The requested fact page does not exist.", bn: "অনুরোধকৃত ফ্যাক্ট পেজটি পাওয়া যায়নি।" })}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Public Fact Checks", bn: "পাবলিক ফ্যাক্ট চেকস" })}</p>
          <div className="live-pill">{item.coverage_scope === "bangladesh" ? tx({ en: "Bangladesh", bn: "বাংলাদেশ" }) : tx({ en: "International", bn: "আন্তর্জাতিক" })}</div>
        </div>
        <h1>{item.title}</h1>
        <p className="muted">
          {tx({ en: "Verdict", bn: "ভার্ডিক্ট" })}: {language === "bn" && !item.verdict ? "অযাচাইকৃত" : verdictLabel(item.verdict)} · {tx({ en: "Source", bn: "সূত্র" })}: {item.source_name || (item.origin === "external" ? tx({ en: "External", bn: "বাহ্যিক" }) : tx({ en: "JachaiX Internal", bn: "জাচাইএক্স অভ্যন্তরীণ" }))}
          {item.published_at ? ` · ${tx({ en: "Published", bn: "প্রকাশিত" })}: ${new Date(item.published_at).toLocaleDateString()}` : ""}
        </p>
      </section>

      <section className="panel reveal delay-1">
        <h2>{tx({ en: "Summary", bn: "সারসংক্ষেপ" })}</h2>
        <p className="explanation">{item.summary || tx({ en: "No summary provided.", bn: "কোনো সারসংক্ষেপ দেওয়া হয়নি।" })}</p>
      </section>

      <section className="panel reveal delay-2">
        <h2>{tx({ en: "Claim", bn: "ক্লেম" })}</h2>
        <p className="explanation">{item.claim_text || tx({ en: "No claim text provided.", bn: "কোনো ক্লেম টেক্সট দেওয়া হয়নি।" })}</p>
      </section>

      <section className="panel reveal delay-3">
        <h2>{tx({ en: "Explanation", bn: "ব্যাখ্যা" })}</h2>
        <p className="explanation">{item.explanation || tx({ en: "No explanation provided.", bn: "কোনো ব্যাখ্যা দেওয়া হয়নি।" })}</p>
      </section>

      <section className="panel reveal delay-4">
        <h2>{tx({ en: "Sources", bn: "সূত্রসমূহ" })}</h2>
        {Array.isArray(item.sources) && item.sources.length > 0 ? (
          <ul className="result-list">
            {item.sources.map((src, idx) => (
              <li key={`${idx}-${src.url || src.title || "source"}`}>
                <strong>{src.title || tx({ en: "Evidence source", bn: "এভিডেন্স সূত্র" })}</strong>
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noreferrer" className="link-inline">{src.url}</a>
                ) : (
                  <span className="muted">{tx({ en: "No URL", bn: "কোনো URL নেই" })}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{tx({ en: "No linked sources.", bn: "কোনো সংযুক্ত সূত্র নেই।" })}</p>
        )}
      </section>
    </main>
  );
}
