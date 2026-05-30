"use client";

import { activityItems } from "@/data/mockDashboard";
import { useLanguage } from "@/lib/i18n";

export function ActivityFeed() {
  const { tx } = useLanguage();

  return (
    <section className="panel dashboard-feed">
      <h2>{tx({ en: "Live Activity", bn: "লাইভ কার্যক্রম" })}</h2>
      <div className="activity-list">
        {activityItems.map((item) => (
          <article key={`${item.time}-${tx(item.title)}`} className="activity-item">
            <div>
              <p className="data-label">{item.time}</p>
              <h3>{tx(item.title)}</h3>
              <p className="muted">{tx(item.detail)}</p>
            </div>
            <span>{tx(item.tag)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
