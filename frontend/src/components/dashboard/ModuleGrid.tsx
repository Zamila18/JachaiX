import Link from "next/link";
import { moduleItems } from "@/data/mockDashboard";

export function ModuleGrid() {
  return (
    <section className="overview-grid">
      {moduleItems.map((item) => (
        <article key={item.title} className="panel app-card">
          <p className={`chip-label ${item.status}`}>{item.status}</p>
          <h2>{item.title}</h2>
          <p className="muted">{item.description}</p>
          <Link className="nav-cta" href={item.href}>
            Open Module
          </Link>
        </article>
      ))}
    </section>
  );
}
