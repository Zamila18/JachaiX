"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicFactChecks, getBookmarkIds, addBookmark, removeBookmark, saveSearch } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import type { PublicFactCheckListItem } from "@/lib/types";

type Scope = "bangladesh" | "international";

const FALLBACK_FACT_CHECKS: PublicFactCheckListItem[] = [
  {
    id: 2001,
    slug: "bd-vaccine-rumor-claim",
    title: "Bangladesh Vaccine Microchip Claim",
    summary: "False claim alleging vaccines include tracking microchips. No credible source evidence supports this.",
    verdict: "false",
    confidence_score: 0.95,
    language: "en",
    coverage_scope: "bangladesh",
    origin: "internal",
    source_name: "JachaiX Verification Desk",
    source_url: null,
    is_featured: true,
    published_at: null,
    tags: ["health", "misinformation", "bangladesh"],
  },
  {
    id: 2002,
    slug: "bd-election-video-context",
    title: "Bangladesh Election Video Context Check",
    summary: "Real video shared with wrong date/location context; original context changes conclusion.",
    verdict: "misleading",
    confidence_score: 0.86,
    language: "en",
    coverage_scope: "bangladesh",
    origin: "internal",
    source_name: "JachaiX Verification Desk",
    source_url: null,
    is_featured: true,
    published_at: null,
    tags: ["election", "context"],
  },
  {
    id: 2003,
    slug: "intl-celebrity-death-hoax",
    title: "International Celebrity Death Hoax",
    summary: "Misleading viral posts reused old visuals; official statements confirmed the person alive.",
    verdict: "misleading",
    confidence_score: 0.88,
    language: "en",
    coverage_scope: "international",
    origin: "external",
    source_name: "Partner Fact-Check Network",
    source_url: null,
    is_featured: true,
    published_at: null,
    tags: ["international", "viral"],
  },
  {
    id: 2004,
    slug: "intl-policy-quote-fabrication",
    title: "International Policy Quote Fabrication",
    summary: "Fabricated quote image circulated widely; no official transcript contains the claim.",
    verdict: "false",
    confidence_score: 0.9,
    language: "en",
    coverage_scope: "international",
    origin: "external",
    source_name: "Global Fact-Check Alliance",
    source_url: null,
    is_featured: true,
    published_at: null,
    tags: ["international", "fabrication"],
  },
];

function fallbackItemsFor(scope: Scope, query: string): PublicFactCheckListItem[] {
  const q = query.trim().toLowerCase();
  return FALLBACK_FACT_CHECKS.filter((item) => {
    if (item.coverage_scope !== scope) return false;
    if (!q) return true;
    return `${item.title} ${item.summary || ""}`.toLowerCase().includes(q);
  });
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

export function FactsHubPage() {
  const { language, tx } = useLanguage();
  const { token, isAuthenticated } = useAuth();
  const params = useSearchParams();

  const initialScope: Scope = params.get("scope") === "international" ? "international" : "bangladesh";
  const [scope, setScope] = useState<Scope>(initialScope);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [items, setItems] = useState<PublicFactCheckListItem[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bookmark state (real fact-checks only)
  const [bookmarkIds, setBookmarkIds] = useState<Set<number>>(new Set());
  const [savedSearchMsg, setSavedSearchMsg] = useState("");

  useEffect(() => {
    if (!token) { setBookmarkIds(new Set()); return; }
    getBookmarkIds(token).then((r) => setBookmarkIds(new Set(r.ids))).catch(() => {});
  }, [token]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getPublicFactChecks({ scope, q: query.trim() || undefined, perPage: 24 })
      .then((res) => {
        if (!mounted) return;
        const apiItems = res.items || [];
        setUsingFallback(apiItems.length === 0);
        setItems(apiItems.length ? apiItems : fallbackItemsFor(scope, query));
      })
      .catch(() => {
        if (!mounted) return;
        setUsingFallback(true);
        setItems(fallbackItemsFor(scope, query));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [scope, query]);

  const toggleBookmark = async (id: number) => {
    if (!token) return;
    const next = new Set(bookmarkIds);
    if (next.has(id)) {
      next.delete(id);
      setBookmarkIds(next);
      removeBookmark(token, id).catch(() => {});
    } else {
      next.add(id);
      setBookmarkIds(next);
      addBookmark(token, id).catch(() => {});
    }
  };

  const onSaveSearch = async () => {
    if (!token || !query.trim()) return;
    try {
      await saveSearch(token, query.trim(), { scope });
      setSavedSearchMsg(tx({ en: "Search saved", bn: "অনুসন্ধান সংরক্ষিত" }));
      setTimeout(() => setSavedSearchMsg(""), 2500);
    } catch {
      /* ignore */
    }
  };

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
          <div className="facts-search-wrap">
            <input
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx({ en: "Search fact checks", bn: "ফ্যাক্ট চেক খুঁজুন" })}
            />
            {isAuthenticated && query.trim() && (
              <button type="button" className="facts-save-search" onClick={onSaveSearch} title={tx({ en: "Save this search", bn: "এই অনুসন্ধান সংরক্ষণ করুন" })}>
                {savedSearchMsg || tx({ en: "★ Save search", bn: "★ অনুসন্ধান সংরক্ষণ" })}
              </button>
            )}
          </div>
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
                <span className="scope-chip">{item.coverage_scope === "bangladesh" ? tx({ en: "Bangladesh", bn: "বাংলাদেশ" }) : tx({ en: "International", bn: "আন্তর্জাতিক" })}</span>
                {isAuthenticated && !usingFallback && (
                  <button
                    type="button"
                    className={`fact-bookmark ${bookmarkIds.has(item.id) ? "active" : ""}`}
                    onClick={() => toggleBookmark(item.id)}
                    title={bookmarkIds.has(item.id) ? tx({ en: "Remove bookmark", bn: "বুকমার্ক সরান" }) : tx({ en: "Bookmark", bn: "বুকমার্ক" })}
                    aria-pressed={bookmarkIds.has(item.id)}
                  >
                    {bookmarkIds.has(item.id) ? "🔖" : "🏷️"}
                  </button>
                )}
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
