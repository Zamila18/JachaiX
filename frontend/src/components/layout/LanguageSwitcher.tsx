"use client";

import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="lang-switcher" role="group" aria-label={t.language.label}>
      <button
        type="button"
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        {t.language.english}
      </button>
      <button
        type="button"
        className={language === "bn" ? "active" : ""}
        onClick={() => setLanguage("bn")}
        aria-pressed={language === "bn"}
      >
        {t.language.bangla}
      </button>
    </div>
  );
}
