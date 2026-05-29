import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { KPICards } from "@/components/dashboard/KPICards";
import { ModuleGrid } from "@/components/dashboard/ModuleGrid";

export function DashboardContent() {
  return (
    <main className="dashboard-root">
      <section className="hero-card reveal">
        <p className="eyebrow">JachaiX Command Surface</p>
        <h2>Evidence-first verification control room with production-style structure.</h2>
        <p className="subtitle">
          Design system and structure are now aligned to a full application model: shared layout, modular components,
          dashboard cards, and scoped feature pages.
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
