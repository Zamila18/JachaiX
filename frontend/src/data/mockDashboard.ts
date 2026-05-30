import type { LocalizedText } from "@/lib/i18n";

export interface KpiItem {
  label: string | LocalizedText;
  value: string;
  trend: string | LocalizedText;
  tone: "good" | "warn" | "neutral";
}

export interface ActivityItem {
  time: string;
  title: string | LocalizedText;
  detail: string | LocalizedText;
  tag: string | LocalizedText;
}

export interface ModuleItem {
  title: string | LocalizedText;
  description: string | LocalizedText;
  href: string;
  status: "live" | "demo" | "future";
}

export const kpiItems: KpiItem[] = [
  { label: { en: "Claims Today", bn: "আজকের ক্লেম" }, value: "148", trend: { en: "+12% vs yesterday", bn: "গতকালের তুলনায় +12%" }, tone: "good" },
  { label: { en: "Avg Confidence", bn: "গড় কনফিডেন্স" }, value: "0.79", trend: { en: "Stable in last 24h", bn: "গত ২৪ ঘণ্টায় স্থিতিশীল" }, tone: "neutral" },
  { label: { en: "Needs Review", bn: "রিভিউ প্রয়োজন" }, value: "19", trend: { en: "5 high priority", bn: "৫টি উচ্চ অগ্রাধিকার" }, tone: "warn" },
  { label: { en: "Pipeline Uptime", bn: "পাইপলাইন আপটাইম" }, value: "99.4%", trend: { en: "All services healthy", bn: "সব সার্ভিস সুস্থ" }, tone: "good" },
];

export const activityItems: ActivityItem[] = [
  {
    time: "14:06",
    title: { en: "Claim analyzed", bn: "ক্লেম বিশ্লেষিত" },
    detail: { en: "Verdict generated with cross-verification links attached.", bn: "ক্রস-ভেরিফিকেশন লিংকসহ ভার্ডিক্ট তৈরি হয়েছে।" },
    tag: { en: "pipeline", bn: "পাইপলাইন" },
  },
  {
    time: "14:11",
    title: { en: "Manual review requested", bn: "ম্যানুয়াল রিভিউ অনুরোধ" },
    detail: { en: "Low-confidence output routed to reviewer queue.", bn: "কম কনফিডেন্স আউটপুট রিভিউয়ার কিউতে পাঠানো হয়েছে।" },
    tag: { en: "review", bn: "রিভিউ" },
  },
  {
    time: "14:16",
    title: { en: "Case escalated", bn: "কেস এসকেলেটেড" },
    detail: { en: "Regional monitor alerted for misinformation cluster.", bn: "ভ্রান্ততথ্য ক্লাস্টারের জন্য আঞ্চলিক মনিটরকে সতর্ক করা হয়েছে।" },
    tag: { en: "alert", bn: "অ্যালার্ট" },
  },
];

export const moduleItems: ModuleItem[] = [
  {
    title: { en: "Analyst Workspace", bn: "অ্যানালিস্ট ওয়ার্কস্পেস" },
    description: { en: "Live text claim verification with backend job orchestration and review request handoff.", bn: "ব্যাকএন্ড জব orchestration ও review handoff সহ লাইভ টেক্সট ক্লেম ভেরিফিকেশন।" },
    href: "/workspace",
    status: "live",
  },
  {
    title: { en: "Case Management", bn: "কেস ম্যানেজমেন্ট" },
    description: { en: "Operational board for triage, ownership, and confidence-driven prioritization.", bn: "ট্রায়াজ, ownership ও confidence-driven prioritization এর অপারেশনাল বোর্ড।" },
    href: "/cases",
    status: "demo",
  },
  {
    title: { en: "Multimodal Lab", bn: "মাল্টিমডাল ল্যাব" },
    description: { en: "URL, image, audio, and video modules are surfaced as product shells for future integration.", bn: "ভবিষ্যৎ ইন্টিগ্রেশনের জন্য URL, image, audio এবং video মডিউল প্রোডাক্ট শেল হিসেবে উপস্থাপিত।" },
    href: "/modalities",
    status: "future",
  },
  {
    title: { en: "Audit Timeline", bn: "অডিট টাইমলাইন" },
    description: { en: "Trace key decision events and governance actions across the verification lifecycle.", bn: "ভেরিফিকেশন লাইফসাইকেল জুড়ে মূল সিদ্ধান্ত ও গভর্ন্যান্স অ্যাকশন ট্রেস করুন।" },
    href: "/audit",
    status: "demo",
  },
];
