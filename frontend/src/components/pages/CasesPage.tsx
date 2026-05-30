"use client";

import { useLanguage } from "@/lib/i18n";

const DEMO_CASES = [
  { id: "CLM-1092", title: { en: "Vaccine microchip claim", bn: "ভ্যাকসিন মাইক্রোচিপ দাবি" }, status: { en: "Needs Review", bn: "রিভিউ প্রয়োজন" }, confidence: 0.58, owner: "Ops Team A" },
  { id: "CLM-1089", title: { en: "Flood-relief fund rumor", bn: "বন্যা ত্রাণ তহবিল গুজব" }, status: { en: "Verified False", bn: "ভেরিফায়েড মিথ্যা" }, confidence: 0.87, owner: "Ops Team B" },
  { id: "CLM-1084", title: { en: "School closure announcement", bn: "স্কুল বন্ধের ঘোষণা" }, status: { en: "Verified True", bn: "ভেরিফায়েড সত্য" }, confidence: 0.79, owner: "Ops Team A" },
];

export function CasesPageView() {
  const { tx } = useLanguage();

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Case Management", bn: "কেস ম্যানেজমেন্ট" })}</p>
          <div className="live-pill">{tx({ en: "Demo Board", bn: "ডেমো বোর্ড" })}</div>
        </div>
        <h1>{tx({ en: "Operational case board for prioritization, routing, and review tracking.", bn: "অগ্রাধিকার নির্ধারণ, রাউটিং এবং রিভিউ ট্র্যাকিংয়ের জন্য অপারেশনাল কেস বোর্ড।" })}</h1>
        <p className="subtitle">{tx({ en: "This screen is currently using demo rows to represent final product behavior.", bn: "এই স্ক্রিন বর্তমানে ডেমো সারি ব্যবহার করছে, যা চূড়ান্ত পণ্যের আচরণ দেখায়।" })}</p>
      </section>

      <section className="panel reveal delay-1">
        <h2>{tx({ en: "Case Queue", bn: "কেস কিউ" })}</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{tx({ en: "Case ID", bn: "কেস আইডি" })}</th>
                <th>{tx({ en: "Claim", bn: "ক্লেম" })}</th>
                <th>{tx({ en: "Status", bn: "স্ট্যাটাস" })}</th>
                <th>{tx({ en: "Confidence", bn: "কনফিডেন্স" })}</th>
                <th>{tx({ en: "Owner", bn: "ওনার" })}</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_CASES.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{tx(item.title)}</td>
                  <td>{tx(item.status)}</td>
                  <td>{item.confidence}</td>
                  <td>{item.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
