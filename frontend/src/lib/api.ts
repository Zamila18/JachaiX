import {
  AdminCompletedClaimItem,
  ClaimResult,
  ClaimStatusResponse,
  LatestEvaluationMetrics,
  DocsLiveData,
  DocsPageData,
  DocsTeamMember,
  DocsVisibility,
  PublicFactCheckDetail,
  PublicFactCheckListItem,
} from "@/lib/types";

const BASE = "/api/v1";

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const status = response.status;

    let message = `API request failed (${status} ${response.statusText || "error"})`;

    if (contentType.includes("application/json")) {
      try {
        const payload = (await response.json()) as {
          message?: string;
          error?: string;
          errors?: Record<string, string[] | string>;
        };

        if (payload?.message) {
          message = payload.message;
        } else if (payload?.error) {
          message = payload.error;
        } else if (payload?.errors) {
          const firstField = Object.keys(payload.errors)[0];
          const firstValue = firstField ? payload.errors[firstField] : undefined;
          if (Array.isArray(firstValue) && firstValue.length) {
            message = String(firstValue[0]);
          } else if (typeof firstValue === "string" && firstValue.trim()) {
            message = firstValue;
          }
        }
      } catch {
        // Ignore malformed JSON and fall back to status-driven message.
      }
    } else {
      const body = (await response.text()).trim();
      const looksLikeHtml = /^\s*<(!doctype|html|head|body)/i.test(body) || /<title>.*<\/title>/i.test(body);

      if (!looksLikeHtml && body) {
        const singleLine = body.replace(/\s+/g, " ").slice(0, 220);
        message = singleLine;
      }
    }

    if (status === 502 || status === 503 || status === 504) {
      message = "Service temporarily unavailable (gateway error). Please retry in a moment.";
    }

    throw new Error(message);
  }
  return (await response.json()) as T;
}

// Attach the logged-in user's token (if any) so claims/reviews are attributed
// to their account. Guests omit it and stay anonymous (public submission).
function storedAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("jx_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function submitTextClaim(text: string, language: string) {
  const response = await fetch(`${BASE}/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...storedAuthHeader() },
    body: JSON.stringify({ text, language }),
  });

  return parseJson<{ claim_id?: number; job?: { id?: number } }>(response);
}

// Load a File into an <img> element (fallback when createImageBitmap is unavailable).
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Downscale large images in-browser before upload. This keeps the request body
// small (under the server's upload/body limits) and makes OCR noticeably faster.
// On ANY error it returns the original file untouched, so uploads never break.
async function downscaleImage(file: File, maxEdge = 1600, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  try {
    let width = 0, height = 0;
    let source: CanvasImageSource;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (bitmap) {
      width = bitmap.width; height = bitmap.height; source = bitmap;
    } else {
      const img = await loadImageElement(file);
      width = img.naturalWidth; height = img.naturalHeight; source = img;
    }
    if (!width || !height) return file;

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    // Already small in both dimensions and bytes → no need to re-encode.
    if (scale === 1 && file.size < 900 * 1024) return file;

    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";          // flatten transparency (screenshots) to white
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    // Keep whichever is smaller (avoid making an already-tiny file bigger).
    if (blob.size >= file.size && scale === 1) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

async function submitFileClaim(endpoint: "image" | "pdf", file: File, language: string) {
  // Images are downscaled client-side; PDFs are sent as-is.
  const upload = endpoint === "image" ? await downscaleImage(file) : file;

  const formData = new FormData();
  formData.append("file", upload);
  formData.append("language", language);

  const response = await fetch(`${BASE}/analyze/${endpoint}`, {
    method: "POST",
    headers: { ...storedAuthHeader() },
    body: formData,
  });

  return parseJson<{ claim_id?: number; job?: { id?: number } }>(response);
}

export async function submitImageClaim(file: File, language: string) {
  return submitFileClaim("image", file, language);
}

export async function submitPdfClaim(file: File, language: string) {
  return submitFileClaim("pdf", file, language);
}

export async function getClaimStatus(claimId: number) {
  const response = await fetch(`${BASE}/claims/${claimId}/status`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<ClaimStatusResponse>(response);
}

export async function getClaimResult(claimId: number) {
  const response = await fetch(`${BASE}/claims/${claimId}/result`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await parseJson<{ claim: ClaimResult }>(response);
  return payload.claim;
}

export async function submitHumanReview(claimId: number, reason: string, notes: string, reporterName: string) {
  const response = await fetch(`${BASE}/claims/${claimId}/review-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...storedAuthHeader() },
    body: JSON.stringify({
      reason,
      notes,
      reporter_name: reporterName,
    }),
  });

  return parseJson<{
    success: boolean;
    message: string;
    review_request: {
      claim_id: number;
      event: string;
      reason: string;
      requested_at: string;
    };
  }>(response);
}

