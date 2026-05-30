"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "bn";
export type LocalizedText = { en: string; bn: string };

const STORAGE_KEY = "jachaix_language";

type RouteTitleKey =
  | "dashboard"
  | "workspace"
  | "cases"
  | "modalities"
  | "audit"
  | "scan"
  | "docs"
  | "adminQueue"
  | "adminDocs"
  | "reports"
  | "analytics"
  | "threatMap"
  | "alerts"
  | "chat"
  | "investigation"
  | "moderator"
  | "monitor"
  | "settings";

type NavKey =
  | "homepage"
  | "dashboard"
  | "workspace"
  | "cases"
  | "modalities"
  | "audit"
  | "scan"
  | "factChecks"
  | "adminQueue"
  | "docs"
  | "adminDocs"
  | "reports"
  | "analytics"
  | "threatMap"
  | "alerts"
  | "chat"
  | "investigation"
  | "moderator"
  | "monitor"
  | "settings";

interface Dictionary {
  topbar: {
    commandDeck: string;
    operationsLive: string;
    routeTitles: Record<RouteTitleKey, string>;
  };
  nav: {
    primaryLabel: string;
    trustSuite: string;
    items: Record<NavKey, string>;
    system: string;
    connectivity: string;
  };
  footer: {
    appLine1: string;
    appLine2: string;
    landingLine1: string;
    landingLine2: string;
  };
  landing: {
    brandAria: string;
    aiPlatform: string;
    capabilities: string;
    pipeline: string;
    deployment: string;
    dashboard: string;
  };
  language: {
    label: string;
    english: string;
    bangla: string;
  };
}

