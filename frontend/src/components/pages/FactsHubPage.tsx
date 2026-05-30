"use client";

import { useEffect, useState } from "react";
import { getPublicFactChecks } from "@/lib/api";
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

export function FactsHubPage() {
  const { language, tx } = useLanguage();
  const [scope, setScope] = useState<Scope>("bangladesh");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PublicFactCheckListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getPublicFactChecks({ scope, q: query.trim() || undefined, perPage: 24 })
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
  }, [scope, query]);

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Public Fact Checks", bn: "পাবলিক ফ্যাক্ট চেকস" })}</p>
          <div className="live-pill">{tx({ en: "Public fact-check cards", bn: "পাবলিক ফ্যাক্ট-চেক কার্ড" })}</div>
        </div>
        <h1>{tx({ en: "Browse Already Fact-Checked Claims", bn: "ইতোমধ্যে যাচাইকৃত ক্লেমগুলো দেখুন" })}</h1>
        <p className="muted">{tx({ en: "Filter by Bangladesh and International scope and open detailed fact pages.", bn: "বাংলাদেশ ও আন্তর্জাতিক স্কোপ অনুযায়ী ফিল্টার করুন এবং বিস্তারিত ফ্যাক্ট পেজ খুলুন।" })}</p>
      </section>

      <section className="panel reveal delay-1">
        <div className="home-section-head">
          <div className="scope-tabs" role="tablist" aria-label={tx({ en: "Coverage scope", bn: "কভারেজ স্কোপ" })}>
            <button className={scope === "bangladesh" ? "active" : ""} onClick={() => setScope("bangladesh")} type="button">
              {tx({ en: "Bangladesh", bn: "বাংলাদেশ" })}
            </button>
            <button className={scope === "international" ? "active" : ""} onClick={() => setScope("international")} type="button">
              {tx({ en: "International", bn: "আন্তর্জাতিক" })}
            </button>
          </div>
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tx({ en: "Search fact checks", bn: "ফ্যাক্ট চেক খুঁজুন" })}
          />
        </div>

        {loading && (
          <div className="fact-grid">
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
            <div className="skeleton-box" style={{ height: "160px", borderRadius: "16px" }} />
          </div>
        )}
        {!loading && items.length === 0 && <p className="muted">{tx({ en: "No published fact checks found.", bn: "কোনো প্রকাশিত ফ্যাক্ট চেক পাওয়া যায়নি।" })}</p>}

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
    </main>
  );
}