interface FactListFilters {
  scope?: "bangladesh" | "international";
  verdict?: string;
  language?: string;
  q?: string;
  origin?: "internal" | "external";
  perPage?: number;
}

export async function getPublicFactChecks(filters: FactListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.verdict) params.set("verdict", filters.verdict);
  if (filters.language) params.set("language", filters.language);
  if (filters.q) params.set("q", filters.q);
  if (filters.origin) params.set("origin", filters.origin);
  if (filters.perPage) params.set("per_page", String(filters.perPage));

  const response = await fetch(`${BASE}/public/fact-checks?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<{
    success: boolean;
    items: PublicFactCheckListItem[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  }>(response);
}

export async function getFeaturedFactChecks() {
  const response = await fetch(`${BASE}/public/fact-checks/featured`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<{ success: boolean; items: PublicFactCheckListItem[] }>(response);
}

export async function getPublicFactCheckDetail(slug: string) {
  const response = await fetch(`${BASE}/public/fact-checks/${slug}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<{ success: boolean; item: PublicFactCheckDetail }>(response);
}

export async function getAdminCompletedClaims(params: { q?: string; perPage?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.perPage) search.set("per_page", String(params.perPage));

  const response = await fetch(`${BASE}/admin/fact-checks/completed-claims?${search.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<{
    success: boolean;
    items: AdminCompletedClaimItem[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  }>(response);
}

export async function publishFactCheckFromClaim(
  claimId: number,
  payload: {
    title?: string;
    summary?: string;
    coverage_scope?: "bangladesh" | "international";
    language?: string;
    tags?: string[];
    is_featured?: boolean;
    published_by?: string;
    status?: "draft" | "review" | "published";
  }
) {
  const response = await fetch(`${BASE}/admin/fact-checks/from-claim/${claimId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson<{ success: boolean; item: PublicFactCheckListItem }>(response);
}

export async function updateAdminFactCheck(
  id: number,
  payload: {
    coverage_scope?: "bangladesh" | "international";
    is_featured?: boolean;
    tags?: string[];
    title?: string;
    summary?: string;
    status?: "draft" | "review" | "published";
    published_by?: string;
  }
) {
  const response = await fetch(`${BASE}/admin/fact-checks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson<{ success: boolean; item: PublicFactCheckListItem }>(response);
}

export async function getPublicDocs() {
  const response = await fetchWithTimeout(`${BASE}/docs`, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 403) {
    return (await response.json()) as {
      success: false;
      available: false;
      message: string;
      visibility: DocsVisibility;
    };
  }

  return parseJson<{
    success: true;
    available: true;
    page: DocsPageData;
    live_data: DocsLiveData;
  }>(response);
}

export async function getAdminDocs() {
  const response = await fetchWithTimeout(`${BASE}/admin/docs`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<{
    success: true;
    page: DocsPageData;
    visibility: DocsVisibility;
    live_data: DocsLiveData;
  }>(response);
}

export async function updateAdminDocs(payload: {
  team_name?: string | null;
  pitch_sections?: Array<{ id: string; title: string; content: string }>;
  technical_sections?: Record<string, unknown>;
  team_members?: DocsTeamMember[];
  updated_by?: string;
}) {
  const response = await fetch(`${BASE}/admin/docs`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson<{
    success: true;
    page: DocsPageData;
    visibility: DocsVisibility;
  }>(response);
}

export async function setAdminDocsVisibility(payload: { is_enabled: boolean; updated_by?: string }) {
  const response = await fetch(`${BASE}/admin/docs/visibility`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson<{
    success: true;
    page: DocsPageData;
    visibility: DocsVisibility;
  }>(response);
}

export async function setAdminDocsSchedule(payload: {
  available_from?: string | null;
  available_until?: string | null;
  duration_hours?: number;
  updated_by?: string;
}) {
  const response = await fetch(`${BASE}/admin/docs/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson<{
    success: true;
    page: DocsPageData;
    visibility: DocsVisibility;
  }>(response);
}

export async function getLatestEvaluationMetrics() {
  const response = await fetchWithTimeout(`${BASE}/admin/evaluation/latest`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<LatestEvaluationMetrics>(response);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function authHeader(token: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  password_confirmation: string;
  profile_picture?: string;
  gender?: string;
  date_of_birth?: string;
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{ message: string; user: import("./auth").AuthUser; token: string; redirect: string }>(response);
}

export async function loginUser(email: string, password: string, remember: boolean) {
  const response = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, remember }),
  });
  return parseJson<
    | { user: import("./auth").AuthUser; token: string; redirect: string }
    | { role: "admin"; email: string; token: string; redirect: string }
  >(response);
}

export async function logoutUser(token: string | null) {
  if (!token) return;
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
  });
}

