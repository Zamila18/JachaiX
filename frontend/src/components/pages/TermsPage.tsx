"use client";

import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using JachaiX ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing the Platform. These terms apply to all visitors, users, and others who access or use the Platform.`,
  },
  {
    title: "2. Use of the Platform",
    body: `JachaiX grants you a limited, non-exclusive, non-transferable, revocable license to use the Platform for personal, non-commercial purposes, subject to these Terms. You agree not to: (a) use the Platform for any unlawful purpose or in violation of any regulations; (b) submit false, misleading, or defamatory claims; (c) attempt to gain unauthorized access to any part of the Platform or its related systems; (d) use automated means to scrape, crawl, or extract data from the Platform without prior written consent; (e) impersonate any person or entity or misrepresent your affiliation with any person or entity.`,
  },
  {
    title: "3. User Accounts",
    body: `To access certain features, you must register for an account. You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. JachaiX reserves the right to terminate accounts, remove content, or restrict access at our discretion if we believe you have violated these Terms.`,
  },
  {
    title: "4. Content & Submissions",
    body: `When you submit a claim or any content to JachaiX, you grant us a worldwide, royalty-free, non-exclusive license to use, reproduce, modify, and publish that content for the purpose of providing our fact-checking services. You represent that you have the right to submit such content and that it does not infringe any third-party rights. JachaiX does not endorse user-submitted claims and is not responsible for their accuracy prior to verification.`,
  },
  {
    title: "5. Intellectual Property",
    body: `The Platform and its original content, features, and functionality are and will remain the exclusive property of JachaiX and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of JachaiX. Published fact-check verdicts are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0) unless otherwise noted.`,
  },
  {
    title: "6. Disclaimers & Limitation of Liability",
    body: `JachaiX verdicts represent our best good-faith assessment based on available evidence at the time of publication. They are not legal determinations and should not be relied upon as such. The Platform is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. To the maximum extent permitted by law, JachaiX shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Platform.`,
  },
  {
    title: "7. Third-Party Links",
    body: `The Platform may contain links to third-party websites or services that are not owned or controlled by JachaiX. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites. We encourage you to review the terms and privacy policies of any third-party sites you visit.`,
  },
  {
    title: "8. Termination",
    body: `We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Platform will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`,
  },
  {
    title: "9. Governing Law",
    body: `These Terms shall be governed and construed in accordance with the laws of Bangladesh, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Bangladesh.`,
  },
  {
    title: "10. Changes to Terms",
    body: `We reserve the right to modify or replace these Terms at any time at our sole discretion. We will provide notice of significant changes by updating the "Last updated" date at the top of this page. Your continued use of the Platform after any such changes constitutes your acceptance of the new Terms.`,
  },
];

export function TermsPage() {
  return (
    <div>
      {/* Dark hero — matches jx-hero */}
      <section className="jx-legal-hero-banner">
        <div className="jx-legal-hero-inner">
          <h1 className="jx-legal-title">Terms of Service</h1>
          <p className="jx-legal-intro">
            Please read these Terms carefully before using JachaiX. They govern your access to and
            use of our AI-powered fact-verification service.
          </p>
        </div>
      </section>

      {/* Light body */}
      <div className="jx-legal-shell">
        <div className="jx-legal-body">
          <nav className="jx-legal-toc">
            <div className="jx-legal-toc-label">Contents</div>
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.title}>
                  <a href={`#${s.title.replace(/\s+/g, "-").toLowerCase()}`}>{s.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="jx-legal-content">
            {SECTIONS.map((s) => (
              <section
                key={s.title}
                id={s.title.replace(/\s+/g, "-").toLowerCase()}
                className="jx-legal-section"
              >
                <h2 className="jx-legal-section-title">{s.title}</h2>
                <p className="jx-legal-section-body">{s.body}</p>
              </section>
            ))}

            <div className="jx-legal-contact">
              <h2 className="jx-legal-section-title">Questions?</h2>
              <p className="jx-legal-section-body">
                If you have questions about these Terms, please{" "}
                <Link href="/contact" className="jx-legal-link">contact us</Link>. You may also
                review our{" "}
                <Link href="/privacy" className="jx-legal-link">Privacy Policy</Link>.
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
