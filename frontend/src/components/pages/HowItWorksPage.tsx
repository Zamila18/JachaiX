"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { getPublicFactChecks } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

// ── Scroll-triggered fade-in ──────────────────────────────────────────────────
function useInView(threshold = 0.1): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function Fade({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : "translateY(20px)",
      transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Animated confidence bar ───────────────────────────────────────────────────
function ConfBar({ pct, label, sub, icon }: { pct: number; label: string; sub: string; icon: React.ReactNode }) {
  const [ref, vis] = useInView(0.3);
  return (
    <div ref={ref} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: "#e8f5ee", border: "1px solid #c8e8d4",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{label}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#16a34a" }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, lineHeight: 1.5 }}>{sub}</div>
        <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #16a34a, #22c55e)",
            borderRadius: 99,
            width: vis ? `${pct}%` : "0%",
            transition: "width 1.1s cubic-bezier(0.4, 0, 0.2, 1) 200ms",
          }} />
        </div>
      </div>
    </div>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Ico = {
  Doc: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  Globe: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Search: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Shield: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Brain: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z"/>
    </svg>
  ),
  ShieldCheck: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  Check: ({ s = 14, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Text: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  Image: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Pdf: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Users: ({ s = 22, c = "#16a34a" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  ArrowRight: ({ s = 16, c = "#94a3b8" }: { s?: number; c?: string }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const SOURCES_INTL = [
  { name: "Reuters", dot: "#f97316" }, { name: "AP News", dot: "#dc2626" },
  { name: "BBC News", dot: "#1d4ed8" }, { name: "AFP", dot: "#7c3aed" },
  { name: "WHO", dot: "#0891b2" }, { name: "UN News", dot: "#1e40af" },
];
const SOURCES_BD = [
  { name: "Prothom Alo", dot: "#dc2626" }, { name: "The Daily Star", dot: "#16a34a" },
  { name: "Bdnews24", dot: "#ef4444" }, { name: "Bangla Tribune", dot: "#d97706" },
  { name: "Somoy TV", dot: "#7c3aed" }, { name: "Jugantor", dot: "#0369a1" },
];

// ─────────────────────────────────────────────────────────────────────────────
export function HowItWorksPage() {
  const { tx } = useLanguage();
  const [claimCount, setClaimCount] = useState<string | null>(null);

  useEffect(() => {
    getPublicFactChecks({ perPage: 1 })
      .then(res => {
        const total = res.pagination?.total ?? 0;
        setClaimCount(total >= 1000 ? `${(total / 1000).toFixed(1).replace(/\.0$/, "")}K+` : String(total));
      })
      .catch(() => setClaimCount(null));
  }, []);

  const PROCESS_STEPS = [
    {
      n: "01", icon: Ico.Doc,
      title: tx({ en: "Claim Submitted", bn: "ক্লেম জমা দেওয়া" }),
      desc: tx({ en: "Users submit a claim via text, image, or PDF. Bangla, English, and Banglish are all supported natively.", bn: "ব্যবহারকারীরা টেক্সট, ছবি বা PDF-এর মাধ্যমে ক্লেম জমা দেন। বাংলা, ইংরেজি ও বাংলিশ সবই সমর্থিত।" }),
      tags: [tx({ en: "Bangla text", bn: "বাংলা টেক্সট" }), tx({ en: "English article", bn: "ইংরেজি নিবন্ধ" }), tx({ en: "Screenshot", bn: "স্ক্রিনশট" }), tx({ en: "PDF report", bn: "PDF রিপোর্ট" })],
      tagColor: "#16a34a",
    },
    {
      n: "02", icon: Ico.Globe,
      title: tx({ en: "Language Detection", bn: "ভাষা শনাক্তকরণ" }),
      desc: tx({ en: "JachaiX auto-detects the input language and routes it through the correct NLP pipeline.", bn: "JachaiX স্বয়ংক্রিয়ভাবে ইনপুট ভাষা শনাক্ত করে এবং সঠিক NLP পাইপলাইনে পাঠায়।" }),
      tags: ["বাংলা", "English", "Banglish", tx({ en: "Mixed", bn: "মিশ্র" })],
      tagColor: "#2563eb",
    },
    {
      n: "03", icon: Ico.Search,
      title: tx({ en: "Evidence Retrieval", bn: "প্রমাণ সংগ্রহ" }),
      desc: tx({ en: "Semantic vector search across our knowledge base surfaces the most relevant evidence passages.", bn: "আমাদের জ্ঞানভান্ডার জুড়ে সেম্যান্টিক ভেক্টর অনুসন্ধান সবচেয়ে প্রাসঙ্গিক প্রমাণ খুঁজে বের করে।" }),
      tags: [tx({ en: "Vector search", bn: "ভেক্টর অনুসন্ধান" }), "Qdrant", tx({ en: "Top-k results", bn: "শীর্ষ-k ফলাফল" }), "RAG"],
      tagColor: "#7c3aed",
    },
    {
      n: "04", icon: Ico.Shield,
      title: tx({ en: "Source Verification", bn: "উৎস যাচাই" }),
      desc: tx({ en: "Evidence is filtered and ranked by source credibility, recency, and topical relevance.", bn: "উৎসের বিশ্বাসযোগ্যতা, সাম্প্রতিকতা ও প্রাসঙ্গিকতার ভিত্তিতে প্রমাণ ফিল্টার ও র‍্যাংক করা হয়।" }),
      tags: ["Reuters", "BBC", "WHO", "Daily Star"],
      tagColor: "#0891b2",
    },
    {
      n: "05", icon: Ico.Brain,
      title: tx({ en: "AI Analysis", bn: "AI বিশ্লেষণ" }),
      desc: tx({ en: "Large Language Models compare the claim against retrieved evidence and generate a structured verdict.", bn: "বড় ভাষা মডেল সংগৃহীত প্রমাণের সাথে ক্লেম তুলনা করে একটি কাঠামোবদ্ধ রায় তৈরি করে।" }),
      tags: [tx({ en: "LLM reasoning", bn: "LLM যুক্তি" }), tx({ en: "Contradiction check", bn: "বিরোধ যাচাই" }), tx({ en: "Context match", bn: "প্রসঙ্গ মিলান" }), tx({ en: "Score", bn: "স্কোর" })],
      tagColor: "#c2410c",
    },
    {
      n: "06", icon: Ico.ShieldCheck,
      title: tx({ en: "Final Verdict", bn: "চূড়ান্ত রায়" }),
      desc: tx({ en: "A clear verdict with confidence score is published — or flagged for human review if uncertainty is high.", bn: "আস্থা স্কোরসহ একটি স্পষ্ট রায় প্রকাশিত হয় — বা অনিশ্চয়তা বেশি হলে মানব পর্যালোচনার জন্য পাঠানো হয়।" }),
      tags: [tx({ en: "TRUE", bn: "সত্য" }), tx({ en: "FALSE", bn: "মিথ্যা" }), tx({ en: "MISLEADING", bn: "বিভ্রান্তিকর" }), tx({ en: "UNVERIFIED", bn: "অযাচাইকৃত" })],
      tagColor: "#16a34a",
    },
  ];

  const INPUT_TYPES = [
    {
      icon: Ico.Text, bg: "#eff6ff", iconColor: "#2563eb",
      title: tx({ en: "Text Claims", bn: "টেক্সট দাবি" }),
      desc: tx({ en: "Paste or type any claim directly. Supports Bangla, English, Banglish, and mixed-language input.", bn: "যেকোনো দাবি সরাসরি পেস্ট বা টাইপ করুন। বাংলা, ইংরেজি, বাংলিশ ও মিশ্র ভাষার ইনপুট সমর্থিত।" }),
      checks: [
        tx({ en: "Bangla & English support", bn: "বাংলা ও ইংরেজি সমর্থন" }),
        tx({ en: "Banglish / mixed-language", bn: "বাংলিশ / মিশ্র ভাষা" }),
        tx({ en: "Social media captions", bn: "সোশ্যাল মিডিয়া ক্যাপশন" }),
        tx({ en: "News headlines", bn: "সংবাদ শিরোনাম" }),
      ],
    },
    {
      icon: Ico.Image, bg: "#f0fdf4", iconColor: "#16a34a",
      title: tx({ en: "Image Claims", bn: "ছবির দাবি" }),
      desc: tx({ en: "Upload screenshots or images. OCR extracts text and visual context for analysis.", bn: "স্ক্রিনশট বা ছবি আপলোড করুন। OCR বিশ্লেষণের জন্য টেক্সট ও ভিজ্যুয়াল প্রসঙ্গ বের করে।" }),
      checks: [
        tx({ en: "Facebook screenshot OCR", bn: "ফেসবুক স্ক্রিনশট OCR" }),
        tx({ en: "News image verification", bn: "নিউজ ছবি যাচাই" }),
        tx({ en: "Screenshot context reading", bn: "স্ক্রিনশট প্রসঙ্গ পাঠ" }),
        tx({ en: "Social media posts", bn: "সোশ্যাল মিডিয়া পোস্ট" }),
      ],
    },
    {
      icon: Ico.Pdf, bg: "#fff7ed", iconColor: "#c2410c",
      title: tx({ en: "PDF Reports", bn: "PDF রিপোর্ট" }),
      desc: tx({ en: "Upload PDF documents for deep analysis — full text extraction across multiple pages.", bn: "গভীর বিশ্লেষণের জন্য PDF নথি আপলোড করুন — একাধিক পৃষ্ঠা জুড়ে সম্পূর্ণ টেক্সট বের করা হয়।" }),
      checks: [
        tx({ en: "Multi-page extraction", bn: "বহু-পৃষ্ঠা নিষ্কাশন" }),
        tx({ en: "Document analysis", bn: "নথি বিশ্লেষণ" }),
        tx({ en: "Report verification", bn: "রিপোর্ট যাচাই" }),
        tx({ en: "OCR fallback", bn: "OCR ফলব্যাক" }),
      ],
    },
  ];

  const VERDICTS = [
    {
      label: tx({ en: "TRUE", bn: "সত্য" }), color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
      desc: tx({ en: "Evidence strongly supports the claim. The information is reliable and verified.", bn: "প্রমাণ দৃঢ়ভাবে দাবিটি সমর্থন করে। তথ্যটি নির্ভরযোগ্য ও যাচাইকৃত।" }),
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 3l12 4.7v8.6C30 26.3 18 33 18 33S6 26.3 6 16.3V7.7z" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.8"/>
          <path d="M12 18l4 4 8-9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: tx({ en: "FALSE", bn: "মিথ্যা" }), color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
      desc: tx({ en: "Evidence directly contradicts the claim. The information is incorrect.", bn: "প্রমাণ সরাসরি দাবির বিরোধিতা করে। তথ্যটি ভুল।" }),
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="14" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.8"/>
          <path d="M12 12l12 12M24 12l-12 12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: tx({ en: "MISLEADING", bn: "বিভ্রান্তিকর" }), color: "#c2410c", bg: "#fff7ed", border: "#fed7aa",
      desc: tx({ en: "The claim contains partial truths but omits key context that changes its meaning.", bn: "দাবিতে আংশিক সত্য রয়েছে কিন্তু মূল প্রসঙ্গ বাদ দেওয়া হয়েছে যা অর্থ পরিবর্তন করে।" }),
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 4L33 30H3z" fill="#fff7ed" stroke="#c2410c" strokeWidth="1.8"/>
          <line x1="18" y1="14" x2="18" y2="23" stroke="#c2410c" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="18" cy="27" r="1.5" fill="#c2410c"/>
        </svg>
      ),
    },
    {
      label: tx({ en: "UNVERIFIED", bn: "অযাচাইকৃত" }), color: "#64748b", bg: "#f8fafc", border: "#e2e8f0",
      desc: tx({ en: "Insufficient evidence available. The claim requires more information to assess.", bn: "পর্যাপ্ত প্রমাণ নেই। দাবিটি মূল্যায়ন করতে আরও তথ্য প্রয়োজন।" }),
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="14" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.8"/>
          <text x="18" y="24" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#94a3b8">?</text>
        </svg>
      ),
    },
  ];

  const STATIC_STATS = [
    { value: "95%",     label: tx({ en: "Retrieval Accuracy", bn: "রিট্রিভাল নির্ভুলতা" }) },
    { value: "50+",     label: tx({ en: "Trusted Sources", bn: "বিশ্বস্ত উৎস" }) },
    { value: "< 4 hrs", label: tx({ en: "Avg. Turnaround", bn: "গড় সময়" }) },
  ];

  const pipelineSteps = [
    { n: "01", label: tx({ en: "Claim Intake", bn: "ক্লেম গ্রহণ" }), sub: tx({ en: "Text · Image · PDF", bn: "টেক্সট · ছবি · PDF" }), icon: <Ico.Doc s={15} c="#22c55e" /> },
    { n: "02", label: tx({ en: "Language Detection", bn: "ভাষা শনাক্তকরণ" }), sub: tx({ en: "Bangla · Banglish", bn: "বাংলা · বাংলিশ" }), icon: <Ico.Globe s={15} c="#22c55e" /> },
    { n: "03", label: tx({ en: "Evidence Retrieval", bn: "প্রমাণ সংগ্রহ" }), sub: tx({ en: "Vector · RAG", bn: "ভেক্টর · RAG" }), icon: <Ico.Search s={15} c="#22c55e" /> },
    { n: "04", label: tx({ en: "Source Check", bn: "উৎস যাচাই" }), sub: tx({ en: "50+ publishers", bn: "৫০+ প্রকাশক" }), icon: <Ico.Shield s={15} c="#22c55e" /> },
    { n: "05", label: tx({ en: "AI Analysis", bn: "AI বিশ্লেষণ" }), sub: tx({ en: "LLM reasoning", bn: "LLM যুক্তি" }), icon: <Ico.Brain s={15} c="#22c55e" /> },
    { n: "06", label: tx({ en: "Final Verdict", bn: "চূড়ান্ত রায়" }), sub: tx({ en: "TRUE · FALSE · UNVERIFIED", bn: "সত্য · মিথ্যা · অযাচাইকৃত" }), icon: <Ico.ShieldCheck s={15} c="#ffffff" />, final: true },
  ];

  const humanReviewPoints = [
    tx({ en: "Automatic escalation when AI confidence is low", bn: "AI আস্থা কম হলে স্বয়ংক্রিয় এস্কেলেশন" }),
    tx({ en: "Expert fact-checkers conduct additional research", bn: "বিশেষজ্ঞ ফ্যাক্ট-চেকাররা অতিরিক্ত গবেষণা করেন" }),
    tx({ en: "Human-reviewed verdict replaces AI draft", bn: "মানব-পর্যালোচিত রায় AI খসড়া প্রতিস্থাপন করে" }),
    tx({ en: "Full audit trail published for transparency", bn: "স্বচ্ছতার জন্য সম্পূর্ণ অডিট ট্রেইল প্রকাশিত" }),
  ];

  return (
    <div style={{ background: "#ffffff", color: "#0f172a", minHeight: "100vh" }}>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .hiw-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #16a34a; color: #ffffff;
          padding: 12px 24px; border-radius: 10px;
          font-size: 15px; font-weight: 700;
          text-decoration: none; cursor: pointer; border: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .hiw-btn-primary:hover { background: #15803d; transform: translateY(-1px); }
        .hiw-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #d4e8ff;
          padding: 12px 24px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          text-decoration: none; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.22);
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .hiw-btn-ghost:hover { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.06); color: #ffffff; }
        .hiw-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: #ffffff; color: #0f172a;
          padding: 12px 24px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          text-decoration: none; cursor: pointer;
          border: 1px solid #e2e8f0;
          transition: border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }
        .hiw-btn-outline:hover { border-color: #16a34a; color: #16a34a; transform: translateY(-1px); }
        .hiw-step-card {
          background: #ffffff; border: 1px solid #eef2f7; border-radius: 14px;
          padding: 24px 20px; height: 100%; box-sizing: border-box;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 1px 6px rgba(15,23,42,0.05);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
          cursor: default;
        }
        .hiw-step-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.1); transform: translateY(-3px); border-color: #d1fae5; }
        .hiw-source-chip {
          display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: default;
        }
        .hiw-source-dot {
          width: 54px; height: 54px; border-radius: 12px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, border-color 0.15s;
        }
        .hiw-source-chip:hover .hiw-source-dot { background: #f0fdf4; border-color: #bbf7d0; }
        .hiw-feature-card {
          background: #ffffff; border: 1px solid #eef2f7; border-radius: 14px;
          padding: 28px 24px; height: 100%; box-sizing: border-box;
          display: flex; flex-direction: column; gap: 16px;
          box-shadow: 0 2px 8px rgba(15,23,42,0.05);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .hiw-feature-card:hover { box-shadow: 0 10px 32px rgba(15,23,42,0.1); transform: translateY(-3px); }
        .hiw-verdict-card {
          background: #ffffff; border: 1px solid #eef2f7; border-radius: 14px;
          padding: 22px 20px; height: 100%; box-sizing: border-box;
          display: flex; flex-direction: column; gap: 10px;
          box-shadow: 0 1px 6px rgba(15,23,42,0.05);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .hiw-verdict-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.09); transform: translateY(-2px); }
        .hiw-steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .hiw-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hiw-input-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .hiw-34-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
        .hiw-verdict-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .hiw-sources-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        @media (max-width: 1024px) {
          .hiw-hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hiw-34-grid { grid-template-columns: 1fr !important; }
          .hiw-sources-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
        @media (max-width: 900px) {
          .hiw-steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hiw-input-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .hiw-steps-grid { grid-template-columns: 1fr !important; }
          .hiw-verdict-grid { grid-template-columns: 1fr !important; }
        }
        .hiw-pipeline { display: flex; flex-direction: row; gap: 0; overflow-x: auto; }
        .hiw-pipeline-step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; position: relative; }
        .hiw-pipeline-connector { position: absolute; top: 19px; left: 50%; right: -50%; height: 2px; background: linear-gradient(90deg, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.1) 100%); z-index: 0; }
        @media (max-width: 640px) {
          .hiw-pipeline { flex-direction: column; align-items: flex-start; gap: 0; }
          .hiw-pipeline-step { flex-direction: row; align-items: flex-start; flex: none; width: 100%; }
          .hiw-pipeline-connector { display: none; }
        }
        .hiw-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
        .hiw-stat-item { border-right: 1px solid #e8eef5; }
        .hiw-stat-item:last-child { border-right: none; }
        @media (max-width: 768px) {
          .hiw-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hiw-stat-item { border-right: none !important; border-bottom: 1px solid #e8eef5; }
          .hiw-stat-item:nth-child(odd) { border-right: 1px solid #e8eef5 !important; }
        }
        @media (max-width: 420px) {
          .hiw-stats-grid { grid-template-columns: 1fr !important; }
          .hiw-stat-item { border-right: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: "#0a1628",
        backgroundImage: `
          radial-gradient(ellipse 55% 85% at 95% 50%, rgba(5, 35, 18, 0.92) 0%, transparent 65%),
          radial-gradient(circle, rgba(255,255,255,0.038) 1px, transparent 1px)
        `,
        backgroundSize: "auto, 26px 26px",
        padding: "clamp(3rem, 6vw, 5rem) 0 clamp(2.5rem, 5vw, 4rem)",
        color: "#ffffff",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(1.25rem, 4vw, 2rem)" }}>
          <div className="hiw-hero-grid">
            <Fade>
              <h1 style={{
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)", fontWeight: 800,
                lineHeight: 1.1, letterSpacing: "-0.025em",
                margin: "0 0 20px", color: "#ffffff",
              }}>
                {tx({ en: "How Jachai", bn: "Jachai" })}<span style={{ color: "#22c55e" }}>X</span>{tx({ en: "", bn: " কীভাবে" })}<br />
                <span style={{ color: "#22c55e" }}>{tx({ en: "Verifies Information", bn: "তথ্য যাচাই করে" })}</span>
              </h1>
              <p style={{
                fontSize: "clamp(0.95rem, 1.4vw, 1.08rem)", color: "#9fb9d4",
                lineHeight: 1.75, margin: "0 0 32px", maxWidth: "46ch",
              }}>
                {tx({
                  en: "JachaiX combines Artificial Intelligence, Retrieval-Augmented Generation, trusted news sources, and human review workflows to analyze claims and deliver transparent, evidence-backed verdicts.",
                  bn: "JachaiX কৃত্রিম বুদ্ধিমত্তা, Retrieval-Augmented Generation, বিশ্বস্ত সংবাদ উৎস এবং মানব পর্যালোচনা ওয়ার্কফ্লো একত্রিত করে দাবি বিশ্লেষণ করে এবং স্বচ্ছ, প্রমাণ-সমর্থিত রায় দেয়।",
                })}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href="/scan" className="hiw-btn-primary">
                  <Ico.ShieldCheck s={17} c="#ffffff" /> {tx({ en: "Verify a Claim", bn: "একটি দাবি যাচাই করুন" })}
                </Link>
                <Link href="/facts" className="hiw-btn-ghost">
                  {tx({ en: "Browse Fact Checks", bn: "ফ্যাক্ট চেক দেখুন" })} <Ico.ArrowRight s={15} c="#d4e8ff" />
                </Link>
              </div>
            </Fade>

            <Fade delay={100}>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 20, padding: "28px 24px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
                  {tx({ en: "Verification Pipeline", bn: "যাচাই পাইপলাইন" })}
                </div>
                <div className="hiw-pipeline" style={{ padding: "6px 8px" }}>
                  {pipelineSteps.map((step, i, arr) => (
                    <div key={step.n} className="hiw-pipeline-step">
                      {i < arr.length - 1 && <div className="hiw-pipeline-connector" />}
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0, position: "relative", zIndex: 1,
                        background: step.final ? "#16a34a" : "#0d1e30",
                        border: step.final ? "2px solid #22c55e" : "1.5px solid rgba(34,197,94,0.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: step.final ? "0 0 0 5px rgba(22,163,74,0.25), 0 0 12px rgba(22,163,74,0.3)" : "none",
                        marginBottom: 10,
                      }}>
                        {step.icon}
                      </div>
                      <div style={{ textAlign: "center", padding: "0 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: step.final ? "#4ade80" : "#e2f0ff", lineHeight: 1.3 }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{step.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(1.25rem, 4vw, 2rem)" }}>
        <div className="hiw-stats-grid" style={{
          background: "#ffffff", border: "1px solid #e8eef5",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 4px 18px rgba(15,23,42,0.06)",
          margin: "clamp(1.5rem, 3vw, 2.5rem) 0",
        }}>
          <div className="hiw-stat-item" style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "clamp(1rem, 2vw, 1.4rem) clamp(0.85rem, 2vw, 1.5rem)",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#e8f5ee", border: "1px solid #c8e8d4",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Ico.ShieldCheck s={20} c="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.15, minWidth: 60 }}>
                {claimCount === null ? (
                  <span style={{
                    display: "inline-block", width: 56, height: 22, borderRadius: 6,
                    background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite",
                  }} />
                ) : claimCount}
              </div>
              <div style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.88rem)", color: "#64748b", marginTop: 1 }}>
                {tx({ en: "Claims Analyzed", bn: "ক্লেম বিশ্লেষিত" })}
              </div>
            </div>
          </div>
          {STATIC_STATS.map((s) => (
            <div key={s.label} className="hiw-stat-item" style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "clamp(1rem, 2vw, 1.4rem) clamp(0.85rem, 2vw, 1.5rem)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#e8f5ee", border: "1px solid #c8e8d4",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Ico.ShieldCheck s={20} c="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.15 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.88rem)", color: "#64748b", marginTop: 1 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(1.25rem, 4vw, 2rem) 5rem" }}>

        {/* ── Section 1: Process Steps ── */}
        <section style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <Fade>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                {tx({ en: "Process", bn: "প্রক্রিয়া" })}
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                {tx({ en: "Our 6-step verification workflow", bn: "আমাদের ৬-ধাপের যাচাই ওয়ার্কফ্লো" })}
              </h2>
              <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: "0.97rem", lineHeight: 1.7, maxWidth: "60ch" }}>
                {tx({
                  en: "Every claim goes through the same rigorous pipeline — AI-powered retrieval and analysis, with human oversight for uncertain cases.",
                  bn: "প্রতিটি দাবি একই কঠোর পাইপলাইনের মধ্য দিয়ে যায় — AI-চালিত রিট্রিভাল ও বিশ্লেষণ, অনিশ্চিত ক্ষেত্রে মানব তদারকিসহ।",
                })}
              </p>
            </div>
          </Fade>

          <div className="hiw-steps-grid">
            {PROCESS_STEPS.map((step, i) => (
              <Fade key={step.n} delay={i * 60}>
                <div className="hiw-step-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#e8f5ee", border: "1px solid #c8e8d4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: "#16a34a",
                    }}>{step.n}</div>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "#f8fafc", border: "1px solid #e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <step.icon s={20} c="#16a34a" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 6 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{step.desc}</div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
                    {step.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 8px",
                        borderRadius: 6, background: "#f8fafc",
                        border: "1px solid #e2e8f0", color: "#475569",
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ── Section 2: Input Types ── */}
        <section style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <Fade>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                {tx({ en: "Input Types", bn: "ইনপুট ধরন" })}
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                {tx({ en: "Analyze claims from any format", bn: "যেকোনো ফরম্যাট থেকে দাবি বিশ্লেষণ করুন" })}
              </h2>
            </div>
          </Fade>

          <div className="hiw-input-grid">
            {INPUT_TYPES.map((card, i) => (
              <Fade key={card.title} delay={i * 80}>
                <div className="hiw-feature-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 12,
                      background: card.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <card.icon s={24} c={card.iconColor} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{card.title}</div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#64748b", lineHeight: 1.7 }}>{card.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {card.checks.map(c => (
                      <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#475569" }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "#e8f5ee", border: "1px solid #c8e8d4",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Ico.Check s={11} c="#16a34a" />
                        </div>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ── Section 3 + 4: Verdicts + Confidence ── */}
        <section style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <div className="hiw-34-grid">

            <div>
              <Fade>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                    {tx({ en: "Verdicts", bn: "রায়সমূহ" })}
                  </div>
                  <h2 style={{ fontSize: "clamp(1.3rem, 2vw, 1.75rem)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                    {tx({ en: "Understanding the results", bn: "ফলাফল বোঝা" })}
                  </h2>
                </div>
              </Fade>
              <div className="hiw-verdict-grid">
                {VERDICTS.map((v, i) => (
                  <Fade key={v.label} delay={i * 55}>
                    <div className="hiw-verdict-card">
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: v.bg, border: `1px solid ${v.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {v.icon}
                      </div>
                      <div style={{
                        display: "inline-block",
                        fontSize: 11, fontWeight: 800,
                        color: v.color, letterSpacing: "0.06em",
                        background: v.bg, border: `1px solid ${v.border}`,
                        borderRadius: 6, padding: "3px 10px",
                      }}>{v.label}</div>
                      <p style={{ margin: 0, fontSize: 12.5, color: "#64748b", lineHeight: 1.65 }}>{v.desc}</p>
                    </div>
                  </Fade>
                ))}
              </div>
            </div>

            <div>
              <Fade>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                    {tx({ en: "Trust Score", bn: "আস্থা স্কোর" })}
                  </div>
                  <h2 style={{ fontSize: "clamp(1.3rem, 2vw, 1.75rem)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                    {tx({ en: "How confidence is calculated", bn: "আস্থা কীভাবে হিসাব করা হয়" })}
                  </h2>
                </div>
              </Fade>
              <Fade delay={60}>
                <div style={{
                  background: "#ffffff", border: "1px solid #eef2f7",
                  borderRadius: 14, padding: "28px 24px",
                  boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
                }}>
                  <ConfBar pct={93} label={tx({ en: "Evidence Quality", bn: "প্রমাণের মান" })} sub={tx({ en: "Relevance, coverage, and consistency of retrieved evidence.", bn: "সংগৃহীত প্রমাণের প্রাসঙ্গিকতা, কভারেজ ও সামঞ্জস্যতা।" })} icon={<Ico.Shield s={18} c="#16a34a" />} />
                  <ConfBar pct={94} label={tx({ en: "Source Credibility", bn: "উৎসের বিশ্বাসযোগ্যতা" })} sub={tx({ en: "Publisher reputation, fact-check history, and reliability tier.", bn: "প্রকাশকের সুনাম, ফ্যাক্ট-চেক ইতিহাস ও নির্ভরযোগ্যতার স্তর।" })} icon={<Ico.Search s={18} c="#16a34a" />} />
                  <ConfBar pct={89} label={tx({ en: "AI Confidence", bn: "AI আস্থা" })} sub={tx({ en: "Model certainty, evidence agreement, and contradiction level.", bn: "মডেলের নিশ্চয়তা, প্রমাণের সম্মতি ও বিরোধের মাত্রা।" })} icon={<Ico.Brain s={18} c="#16a34a" />} />

                  <div style={{
                    marginTop: 4,
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: 12, padding: "18px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{tx({ en: "Final Trust Score", bn: "চূড়ান্ত আস্থা স্কোর" })}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{tx({ en: "Composite of all signals", bn: "সকল সংকেতের সমন্বয়" })}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 32, color: "#16a34a", lineHeight: 1 }}>92%</span>
                      <span style={{
                        background: "#dcfce7", color: "#15803d",
                        padding: "4px 12px", borderRadius: 8,
                        fontSize: 12, fontWeight: 700,
                      }}>{tx({ en: "Trustworthy", bn: "বিশ্বাসযোগ্য" })}</span>
                    </div>
                  </div>
                </div>
              </Fade>
            </div>
          </div>
        </section>

        {/* ── Section 5: Knowledge Sources ── */}
        <section style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <Fade>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                {tx({ en: "Knowledge Base", bn: "জ্ঞানভান্ডার" })}
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                {tx({ en: "50+ trusted sources, continuously monitored", bn: "৫০+ বিশ্বস্ত উৎস, ক্রমাগত পর্যবেক্ষণ করা হচ্ছে" })}
              </h2>
            </div>
          </Fade>
          <Fade delay={60}>
            <div style={{
              background: "#ffffff", border: "1px solid #eef2f7",
              borderRadius: 16, padding: "32px 28px",
              boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
            }}>
              <div className="hiw-sources-grid">
                {[
                  { label: tx({ en: "International Sources", bn: "আন্তর্জাতিক উৎস" }), sources: SOURCES_INTL },
                  { label: tx({ en: "Bangladeshi Sources", bn: "বাংলাদেশী উৎস" }), sources: SOURCES_BD },
                ].map(({ label, sources }) => (
                  <div key={label}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20,
                    }}>{label}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      {sources.map(s => (
                        <div key={s.name} className="hiw-source-chip">
                          <div className="hiw-source-dot">
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%", background: s.dot,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>
                                {s.name[0]}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>
                            {s.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 28, paddingTop: 22,
                borderTop: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, color: "#64748b",
              }}>
                <Ico.ShieldCheck s={16} c="#16a34a" />
                {tx({ en: "Sources are continuously monitored and updated to ensure accuracy and reliability.", bn: "নির্ভুলতা ও নির্ভরযোগ্যতা নিশ্চিত করতে উৎসগুলো ক্রমাগত পর্যবেক্ষণ ও আপডেট করা হয়।" })}
              </div>
            </div>
          </Fade>
        </section>

        {/* ── Section 6: Human Review ── */}
        <section style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <Fade>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                {tx({ en: "Human Oversight", bn: "মানব তদারকি" })}
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                {tx({ en: "Expert review for uncertain cases", bn: "অনিশ্চিত ক্ষেত্রে বিশেষজ্ঞ পর্যালোচনা" })}
              </h2>
            </div>
          </Fade>
          <Fade delay={60}>
            <div style={{
              background: "#ffffff", border: "1px solid #eef2f7",
              borderRadius: 16, padding: "clamp(24px, 4vw, 40px)",
              boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, margin: "0 0 24px" }}>
                    {tx({
                      en: "When AI confidence falls below our internal threshold, the claim is automatically escalated to a human fact-checker. Expert reviewers conduct additional research and publish a final, human-verified verdict.",
                      bn: "যখন AI আস্থা আমাদের অভ্যন্তরীণ সীমার নিচে নামে, দাবিটি স্বয়ংক্রিয়ভাবে একজন মানব ফ্যাক্ট-চেকারের কাছে এস্কেলেট করা হয়। বিশেষজ্ঞ পর্যালোচকরা অতিরিক্ত গবেষণা করেন এবং চূড়ান্ত, মানব-যাচাইকৃত রায় প্রকাশ করেন।",
                    })}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {humanReviewPoints.map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "#0f172a" }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                          background: "#e8f5ee", border: "1px solid #c8e8d4",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Ico.Check s={12} c="#16a34a" />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: "50%",
                    background: "#e8f5ee", border: "3px solid #c8e8d4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Ico.Users s={48} c="#16a34a" />
                  </div>
                  <div style={{
                    background: "#16a34a", color: "#ffffff",
                    padding: "10px 18px", borderRadius: 10,
                    fontSize: 12, fontWeight: 700, textAlign: "center", lineHeight: 1.5,
                  }}>
                    {tx({ en: "Human Verified", bn: "মানব যাচাইকৃত" })}<br />
                    {tx({ en: "When Needed", bn: "প্রয়োজনে" })}
                  </div>
                </div>
              </div>
            </div>
          </Fade>
        </section>

        {/* ── CTA ── */}
        <Fade>
          <section style={{
            background: "#f1f8f4", border: "1px solid #d7e7dd",
            borderRadius: 14, padding: "20px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 20, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: "#e8f5ee", border: "1px solid #c8e8d4",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Ico.ShieldCheck s={20} c="#16a34a" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{tx({ en: "Ready to verify a claim?", bn: "একটি দাবি যাচাই করতে প্রস্তুত?" })}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{tx({ en: "AI-powered fact-checking, backed by 50+ trusted sources.", bn: "AI-চালিত ফ্যাক্ট-চেকিং, ৫০+ বিশ্বস্ত উৎস দ্বারা সমর্থিত।" })}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/scan" className="hiw-btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>
                <Ico.ShieldCheck s={15} c="#ffffff" /> {tx({ en: "Verify a Claim", bn: "দাবি যাচাই করুন" })}
              </Link>
              <Link href="/facts" className="hiw-btn-outline" style={{ padding: "9px 20px", fontSize: 14 }}>
                {tx({ en: "Browse Fact Checks", bn: "ফ্যাক্ট চেক দেখুন" })}
              </Link>
            </div>
          </section>
        </Fade>

      </div>
    </div>
  );
}
