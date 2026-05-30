"use client";

import { useLanguage } from "@/lib/i18n";

const LOG_ITEMS = [
  {
    time: "14:06",
    actor: { en: "system", bn: "সিস্টেম" },
    action: { en: "Claim analyzed", bn: "ক্লেম বিশ্লেষণ সম্পন্ন" },
    detail: { en: "Verdict generated with cross-verification links", bn: "ক্রস-ভেরিফিকেশন লিংকসহ ভার্ডিক্ট তৈরি হয়েছে" },
  },
  {
    time: "14:11",
    actor: { en: "reviewer", bn: "রিভিউয়ার" },
    action: { en: "Manual review requested", bn: "ম্যানুয়াল রিভিউ অনুরোধ করা হয়েছে" },
    detail: { en: "Evidence confidence below preferred threshold", bn: "এভিডেন্স কনফিডেন্স নির্ধারিত থ্রেশহোল্ডের নিচে" },
  },
  {
    time: "14:16",
    actor: { en: "system", bn: "সিস্টেম" },
    action: { en: "Queue completed", bn: "কিউ সম্পন্ন" },
    detail: { en: "Claim state set to completed", bn: "ক্লেম স্টেট completed হিসেবে সেট হয়েছে" },
  },
];

export function AuditPageView() {
  const { tx } = useLanguage();

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Audit Timeline", bn: "অডিট টাইমলাইন" })}</p>
          <div className="live-pill">{tx({ en: "Governance View", bn: "গভর্ন্যান্স ভিউ" })}</div>
        </div>
        <h1>{tx({ en: "Trace decisions, evidence events, and review escalation in one timeline.", bn: "একটি টাইমলাইনে সিদ্ধান্ত, এভিডেন্স ইভেন্ট ও রিভিউ এসকেলেশন ট্র্যাক করুন।" })}</h1>
        <p className="subtitle">{tx({ en: "Current list uses demo entries and will connect to backend audit records in future integration.", bn: "বর্তমান তালিকা ডেমো ডাটা ব্যবহার করছে; ভবিষ্যৎ ইন্টিগ্রেশনে ব্যাকএন্ড অডিট রেকর্ড যুক্ত হবে।" })}</p>
      </section>

      <section className="panel reveal delay-1">
        <h2>{tx({ en: "Recent Activity", bn: "সাম্প্রতিক কার্যক্রম" })}</h2>
        <div className="timeline">
          {LOG_ITEMS.map((item) => (
            <article key={`${item.time}-${item.action.en}`} className="timeline-item">
              <p className="metric-label">{item.time}</p>
              <h3>{tx(item.action)}</h3>
              <p className="muted">{tx(item.actor)}</p>
              <p>{tx(item.detail)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
