"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

const BASE = "/api/v1";

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 28px", fontFamily: "var(--font-body, 'Inter', sans-serif)" }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: sub ? 4 : 20, fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>{title}</div>
      {sub && <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>{sub}</div>}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 12px",
  fontSize: 13, color: "#0f172a", background: "#f8fafc", outline: "none", boxSizing: "border-box",
};

export default function SettingsPage() {
  const { adminEmail, token } = useAuth();

  const [pwForm, setPwForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwStatus({ type: "error", msg: "Passwords do not match." }); return;
    }
    if (pwForm.password.length < 8) {
      setPwStatus({ type: "error", msg: "Password must be at least 8 characters." }); return;
    }
    setPwLoading(true); setPwStatus(null);
    try {
      const r = await fetch(`${BASE}/user/password`, {
        method: "POST",
        headers: { ...authHeader(token), "Content-Type": "application/json" },
        body: JSON.stringify(pwForm),
      });
      if (r.ok) {
        setPwStatus({ type: "success", msg: "Password updated successfully." });
        setPwForm({ current_password: "", password: "", password_confirmation: "" });
      } else {
        const d = await r.json().catch(() => ({}));
        setPwStatus({ type: "error", msg: d.message ?? "Failed to update password." });
      }
    } catch { setPwStatus({ type: "error", msg: "Network error. Please try again." }); }
    finally { setPwLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720, fontFamily: "var(--font-body, 'Inter', sans-serif)" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>Settings</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Manage your admin account preferences</p>
      </div>

      {/* Profile */}
      <Section title="Profile" sub="Your administrator account information">
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
            {adminEmail ? adminEmail.slice(0, 2).toUpperCase() : "AD"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Admin User</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{adminEmail}</div>
            <span style={{ display: "inline-block", marginTop: 4, background: "#f0fdf4", color: "#16a34a", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Administrator</span>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Email Address">
            <input value={adminEmail ?? ""} disabled style={{ ...inputStyle, color: "#94a3b8", cursor: "not-allowed" }} />
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Admin email is configured via environment variables and cannot be changed here.</div>
          </Field>
          <Field label="Role">
            <input value="Administrator" disabled style={{ ...inputStyle, color: "#94a3b8", cursor: "not-allowed" }} />
          </Field>
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" sub="Update your account password">
        <form onSubmit={handlePwChange}>
          <Field label="Current Password">
            <input type="password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} placeholder="Enter current password" required style={inputStyle} />
          </Field>
          <Field label="New Password">
            <input type="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" required style={inputStyle} />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" value={pwForm.password_confirmation} onChange={e => setPwForm(f => ({ ...f, password_confirmation: e.target.value }))} placeholder="Repeat new password" required style={inputStyle} />
          </Field>
          {pwStatus && (
            <div style={{ background: pwStatus.type === "success" ? "#f0fdf4" : "#fee2e2", color: pwStatus.type === "success" ? "#16a34a" : "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {pwStatus.msg}
            </div>
          )}
          <button type="submit" disabled={pwLoading} style={{ background: pwLoading ? "#e2e8f0" : "#22c55e", color: pwLoading ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: pwLoading ? "not-allowed" : "pointer" }}>
            {pwLoading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Section>

    </div>
  );
}
