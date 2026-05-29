import { activityItems } from "@/data/mockDashboard";

export function ActivityFeed() {
  return (
    <section className="panel dashboard-feed">
      <h2>Live Activity</h2>
      <div className="activity-list">
        {activityItems.map((item) => (
          <article key={`${item.time}-${item.title}`} className="activity-item">
            <div>
              <p className="data-label">{item.time}</p>
              <h3>{item.title}</h3>
              <p className="muted">{item.detail}</p>
            </div>
            <span>{item.tag}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
