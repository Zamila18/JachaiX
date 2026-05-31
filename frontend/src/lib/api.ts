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

export async function submitTextClaim(text: string, language: string) {
  const response = await fetch(`${BASE}/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });

  return parseJson<{ claim_id?: number; job?: { id?: number } }>(response);
}

async function submitFileClaim(endpoint: "image" | "pdf", file: File, language: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const response = await fetch(`${BASE}/analyze/${endpoint}`, {
    method: "POST",
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
    headers: { "Content-Type": "application/json" },
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
