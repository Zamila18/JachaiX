import { ModuleShell } from "@/components/shared/ModuleShell";

export function ModeratorPageView() {
  return (
    <ModuleShell
      label={{ en: "Moderator", bn: "মডারেটর" }}
      title={{ en: "Reviewer governance and override controls", bn: "রিভিউয়ার গভর্ন্যান্স এবং ওভাররাইড কন্ট্রোল" }}
      summary={{ en: "Moderation controls and policy actions will be connected to audit APIs later.", bn: "মডারেশন কন্ট্রোল এবং পলিসি অ্যাকশন পরবর্তীতে অডিট API এর সাথে সংযুক্ত হবে।" }}
      state="Future Integration"
    />
  );
}
