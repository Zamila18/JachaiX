"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { loginUser } from "@/lib/api";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(email.trim(), password, remember);

      if ("role" in res && res.role === "admin") {
        login(res.token, "admin", undefined, res.email);
        router.push(params.get("returnUrl") || "/admin/dashboard");
      } else if ("user" in res) {
        login(res.token, "user", res.user);
        router.push(params.get("returnUrl") || "/user/profile");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jx-auth-page">
      <div className="jx-auth-card">
        <div className="jx-auth-langbar">
          <LanguageSwitcher />
        </div>
        <div className="jx-auth-header">
          <Link href="/" className="jx-auth-brand">
            Jachai<span>X</span>
          </Link>
          <h1>{t.auth.loginTitle}</h1>
          <p>{t.auth.loginSubtitle}</p>
        </div>

        <form className="jx-auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="jx-auth-error">{error}</div>}

          <div className="jx-field">
            <label htmlFor="email">{t.auth.email}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="jx-field">
            <label htmlFor="password">{t.auth.password}</label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
          </div>

          <div className="jx-field-row">
            <label className="jx-checkbox">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>{t.auth.rememberMe}</span>
            </label>
          </div>

          <button type="submit" className="jx-auth-btn" disabled={loading}>
            {loading ? t.auth.signingIn : t.auth.signIn}
          </button>
        </form>

        <div className="jx-auth-footer">
          <p>
            {t.auth.noAccount} <Link href="/register">{t.auth.createOne}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
