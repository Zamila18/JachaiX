export type Verdict = "true" | "false" | "misleading" | "unverified" | null;

export interface ClaimStatusResponse {
  claim: {
    id: number;
    status: "pending" | "processing" | "completed" | "failed";
    verdict: Verdict;
    confidence_score: number | null;
    failure_reason?: string | null;
  };
}

export interface SourceItem {
  title?: string;
  source?: string;
  url?: string;
  score?: number;
  reliability_score?: number;
}

export interface CrossVerification {
  has_knowledge: boolean;
  suggestion: string;
  links: Array<{ title: string; source: string; url: string }>;
}

export interface HumanVerification {
  recommended: boolean;
  reason: string;
  action?: {
    method: string;
    endpoint: string;
    payload_template: {
      reason: string;
      notes: string;
      reporter_name: string;
    };
  };
}

export interface TrustBreakdown {
  evidence_strength?: number;
  avg_reliability?: number;
  llm_confidence?: number;
  lang_clarity?: number;
  coverage?: number;
  verdict_weight?: number;
  evidence_relevance?: number;
  translation_confidence?: number;
  source_triangulation?: number;
  provider_consensus?: string;
  image_forensics?: { image_verdict: string; confidence: number };
}

export interface NormalizationData {
  web_augmented?: boolean;
  web_sources?: Array<{ title: string; url: string; source: string }>;
  [key: string]: unknown;
}

export interface ClaimResult {
  id: number;
  status: string;
  input_type?: "text" | "image" | "pdf" | "url";
  extracted_text?: string | null;
  claim_text: string;
  language: string;
  verdict: Verdict;
  confidence_score: number | null;
  trust_label?: string | null;
  trust_breakdown?: TrustBreakdown | null;
  normalization?: NormalizationData | null;
  explanation: string;
  sources: SourceItem[];
  cross_verification?: CrossVerification;
  human_verification?: HumanVerification;
  created_at?: string | null;
  is_published?: boolean;
  fact_check?: null | {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    status: "draft" | "review" | "published";
    published_at: string | null;
  };
}

export interface PublicFactCheckListItem {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  verdict: string | null;
  confidence_score: number | null;
  language: string;
  coverage_scope: "bangladesh" | "international";
  origin: "internal" | "external";
  source_name: string | null;
  source_url: string | null;
  is_featured: boolean;
  published_at: string | null;
  tags: string[];
}

export interface PublicFactCheckDetail {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  claim_text: string | null;
  explanation: string | null;
  verdict: string | null;
  confidence_score: number | null;
  language: string;
  coverage_scope: "bangladesh" | "international";
  origin: "internal" | "external";
  source_name: string | null;
  source_url: string | null;
  is_featured: boolean;
  cover_image: string | null;
  tags: string[];
  sources: SourceItem[];
  published_at: string | null;
}

export interface AdminCompletedClaimItem {
  claim_id: number;
  status: string;
  claim_text: string | null;
  raw_input: string | null;
  language: string;
  verdict: Verdict;
  confidence_score: number | null;
  explanation: string | null;
  created_at: string | null;
  is_published: boolean;
  fact_check: null | {
    id: number;
    title: string;
    slug: string;
    coverage_scope: "bangladesh" | "international";
    is_featured: boolean;
    tags: string[];
    status: "draft" | "review" | "published";
    published_at: string | null;
  };
}

export interface DocsTeamMember {
  name: string;
  role: string;
  email: string;
  image_url?: string | null;
}

export interface DocsPitchSection {
  id: string;
  title: string;
  content: string;
}

export interface DocsVisibility {
  is_enabled: boolean;
  available_from: string | null;
  available_until: string | null;
  is_visible_now: boolean;
}

export interface DocsPageData {
  team_name: string | null;
  pitch_sections: DocsPitchSection[];
  technical_sections: Record<string, unknown>;
  team_members: DocsTeamMember[];
  updated_by: string | null;
  version: number;
  updated_at: string | null;
}

export interface DocsLiveData {
  metrics: {
    users: number;
    claims_total: number;
    claims_completed: number;
    claims_processing: number;
    public_fact_checks: number;
    published_fact_checks: number;
    featured_fact_checks: number;
  };
  features: Array<{ name: string; status: string }>;
  apis: Array<{ method: string; path: string }>;
  events: Array<{
    id: number;
    status: string;
    verdict: Verdict;
    language: string;
    created_at: string | null;
  }>;
}

export interface EvalMetricsSummary {
  generated_at_unix: number;
  input: string;
  samples_total: number;
  samples_scored: number;
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
}

export interface LatestEvaluationMetrics {
  success: boolean;
  available: boolean;
  latest: null | {
    name: "human" | "multilingual";
    summary: EvalMetricsSummary;
  };
  reports: {
    human: EvalMetricsSummary | null;
    multilingual: EvalMetricsSummary | null;
  };
}