export async function getMe(token: string) {
  const response = await fetch(`${BASE}/auth/me`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<
    | { user: import("./auth").AuthUser }
    | { role: "admin"; email: string }
  >(response);
}

// ── Activity & analytics ────────────────────────────────────────────────────

export interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityStatistics {
  totals: {
    claims: number;
    claims_verified: number;
    claims_this_month: number;
    claims_last_month: number;
    claims_change_pct: number;
    bookmarks: number;
    fact_views: number;
    review_requests: number;
    last_login: string | null;
  };
  verdicts: { true: number; false: number; misleading: number; unverified: number };
  usage_this_month: {
    claims_submitted: number;
    reviews_requested: number;
    fact_views: number;
    bookmarks_added: number;
    profile_updates: number;
    logins: number;
  };
  month_label: string;
}

export interface HistoryItem {
  id: number;
  claim_text: string | null;
  input_type: string;
  verdict: string | null;
  confidence_score: number | null;
  trust_label: string | null;
  status: string;
  language: string;
  created_at: string | null;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export async function getRecentActivity(token: string, limit = 6) {
  const response = await fetch(`${BASE}/activity/recent?limit=${limit}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; items: ActivityItem[] }>(response);
}

export async function getActivityFeed(
  token: string,
  opts: { page?: number; perPage?: number; type?: string; q?: string } = {}
) {
  const p = new URLSearchParams();
  if (opts.page) p.set("page", String(opts.page));
  if (opts.perPage) p.set("per_page", String(opts.perPage));
  if (opts.type) p.set("type", opts.type);
  if (opts.q) p.set("q", opts.q);

  const response = await fetch(`${BASE}/activity?${p.toString()}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; items: ActivityItem[]; pagination: Pagination }>(response);
}

export async function getActivityStatistics(token: string) {
  const response = await fetch(`${BASE}/activity/statistics`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; statistics: ActivityStatistics }>(response);
}

export async function getFactCheckHistory(token: string, opts: { page?: number; perPage?: number } = {}) {
  const p = new URLSearchParams();
  if (opts.page) p.set("page", String(opts.page));
  if (opts.perPage) p.set("per_page", String(opts.perPage));

  const response = await fetch(`${BASE}/activity/history?${p.toString()}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; items: HistoryItem[]; pagination: Pagination }>(response);
}

export async function getMyClaims(
  token: string,
  opts: { page?: number; perPage?: number; verdict?: string; status?: string; q?: string } = {}
) {
  const p = new URLSearchParams();
  if (opts.page) p.set("page", String(opts.page));
  if (opts.perPage) p.set("per_page", String(opts.perPage));
  if (opts.verdict) p.set("verdict", opts.verdict);
  if (opts.status) p.set("status", opts.status);
  if (opts.q) p.set("q", opts.q);

  const response = await fetch(`${BASE}/user/claims?${p.toString()}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; items: HistoryItem[]; pagination: Pagination }>(response);
}

// ── Profile ─────────────────────────────────────────────────────────────────

export interface ProfileUpdatePayload {
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  gender?: string;
  date_of_birth?: string;
}

export async function updateProfile(token: string, payload: ProfileUpdatePayload) {
  const response = await fetch(`${BASE}/user/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  });
  return parseJson<{ message: string; user: import("./auth").AuthUser }>(response);
}

export async function changePassword(
  token: string,
  current_password: string,
  password: string,
  password_confirmation: string
) {
  const response = await fetch(`${BASE}/user/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ current_password, password, password_confirmation }),
  });
  return parseJson<{ message: string }>(response);
}

