"use client";

import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { KPICards } from "@/components/dashboard/KPICards";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";
import { useLanguage } from "@/lib/i18n";

export function DashboardContent() {
  const { tx } = useLanguage();

  return (
    <main className="dashboard-root">
      <section className="hero-card reveal">
        <p className="eyebrow">{tx({ en: "JachaiX Command Surface", bn: "জাচাইএক্স কমান্ড সারফেস" })}</p>
        <h2>{tx({ en: "Evidence-first verification control room with production-style structure.", bn: "প্রডাকশন-স্টাইল কাঠামোসহ evidence-first ভেরিফিকেশন কন্ট্রোল রুম।" })}</h2>
        <p className="subtitle">
          {tx({ en: "Design system and structure are now aligned to a full application model: shared layout, modular components, dashboard cards, and scoped feature pages.", bn: "ডিজাইন সিস্টেম ও কাঠামো এখন পূর্ণ অ্যাপ্লিকেশন মডেলের সাথে সামঞ্জস্যপূর্ণ: শেয়ারড লেআউট, মডুলার কম্পোনেন্ট, ড্যাশবোর্ড কার্ড এবং স্কোপড ফিচার পেজ।" })}
        </p>
      </section>

      <KPICards />

      <div className="dashboard-columns">
        <ModuleGrid />
        <ActivityFeed />
      </div>
    </main>
  );
}
