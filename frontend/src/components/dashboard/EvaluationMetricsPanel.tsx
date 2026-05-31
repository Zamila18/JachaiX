"use client";

import { useEffect, useState } from "react";
import { getLatestEvaluationMetrics } from "@/lib/api";
import type { EvalMetricsSummary } from "@/lib/types";

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function MetricCard({ title, report }: { title: string; report: EvalMetricsSummary | null }) {
  if (!report) {
    return (
      <article className="kpi-card">
        <p className="data-label">{title}</p>
        <h3>n/a</h3>
        <p className="kpi-trend neutral">Report not available</p>
      </article>
    );
  }

  return (
    <article className="kpi-card">
      <p className="data-label">{title}</p>
      <h3>{formatPct(report.macro_f1)}</h3>
      <p className="kpi-trend good">
        Acc {formatPct(report.accuracy)} · P {formatPct(report.macro_precision)} · R {formatPct(report.macro_recall)}
      </p>
      <p className="kpi-trend neutral">Scored {report.samples_scored}/{report.samples_total}</p>
    </article>
  );
}

export function EvaluationMetricsPanel() {
  const [human, setHuman] = useState<EvalMetricsSummary | null>(null);
  const [multilingual, setMultilingual] = useState<EvalMetricsSummary | null>(null);
  const [latestName, setLatestName] = useState<string>("n/a");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getLatestEvaluationMetrics()
      .then((res) => {
        if (!mounted) return;
        setHuman(res.reports.human || null);
        setMultilingual(res.reports.multilingual || null);
        setLatestName(res.latest?.name || "n/a");
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load evaluation metrics");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="panel reveal">
      <div className="hero-top" style={{ marginBottom: "0.7rem" }}>
        <h2 style={{ margin: 0 }}>Evaluation Metrics</h2>
        <span className="phase-chip">Latest: {latestName}</span>
      </div>
      <p className="muted" style={{ marginBottom: "0.85rem" }}>
        Accuracy, macro precision, macro recall, and macro F1 from benchmark regression reports.
      </p>

      {error && <p className="kpi-trend warn" style={{ marginBottom: "0.85rem" }}>{error}</p>}

      <div className="kpi-grid">
        <MetricCard title="Human Benchmark" report={human} />
        <MetricCard title="Multilingual Slice" report={multilingual} />
      </div>
    </section>
  );
}
