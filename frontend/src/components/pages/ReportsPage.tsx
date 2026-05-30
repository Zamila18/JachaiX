import { ModuleShell } from "@/components/shared/ModuleShell";

export function ReportsPageView() {
  return (
    <ModuleShell
      label={{ en: "Reports", bn: "রিপোর্টস" }}
      title={{ en: "Scheduled verification and incident reporting", bn: "নির্ধারিত ভেরিফিকেশন এবং ইনসিডেন্ট রিপোর্টিং" }}
      summary={{ en: "Comprehensive export and reporting workflows will be attached in future integration.", bn: "সম্পূর্ণ এক্সপোর্ট এবং রিপোর্টিং ওয়ার্কফ্লো ভবিষ্যৎ ইন্টিগ্রেশনে যুক্ত হবে।" }}
      state="Future Integration"
    />
  );
}
