"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { registerUser } from "@/lib/auth";

export function RegisterPage() {
  const { tx } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthClass = ["", "jx-pw-weak", "jx-pw-fair", "jx-pw-good", "jx-pw-strong"][passwordStrength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirm) {
      setError(tx({ en: "Please fill in all fields.", bn: "সকল তথ্য পূরণ করুন।" }));
      return;
    }
    if (form.password !== form.confirm) {
      setError(tx({ en: "Passwords do not match.", bn: "পাসওয়ার্ড মিলছে না।" }));
      return;
    }
    if (!agreed) {
      setError(tx({ en: "Please agree to the terms to continue.", bn: "চালিয়ে যেতে শর্তাবলীতে সম্মত হন।" }));
      return;
    }
    setLoading(true);
    try {
      await registerUser(form.name.trim(), form.email.trim(), form.password, form.confirm);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="jx-auth-page">
      <div className="jx-auth-bg" aria-hidden />

      <div className="jx-auth-card jx-auth-card--register">
        {/* Card header */}
        <div className="jx-auth-card-header">
          <div className="jx-auth-shield" aria-hidden>
            <svg viewBox="0 0 40 46" fill="none" width="38" height="44">
              <path
                d="M20 2L4 9v13c0 11.05 6.84 21.38 16 24 9.16-2.62 16-12.95 16-24V9L20 2z"
                fill="rgba(34,197,94,0.15)"
                stroke="#22c55e"
                strokeWidth="1.5"
              />
              <path d="M12 21h16M12 25h10" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="jx-auth-title">
            {tx({ en: "Create your account", bn: "অ্যাকাউন্ট তৈরি করুন" })}
          </h1>
          <p className="jx-auth-subtitle">
            {tx({ en: "Join JachaiX — Bangladesh's AI fact-checking platform", bn: "JachaiX-এ যোগ দিন — বাংলাদেশের এআই ফ্যাক্ট-চেকিং প্ল্যাটফর্ম" })}
          </p>
        </div>

        <form className="jx-auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="jx-auth-error" role="alert">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Two-column layout for name + email */}
          <div className="jx-auth-row">
            <div className="jx-auth-field">
              <label htmlFor="reg-name" className="jx-auth-label">
                {tx({ en: "Full name", bn: "পূর্ণ নাম" })}
              </label>
              <div className="jx-auth-input-wrap">
                <span className="jx-auth-input-icon" aria-hidden>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  id="reg-name"
                  type="text"
                  className="jx-auth-input"
                  placeholder={tx({ en: "John Doe", bn: "আপনার নাম" })}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="jx-auth-field">
              <label htmlFor="reg-email" className="jx-auth-label">
                {tx({ en: "Email address", bn: "ইমেইল ঠিকানা" })}
              </label>
              <div className="jx-auth-input-wrap">
                <span className="jx-auth-input-icon" aria-hidden>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <input
                  id="reg-email"
                  type="email"
                  className="jx-auth-input"
                  placeholder={tx({ en: "you@example.com", bn: "আপনার@ইমেইল.com" })}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
          </div>

          <div className="jx-auth-field">
            <label htmlFor="reg-password" className="jx-auth-label">
              {tx({ en: "Password", bn: "পাসওয়ার্ড" })}
            </label>
            <div className="jx-auth-input-wrap">
              <span className="jx-auth-input-icon" aria-hidden>
                <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className="jx-auth-input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="jx-auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            {/* Strength meter */}
            {form.password && (
              <div className="jx-pw-meter">
                <div className="jx-pw-bars">
                  {[1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      className={`jx-pw-bar ${passwordStrength >= lvl ? strengthClass : ""}`}
                    />
                  ))}
                </div>
                <span className={`jx-pw-label ${strengthClass}`}>{strengthLabel}</span>
              </div>
            )}
          </div>

          <div className="jx-auth-field">
            <label htmlFor="reg-confirm" className="jx-auth-label">
              {tx({ en: "Confirm password", bn: "পাসওয়ার্ড নিশ্চিত করুন" })}
            </label>
            <div className="jx-auth-input-wrap">
              <span className="jx-auth-input-icon" aria-hidden>
                <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                className={`jx-auth-input ${form.confirm && form.confirm !== form.password ? "jx-input-error" : ""}`}
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="jx-auth-eye"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide" : "Show"}
              >
                {showConfirm ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            {form.confirm && form.confirm !== form.password && (
              <p className="jx-auth-field-error">
                {tx({ en: "Passwords do not match", bn: "পাসওয়ার্ড মিলছে না" })}
              </p>
            )}
          </div>

          {/* Terms */}
          <label className="jx-auth-terms">
            <input
              type="checkbox"
              id="reg-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="jx-auth-checkbox"
            />
            <span>
              {tx({ en: "I agree to the", bn: "আমি রাজি" })}{" "}
              <a href="#" className="jx-auth-switch-link">{tx({ en: "Terms of Service", bn: "পরিষেবার শর্তাবলী" })}</a>{" "}
              {tx({ en: "and", bn: "এবং" })}{" "}
              <a href="#" className="jx-auth-switch-link">{tx({ en: "Privacy Policy", bn: "গোপনীয়তা নীতি" })}</a>
            </span>
          </label>

          <button
            type="submit"
            id="register-submit-btn"
            className="jx-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="jx-auth-spinner" aria-hidden />
                {tx({ en: "Creating account…", bn: "অ্যাকাউন্ট তৈরি হচ্ছে…" })}
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17" aria-hidden>
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                {tx({ en: "Create account", bn: "অ্যাকাউন্ট তৈরি করুন" })}
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="jx-auth-switch">
          {tx({ en: "Already have an account?", bn: "ইতিমধ্যে অ্যাকাউন্ট আছে?" })}{" "}
          <Link href="/login" className="jx-auth-switch-link">
            {tx({ en: "Sign in", bn: "সাইন ইন" })}
          </Link>
        </p>
      </div>

      {/* Right panel */}
      <aside className="jx-auth-panel" aria-label="Platform features">
        <div className="jx-auth-panel-inner">
          <div className="jx-auth-panel-brand">
            <span className="jx-brand-name">Jachai<span className="jx-brand-x">X</span></span>
            <small>{tx({ en: "AI Verification Platform", bn: "এআই ভেরিফিকেশন প্ল্যাটফর্ম" })}</small>
          </div>

          <blockquote className="jx-auth-quote">
            <p>"{tx({ en: "Start verifying claims in seconds. Join thousands of fact-checkers, journalists, and researchers on JachaiX.", bn: "সেকেন্ডের মধ্যে দাবি যাচাই শুরু করুন। হাজারো ফ্যাক্ট-চেকার, সাংবাদিক এবং গবেষকদের সাথে JachaiX-এ যোগ দিন।" })}"</p>
          </blockquote>

          <ul className="jx-auth-features">
            {[
              tx({ en: "✓  AI-powered claim analysis", bn: "✓  এআই-চালিত দাবি বিশ্লেষণ" }),
              tx({ en: "✓  Multi-modal verification (text, image, PDF)", bn: "✓  মাল্টি-মোডাল যাচাই (টেক্সট, ছবি, পিডিএফ)" }),
              tx({ en: "✓  50+ trusted source integrations", bn: "✓  ৫০+ বিশ্বস্ত সূত্র ইন্টিগ্রেশন" }),
              tx({ en: "✓  Real-time evidence retrieval", bn: "✓  রিয়েল-টাইম এভিডেন্স রিট্রিভাল" }),
              tx({ en: "✓  Bangla + English support", bn: "✓  বাংলা + ইংরেজি সাপোর্ট" }),
              tx({ en: "✓  Human-reviewed verdicts", bn: "✓  মানব-পর্যালোচিত রায়" }),
            ].map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          <div className="jx-auth-stats">
            <div className="jx-auth-stat">
              <strong>25,000+</strong>
              <span>{tx({ en: "Claims analyzed", bn: "ক্লেম বিশ্লেষিত" })}</span>
            </div>
            <div className="jx-auth-stat">
              <strong>95%</strong>
              <span>{tx({ en: "Accuracy rate", bn: "নির্ভুলতার হার" })}</span>
            </div>
            <div className="jx-auth-stat">
              <strong>Free</strong>
              <span>{tx({ en: "To get started", bn: "শুরু করতে" })}</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
