import { kpiItems } from "@/data/mockDashboard";

export function KPICards() {
  return (
    <section className="kpi-grid">
      {kpiItems.map((item) => (
        <article key={item.label} className="kpi-card">
          <p className="data-label">{item.label}</p>
          <h3>{item.value}</h3>
          <p className={`kpi-trend ${item.tone}`}>{item.trend}</p>
        </article>
      ))}
    </section>
  );
}
