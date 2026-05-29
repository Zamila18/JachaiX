"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminCompletedClaims,
  publishFactCheckFromClaim,
  updateAdminFactCheck,
} from "@/lib/api";
import type { AdminCompletedClaimItem } from "@/lib/types";

interface RowDraft {
  scope: "bangladesh" | "international";
  tagsText: string;
  isFeatured: boolean;
  title: string;
  summary: string;
}

function parseTags(tagsText: string): string[] {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function AdminPublishQueuePage() {
  const [items, setItems] = useState<AdminCompletedClaimItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyClaimId, setBusyClaimId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getAdminCompletedClaims({ q: q.trim() || undefined, perPage: 50 });
      setItems(res.items || []);
      setDrafts((current) => {
        const next = { ...current };
        for (const row of res.items || []) {
          if (!next[row.claim_id]) {
            next[row.claim_id] = {
              scope: row.fact_check?.coverage_scope || "bangladesh",
              tagsText: (row.fact_check?.tags || []).join(", "),
              isFeatured: !!row.fact_check?.is_featured,
              title: row.fact_check?.title || row.claim_text || row.raw_input || `Claim ${row.claim_id}`,
              summary: "",
            };
          }
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unpublishedCount = useMemo(() => items.filter((item) => !item.is_published).length, [items]);

  function setDraftField(claimId: number, field: keyof RowDraft, value: string | boolean) {
    setDrafts((current) => ({
      ...current,
      [claimId]: {
        ...current[claimId],
        [field]: value,
      },
    }));
  }

  async function onPublish(item: AdminCompletedClaimItem) {
    const draft = drafts[item.claim_id];
    if (!draft) return;

    setBusyClaimId(item.claim_id);
    setMessage(null);
    try {
      await publishFactCheckFromClaim(item.claim_id, {
        title: draft.title,
        summary: draft.summary,
        coverage_scope: draft.scope,
        tags: parseTags(draft.tagsText),
        is_featured: draft.isFeatured,
        published_by: "admin_queue",
        status: "published",
      });
      setMessage(`Published claim ${item.claim_id}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to publish.");
    } finally {
      setBusyClaimId(null);
    }
  }

  async function onUpdate(item: AdminCompletedClaimItem) {
    const draft = drafts[item.claim_id];
    const factId = item.fact_check?.id;
    if (!draft || !factId) return;

    setBusyClaimId(item.claim_id);
    setMessage(null);
    try {
      await updateAdminFactCheck(factId, {
        coverage_scope: draft.scope,
        tags: parseTags(draft.tagsText),
        is_featured: draft.isFeatured,
        title: draft.title,
        summary: draft.summary,
        published_by: "admin_queue",
      });
      setMessage(`Updated published card for claim ${item.claim_id}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update.");
    } finally {
      setBusyClaimId(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">Admin Publish Queue</p>
          <div className="live-pill">Completed claims: {items.length}</div>
        </div>
        <h1>Publish completed claims to public fact-check cards in one click.</h1>
        <p className="subtitle">
          Queue shows completed claims, publication state, and editorial controls for scope, tags, and featured status.
        </p>
      </section>

      <section className="panel reveal delay-1">
        <div className="admin-toolbar">
          <input
            className="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search completed claims"
          />
          <button type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <p className="muted">Unpublished: {unpublishedCount}</p>
        </div>
        {message && <p className="meta">{message}</p>}
      </section>

      <section className="panel reveal delay-2">
        <div className="admin-queue-grid">
          {items.map((item) => {
            const draft = drafts[item.claim_id];
            if (!draft) return null;

            return (
              <article className="admin-queue-card" key={item.claim_id}>
                <div className="fact-meta-row">
                  <span className={`verdict-chip ${item.verdict === "true" ? "is-true" : item.verdict === "false" ? "is-false" : item.verdict === "misleading" ? "is-misleading" : "is-unverified"}`}>
                    {(item.verdict || "unverified").toUpperCase()}
                  </span>
                  <span className="scope-chip">{item.is_published ? "Published" : "Not Published"}</span>
                </div>

                <h3>{item.claim_text || item.raw_input || `Claim ${item.claim_id}`}</h3>
                <p className="muted">Confidence: {item.confidence_score ?? "n/a"}</p>

                <label>
                  <span>Card title</span>
                  <textarea
                    value={draft.title}
                    onChange={(e) => setDraftField(item.claim_id, "title", e.target.value)}
                    rows={2}
                  />
                </label>

                <label>
                  <span>Summary</span>
                  <textarea
                    value={draft.summary}
                    onChange={(e) => setDraftField(item.claim_id, "summary", e.target.value)}
                    rows={3}
                    placeholder="Short summary for card and detail page"
                  />
                </label>

                <div className="admin-inline-grid">
                  <label>
                    <span>Coverage scope</span>
                    <select
                      value={draft.scope}
                      onChange={(e) => setDraftField(item.claim_id, "scope", e.target.value as "bangladesh" | "international")}
                    >
                      <option value="bangladesh">Bangladesh</option>
                      <option value="international">International</option>
                    </select>
                  </label>

                  <label className="toggle-label">
                    <span>Featured</span>
                    <input
                      type="checkbox"
                      checked={draft.isFeatured}
                      onChange={(e) => setDraftField(item.claim_id, "isFeatured", e.target.checked)}
                    />
                  </label>
                </div>

                <label>
                  <span>Tags (comma-separated)</span>
                  <input
                    className="search-input"
                    value={draft.tagsText}
                    onChange={(e) => setDraftField(item.claim_id, "tagsText", e.target.value)}
                    placeholder="health, election, social-media"
                  />
                </label>

                <div className="actions">
                  {!item.is_published ? (
                    <button type="button" onClick={() => onPublish(item)} disabled={busyClaimId === item.claim_id}>
                      {busyClaimId === item.claim_id ? "Publishing..." : "Publish"}
                    </button>
                  ) : (
                    <button type="button" className="secondary" onClick={() => onUpdate(item)} disabled={busyClaimId === item.claim_id}>
                      {busyClaimId === item.claim_id ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
