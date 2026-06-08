"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { registerUser } from "@/lib/api";
import { COUNTRIES, COUNTRY_CODES } from "@/lib/countries";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    first_name: "", last_name: "", username: "", email: "",
    dialCode: "+880", localPhone: "",
    country: "", password: "", password_confirmation: "",
    gender: "", date_of_birth: "",
  });
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!form.country) {
      setFieldErrors((fe) => ({ ...fe, country: "Please select a country." }));
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        phone: form.dialCode + form.localPhone,
        country: form.country,
        password: form.password,
        password_confirmation: form.password_confirmation,
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
      });

      login(res.token, "user", res.user);
      router.push("/user/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jx-auth-page">
      <div className="jx-auth-card jx-auth-card--wide">
        <div className="jx-auth-langbar">
          <LanguageSwitcher />
        </div>
        <div className="jx-auth-header">
          <Link href="/" className="jx-auth-brand">
            Jachai<span>X</span>
          </Link>
          <h1>{t.auth.registerTitle}</h1>
          <p>{t.auth.registerSubtitle}</p>
        </div>

        <form className="jx-auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="jx-auth-error">{error}</div>}

          <div className="jx-field-row">
            <div className="jx-field">
              <label>{t.auth.firstName}</label>
              <input type="text" required value={form.first_name} onChange={set("first_name")} placeholder="First" />
            </div>
            <div className="jx-field">
              <label>{t.auth.lastName}</label>
              <input type="text" required value={form.last_name} onChange={set("last_name")} placeholder="Last" />
            </div>
          </div>

          <div className="jx-field">
            <label>{t.auth.username}</label>
            <input type="text" required value={form.username} onChange={set("username")} placeholder="letters, numbers, underscores" />
          </div>

          <div className="jx-field">
            <label>{t.auth.email}</label>
            <input type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </div>

          <div className="jx-field">
            <label>{t.auth.phone}</label>
            <div className="jx-phone-row">
              <select value={form.dialCode} onChange={set("dialCode")} className="jx-dial-select">
                {COUNTRY_CODES.map((cc) => (
                  <option key={cc.code} value={cc.code}>{cc.label}</option>
                ))}
              </select>
              <input type="tel" required value={form.localPhone} onChange={set("localPhone")} placeholder="01711234567" className="jx-phone-input" />
            </div>
          </div>

          <div className="jx-field" style={{ position: "relative" }}>
            <label>{t.auth.country}</label>
            <input
              type="text"
              readOnly
              value={form.country}
              onClick={() => setCountryOpen((o) => !o)}
              placeholder={t.auth.selectCountry}
              className={fieldErrors.country ? "jx-input-error" : ""}
              style={{ cursor: "pointer" }}
            />
            {fieldErrors.country && <span className="jx-field-error">{fieldErrors.country}</span>}
            {countryOpen && (
              <div className="jx-country-dropdown">
                <input
                  type="text"
                  placeholder={t.auth.search}
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="jx-country-search"
                  autoFocus
                />
                <ul className="jx-country-list">
                  {filteredCountries.map((c) => (
                    <li
                      key={c}
                      className={form.country === c ? "selected" : ""}
                      onClick={() => { setForm((f) => ({ ...f, country: c })); setCountryOpen(false); setCountrySearch(""); }}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="jx-field">
            <label>{t.auth.password}</label>
            <PasswordInput
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder={t.auth.passwordHint}
              autoComplete="new-password"
              required
            />
            <small className="jx-field-hint">{t.auth.passwordHint}</small>
          </div>

          <div className="jx-field">
            <label>{t.auth.confirmPassword}</label>
            <PasswordInput
              value={form.password_confirmation}
              onChange={(v) => setForm((f) => ({ ...f, password_confirmation: v }))}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="jx-field-row">
            <div className="jx-field">
              <label>{t.auth.gender} <span className="jx-optional">{t.auth.optional}</span></label>
              <select value={form.gender} onChange={set("gender")}>
                <option value="">{t.auth.genderNone}</option>
                <option value="male">{t.auth.genderMale}</option>
                <option value="female">{t.auth.genderFemale}</option>
                <option value="other">{t.auth.genderOther}</option>
              </select>
            </div>
            <div className="jx-field">
              <label>{t.auth.dob} <span className="jx-optional">{t.auth.optional}</span></label>
              <input type="date" max={today} value={form.date_of_birth} onChange={set("date_of_birth")} />
            </div>
          </div>

          <button type="submit" className="jx-auth-btn" disabled={loading}>
            {loading ? t.auth.creating : t.auth.createAccount}
          </button>
        </form>

        <div className="jx-auth-footer">
          <p>{t.auth.haveAccount} <Link href="/login">{t.auth.signIn}</Link></p>
        </div>
      </div>
    </div>
  );
}
