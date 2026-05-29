const MODALITIES = [
  {
    title: "URL",
    state: "Future integration",
    notes: "Article ingest and source extraction are planned but not yet connected.",
  },
  {
    title: "Image",
    state: "Future integration",
    notes: "OCR and visual context checks will be wired to backend services in a later phase.",
  },
  {
    title: "Audio",
    state: "Future integration",
    notes: "Transcription pipeline exists conceptually and will be integrated after text hardening.",
  },
  {
    title: "Video",
    state: "Future integration",
    notes: "Frame + subtitle verification and timeline reasoning are roadmap items.",
  },
];

export function ModalitiesPageView() {
  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">Multimodal Lab</p>
          <div className="live-pill">Roadmap Surface</div>
        </div>
        <h1>Design-complete multimodal modules prepared for staged backend integration.</h1>
      </section>

      <section className="overview-grid reveal delay-1">
        {MODALITIES.map((item) => (
          <article key={item.title} className="panel app-card">
            <p className="chip-label">{item.state}</p>
            <h2>{item.title} Verification</h2>
            <p className="muted">{item.notes}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
