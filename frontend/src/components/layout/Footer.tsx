"use client";

import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="app-footer">
      <p>{t.footer.appLine1}</p>
      <small>{t.footer.appLine2}</small>
    </footer>
  );
}
