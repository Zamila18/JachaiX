/**
 * Auth helper — handles registration, login, logout, and token storage.
 *
 * Uses Sanctum API tokens stored in localStorage.
 * All auth endpoints are proxied through Next.js rewrites → /api/v1/auth/*
 */

const BASE = "/api/v1";
const TOKEN_KEY = "jx_auth_token";

/* ── Token helpers ──────────────────────────────────────────────────────── */

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/* ── Shared fetch with auth header ──────────────────────────────────────── */

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { ...init, headers });
}

/* ── Response parser ────────────────────────────────────────────────────── */

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthSuccess {
  success: true;
  message: string;
  user: AuthUser;
  token: string;
}

interface AuthError {
  message?: string;
  errors?: Record<string, string[]>;
}

async function parseAuthResponse(response: Response): Promise<AuthSuccess> {
  const data = await response.json();

  if (!response.ok) {
    const err = data as AuthError;

    // Extract first validation error if present
    if (err.errors) {
      const firstField = Object.keys(err.errors)[0];
      const firstMsg = firstField ? err.errors[firstField]?.[0] : undefined;
      if (firstMsg) throw new Error(firstMsg);
    }

    throw new Error(err.message || `Request failed (${response.status})`);
  }

  return data as AuthSuccess;
}

/* ── API calls ──────────────────────────────────────────────────────────── */

export async function registerUser(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthSuccess> {
  const response = await authFetch(`${BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });

  const result = await parseAuthResponse(response);
  setToken(result.token);
  return result;
}

export async function loginUser(email: string, password: string): Promise<AuthSuccess> {
  const response = await authFetch(`${BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const result = await parseAuthResponse(response);
  setToken(result.token);
  return result;
}

export async function logoutUser(): Promise<void> {
  try {
    await authFetch(`${BASE}/auth/logout`, { method: "POST" });
  } catch {
    // Swallow errors — we clear the token regardless
  }
  clearToken();
}

export async function getMe(): Promise<AuthUser | null> {
  if (!isLoggedIn()) return null;

  try {
    const response = await authFetch(`${BASE}/auth/me`);
    if (!response.ok) {
      clearToken();
      return null;
    }
    const data = await response.json();
    return (data as { user: AuthUser }).user;
  } catch {
    clearToken();
    return null;
  }
}
