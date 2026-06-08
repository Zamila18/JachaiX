"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useLanguage } from "@/lib/i18n";
import Link from "next/link";

export function HelpPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <Help />
    </ProtectedRoute>
  );
}

function Help() {
  const { tx } = useLanguage();

  const faqs = [
    {
      q: { en: "How do I verify a claim?", bn: "আমি কীভাবে একটি দাবি যাচাই করব?" },
      a: { en: "Go to Verify Claim, paste text, a URL, or upload an image/PDF, and submit. You'll get a verdict with evidence.", bn: "যাচাই করুন পেজে গিয়ে টেক্সট, URL দিন বা ছবি/পিডিএফ আপলোড করে জমা দিন। প্রমাণসহ রায় পাবেন।" },
    },
    {
      q: { en: "What do the verdicts mean?", bn: "রায়গুলোর অর্থ কী?" },
      a: { en: "True, False, Misleading, or Unverified — based on evidence from our knowledge base and trusted sources.", bn: "সত্য, মিথ্যা, বিভ্রান্তিকর বা অযাচাইকৃত — আমাদের নলেজ বেস ও নির্ভরযোগ্য উৎসের প্রমাণের ভিত্তিতে।" },
    },
    {
      q: { en: "How do I request human review?", bn: "হিউম্যান রিভিউ কীভাবে চাইব?" },
      a: { en: "On any result page, use the 'Request Human Review' action. You must be logged in.", bn: "যেকোনো ফলাফল পেজে 'হিউম্যান রিভিউ' অপশন ব্যবহার করুন। লগইন থাকতে হবে।" },
    },
    {
      q: { en: "Where are my saved fact-checks?", bn: "আমার সংরক্ষিত ফ্যাক্ট-চেক কোথায়?" },
      a: { en: "Bookmarks appear under Bookmarks in the sidebar. Saved searches are under Saved Searches.", bn: "বুকমার্ক সাইডবারে Bookmarks-এ এবং সংরক্ষিত অনুসন্ধান Saved Searches-এ থাকে।" },
    },
  ];

  return (
    <div className="jxu-page">
      <header className="jxu-page-head">
        <h1>{tx({ en: "Help & Support", bn: "সহায়তা ও সাপোর্ট" })}</h1>
        <p>{tx({ en: "Answers to common questions about using JachaiX.", bn: "JachaiX ব্যবহারের সাধারণ প্রশ্নের উত্তর।" })}</p>
      </header>

      <section className="jxu-card">
        <div className="jxu-faq">
          {faqs.map((f, i) => (
            <details key={i}>
              <summary>{tx(f.q)}</summary>
              <p>{tx(f.a)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="jxu-card">
        <h2>{tx({ en: "Still need help?", bn: "আরও সাহায্য দরকার?" })}</h2>
        <p className="jxu-muted">
          {tx({ en: "Email us at ", bn: "আমাদের ইমেইল করুন " })}
          <a href="mailto:support@jachaix.com">support@jachaix.com</a>
          {tx({ en: " or browse the ", bn: " অথবা দেখুন " })}
          <Link href="/docs">{tx({ en: "documentation", bn: "ডকুমেন্টেশন" })}</Link>.
        </p>
      </section>
    </div>
  );
}
