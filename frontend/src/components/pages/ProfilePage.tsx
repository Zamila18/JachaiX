"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/countries";
import { changePassword, deleteAvatar, setAvatar, updateProfile } from "@/lib/api";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

export function ProfilePage() {
  return (
    <ProtectedRoute requiredRole="user">
      <Profile />
    </ProtectedRoute>
  );
}

type Tab = "personal" | "password" | "account";

function Profile() {
  const { user, token, updateUser, logout } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("personal");

  if (!user) return null;

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}` || "U";

  return (
    <div className="jxu-page">
      <header className="jxu-page-head">
        <h1>{t.profile.title}</h1>
        <p>{t.profile.subtitle}</p>
      </header>

      <div className="jxu-profile-grid">
        {/* Left card */}
        <aside className="jxu-card jxu-profile-aside">
          <AvatarBlock initials={initials} />
          <div className="jxu-profile-name">
            <strong>{user.first_name} {user.last_name}</strong>
            <small>{user.email}</small>
          </div>
          <nav className="jxu-tabs">
            <button className={tab === "personal" ? "active" : ""} onClick={() => setTab("personal")}>{t.profile.tabPersonal}</button>
            <button className={tab === "password" ? "active" : ""} onClick={() => setTab("password")}>{t.profile.tabPassword}</button>
            <button className={tab === "account" ? "active" : ""} onClick={() => setTab("account")}>{t.profile.tabAccount}</button>
            <button className="jxu-tab-logout" onClick={logout}>{t.userNav.logout}</button>
          </nav>
        </aside>

        {/* Right content */}
        <section className="jxu-card jxu-profile-main">
          {tab === "personal" && <PersonalTab />}
          {tab === "password" && <PasswordTab />}
          {tab === "account" && <AccountTab />}
        </section>
      </div>
    </div>
  );

  function AvatarBlock({ initials }: { initials: string }) {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !token) return;
      setErr("");
      setBusy(true);
      try {
        const url = await uploadToCloudinary(file);
        const res = await setAvatar(token, url);
        updateUser(res.user);
      } catch (e2: unknown) {
        setErr(e2 instanceof Error ? e2.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    };

    const onRemove = async () => {
      if (!token) return;
      setBusy(true);
      setErr("");
      try {
        const res = await deleteAvatar(token);
        updateUser(res.user);
      } catch (e2: unknown) {
        setErr(e2 instanceof Error ? e2.message : "Failed.");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="jxu-avatar-block">
        <div className="jxu-avatar-lg">
          {user?.profile_picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profile_picture} alt="Profile" />
          ) : (
            <span>{initials}</span>
          )}
          {busy && <div className="jxu-avatar-busy">{t.profile.uploading}</div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <div className="jxu-avatar-actions">
          <button className="jxu-btn jxu-btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {t.profile.changePhoto}
          </button>
          {user?.profile_picture && (
            <button className="jxu-btn jxu-btn-ghost jxu-btn-sm" disabled={busy} onClick={onRemove}>
              {t.profile.removePhoto}
            </button>
          )}
        </div>
        {!isCloudinaryConfigured() && (
          <small className="jxu-hint-warn">Image upload not configured (set Cloudinary env vars).</small>
        )}
        {err && <small className="jxu-field-err">{err}</small>}
      </div>
    );
  }

  function PersonalTab() {
    const [f, setF] = useState({
      first_name: user!.first_name ?? "",
      last_name: user!.last_name ?? "",
      phone: user!.phone ?? "",
      country: user!.country ?? "",
      gender: user!.gender ?? "",
      date_of_birth: user!.date_of_birth ?? "",
    });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);
    const today = new Date().toISOString().slice(0, 10);

    const submit = async (e: FormEvent) => {
      e.preventDefault();
      if (!token) return;
      setMsg(""); setErr(""); setSaving(true);
      try {
        const res = await updateProfile(token, {
          first_name: f.first_name,
          last_name: f.last_name,
          phone: f.phone,
          country: f.country,
          gender: f.gender || undefined,
          date_of_birth: f.date_of_birth || undefined,
        });
        updateUser(res.user);
        setMsg(res.message);
      } catch (e2: unknown) {
        setErr(e2 instanceof Error ? e2.message : "Update failed.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <form onSubmit={submit} className="jxu-form">
        <h2>{t.profile.personalHeading}</h2>
        {msg && <div className="jxu-banner ok">{msg}</div>}
        {err && <div className="jxu-banner err">{err}</div>}

        <div className="jxu-form-row">
          <Field label={t.auth.firstName}>
            <input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} required />
          </Field>
          <Field label={t.auth.lastName}>
            <input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} required />
          </Field>
        </div>

        <div className="jxu-form-row">
          <Field label={t.auth.username}>
            <input value={user!.username} readOnly disabled />
          </Field>
          <Field label={`${t.auth.email} (${t.profile.emailNote})`}>
            <input value={user!.email} readOnly disabled />
          </Field>
        </div>

        <div className="jxu-form-row">
          <Field label={t.auth.phone}>
            <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+8801711234567" required />
          </Field>
          <Field label={t.auth.country}>
            <select value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} required>
              <option value="">{t.auth.selectCountry}</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="jxu-form-row">
          <Field label={t.auth.gender}>
            <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
              <option value="">{t.auth.genderNone}</option>
              <option value="male">{t.auth.genderMale}</option>
              <option value="female">{t.auth.genderFemale}</option>
              <option value="other">{t.auth.genderOther}</option>
            </select>
          </Field>
          <Field label={t.auth.dob}>
            <input type="date" max={today} value={f.date_of_birth ?? ""} onChange={(e) => setF({ ...f, date_of_birth: e.target.value })} />
          </Field>
        </div>

        <button type="submit" className="jxu-btn" disabled={saving}>
          {saving ? t.profile.saving : t.profile.save}
        </button>
      </form>
    );
  }

  function PasswordTab() {
    const [cur, setCur] = useState("");
    const [nw, setNw] = useState("");
    const [cf, setCf] = useState("");
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async (e: FormEvent) => {
      e.preventDefault();
      if (!token) return;
      setMsg(""); setErr(""); setSaving(true);
      try {
        const res = await changePassword(token, cur, nw, cf);
        setMsg(res.message);
        setCur(""); setNw(""); setCf("");
      } catch (e2: unknown) {
        setErr(e2 instanceof Error ? e2.message : "Failed.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <form onSubmit={submit} className="jxu-form">
        <h2>{t.profile.pwHeading}</h2>
        {msg && <div className="jxu-banner ok">{msg}</div>}
        {err && <div className="jxu-banner err">{err}</div>}

        <Field label={t.profile.currentPassword}>
          <PasswordInput value={cur} onChange={setCur} required autoComplete="current-password" />
        </Field>
        <Field label={t.profile.newPassword}>
          <PasswordInput value={nw} onChange={setNw} required autoComplete="new-password" />
        </Field>
        <small className="jxu-hint">{t.auth.passwordHint}</small>
        <Field label={t.profile.confirmNewPassword}>
          <PasswordInput value={cf} onChange={setCf} required autoComplete="new-password" />
        </Field>

        <button type="submit" className="jxu-btn" disabled={saving}>
          {saving ? t.profile.updating : t.profile.updatePassword}
        </button>
      </form>
    );
  }

  function AccountTab() {
    const created = user!.created_at ? new Date(user!.created_at).toLocaleDateString() : "—";
    return (
      <div className="jxu-form">
        <h2>{t.profile.accountHeading}</h2>
        <dl className="jxu-account-list">
          <div><dt>{t.profile.role}</dt><dd><span className="jxu-badge green">{user!.role}</span></dd></div>
          <div><dt>{t.profile.memberSince}</dt><dd>{created}</dd></div>
          <div>
            <dt>{t.profile.emailVerified}</dt>
            <dd>
              {user!.email_verified
                ? <span className="jxu-badge green">{t.profile.verified}</span>
                : <span className="jxu-badge gray">{t.profile.notVerified}</span>}
            </dd>
          </div>
        </dl>
        <button className="jxu-btn jxu-btn-ghost" onClick={logout}>{t.userNav.logout}</button>
      </div>
    );
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="jxu-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
