"use client";

import { LocalizedText, useLanguage } from "@/lib/i18n";

interface ModuleShellProps {
  label: string | LocalizedText;
  title: string | LocalizedText;
  summary: string | LocalizedText;
  state: "Live" | "Demo" | "Future Integration";
}

export function ModuleShell({ label, title, summary, state }: ModuleShellProps) {
  const { language, tx } = useLanguage();
  const stateLabel =
    state === "Live"
      ? language === "bn"
        ? "লাইভ"
        : "Live"
      : state === "Demo"
        ? language === "bn"
          ? "ডেমো"
          : "Demo"
        : language === "bn"
          ? "ভবিষ্যৎ ইন্টিগ্রেশন"
          : "Future Integration";

  return (
    <main className="jx-page-shell">
      <section className="jx-module-hero reveal">
        <div className="jx-hero-top">
          <p className="jx-eyebrow">{tx(label)}</p>
          <div className="jx-live-pill">{stateLabel}</div>
        </div>
        <h1>{tx(title)}</h1>
        <p className="jx-subtitle">{tx(summary)}</p>
      </section>

      <section className="jx-panel reveal delay-1">
        <h2>{language === "bn" ? "মডিউল স্ট্যাটাস" : "Module Status"}</h2>
        <p className="jx-muted">
          {language === "bn"
            ? "এই অংশটি পূর্ণ অ্যাপ শেলের অংশ হিসেবে গঠন ও স্টাইল করা হয়েছে। ব্যাকএন্ড প্রস্তুতি অনুযায়ী ধাপে ধাপে ফিচার লজিক বিস্তৃত হবে।"
            : "This section is structured and styled as part of the full application shell. Feature logic will be expanded in phased integration according to backend readiness."}
        </p>
      </section>
    </main>
  );
}
