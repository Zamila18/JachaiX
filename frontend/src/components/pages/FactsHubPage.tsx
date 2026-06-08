"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicFactChecks, getBookmarkIds, addBookmark, removeBookmark, saveSearch } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n";
import { getPublicFactChecks } from "@/lib/api";
import type { PublicFactCheckListItem } from "@/lib/types";


const PER_PAGE = 12;

function verdictLabel(verdict: string) {
  if (verdict === "partially_true") return "PARTIALLY TRUE";
  return verdict.toUpperCase();
}

function verdictColor(verdict: string) {
  switch (verdict) {
    case "true": return "#16a34a";
    case "false": return "#ef4444";
    case "misleading": return "#f97316";
    case "partially_true": return "#3b82f6";
    default: return "#94a3b8";
  }
}

function HalfCircleGauge({ pct, color }: { pct: number; color: string }) {
  const radius = 12;
  const circ = Math.PI * radius;
  const dash = (pct / 100) * circ;
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" style={{ overflow: "visible" }}>
      <path d="M 2 14 A 12 12 0 0 1 26 14" fill="none" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
      <path d="M 2 14 A 12 12 0 0 1 26 14" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
    </svg>
  );
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
  const { tx } = useLanguage();

  const [items, setItems] = useState<PublicFactCheckListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Applied filter state
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<string>("all");
  const [verdict, setVerdict] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  // Temp (pre-apply) filter state
  const [tempQuery, setTempQuery] = useState("");
  const [tempScope, setTempScope] = useState<string>("all");
  const [tempVerdict, setTempVerdict] = useState<string>("all");
  const [tempSort, setTempSort] = useState<string>("newest");

  const fetchFacts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await getPublicFactChecks({
        perPage: PER_PAGE,
        ...(query ? { q: query } : {}),
        ...(scope !== "all" ? { scope: scope as "bangladesh" | "international" } : {}),
        ...(verdict !== "all" ? { verdict } : {}),
      });
      if (res && res.success) {
        // Client-side sort since API may not support it
        let sorted = [...res.items];
        if (sort === "newest") {
          sorted.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
        } else {
          sorted.sort((a, b) => new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime());
        }
        // Paginate client-side
        const pageTotal = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
        setTotalPages(res.pagination?.last_page ?? pageTotal);
        setTotal(res.pagination?.total ?? sorted.length);
        const start = (page - 1) * PER_PAGE;
        setItems(sorted.slice(start, start + PER_PAGE));
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query, scope, verdict, sort]);

  useEffect(() => {
    fetchFacts(currentPage);
  }, [fetchFacts, currentPage]);

  const applyFilters = () => {
    setQuery(tempQuery);
    setScope(tempScope);
    setVerdict(tempVerdict);
    setSort(tempSort);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Build page number list
  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (currentPage > 3) pageNumbers.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pageNumbers.push(i);
    if (currentPage < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

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
    <main className="jx-hub" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .jx-hub-hero {
          background: #0a1628;
          padding: 64px 2rem 100px;
          position: relative;
          color: #fff;
          overflow: hidden;
        }
        /* World-map dot grid */
        .jx-hub-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(100,180,255,0.18) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 500'%3E%3Cellipse cx='500' cy='250' rx='480' ry='230' fill='white'/%3E%3C/svg%3E");
          mask-size: cover;
          opacity: 0.55;
          pointer-events: none;
        }
        /* Subtle green glow top-right */
        .jx-hub-hero::after {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(22,163,74,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .jx-hub-hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }
        .jx-hub-hero-copy {
          flex: 1;
        }
        .jx-hub-hero-copy h1 {
          font-family: var(--font-display), sans-serif;
          font-size: clamp(1.85rem, 3.5vw, 3rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem;
          color: #fff;
        }
        .jx-hub-hero-copy p {
          font-size: 1rem;
          color: #94a3b8;
          max-width: 440px;
          line-height: 1.65;
          margin: 0;
        }
        .jx-hero-graphic {
          width: 220px;
          height: 220px;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
          filter: drop-shadow(0 0 40px rgba(22,163,74,0.35));
        }

        .jx-hub-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }

        .jx-filter-bar {
          background: #fff;
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.13);
          margin-top: -52px;
          position: relative;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          border: 1px solid #e8edf3;
        }
        .jx-filter-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .jx-filter-input, .jx-filter-select {
          padding: 0.72rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.92rem;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
          cursor: pointer;
        }
        .jx-filter-select:focus { border-color: #16a34a; }
        .jx-filter-search {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 0 1rem;
          background: #fff;
          transition: border-color 0.15s;
        }
        .jx-filter-search:focus-within { border-color: #16a34a; }
        .jx-filter-search input {
          border: none;
          padding: 0.72rem 0;
          width: 100%;
          outline: none;
          font-size: 0.92rem;
          color: #1e293b;
          background: transparent;
        }
        .jx-filter-search input::placeholder { color: #94a3b8; }
        .jx-filter-with-icon {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 0 0.9rem;
          background: #fff;
          color: #1e293b;
          font-size: 0.92rem;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .jx-filter-with-icon select {
          border: none;
          outline: none;
          background: transparent;
          color: #1e293b;
          font-size: 0.92rem;
          padding: 0.72rem 0;
          cursor: pointer;
        }
        .jx-btn-apply {
          background: #16a34a;
          color: #fff;
          border: none;
          padding: 0.72rem 1.4rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: auto;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .jx-btn-apply:hover { background: #15803d; }

        .jx-hub-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .jx-stat-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .jx-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .jx-stat-icon.green { background: #f0fdf4; color: #16a34a; }
        .jx-stat-icon.red { background: #fef2f2; color: #ef4444; }
        .jx-stat-icon.orange { background: #fff7ed; color: #f97316; }
        .jx-stat-info h4 { font-size: 1.5rem; margin: 0 0 0.2rem; color: #0f172a; }
        .jx-stat-info p { font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.2; }


        .jx-hub-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        @media (max-width: 1100px) { .jx-hub-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px)  { .jx-hub-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .jx-hub-grid { grid-template-columns: 1fr; } }

        .jx-hub-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .jx-hub-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .jx-hub-card-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .jx-hub-card-verdict {
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          color: #fff;
        }
        .jx-hub-card-region {
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
        }
        .jx-hub-card h3 {
          font-size: 1.1rem;
          color: #0f172a;
          margin: 0 0 0.8rem;
          line-height: 1.4;
        }
        .jx-hub-card-summary {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.5;
          flex-grow: 1;
          margin: 0 0 1.5rem;
        }
        .jx-hub-card-meta {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.5rem 1rem;
          font-size: 0.85rem;
          color: #64748b;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .jx-hub-card-meta svg { width: 14px; height: 14px; }
        .jx-hub-card-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
          color: #16a34a;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .jx-trust {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 2rem;
          display: flex;
          gap: 2rem;
          margin-bottom: 3rem;
          align-items: center;
        }
        .jx-trust-title { flex-shrink: 0; width: 150px; }
        .jx-trust-title h3 { margin: 0; font-size: 1.4rem; color: #0f172a; }
        .jx-trust-grid { display: flex; gap: 2rem; flex: 1; justify-content: space-between; }
        .jx-trust-item { display: flex; flex-direction: column; gap: 0.5rem; }
        .jx-trust-item h4 { margin: 0; font-size: 0.95rem; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
        .jx-trust-item p { margin: 0; font-size: 0.8rem; color: #64748b; }

        .jx-pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .jx-page-btn {
          background: #fff;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .jx-page-btn:hover:not(:disabled) { border-color: #16a34a; color: #16a34a; }
        .jx-page-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; }
        .jx-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .jx-page-ellipsis { padding: 0.5rem; color: #94a3b8; display: flex; align-items: center; }

        .jx-skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: jx-shimmer 1.2s infinite;
          border-radius: 8px;
        }
        @keyframes jx-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .jx-result-count {
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
      `}} />

      {/* HERO */}
      <section className="jx-hub-hero">
        <div className="jx-hub-hero-inner">
          <div className="jx-hub-hero-copy">
            <h1>{tx({ en: "Fact Checks", bn: "ফ্যাক্ট চেকস" })}</h1>
            <p>{tx({ en: "Browse verified fact-check reports, evidence-backed investigations, and misinformation analysis from Bangladesh and around the world.", bn: "বাংলাদেশ এবং বিশ্বজুড়ে যাচাইকৃত ফ্যাক্ট-চেক রিপোর্ট, প্রমাণ-সমর্থিত তদন্ত এবং ভুল তথ্যের বিশ্লেষণ ব্রাউজ করুন।" })}</p>
          </div>
          {/* Shield with checkmark — matches the image */}
          <div className="jx-hero-graphic">
            <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer glow */}
              <ellipse cx="110" cy="115" rx="90" ry="88" fill="rgba(22,163,74,0.08)" />
              {/* Shield body */}
              <path
                d="M110 18 L188 52 L188 118 C188 158 110 196 110 196 C110 196 32 158 32 118 L32 52 Z"
                fill="rgba(22,163,74,0.15)"
                stroke="#16a34a"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Inner shield highlight */}
              <path
                d="M110 38 L172 66 L172 116 C172 146 110 176 110 176 C110 176 48 146 48 116 L48 66 Z"
                fill="rgba(22,163,74,0.08)"
                stroke="rgba(22,163,74,0.3)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Checkmark */}
              <path
                d="M76 110 L100 136 L148 88"
                stroke="#16a34a"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </section>

      <div className="jx-hub-body">
        {/* FILTER BAR */}
        <div className="jx-filter-bar">
          <div className="jx-filter-row">
            {/* Search */}
            <div className="jx-filter-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={tempQuery}
                onChange={e => setTempQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && applyFilters()}
                placeholder={tx({ en: "Search fact checks...", bn: "ফ্যাক্ট চেক খুঁজুন..." })}
              />
            </div>
            {/* Region */}
            <select className="jx-filter-select" value={tempScope} onChange={e => setTempScope(e.target.value)}>
              <option value="all">All Regions</option>
              <option value="bangladesh">Bangladesh</option>
              <option value="international">International</option>
            </select>
            {/* Verdict */}
            <select className="jx-filter-select" value={tempVerdict} onChange={e => setTempVerdict(e.target.value)}>
              <option value="all">All Verdicts</option>
              <option value="true">True</option>
              <option value="false">False</option>
              <option value="misleading">Misleading</option>
              <option value="partially_true">Partially True</option>
            </select>
          </div>
          <div className="jx-filter-row">
            {/* Date range with calendar icon */}
            <div className="jx-filter-with-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <select style={{ border: 'none', outline: 'none', background: 'transparent', color: '#1e293b', fontSize: '0.92rem', padding: '0.72rem 0', cursor: 'pointer' }}>
                <option value="30days">Last 30 Days</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last 1 Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            {/* Sort with icon */}
            <div className="jx-filter-with-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <select value={tempSort} onChange={e => setTempSort(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', color: '#1e293b', fontSize: '0.92rem', padding: '0.72rem 0', cursor: 'pointer' }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            <button className="jx-btn-apply" onClick={applyFilters}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              {tx({ en: "Apply Filters", bn: "ফিল্টার প্রয়োগ" })}
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

        {/* STATS */}
        <div className="jx-hub-stats">
          <div className="jx-stat-card">
            <div className="jx-stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <div className="jx-stat-info">
              <h4>{loading ? "—" : total}</h4>
              <p>{tx({ en: "Published Fact Checks", bn: "প্রকাশিত ফ্যাক্ট চেক" })}</p>
            </div>
          </div>
          <div className="jx-stat-card">
            <div className="jx-stat-icon red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div className="jx-stat-info">
              <h4>{loading ? "—" : items.filter(i => i.verdict === "false").length}</h4>
              <p>{tx({ en: "False Claims", bn: "মিথ্যা দাবি" })}</p>
            </div>
          </div>
          <div className="jx-stat-card">
            <div className="jx-stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="jx-stat-info">
              <h4>{loading ? "—" : items.filter(i => i.verdict === "misleading").length}</h4>
              <p>{tx({ en: "Misleading Claims", bn: "বিভ্রান্তিকর দাবি" })}</p>
            </div>
          </div>
          <div className="jx-stat-card">
            <div className="jx-stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div className="jx-stat-info">
              <h4>{loading ? "—" : items.filter(i => i.verdict === "true").length}</h4>
              <p>{tx({ en: "True Claims", bn: "সত্য দাবি" })}</p>
            </div>
          </div>
        </div>

        {/* RESULT COUNT */}
        {!loading && (
          <p className="jx-result-count">
            {total > 0
              ? tx({ en: `Showing ${items.length} of ${total} fact checks`, bn: `${total}টির মধ্যে ${items.length}টি দেখাচ্ছে` })
              : tx({ en: "No published fact checks found.", bn: "কোনো প্রকাশিত ফ্যাক্ট চেক পাওয়া যায়নি।" })
            }
          </p>
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

        {/* FACT CARDS GRID */}
        {loading ? (
          <div className="jx-hub-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="jx-skeleton" style={{ height: 20, width: '60%' }} />
                <div className="jx-skeleton" style={{ height: 16, width: '100%' }} />
                <div className="jx-skeleton" style={{ height: 16, width: '80%' }} />
                <div className="jx-skeleton" style={{ height: 40, width: '100%', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>{tx({ en: "No published fact checks found matching your criteria.", bn: "আপনার মানদণ্ডের সাথে মিলে যাওয়া কোনো প্রকাশিত ফ্যাক্ট চেক পাওয়া যায়নি।" })}</p>
          </div>
        ) : (
          <div className="jx-hub-grid">
            {items.map(item => {
              const color = verdictColor(item.verdict ?? "");
              return (
                <a key={item.id} href={`/facts/${item.slug}`} className="jx-hub-card">
                  <div className="jx-hub-card-top">
                    <span className="jx-hub-card-verdict" style={{ background: color }}>{verdictLabel(item.verdict ?? "unverified")}</span>
                    <span className="jx-hub-card-region">{item.coverage_scope.toUpperCase()}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="jx-hub-card-summary">{item.summary ?? ""}</p>
                  <div className="jx-hub-card-meta">
                    {item.confidence_score != null && (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg> Confidence
                        </span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{Math.round(item.confidence_score * 100)}%</span>
                        <span style={{ display: 'flex', alignItems: 'flex-end', height: '14px' }}><HalfCircleGauge pct={item.confidence_score * 100} color={color} /></span>
                      </>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Published
                    </span>
                    <span style={{ fontWeight: 600, color: '#0f172a', gridColumn: '2 / span 2' }}>
                      {item.published_at ? new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </span>
                  </div>
                  <div className="jx-hub-card-footer">
                    {tx({ en: "View Report", bn: "রিপোর্ট দেখুন" })} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* WHY TRUST US */}
        <div className="jx-trust">
          <div className="jx-trust-title">
            <h3>{tx({ en: "Why Trust Our Fact Checks?", bn: "কেন আমাদের ফ্যাক্ট চেকে বিশ্বাস রাখবেন?" })}</h3>
          </div>
          <div className="jx-trust-grid">
            <div className="jx-trust-item">
              <h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> {tx({ en: "Verified Sources", bn: "যাচাইকৃত সূত্র" })}</h4>
              <p>{tx({ en: "Multiple credible sources cross-checked", bn: "একাধিক বিশ্বাসযোগ্য উৎস ক্রস-চেক করা হয়েছে" })}</p>
            </div>
            <div className="jx-trust-item">
              <h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> {tx({ en: "AI-Assisted Analysis", bn: "AI-সহায়তা বিশ্লেষণ" })}</h4>
              <p>{tx({ en: "Advanced AI tools for pattern and context", bn: "প্যাটার্ন ও প্রসঙ্গের জন্য উন্নত AI সরঞ্জাম" })}</p>
            </div>
            <div className="jx-trust-item">
              <h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {tx({ en: "Human Expert Review", bn: "মানব বিশেষজ্ঞ পর্যালোচনা" })}</h4>
              <p>{tx({ en: "Subject matter experts validate findings", bn: "বিষয় বিশেষজ্ঞরা ফলাফল যাচাই করেন" })}</p>
            </div>
            <div className="jx-trust-item">
              <h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="M9 18l3-3-3-3"/></svg> {tx({ en: "Evidence Archive", bn: "প্রমাণ আর্কাইভ" })}</h4>
              <p>{tx({ en: "All evidence preserved for transparency", bn: "স্বচ্ছতার জন্য সমস্ত প্রমাণ সংরক্ষিত" })}</p>
            </div>
            <div className="jx-trust-item">
              <h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {tx({ en: "Transparent Methodology", bn: "স্বচ্ছ পদ্ধতি" })}</h4>
              <p>{tx({ en: "Clear process and criteria for every verdict", bn: "প্রতিটি রায়ের জন্য স্পষ্ট প্রক্রিয়া ও মানদণ্ড" })}</p>
            </div>
          </div>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="jx-pagination">
            <button
              className="jx-page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &larr; {tx({ en: "Previous", bn: "আগের" })}
            </button>

            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="jx-page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`jx-page-btn ${currentPage === p ? "active" : ""}`}
                  onClick={() => goToPage(p as number)}
                >
                  {p}
                </button>
              )
            )}

            <button
              className="jx-page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {tx({ en: "Next", bn: "পরের" })} &rarr;
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
