const DEMO_CASES = [
  { id: "CLM-1092", title: "Vaccine microchip claim", status: "Needs Review", confidence: 0.58, owner: "Ops Team A" },
  { id: "CLM-1089", title: "Flood-relief fund rumor", status: "Verified False", confidence: 0.87, owner: "Ops Team B" },
  { id: "CLM-1084", title: "School closure announcement", status: "Verified True", confidence: 0.79, owner: "Ops Team A" },
];

export function CasesPageView() {
  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">Case Management</p>
          <div className="live-pill">Demo Board</div>
        </div>
        <h1>Operational case board for prioritization, routing, and review tracking.</h1>
        <p className="subtitle">This screen is currently using demo rows to represent final product behavior.</p>
      </section>

      <section className="panel reveal delay-1">
        <h2>Case Queue</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Claim</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_CASES.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
                  <td>{item.confidence}</td>
                  <td>{item.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
