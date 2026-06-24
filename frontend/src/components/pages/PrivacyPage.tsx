"use client";

import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `We collect information you provide directly when you register for an account (name, email address, username, password), submit claims, or contact us. We also automatically collect certain usage data when you interact with the Platform, including IP address, browser type, operating system, pages visited, and timestamps. If you enable notifications, we may collect a device token for push delivery.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use the information we collect to: (a) provide, operate, and maintain the Platform; (b) process and investigate claims you submit; (c) send you transactional emails such as account confirmations and verdict notifications; (d) respond to your comments and questions; (e) monitor and analyze usage patterns to improve the Platform; (f) detect and prevent fraudulent or abusive activity; (g) comply with legal obligations.`,
  },
  {
    title: "3. Information Sharing & Disclosure",
    body: `We do not sell, trade, or rent your personal information to third parties. We may share your information with: trusted service providers who assist in operating the Platform under strict confidentiality agreements; law enforcement or government agencies when required by law; successor entities in the event of a merger, acquisition, or sale of assets (with prior notice to you). Published fact-check verdicts do not include personally identifiable submitter information.`,
  },
  {
    title: "4. Cookies & Tracking Technologies",
    body: `We use cookies and similar tracking technologies to maintain user sessions, remember preferences (e.g., language setting), and analyze Platform usage. Session cookies are deleted when you close your browser. Persistent cookies remain for up to 12 months. You can control cookies through your browser settings, though disabling them may affect Platform functionality. We do not use third-party advertising cookies.`,
  },
  {
    title: "5. Data Retention",
    body: `We retain account data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated personal data at any time by contacting us. We may retain certain information for up to 6 months after deletion for fraud prevention, legal compliance, and dispute resolution. Claim data may be retained in anonymized form for research purposes.`,
  },
  {
    title: "6. Data Security",
    body: `We implement industry-standard security measures including TLS encryption in transit, bcrypt password hashing, access controls, and regular security audits. However, no method of transmission over the Internet or electronic storage is 100% secure. We encourage you to use a strong, unique password and to notify us immediately if you suspect unauthorized access to your account.`,
  },
  {
    title: "7. Your Rights",
    body: `Depending on your location, you may have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your personal data; object to or restrict our processing of your data; data portability (receive your data in a structured, machine-readable format); withdraw consent where processing is based on consent. To exercise these rights, contact us at the address below. We will respond within 30 days.`,
  },
  {
    title: "8. Children's Privacy",
    body: `The Platform is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete such information immediately. If you believe we may have inadvertently collected information from a child, please contact us.`,
  },
  {
    title: "9. International Data Transfers",
    body: `JachaiX is based in Bangladesh. If you are accessing the Platform from outside Bangladesh, your information may be transferred to and processed in Bangladesh or other countries where our servers or service providers are located. By using the Platform, you consent to such transfers. We take appropriate steps to ensure your data receives adequate protection wherever it is processed.`,
  },
  {
    title: "10. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. For material changes, we may also send an email notification to registered users. We encourage you to review this policy periodically.`,
  },
];

export function PrivacyPage() {
  return (
    <div>
      {/* Dark hero — matches jx-hero */}
      <section className="jx-legal-hero-banner">
        <div className="jx-legal-hero-inner">
          <h1 className="jx-legal-title">Privacy Policy</h1>
          <p className="jx-legal-intro">
            Your privacy matters to us. This policy explains what data JachaiX collects, how we use
            it, and the choices you have about your personal information.
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
              <h2 className="jx-legal-section-title">Contact Us</h2>
              <p className="jx-legal-section-body">
                If you have questions or concerns about this Privacy Policy or our data practices,
                please{" "}
                <Link href="/contact" className="jx-legal-link">contact us</Link>. You may also
                review our{" "}
                <Link href="/terms" className="jx-legal-link">Terms of Service</Link>.
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