const dictionary: Record<Language, Dictionary> = {
  en: {
    topbar: {
      commandDeck: "Command Deck",
      operationsLive: "Operations Live",
      routeTitles: {
        dashboard: "Dashboard",
        workspace: "Analyst Workspace",
        cases: "Case Management",
        modalities: "Multimodal Lab",
        audit: "Audit Timeline",
        scan: "Scan Center",
        docs: "Live Documentation",
        adminQueue: "Admin Publish Queue",
        adminDocs: "Admin Docs",
        reports: "Reports",
        analytics: "Analytics",
        threatMap: "Threat Map",
        alerts: "Alerts",
        chat: "Investigator Chat",
        investigation: "Investigation",
        moderator: "Moderator",
        monitor: "Monitoring",
        settings: "Settings",
      },
    },
    nav: {
      primaryLabel: "Primary",
      trustSuite: "Trust Intelligence Suite",
      items: {
        homepage: "Homepage",
        dashboard: "Dashboard",
        workspace: "Workspace",
        cases: "Cases",
        modalities: "Modalities",
        audit: "Audit",
        scan: "Scan",
        factChecks: "Fact Checks",
        adminQueue: "Admin Queue",
        docs: "Docs",
        adminDocs: "Admin Docs",
        reports: "Reports",
        analytics: "Analytics",
        threatMap: "Threat Map",
        alerts: "Alerts",
        chat: "Chat",
        investigation: "Investigation",
        moderator: "Moderator",
        monitor: "Monitor",
        settings: "Settings",
      },
      system: "System",
      connectivity: "Live backend connectivity",
    },
    footer: {
      appLine1: "JachaiX Platform: Evidence-first verification workflows for newsroom, trust and safety, and public-sector response teams.",
      appLine2: "Current release supports live text/image/pdf verification. Extended multimodal intelligence is planned for staged rollout.",
      landingLine1: "JachaiX is a Bangla-first misinformation verification solution for text, image, and PDF claims.",
      landingLine2: "Built with Laravel, asynchronous job processing, OCR, embedding retrieval, reranking, and LLM verdict orchestration.",
    },
    landing: {
      brandAria: "JachaiX Home",
      aiPlatform: "AI Verification Platform",
      capabilities: "Capabilities",
      pipeline: "Pipeline",
      deployment: "Deployment",
      dashboard: "Dashboard",
    },
    language: {
      label: "Language",
      english: "EN",
      bangla: "BN",
    },
  },
  bn: {
    topbar: {
      commandDeck: "কমান্ড ডেক",
      operationsLive: "অপারেশনস লাইভ",
      routeTitles: {
        dashboard: "ড্যাশবোর্ড",
        workspace: "অ্যানালিস্ট ওয়ার্কস্পেস",
        cases: "কেস ম্যানেজমেন্ট",
        modalities: "মাল্টিমডাল ল্যাব",
        audit: "অডিট টাইমলাইন",
        scan: "স্ক্যান সেন্টার",
        docs: "লাইভ ডকুমেন্টেশন",
        adminQueue: "অ্যাডমিন পাবলিশ কিউ",
        adminDocs: "অ্যাডমিন ডকস",
        reports: "রিপোর্টস",
        analytics: "অ্যানালিটিক্স",
        threatMap: "থ্রেট ম্যাপ",
        alerts: "অ্যালার্টস",
        chat: "ইনভেস্টিগেটর চ্যাট",
        investigation: "ইনভেস্টিগেশন",
        moderator: "মডারেটর",
        monitor: "মনিটরিং",
        settings: "সেটিংস",
      },
    },
    nav: {
      primaryLabel: "প্রাইমারি",
      trustSuite: "ট্রাস্ট ইন্টেলিজেন্স স্যুট",
      items: {
        homepage: "হোমপেজ",
        dashboard: "ড্যাশবোর্ড",
        workspace: "ওয়ার্কস্পেস",
        cases: "কেসসমূহ",
        modalities: "মডালিটিস",
        audit: "অডিট",
        scan: "স্ক্যান",
        factChecks: "ফ্যাক্ট চেকস",
        adminQueue: "অ্যাডমিন কিউ",
        docs: "ডকস",
        adminDocs: "অ্যাডমিন ডকস",
        reports: "রিপোর্টস",
        analytics: "অ্যানালিটিক্স",
        threatMap: "থ্রেট ম্যাপ",
        alerts: "অ্যালার্টস",
        chat: "চ্যাট",
        investigation: "ইনভেস্টিগেশন",
        moderator: "মডারেটর",
        monitor: "মনিটর",
        settings: "সেটিংস",
      },
      system: "সিস্টেম",
      connectivity: "লাইভ ব্যাকএন্ড সংযোগ",
    },
    footer: {
      appLine1: "জাচাইএক্স প্ল্যাটফর্ম: নিউজরুম, ট্রাস্ট অ্যান্ড সেফটি, এবং পাবলিক সেক্টরের জন্য প্রমাণভিত্তিক যাচাই ওয়ার্কফ্লো।",
      appLine2: "বর্তমান রিলিজে টেক্সট/ইমেজ/পিডিএফ যাচাই লাইভ আছে। উন্নত মাল্টিমডাল বুদ্ধিমত্তা ধাপে ধাপে যোগ হবে।",
      landingLine1: "জাচাইএক্স টেক্সট, ইমেজ এবং পিডিএফ দাবির জন্য বাংলা-প্রথম ভ্রান্ততথ্য যাচাই সমাধান।",
      landingLine2: "এটি Laravel, async job processing, OCR, embedding retrieval, reranking এবং LLM verdict orchestration দিয়ে তৈরি।",
    },
    landing: {
      brandAria: "জাচাইএক্স হোম",
      aiPlatform: "এআই ভেরিফিকেশন প্ল্যাটফর্ম",
      capabilities: "সক্ষমতাসমূহ",
      pipeline: "পাইপলাইন",
      deployment: "ডিপ্লয়মেন্ট",
      dashboard: "ড্যাশবোর্ড",
    },
    language: {
      label: "ভাষা",
      english: "EN",
      bangla: "বাং",
    },
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
  tx: (value: string | LocalizedText) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "bn") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "bn" ? "bn" : "en";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: dictionary[language],
      tx: (value: string | LocalizedText) => {
        if (typeof value === "string") return value;
        return language === "bn" ? value.bn : value.en;
      },
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
