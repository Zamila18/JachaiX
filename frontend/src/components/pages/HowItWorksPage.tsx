"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Scroll-triggered fade-in ──────────────────────────────────────────────────
function useInView(threshold = 0.12): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null!);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } }, { threshold });
    o.observe(el);
    return () => o.disconnect();
  }, [threshold]);
  return [ref, vis];
}
function Fade({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(18px)", transition: `opacity .5s ease ${delay}ms,transform .5s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

// ── Animated progress bar ─────────────────────────────────────────────────────
function Bar({ pct, icon, label, sub }: { pct: number; icon: React.ReactNode; label: string; sub: string }) {
  const [ref, vis] = useInView(0.3);
  return (
    <div ref={ref} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 22 }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{label}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#16a34a" }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{sub}</div>
        <div style={{ height: 7, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#16a34a,#22c55e)", borderRadius: 99, width: vis ? `${pct}%` : 0, transition: "width 1s cubic-bezier(.4,0,.2,1) 150ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const IcoDoc = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);
const IcoGlobe = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IcoSearch = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoShield = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoBrain = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z"/>
  </svg>
);
const IcoShieldCheck = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
  </svg>
);
const IcoCheck = ({ s = 14, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoText = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);
const IcoImage = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IcoFilePdf = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoUsers = ({ s = 24, c = "#16a34a" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── Verdict icon shapes ───────────────────────────────────────────────────────
const VerdictTRUE = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M20 4l14 5.5v10C34 30 20 37 20 37S6 30 6 19.5V9.5z" fill="#dcfce7" stroke="#16a34a" strokeWidth="2"/>
    <path d="M14 20l4.5 4.5 8-9" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const VerdictFALSE = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="16" fill="#fee2e2" stroke="#dc2626" strokeWidth="2"/>
    <path d="M14 14l12 12M26 14l-12 12" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);
const VerdictMISLEADING = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M20 5L36 33H4z" fill="#fff7ed" stroke="#c2410c" strokeWidth="2"/>
    <line x1="20" y1="16" x2="20" y2="26" stroke="#c2410c" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="20" cy="30" r="1.5" fill="#c2410c"/>
  </svg>
);
const VerdictUNVERIFIED = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="16" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2"/>
    <text x="20" y="27" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#94a3b8">?</text>
  </svg>
);

// ── Card with hover ───────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, boxShadow: h ? "0 8px 28px rgba(0,0,0,.09)" : "0 1px 4px rgba(0,0,0,.05)", transition: "box-shadow .2s,transform .2s", transform: h ? "translateY(-2px)" : "none", ...style }}>
      {children}
    </div>
  );
}

// ── Hero flow diagram ─────────────────────────────────────────────────────────
const FLOW = [
  { label: "Claim",              icon: <IcoDoc s={26} c="#16a34a" /> },
  { label: "AI Analysis",        icon: <IcoBrain s={26} c="#16a34a" /> },
  { label: "Evidence\nRetrieval",icon: <IcoSearch s={26} c="#16a34a" /> },
  { label: "Verification",       icon: <IcoShield s={26} c="#16a34a" /> },
  { label: "Verdict",            icon: <IcoShieldCheck s={28} c="#fff" />, final: true },
];

function FlowDiagram() {
  return (
    <div style={{ position: "relative", padding: "32px 16px 8px" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,#d1fae5 1px,transparent 1px)", backgroundSize: "22px 22px", borderRadius: 20, opacity: 0.7 }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {FLOW.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{
                width: s.final ? 74 : 62, height: s.final ? 74 : 62, borderRadius: "50%",
                background: s.final ? "#16a34a" : "#fff",
                border: s.final ? "none" : "2px solid #d1fae5",
                boxShadow: s.final ? "0 0 0 8px rgba(22,163,74,.14),0 4px 18px rgba(22,163,74,.3)" : "0 2px 8px rgba(0,0,0,.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{s.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.final ? "#16a34a" : "#475569", textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.3 }}>{s.label}</span>
            </div>
            {i < FLOW.length - 1 && (
              <div style={{ width: 32, height: 2, borderTop: "2.5px dashed #86efac", margin: "0 2px", marginBottom: 22, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Source logo chip ──────────────────────────────────────────────────────────
function SourceLogo({ name, dot }: { name: string; dot?: string }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "default" }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: h ? "#f0fdf4" : "#f8fafc",
        border: `1px solid ${h ? "#bbf7d0" : "#e5e7eb"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .15s",
      }}>
        {dot ? (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: dot, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>{name[0]}</span>
          </div>
        ) : (
          <span style={{ fontSize: 9, fontWeight: 700, color: h ? "#16a34a" : "#64748b", textAlign: "center", lineHeight: 1.2 }}>{name.substring(0, 3).toUpperCase()}</span>
        )}
      </div>
      <span style={{ fontSize: 10, color: "#64748b", fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>{name}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function HowItWorksPage() {
  return (
    <div style={{ background: "#fff", fontFamily: "'Inter','IBM Plex Sans',sans-serif", color: "#0f172a", minHeight: "100vh" }}>
      <style>{`
        .hiw-btn-green{display:inline-flex;align-items:center;gap:8px;background:#16a34a;color:#fff;border:2px solid #16a34a;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:background .15s,transform .15s}
        .hiw-btn-green:hover{background:#15803d;transform:translateY(-1px)}
        .hiw-btn-outline{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0f172a;border:2px solid #e5e7eb;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .15s}
        .hiw-btn-outline:hover{border-color:#16a34a;color:#16a34a;transform:translateY(-1px)}
        .hiw-step-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 14px;margin:0 5px;transition:transform .2s,box-shadow .2s;box-shadow:0 1px 4px rgba(0,0,0,.04);height:100%;display:flex;flex-direction:column;box-sizing:border-box}
        .hiw-step-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.09)}
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>

        {/* Breadcrumb */}
        <nav style={{ padding: "16px 0 0", fontSize: 13, color: "#94a3b8", display: "flex", gap: 6, alignItems: "center" }}>
          <Link href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>Home</Link>
          <span>›</span>
          <span style={{ color: "#0f172a", fontWeight: 500 }}>About</span>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", padding: "40px 0 56px" }}>
          <Fade>
            <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.12, margin: "0 0 18px" }}>
              How JachaiX<br />
              <span style={{ color: "#16a34a" }}>Verifies Information</span>
            </h1>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, margin: "0 0 32px", maxWidth: 430 }}>
              JachaiX combines Artificial Intelligence, Retrieval-Augmented Generation (RAG), trusted news sources, and human review workflows to analyze claims and provide transparent fact-checking results.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/scan" className="hiw-btn-green">
                <IcoShieldCheck s={16} c="#fff" /> Verify a Claim
              </Link>
              <Link href="/facts" className="hiw-btn-outline">
                <IcoFilePdf s={16} c="#0f172a" /> Browse Fact Checks
              </Link>
            </div>
          </Fade>
          <Fade delay={100}>
            <div style={{ background: "#f8fafc", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", padding: "8px 0 24px" }}>
              <FlowDiagram />
            </div>
          </Fade>
        </section>

        {/* ── 1. Our Verification Process ─────────────────────────────── */}
        <section style={{ paddingBottom: 60 }}>
          <Fade><h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 24px" }}>1. Our Verification Process</h2></Fade>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 0, position: "relative", alignItems: "stretch" }}>
            {[
              {
                n: 1, icon: <IcoDoc s={28} />, title: "Claim Submitted",
                desc: "Users submit a claim through text, image, or PDF.",
                extra: (
                  <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", fontSize: 12, color: "#64748b", display: "flex", flexDirection: "column", gap: 4 }}>
                    {["Bangla text","English article","Facebook screenshot","PDF report"].map(t => (
                      <li key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>•</span> {t}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                n: 2, icon: <IcoGlobe s={28} />, title: "Language Detection",
                desc: "JachaiX automatically detects:",
                extra: (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                    {[["বাংলা (Bangla)","#f0fdf4","#16a34a"],["English","#eff6ff","#2563eb"],["Banglish","#fff7ed","#c2410c"],["Mixed-language","#f5f3ff","#6d28d9"]].map(([l,bg,c]) => (
                      <span key={l} style={{ background: bg as string, color: c as string, border: `1px solid ${c}30`, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{l}</span>
                    ))}
                  </div>
                ),
              },
              {
                n: 3, icon: <IcoSearch s={28} />, title: "Evidence Retrieval",
                desc: "The platform searches its knowledge base using semantic search powered by vector embeddings.",
                extra: (
                  <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, lineHeight: 1.8 }}>
                    {[["Knowledge Base","#e0f2fe","#0369a1"],["↓","",""],["Qdrant Vector Search","#f0fdf4","#16a34a"],["↓","",""],["Top Evidence Results","#dcfce7","#16a34a"]].map(([t,bg,c],i) => (
                      <div key={i}>
                        {bg ? (
                          <span style={{ display: "inline-block", background: bg as string, color: c as string, padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{t}</span>
                        ) : (
                          <div style={{ color: "#16a34a", fontSize: 14, lineHeight: 1 }}>{t}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: 4, icon: <IcoShield s={28} />, title: "Source Verification",
                desc: "Evidence is filtered and ranked using source credibility, recency, and relevance.",
                extra: (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                    {[
                      { name: "Reuters", color: "#f97316" },
                      { name: "BBC", color: "#1d4ed8" },
                      { name: "WHO", color: "#0891b2" },
                      { name: "UN News", color: "#1e40af" },
                      { name: "Prothom Alo", color: "#dc2626" },
                      { name: "The Daily Star", color: "#16a34a" },
                    ].map(s => (
                      <span key={s.name} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", padding: "3px 7px", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />{s.name}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                n: 5, icon: <IcoBrain s={28} />, title: "AI Analysis",
                desc: "Large Language Models compare the submitted claim against retrieved evidence.",
                extra: (
                  <div style={{ marginTop: 10, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px", fontSize: 12, textAlign: "center" }}>
                    {[["Claim","#0f172a"],["+"  ,"#16a34a"],["Evidence","#0f172a"],["=","#16a34a"],["AI Verdict","#16a34a"]].map(([t,c],i) => (
                      <div key={i} style={{ color: c as string, fontWeight: t === "AI Verdict" ? 700 : 500, padding: "1px 0" }}>{t}</div>
                    ))}
                  </div>
                ),
              },
              {
                n: 6, icon: <IcoShieldCheck s={28} />, title: "Final Verdict",
                desc: "Users receive a clear verdict with confidence score and trust score.",
                extra: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
                    {[["TRUE","#f0fdf4","#16a34a"],["FALSE","#fee2e2","#dc2626"],["MISLEADING","#fff7ed","#c2410c"],["UNVERIFIED","#f1f5f9","#64748b"]].map(([v,bg,c]) => (
                      <span key={v} style={{ background: bg as string, color: c as string, border: `1px solid ${c}40`, padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, display: "inline-block" }}>{v}</span>
                    ))}
                  </div>
                ),
              },
            ].map((step, i) => (
              <Fade key={i} delay={i * 50}>
                <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
                  {i < 5 && (
                    <div style={{ position: "absolute", right: -10, top: 34, zIndex: 3 }}>
                      <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                        <path d="M2 7 Q10 7 18 7" stroke="#86efac" strokeWidth="2" strokeDasharray="3 3"/>
                        <path d="M14 3l4 4-4 4" stroke="#86efac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="hiw-step-card">
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{step.n}</div>
                    <div style={{ color: "#16a34a", marginBottom: 8 }}>{step.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 5 }}>{step.title}</div>
                    <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.6 }}>{step.desc}</div>
                    {step.extra}
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ── 2. Analyze Information From Multiple Sources ─────────────── */}
        <section style={{ paddingBottom: 60 }}>
          <Fade><h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 24px" }}>2. Analyze Information From Multiple Sources</h2></Fade>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "stretch" }}>
            {[
              {
                icon: <IcoText s={26} />, title: "Text Claims", iconBg: "#eff6ff",
                checks: ["Paste or type any claim","Bangla support","English support","Banglish support","Mixed-language support"],
                preview: (
                  <div style={{ height: 80, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, opacity: 0.8 }}>
                    <div style={{ width: 90, height: 6, background: "#d1fae5", borderRadius: 3 }} />
                    <div style={{ width: 70, height: 6, background: "#e5e7eb", borderRadius: 3 }} />
                    <div style={{ width: 60, height: 6, background: "#e5e7eb", borderRadius: 3 }} />
                  </div>
                ),
              },
              {
                icon: <IcoImage s={26} />, title: "Image Claims", iconBg: "#f0fdf4",
                checks: ["OCR text extraction","Screenshot analysis","News image verification","Social media posts"],
                preview: (
                  <div style={{ height: 80, background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
                    <IcoImage s={36} c="#86efac" />
                  </div>
                ),
              },
              {
                icon: <IcoFilePdf s={26} />, title: "PDF Claims", iconBg: "#fff7ed",
                checks: ["Report verification","Document analysis","OCR fallback","Multi-page support"],
                preview: (
                  <div style={{ height: 80, background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
                    <IcoFilePdf s={36} c="#fdba74" />
                  </div>
                ),
              },
            ].map((card, i) => (
              <Fade key={i} delay={i * 80} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Card style={{ padding: "22px", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>{card.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{card.title}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {card.checks.map(c => (
                      <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                        <IcoCheck s={14} c="#16a34a" /> {c}
                      </div>
                    ))}
                  </div>
                  {card.preview}
                </Card>
              </Fade>
            ))}
          </div>
        </section>

        {/* ── 3 + 4 side by side ──────────────────────────────────────── */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, paddingBottom: 60, alignItems: "stretch" }}>

          {/* 3. Understanding Verdicts */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Fade><h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>3. Understanding Verdicts</h2></Fade>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, alignItems: "stretch" }}>
              {[
                { label: "TRUE",       color: "#16a34a", border: "#bbf7d0", icon: <VerdictTRUE />,       desc: "Evidence strongly supports the claim. Reliable and verified information." },
                { label: "FALSE",      color: "#dc2626", border: "#fecaca", icon: <VerdictFALSE />,      desc: "Evidence directly contradicts the claim. The claim is incorrect or false." },
                { label: "MISLEADING", color: "#c2410c", border: "#fed7aa", icon: <VerdictMISLEADING />, desc: "The claim contains partial truths but lacks context. Can mislead or create a wrong impression." },
                { label: "UNVERIFIED", color: "#64748b", border: "#e2e8f0", icon: <VerdictUNVERIFIED />, desc: "Insufficient evidence available to verify the claim. More information is needed." },
              ].map((v, i) => (
                <Fade key={v.label} delay={i * 60} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <Card style={{ padding: "18px 16px", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                    <div style={{ marginBottom: 10 }}>{v.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: v.color, marginBottom: 8 }}>{v.label}</div>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>{v.desc}</div>
                  </Card>
                </Fade>
              ))}
            </div>
          </div>

          {/* 4. How Confidence Is Calculated */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Fade><h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>4. How Confidence Is Calculated</h2></Fade>
            <Fade delay={80}>
              <Card style={{ padding: "24px" }}>
                <Bar pct={93} label="Evidence Quality"   sub="Measures relevance, coverage, and consistency of evidence." icon={<IcoShield s={18} c="#16a34a" />} />
                <Bar pct={94} label="Source Credibility" sub="Measures publisher reputation, fact-check history, and reliability tier." icon={<IcoSearch s={18} c="#16a34a" />} />
                <Bar pct={89} label="AI Confidence"      sub="Measures model certainty, evidence agreement, and contradiction level." icon={<IcoBrain s={18} c="#16a34a" />} />
                <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Final Trust Score</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 26, color: "#16a34a" }}>92%</span>
                    <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>Trustworthy</span>
                  </div>
                </div>
              </Card>
            </Fade>
          </div>
        </section>

        {/* ── 5. Knowledge Sources ─────────────────────────────────────── */}
        <section style={{ paddingBottom: 60 }}>
          <Fade><h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>5. Knowledge Sources</h2></Fade>
          <Fade delay={60}>
            <Card style={{ padding: "28px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, borderBottom: "1px solid #f1f5f9", paddingBottom: 28, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 18, textAlign: "center" }}>International Sources</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, justifyItems: "center" }}>
                    {[
                      { name: "Reuters",  dot: "#f97316" },
                      { name: "AP News",  dot: "#dc2626" },
                      { name: "BBC News", dot: "#1d4ed8" },
                      { name: "AFP",      dot: "#7c3aed" },
                      { name: "WHO",      dot: "#0891b2" },
                      { name: "UN News",  dot: "#1e40af" },
                    ].map(s => <SourceLogo key={s.name} name={s.name} dot={s.dot} />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 18, textAlign: "center" }}>Bangladeshi Sources</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, justifyItems: "center" }}>
                    {[
                      { name: "Prothom Alo",    dot: "#dc2626" },
                      { name: "The Daily Star", dot: "#16a34a" },
                      { name: "Bdnews24",       dot: "#ef4444" },
                      { name: "Bangla Tribune", dot: "#d97706" },
                      { name: "Somoy TV",       dot: "#7c3aed" },
                      { name: "Jugantor",       dot: "#0369a1" },
                    ].map(s => <SourceLogo key={s.name} name={s.name} dot={s.dot} />)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                <IcoShieldCheck s={16} c="#16a34a" />
                Sources are continuously monitored and updated to ensure accuracy and reliability.
              </div>
            </Card>
          </Fade>
        </section>

        {/* ── 6. Human Review ──────────────────────────────────────────── */}
        <section style={{ paddingBottom: 72 }}>
          <Fade><h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>6. Human Review (For Uncertain Cases)</h2></Fade>
          <Fade delay={60}>
            <Card style={{ padding: "32px 36px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, margin: "0 0 22px" }}>
                    When the system is uncertain or the verdict confidence is low, the claim is sent to expert reviewers.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {["Expert fact-checkers review the evidence","Additional research and verification","Final human-reviewed verdict","Published for transparency"].map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0f172a" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IcoCheck s={13} />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#eff6ff", border: "3px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IcoUsers s={46} c="#3b82f6" />
                  </div>
                  <div style={{ background: "#16a34a", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: "center", lineHeight: 1.5 }}>
                    Human Verified<br />When Needed
                  </div>
                </div>
              </div>
            </Card>
          </Fade>
        </section>
      </div>

      {/* ── CTA FOOTER ───────────────────────────────────────────────────────── */}
      <div style={{ background: "#f0fdf4", borderTop: "1px solid #bbf7d0", padding: "22px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IcoShieldCheck s={20} c="#16a34a" />
            </div>
            <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>
              JachaiX is committed to fighting misinformation with technology, transparency, and trust.
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/scan" className="hiw-btn-green">Verify a Claim</Link>
            <Link href="/facts" className="hiw-btn-outline">Browse Fact Checks</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:1024px){
          .hiw-hero-grid{grid-template-columns:1fr!important}
          .hiw-34-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:900px){
          .hiw-steps-grid{grid-template-columns:repeat(3,1fr)!important}
          .hiw-sources-grid{grid-template-columns:1fr!important}
          .hiw-input-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:600px){
          .hiw-steps-grid{grid-template-columns:repeat(2,1fr)!important}
          .hiw-verdict-grid{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
