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
      <main className="jx-home">
        <section className="jx-hero" style={{ paddingBottom: '3rem' }}>
          <div className="jx-hero-inner">
            <div className="skeleton-box" style={{ width: "120px", height: "16px", marginBottom: "0.8rem", background: "rgba(255,255,255,0.1)" }} />
            <div className="skeleton-box" style={{ width: "70%", height: "32px", marginBottom: "1rem", background: "rgba(255,255,255,0.1)" }} />
            <div className="skeleton-box" style={{ width: "40%", height: "20px", background: "rgba(255,255,255,0.1)" }} />
          </div>
        </section>
        <div className="jx-body">
          <section className="jx-latest" style={{ paddingTop: '2rem' }}>
            <div className="skeleton-box" style={{ height: "300px", borderRadius: "12px", background: "#ffffff", border: "1px solid #e2e8f0" }} />
          </section>
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="jx-home">
        <section className="jx-hero" style={{ paddingBottom: '3rem' }}>
          <div className="jx-hero-inner">
            <div className="jx-hero-copy">
              <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{tx({ en: "Fact not found", bn: "ফ্যাক্ট পাওয়া যায়নি" })}</h1>
              <p style={{ fontSize: '1.2rem' }}>{error || tx({ en: "The requested fact page does not exist.", bn: "অনুরোধকৃত ফ্যাক্ট পেজটি পাওয়া যায়নি।" })}</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const tone = item.verdict ? item.verdict.toLowerCase() : "unverified";
  let verdictClassStr = "";
  if (tone === "true") verdictClassStr = "is-true";
  else if (tone === "false") verdictClassStr = "is-false";
  else if (tone === "misleading") verdictClassStr = "is-misleading";
  else verdictClassStr = "is-unverified";

  return (
    <main className="jx-home">
      <style dangerouslySetInnerHTML={{ __html: `
        .jx-detail-panel {
          background: #ffffff;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .jx-detail-panel h2 {
          color: #0f172a;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .jx-detail-panel p {
          color: #334155;
          line-height: 1.7;
          font-size: 1.05rem;
        }
        .jx-sources-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .jx-sources-list li {
          background: #f8fafc;
          padding: 1.2rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .jx-sources-list li strong {
          color: #0f172a;
          font-size: 1.05rem;
        }
        .jx-sources-list li a {
          color: #16a34a;
          text-decoration: none;
          word-break: break-all;
          font-size: 0.95rem;
        }
        .jx-sources-list li a:hover {
          text-decoration: underline;
        }
      `}} />
      <section className="jx-hero" style={{ paddingBottom: '6rem' }}>
        <div className="jx-hero-inner">
          <div className="jx-hero-copy" style={{ maxWidth: '900px', margin: '0' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span className={`jx-verdict ${verdictClassStr}`} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                {(language === "bn" && !item.verdict ? "অযাচাইকৃত" : verdictLabel(item.verdict)).toUpperCase()}
              </span>
              <span className="jx-region" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)' }}>
                {item.coverage_scope === "bangladesh" ? tx({ en: "BANGLADESH", bn: "বাংলাদেশ" }) : tx({ en: "INTERNATIONAL", bn: "আন্তর্জাতিক" })}
              </span>
            </div>
            <h1 style={{ fontSize: '2.5rem', lineHeight: '1.3', marginBottom: '1.5rem' }}>{item.title}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', color: '#94a3b8', fontSize: '0.95rem', flexWrap: 'wrap' }}>
              <span>🏢 {tx({ en: "Source", bn: "সূত্র" })}: <strong style={{ color: '#fff' }}>{item.source_name || (item.origin === "external" ? tx({ en: "External", bn: "বাহ্যিক" }) : tx({ en: "JachaiX Internal", bn: "জাচাইএক্স অভ্যন্তরীণ" }))}</strong></span>
              {item.published_at && <span>📅 {tx({ en: "Published", bn: "প্রকাশিত" })}: <strong style={{ color: '#fff' }}>{new Date(item.published_at).toLocaleDateString()}</strong></span>}
            </div>
          </div>
        </div>
      </section>

      <div className="jx-body">
        <section className="jx-latest" style={{ paddingTop: '0', marginTop: '-4rem', position: 'relative', zIndex: 10 }}>
          <div className="jx-detail-panel">
            <h2>📋 {tx({ en: "Summary", bn: "সারসংক্ষেপ" })}</h2>
            <p>{item.summary || tx({ en: "No summary provided.", bn: "কোনো সারসংক্ষেপ দেওয়া হয়নি।" })}</p>
          </div>

          <div className="jx-detail-panel">
            <h2>🗣️ {tx({ en: "Claim", bn: "ক্লেম" })}</h2>
            <p style={{ fontStyle: 'italic', borderLeft: '4px solid #cbd5e1', paddingLeft: '1.2rem', color: '#475569', fontSize: '1.1rem' }}>
              "{item.claim_text || tx({ en: "No claim text provided.", bn: "কোনো ক্লেম টেক্সট দেওয়া হয়নি।" })}"
            </p>
          </div>

          <div className="jx-detail-panel">
            <h2>🔍 {tx({ en: "Explanation", bn: "ব্যাখ্যা" })}</h2>
            <p>{item.explanation || tx({ en: "No explanation provided.", bn: "কোনো ব্যাখ্যা দেওয়া হয়নি।" })}</p>
          </div>

          <div className="jx-detail-panel">
            <h2>🔗 {tx({ en: "Sources", bn: "সূত্রসমূহ" })}</h2>
            {Array.isArray(item.sources) && item.sources.length > 0 ? (
              <ul className="jx-sources-list">
                {item.sources.map((src, idx) => (
                  <li key={`${idx}-${src.url || src.title || "source"}`}>
                    <strong>{src.title || tx({ en: "Evidence source", bn: "এভিডেন্স সূত্র" })}</strong>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noreferrer">{src.url}</a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>{tx({ en: "No URL", bn: "কোনো URL নেই" })}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#94a3b8' }}>{tx({ en: "No linked sources.", bn: "কোনো সংযুক্ত সূত্র নেই।" })}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
