const LOG_ITEMS = [
  {
    time: "14:06",
    actor: "system",
    action: "Claim analyzed",
    detail: "Verdict generated with cross-verification links",
  },
  {
    time: "14:11",
    actor: "reviewer",
    action: "Manual review requested",
    detail: "Evidence confidence below preferred threshold",
  },
  {
    time: "14:16",
    actor: "system",
    action: "Queue completed",
    detail: "Claim state set to completed",
  },
];

export function AuditPageView() {
  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">Audit Timeline</p>
          <div className="live-pill">Governance View</div>
        </div>
        <h1>Trace decisions, evidence events, and review escalation in one timeline.</h1>
        <p className="subtitle">Current list uses demo entries and will connect to backend audit records in future integration.</p>
      </section>

      <section className="panel reveal delay-1">
        <h2>Recent Activity</h2>
        <div className="timeline">
          {LOG_ITEMS.map((item) => (
            <article key={`${item.time}-${item.action}`} className="timeline-item">
              <p className="metric-label">{item.time}</p>
              <h3>{item.action}</h3>
              <p className="muted">{item.actor}</p>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
