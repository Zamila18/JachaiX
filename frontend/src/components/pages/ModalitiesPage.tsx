"use client";

import { useLanguage } from "@/lib/i18n";

const MODALITIES = [
  {
    title: { en: "URL", bn: "ইউআরএল" },
    state: { en: "Future integration", bn: "ভবিষ্যৎ ইন্টিগ্রেশন" },
    notes: { en: "Article ingest and source extraction are planned but not yet connected.", bn: "আর্টিকেল ইনজেস্ট ও সোর্স এক্সট্র্যাকশন পরিকল্পনায় আছে, তবে এখনো সংযুক্ত হয়নি।" },
  },
  {
    title: { en: "Image", bn: "ইমেজ" },
    state: { en: "Future integration", bn: "ভবিষ্যৎ ইন্টিগ্রেশন" },
    notes: { en: "OCR and visual context checks will be wired to backend services in a later phase.", bn: "OCR এবং ভিজ্যুয়াল কনটেক্সট চেক পরবর্তী ধাপে ব্যাকএন্ড সার্ভিসের সাথে যুক্ত হবে।" },
  },
  {
    title: { en: "Audio", bn: "অডিও" },
    state: { en: "Future integration", bn: "ভবিষ্যৎ ইন্টিগ্রেশন" },
    notes: { en: "Transcription pipeline exists conceptually and will be integrated after text hardening.", bn: "ট্রান্সক্রিপশন পাইপলাইন ধারণাগতভাবে আছে এবং টেক্সট ফ্লো স্থিতিশীল হওয়ার পর ইন্টিগ্রেট হবে।" },
  },
  {
    title: { en: "Video", bn: "ভিডিও" },
    state: { en: "Future integration", bn: "ভবিষ্যৎ ইন্টিগ্রেশন" },
    notes: { en: "Frame + subtitle verification and timeline reasoning are roadmap items.", bn: "ফ্রেম+সাবটাইটেল ভেরিফিকেশন এবং টাইমলাইন রিজনিং রোডম্যাপ আইটেম।" },
  },
];

export function ModalitiesPageView() {
  const { tx } = useLanguage();

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Multimodal Lab", bn: "মাল্টিমডাল ল্যাব" })}</p>
          <div className="live-pill">{tx({ en: "Roadmap Surface", bn: "রোডম্যাপ সারফেস" })}</div>
        </div>
        <h1>{tx({ en: "Design-complete multimodal modules prepared for staged backend integration.", bn: "ধাপে ধাপে ব্যাকএন্ড ইন্টিগ্রেশনের জন্য ডিজাইন-সম্পন্ন মাল্টিমডাল মডিউল প্রস্তুত।" })}</h1>
      </section>

      <section className="overview-grid reveal delay-1">
        {MODALITIES.map((item) => (
          <article key={item.title.en} className="panel app-card">
            <p className="chip-label">{tx(item.state)}</p>
            <h2>{tx(item.title)} {tx({ en: "Verification", bn: "ভেরিফিকেশন" })}</h2>
            <p className="muted">{tx(item.notes)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
