"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const TOKEN_KEY = "jx_token";

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  country?: string;
  profile_picture?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  role: "user";
  email_verified: boolean;
  created_at?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  role: "user" | "admin" | null;
  adminEmail: string | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, role: "user" | "admin", userData?: AuthUser, adminEmail?: string) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    adminEmail: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: { user?: AuthUser; role?: string; email?: string }) => {
        if (data.role === "admin") {
          setState({ user: null, role: "admin", adminEmail: data.email ?? null, token, loading: false });
        } else if (data.user) {
          setState({ user: data.user, role: "user", adminEmail: null, token, loading: false });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setState({ user: null, role: null, adminEmail: null, token: null, loading: false });
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, role: null, adminEmail: null, token: null, loading: false });
      });
  }, []);

  const login = useCallback(
    (token: string, role: "user" | "admin", userData?: AuthUser, adminEmail?: string) => {
      localStorage.setItem(TOKEN_KEY, token);
      setState({ user: userData ?? null, role, adminEmail: adminEmail ?? null, token, loading: false });
    },
    []
  );

  const logout = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, role: null, adminEmail: null, token: null, loading: false });
  }, []);

  const updateUser = useCallback((user: AuthUser) => {
    setState(s => ({ ...s, user }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: state.role !== null,
      isAdmin: state.role === "admin",
      login,
      logout,
      updateUser,
    }),
    [state, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
