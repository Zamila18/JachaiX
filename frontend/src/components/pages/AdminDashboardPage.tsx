"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const { adminEmail, logout } = useAuth();

  return (
    <div className="jx-auth-page">
      <div className="jx-dashboard-card">
        <div className="jx-dashboard-header">
          <Link href="/" className="jx-auth-brand">
            Jachai<span>X</span>
          </Link>
          <h1>Admin Dashboard</h1>
        </div>

        <div className="jx-admin-info">
          <div className="jx-avatar-initials jx-avatar-admin">A</div>
          <div>
            <p className="jx-profile-username">{adminEmail}</p>
            <span className="jx-role-badge jx-role-badge--admin">Administrator</span>
          </div>
        </div>

        <div className="jx-dashboard-actions">
          <Link href="/dashboard" className="jx-auth-btn">Operations Dashboard</Link>
          <Link href="/admin" className="jx-auth-btn jx-auth-btn--outline">Admin Publish Queue</Link>
          <button className="jx-auth-btn jx-auth-btn--ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </div>
  );
}
