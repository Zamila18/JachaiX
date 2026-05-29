export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone: "good" | "warn" | "neutral";
}

export interface ActivityItem {
  time: string;
  title: string;
  detail: string;
  tag: string;
}

export interface ModuleItem {
  title: string;
  description: string;
  href: string;
  status: "live" | "demo" | "future";
}

export const kpiItems: KpiItem[] = [
  { label: "Claims Today", value: "148", trend: "+12% vs yesterday", tone: "good" },
  { label: "Avg Confidence", value: "0.79", trend: "Stable in last 24h", tone: "neutral" },
  { label: "Needs Review", value: "19", trend: "5 high priority", tone: "warn" },
  { label: "Pipeline Uptime", value: "99.4%", trend: "All services healthy", tone: "good" },
];

export const activityItems: ActivityItem[] = [
  {
    time: "14:06",
    title: "Claim analyzed",
    detail: "Verdict generated with cross-verification links attached.",
    tag: "pipeline",
  },
  {
    time: "14:11",
    title: "Manual review requested",
    detail: "Low-confidence output routed to reviewer queue.",
    tag: "review",
  },
  {
    time: "14:16",
    title: "Case escalated",
    detail: "Regional monitor alerted for misinformation cluster.",
    tag: "alert",
  },
];

export const moduleItems: ModuleItem[] = [
  {
    title: "Analyst Workspace",
    description: "Live text claim verification with backend job orchestration and review request handoff.",
    href: "/workspace",
    status: "live",
  },
  {
    title: "Case Management",
    description: "Operational board for triage, ownership, and confidence-driven prioritization.",
    href: "/cases",
    status: "demo",
  },
  {
    title: "Multimodal Lab",
    description: "URL, image, audio, and video modules are surfaced as product shells for future integration.",
    href: "/modalities",
    status: "future",
  },
  {
    title: "Audit Timeline",
    description: "Trace key decision events and governance actions across the verification lifecycle.",
    href: "/audit",
    status: "demo",
  },
];
