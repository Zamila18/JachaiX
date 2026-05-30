import { ModuleShell } from "@/components/shared/ModuleShell";

export function ChatPageView() {
  return (
    <ModuleShell
      label={{ en: "Investigator Chat", bn: "ইনভেস্টিগেটর চ্যাট" }}
      title={{ en: "Conversational evidence exploration", bn: "কথোপকথনভিত্তিক এভিডেন্স এক্সপ্লোরেশন" }}
      summary={{ en: "Interactive chat with contextual claim retrieval is planned after core flow hardening.", bn: "কনটেক্সচুয়াল ক্লেম রিট্রিভালসহ ইন্টারঅ্যাকটিভ চ্যাট কোর ফ্লো স্থিতিশীলতার পর পরিকল্পিত।" }}
      state="Future Integration"
    />
  );
}