export async function setAvatar(token: string, profile_picture: string) {
  const response = await fetch(`${BASE}/user/avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ profile_picture }),
  });
  return parseJson<{ message: string; user: import("./auth").AuthUser }>(response);
}

export async function deleteAvatar(token: string) {
  const response = await fetch(`${BASE}/user/avatar`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return parseJson<{ message: string; user: import("./auth").AuthUser }>(response);
}

// ── Bookmarks ───────────────────────────────────────────────────────────────

export interface BookmarkItem {
  bookmark_id: number;
  bookmarked_at: string;
  fact_check: {
    id: number;
    slug: string;
    title: string;
    summary: string | null;
    verdict: string | null;
    coverage_scope: string | null;
    language: string | null;
    cover_image: string | null;
    published_at: string | null;
  } | null;
}

export async function getBookmarks(token: string, opts: { page?: number; perPage?: number } = {}) {
  const p = new URLSearchParams();
  if (opts.page) p.set("page", String(opts.page));
  if (opts.perPage) p.set("per_page", String(opts.perPage));
  const response = await fetch(`${BASE}/user/bookmarks?${p.toString()}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; items: BookmarkItem[]; pagination: Pagination }>(response);
}

export async function getBookmarkIds(token: string) {
  const response = await fetch(`${BASE}/user/bookmarks/ids`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; ids: number[] }>(response);
}

export async function addBookmark(token: string, factCheckId: number) {
  const response = await fetch(`${BASE}/user/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ fact_check_id: factCheckId }),
  });
  return parseJson<{ success: boolean; bookmarked: boolean }>(response);
}

export async function removeBookmark(token: string, factCheckId: number) {
  const response = await fetch(`${BASE}/user/bookmarks/${factCheckId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return parseJson<{ success: boolean; bookmarked: boolean }>(response);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(token: string, opts: { page?: number; perPage?: number } = {}) {
  const p = new URLSearchParams();
  if (opts.page) p.set("page", String(opts.page));
  if (opts.perPage) p.set("per_page", String(opts.perPage));
  const response = await fetch(`${BASE}/user/notifications?${p.toString()}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; items: NotificationItem[]; pagination: Pagination }>(response);
}

export async function getUnreadCount(token: string) {
  const response = await fetch(`${BASE}/user/notifications/unread-count`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; unread: number }>(response);
}

export async function markNotificationRead(token: string, id: number) {
  const response = await fetch(`${BASE}/user/notifications/${id}/read`, {
    method: "POST",
    headers: authHeader(token),
  });
  return parseJson<{ success: boolean }>(response);
}

export async function markAllNotificationsRead(token: string) {
  const response = await fetch(`${BASE}/user/notifications/read-all`, {
    method: "POST",
    headers: authHeader(token),
  });
  return parseJson<{ success: boolean }>(response);
}

// ── Saved searches ────────────────────────────────────────────────────────────

export interface SavedSearchItem {
  id: number;
  query: string;
  filters: Record<string, unknown> | null;
  created_at: string;
}

export async function getSavedSearches(token: string) {
  const response = await fetch(`${BASE}/user/saved-searches`, {
    headers: authHeader(token),
    cache: "no-store",
  });
  return parseJson<{ success: boolean; items: SavedSearchItem[] }>(response);
}

export async function saveSearch(token: string, query: string, filters?: Record<string, unknown>) {
  const response = await fetch(`${BASE}/user/saved-searches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ query, filters: filters ?? null }),
  });
  return parseJson<{ success: boolean; item: SavedSearchItem; duplicate?: boolean }>(response);
}

export async function deleteSavedSearch(token: string, id: number) {
  const response = await fetch(`${BASE}/user/saved-searches/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return parseJson<{ success: boolean }>(response);
}
