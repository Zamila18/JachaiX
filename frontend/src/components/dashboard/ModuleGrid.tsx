"use client";

import Link from "next/link";
import { moduleItems } from "@/data/mockDashboard";
import { useLanguage } from "@/lib/i18n";

export function ModuleGrid() {
  const { tx } = useLanguage();

  return (
    <section className="overview-grid">
      {moduleItems.map((item) => (
        <article key={item.href} className="panel app-card">
          <p className={`chip-label ${item.status}`}>{item.status === "live" ? tx({ en: "live", bn: "লাইভ" }) : item.status === "demo" ? tx({ en: "demo", bn: "ডেমো" }) : tx({ en: "future", bn: "ভবিষ্যৎ" })}</p>
          <h2>{tx(item.title)}</h2>
          <p className="muted">{tx(item.description)}</p>
          <Link className="nav-cta" href={item.href}>
            {tx({ en: "Open Module", bn: "মডিউল খুলুন" })}
          </Link>
        </article>
      ))}
    </section>
  );
}
