interface ModuleShellProps {
  label: string;
  title: string;
  summary: string;
  state: "Live" | "Demo" | "Future Integration";
}

export function ModuleShell({ label, title, summary, state }: ModuleShellProps) {
  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{label}</p>
          <div className="live-pill">{state}</div>
        </div>
        <h1>{title}</h1>
        <p className="subtitle">{summary}</p>
      </section>

      <section className="panel reveal delay-1">
        <h2>Module Status</h2>
        <p className="muted">
          This section is structured and styled as part of the full application shell. Feature logic will be expanded in
          phased integration according to backend readiness.
        </p>
      </section>
    </main>
  );
}
