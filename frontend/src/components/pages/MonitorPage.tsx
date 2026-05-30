import { ModuleShell } from "@/components/shared/ModuleShell";

export function MonitorPageView() {
  return (
    <ModuleShell
      label={{ en: "Monitoring", bn: "মনিটরিং" }}
      title={{ en: "System and queue health observability", bn: "সিস্টেম এবং কিউ হেলথ অবজারভেবিলিটি" }}
      summary={{ en: "Live infra and pipeline metrics are designed for integration with service telemetry.", bn: "লাইভ ইনফ্রা ও পাইপলাইন মেট্রিক্স সার্ভিস টেলিমেট্রির সাথে ইন্টিগ্রেশনের জন্য ডিজাইন করা হয়েছে।" }}
      state="Demo"
    />
  );
}
