import { ModuleShell } from "@/components/shared/ModuleShell";

export function InvestigationPageView() {
  return (
    <ModuleShell
      label={{ en: "Investigation", bn: "ইনভেস্টিগেশন" }}
      title={{ en: "Deep-dive claim investigation workspace", bn: "গভীর বিশ্লেষণধর্মী ক্লেম ইনভেস্টিগেশন ওয়ার্কস্পেস" }}
      summary={{ en: "Case-level investigation tools are staged and ready for phased rollout.", bn: "কেস-লেভেল ইনভেস্টিগেশন টুল ধাপে ধাপে রোলআউটের জন্য প্রস্তুত।" }}
      state="Demo"
    />
  );
}
