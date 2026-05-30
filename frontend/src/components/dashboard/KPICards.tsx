"use client";

import { kpiItems } from "@/data/mockDashboard";
import { useLanguage } from "@/lib/i18n";

export function KPICards() {
  const { tx } = useLanguage();

  return (
    <section className="kpi-grid">
      {kpiItems.map((item) => (
        <article key={tx(item.label)} className="kpi-card">
          <p className="data-label">{tx(item.label)}</p>
          <h3>{item.value}</h3>
          <p className={`kpi-trend ${item.tone}`}>{tx(item.trend)}</p>
        </article>
      ))}
    </section>
  );
}
