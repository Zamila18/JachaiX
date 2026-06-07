"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { loginUser } from "@/lib/auth";

export function LoginPage() {
  const { tx } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError(tx({ en: "Please fill in all fields.", bn: "সকল তথ্য পূরণ করুন।" }));
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="jx-auth-page">
      {/* Decorative grid pattern background */}
      <div className="jx-auth-bg" aria-hidden />

      <div className="jx-auth-card">
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
              <path d="M14 23l4 4 8-8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="jx-auth-title">
            {tx({ en: "Welcome back", bn: "স্বাগতম" })}
          </h1>
          <p className="jx-auth-subtitle">
            {tx({ en: "Sign in to your JachaiX account", bn: "আপনার JachaiX অ্যাকাউন্টে সাইন ইন করুন" })}
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

          <div className="jx-auth-field">
            <label htmlFor="login-email" className="jx-auth-label">
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
                id="login-email"
                type="email"
                className="jx-auth-input"
                placeholder={tx({ en: "you@example.com", bn: "আপনার@ইমেইল.com" })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="jx-auth-field">
            <div className="jx-auth-label-row">
              <label htmlFor="login-password" className="jx-auth-label">
                {tx({ en: "Password", bn: "পাসওয়ার্ড" })}
              </label>
              <a href="#" className="jx-auth-forgot">
                {tx({ en: "Forgot password?", bn: "পাসওয়ার্ড ভুলে গেছেন?" })}
              </a>
            </div>
            <div className="jx-auth-input-wrap">
              <span className="jx-auth-input-icon" aria-hidden>
                <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="jx-auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="jx-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="jx-auth-spinner" aria-hidden />
                {tx({ en: "Signing in…", bn: "সাইন ইন হচ্ছে…" })}
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17" aria-hidden>
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {tx({ en: "Sign in", bn: "সাইন ইন" })}
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="jx-auth-switch">
          {tx({ en: "Don't have an account?", bn: "অ্যাকাউন্ট নেই?" })}{" "}
          <Link href="/register" className="jx-auth-switch-link">
            {tx({ en: "Create account", bn: "অ্যাকাউন্ট তৈরি করুন" })}
          </Link>
        </p>
      </div>

      {/* Right panel: trust indicators */}
      <aside className="jx-auth-panel" aria-label="Trust indicators">
        <div className="jx-auth-panel-inner">
          <div className="jx-auth-panel-brand">
            <span className="jx-brand-name">Jachai<span className="jx-brand-x">X</span></span>
            <small>{tx({ en: "AI Verification Platform", bn: "এআই ভেরিফিকেশন প্ল্যাটফর্ম" })}</small>
          </div>

          <blockquote className="jx-auth-quote">
            <p>"{tx({ en: "Fighting misinformation with AI-powered evidence retrieval, source verification, and human-reviewed verdicts.", bn: "এআই-চালিত এভিডেন্স রিট্রিভাল, সূত্র যাচাই এবং মানব-পর্যালোচিত রায় দিয়ে ভ্রান্ততথ্যের বিরুদ্ধে লড়াই।" })}"</p>
          </blockquote>

          <div className="jx-auth-trust-grid">
            {[
              { icon: "🛡️", label: tx({ en: "Secure & Encrypted", bn: "নিরাপদ ও এনক্রিপ্টেড" }) },
              { icon: "⚡", label: tx({ en: "Real-time Verification", bn: "রিয়েল-টাইম যাচাই" }) },
              { icon: "🌐", label: tx({ en: "Bangla-first AI", bn: "বাংলা-প্রথম এআই" }) },
              { icon: "🔍", label: tx({ en: "50+ Trusted Sources", bn: "৫০+ বিশ্বস্ত সূত্র" }) },
            ].map((item) => (
              <div key={item.label} className="jx-auth-trust-item">
                <span className="jx-auth-trust-icon" aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

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
              <strong>8,000+</strong>
              <span>{tx({ en: "Verified reports", bn: "যাচাইকৃত রিপোর্ট" })}</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
