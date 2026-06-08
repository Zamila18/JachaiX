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
  userNav: {
    dashboard: string;
    myClaims: string;
    factChecks: string;
    bookmarks: string;
    notifications: string;
    savedSearches: string;
    evidenceLibrary: string;
    howItWorks: string;
    help: string;
    viewProfile: string;
    userDashboard: string;
    logout: string;
    markAllRead: string;
    noNotifications: string;
    seeAll: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    email: string;
    password: string;
    rememberMe: string;
    signIn: string;
    signingIn: string;
    noAccount: string;
    createOne: string;
    registerTitle: string;
    registerSubtitle: string;
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
    country: string;
    selectCountry: string;
    search: string;
    passwordHint: string;
    confirmPassword: string;
    gender: string;
    dob: string;
    optional: string;
    createAccount: string;
    creating: string;
    haveAccount: string;
    genderMale: string;
    genderFemale: string;
    genderOther: string;
    genderNone: string;
  };
  profile: {
    title: string;
    subtitle: string;
    tabPersonal: string;
    tabPassword: string;
    tabAccount: string;
    personalHeading: string;
    changePhoto: string;
    removePhoto: string;
    uploading: string;
    emailNote: string;
    save: string;
    saving: string;
    pwHeading: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    updatePassword: string;
    updating: string;
    accountHeading: string;
    role: string;
    memberSince: string;
    emailVerified: string;
    verified: string;
    notVerified: string;
  };
  dash: {
    welcomeBack: string;
    subtitle: string;
    verifyNew: string;
    claimsVerified: string;
    verdictTrue: string;
    verdictFalse: string;
    verdictMisleading: string;
    verdictUnverified: string;
    vsLastMonth: string;
    totalSubmitted: string;
    recentClaims: string;
    yourActivity: string;
    viewAll: string;
    noClaims: string;
    noActivity: string;
    usageThisMonth: string;
    claimsSubmitted: string;
    reviewsRequested: string;
    factsViewed: string;
    bookmarksAdded: string;
    signIns: string;
    trending: string;
    noTrending: string;
    verdict: string;
    confidence: string;
    submitted: string;
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
    userNav: {
      dashboard: "Dashboard",
      myClaims: "My Claims",
      factChecks: "Fact Checks",
      bookmarks: "Bookmarks",
      notifications: "Notifications",
      savedSearches: "Saved Searches",
      evidenceLibrary: "Evidence Library",
      howItWorks: "How It Works",
      help: "Help & Support",
      viewProfile: "User Profile",
      userDashboard: "User Dashboard",
      logout: "Log out",
      markAllRead: "Mark all read",
      noNotifications: "No notifications yet.",
      seeAll: "See all",
    },
    auth: {
      loginTitle: "Welcome back",
      loginSubtitle: "Sign in to your account",
      email: "Email address",
      password: "Password",
      rememberMe: "Remember me for 60 days",
      signIn: "Sign in",
      signingIn: "Signing in…",
      noAccount: "Don't have an account?",
      createOne: "Create one",
      registerTitle: "Create your account",
      registerSubtitle: "Join JachaiX to track verifications and request human review",
      firstName: "First name",
      lastName: "Last name",
      username: "Username",
      phone: "Phone number",
      country: "Country",
      selectCountry: "Select your country…",
      search: "Search…",
      passwordHint: "Must contain uppercase, lowercase, number, and special character.",
      confirmPassword: "Confirm password",
      gender: "Gender",
      dob: "Date of birth",
      optional: "(optional)",
      createAccount: "Create account",
      creating: "Creating account…",
      haveAccount: "Already have an account?",
      genderMale: "Male",
      genderFemale: "Female",
      genderOther: "Other",
      genderNone: "Prefer not to say",
    },
    profile: {
      title: "Profile Settings",
      subtitle: "Manage your personal information and account",
      tabPersonal: "Personal Info",
      tabPassword: "Password",
      tabAccount: "Account",
      personalHeading: "Personal Information",
      changePhoto: "Change photo",
      removePhoto: "Remove",
      uploading: "Uploading…",
      emailNote: "Email cannot be changed",
      save: "Save changes",
      saving: "Saving…",
      pwHeading: "Change Password",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
      updatePassword: "Update password",
      updating: "Updating…",
      accountHeading: "Account",
      role: "Role",
      memberSince: "Member since",
      emailVerified: "Email status",
      verified: "Verified",
      notVerified: "Not verified",
    },
    dash: {
      welcomeBack: "Welcome back",
      subtitle: "Verify information, explore fact-checks, and track your activity.",
      verifyNew: "Verify New Claim",
      claimsVerified: "Claims Verified",
      verdictTrue: "True",
      verdictFalse: "False",
      verdictMisleading: "Misleading",
      verdictUnverified: "Unverified",
      vsLastMonth: "vs last month",
      totalSubmitted: "total submitted",
      recentClaims: "Recent Claims",
      yourActivity: "Your Activity",
      viewAll: "View all",
      noClaims: "No claims yet.",
      noActivity: "No activity yet.",
      usageThisMonth: "Usage This Month",
      claimsSubmitted: "Claims submitted",
      reviewsRequested: "Reviews requested",
      factsViewed: "Facts viewed",
      bookmarksAdded: "Bookmarks added",
      signIns: "Sign-ins",
      trending: "Trending Fact Checks",
      noTrending: "No trending fact-checks right now.",
      verdict: "Verdict",
      confidence: "Confidence",
      submitted: "Submitted",
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
    userNav: {
      dashboard: "ড্যাশবোর্ড",
      myClaims: "আমার দাবিসমূহ",
      factChecks: "ফ্যাক্ট চেকস",
      bookmarks: "বুকমার্ক",
      notifications: "নোটিফিকেশন",
      savedSearches: "সংরক্ষিত অনুসন্ধান",
      evidenceLibrary: "এভিডেন্স লাইব্রেরি",
      howItWorks: "যেভাবে কাজ করে",
      help: "সহায়তা",
      viewProfile: "ইউজার প্রোফাইল",
      userDashboard: "ইউজার ড্যাশবোর্ড",
      logout: "লগ আউট",
      markAllRead: "সব পঠিত করুন",
      noNotifications: "এখনও কোনো নোটিফিকেশন নেই।",
      seeAll: "সব দেখুন",
    },
    auth: {
      loginTitle: "স্বাগতম",
      loginSubtitle: "আপনার অ্যাকাউন্টে সাইন ইন করুন",
      email: "ইমেইল ঠিকানা",
      password: "পাসওয়ার্ড",
      rememberMe: "৬০ দিন মনে রাখুন",
      signIn: "সাইন ইন",
      signingIn: "সাইন ইন হচ্ছে…",
      noAccount: "অ্যাকাউন্ট নেই?",
      createOne: "তৈরি করুন",
      registerTitle: "আপনার অ্যাকাউন্ট তৈরি করুন",
      registerSubtitle: "যাচাই ট্র্যাক করতে ও হিউম্যান রিভিউ চাইতে JachaiX-এ যোগ দিন",
      firstName: "প্রথম নাম",
      lastName: "শেষ নাম",
      username: "ইউজারনেম",
      phone: "ফোন নম্বর",
      country: "দেশ",
      selectCountry: "আপনার দেশ নির্বাচন করুন…",
      search: "অনুসন্ধান…",
      passwordHint: "বড় হাতের, ছোট হাতের, সংখ্যা ও বিশেষ অক্ষর থাকতে হবে।",
      confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
      gender: "লিঙ্গ",
      dob: "জন্ম তারিখ",
      optional: "(ঐচ্ছিক)",
      createAccount: "অ্যাকাউন্ট তৈরি করুন",
      creating: "তৈরি হচ্ছে…",
      haveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
      genderMale: "পুরুষ",
      genderFemale: "নারী",
      genderOther: "অন্যান্য",
      genderNone: "বলতে চাই না",
    },
    profile: {
      title: "প্রোফাইল সেটিংস",
      subtitle: "আপনার ব্যক্তিগত তথ্য ও অ্যাকাউন্ট পরিচালনা করুন",
      tabPersonal: "ব্যক্তিগত তথ্য",
      tabPassword: "পাসওয়ার্ড",
      tabAccount: "অ্যাকাউন্ট",
      personalHeading: "ব্যক্তিগত তথ্য",
      changePhoto: "ছবি পরিবর্তন করুন",
      removePhoto: "সরান",
      uploading: "আপলোড হচ্ছে…",
      emailNote: "ইমেইল পরিবর্তন করা যাবে না",
      save: "পরিবর্তন সংরক্ষণ করুন",
      saving: "সংরক্ষণ হচ্ছে…",
      pwHeading: "পাসওয়ার্ড পরিবর্তন",
      currentPassword: "বর্তমান পাসওয়ার্ড",
      newPassword: "নতুন পাসওয়ার্ড",
      confirmNewPassword: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
      updatePassword: "পাসওয়ার্ড আপডেট করুন",
      updating: "আপডেট হচ্ছে…",
      accountHeading: "অ্যাকাউন্ট",
      role: "ভূমিকা",
      memberSince: "সদস্য হয়েছেন",
      emailVerified: "ইমেইল স্ট্যাটাস",
      verified: "যাচাইকৃত",
      notVerified: "যাচাই করা হয়নি",
    },
    dash: {
      welcomeBack: "স্বাগতম",
      subtitle: "তথ্য যাচাই করুন, ফ্যাক্ট-চেক দেখুন এবং আপনার কার্যকলাপ ট্র্যাক করুন।",
      verifyNew: "নতুন দাবি যাচাই করুন",
      claimsVerified: "যাচাইকৃত দাবি",
      verdictTrue: "সত্য",
      verdictFalse: "মিথ্যা",
      verdictMisleading: "বিভ্রান্তিকর",
      verdictUnverified: "অযাচাইকৃত",
      vsLastMonth: "গত মাসের তুলনায়",
      totalSubmitted: "মোট জমা",
      recentClaims: "সাম্প্রতিক দাবি",
      yourActivity: "আপনার কার্যকলাপ",
      viewAll: "সব দেখুন",
      noClaims: "এখনও কোনো দাবি নেই।",
      noActivity: "এখনও কোনো কার্যকলাপ নেই।",
      usageThisMonth: "এই মাসের ব্যবহার",
      claimsSubmitted: "জমাকৃত দাবি",
      reviewsRequested: "রিভিউ অনুরোধ",
      factsViewed: "দেখা ফ্যাক্ট",
      bookmarksAdded: "যোগ করা বুকমার্ক",
      signIns: "সাইন-ইন",
      trending: "ট্রেন্ডিং ফ্যাক্ট চেকস",
      noTrending: "এই মুহূর্তে কোনো ট্রেন্ডিং ফ্যাক্ট-চেক নেই।",
      verdict: "রায়",
      confidence: "আস্থা",
      submitted: "জমা",
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
