import { ModuleShell } from "@/components/shared/ModuleShell";

export function AlertsPageView() {
  return (
    <ModuleShell
      label={{ en: "Threat Alerts", bn: "থ্রেট অ্যালার্টস" }}
      title={{ en: "Real-time misinformation alert center", bn: "রিয়েল-টাইম ভ্রান্ততথ্য অ্যালার্ট সেন্টার" }}
      summary={{ en: "Curated alert queues and escalation workflows will be integrated in a future release.", bn: "নির্বাচিত অ্যালার্ট কিউ এবং এসকেলেশন ওয়ার্কফ্লো ভবিষ্যৎ রিলিজে ইন্টিগ্রেট হবে।" }}
      state="Future Integration"
    />
  );
}
