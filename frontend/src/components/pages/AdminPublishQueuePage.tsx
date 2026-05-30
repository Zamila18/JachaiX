"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminCompletedClaims,
  publishFactCheckFromClaim,
  updateAdminFactCheck,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
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
  const { tx } = useLanguage();
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
      setMessage(error instanceof Error ? error.message : tx({ en: "Failed to load queue.", bn: "কিউ লোড করা যায়নি।" }));
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
      setMessage(tx({ en: `Published claim ${item.claim_id}.`, bn: `ক্লেম ${item.claim_id} প্রকাশিত হয়েছে।` }));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : tx({ en: "Failed to publish.", bn: "প্রকাশ করা যায়নি।" }));
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
      setMessage(tx({ en: `Updated published card for claim ${item.claim_id}.`, bn: `ক্লেম ${item.claim_id} এর প্রকাশিত কার্ড আপডেট হয়েছে।` }));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : tx({ en: "Failed to update.", bn: "আপডেট করা যায়নি।" }));
    } finally {
      setBusyClaimId(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <div className="hero-top">
          <p className="eyebrow">{tx({ en: "Admin Publish Queue", bn: "অ্যাডমিন পাবলিশ কিউ" })}</p>
          <div className="live-pill">{tx({ en: "Completed claims", bn: "সম্পন্ন ক্লেম" })}: {items.length}</div>
        </div>
        <h1>{tx({ en: "Publish completed claims to public fact-check cards in one click.", bn: "এক ক্লিকে সম্পন্ন ক্লেমকে পাবলিক ফ্যাক্ট-চেক কার্ড হিসেবে প্রকাশ করুন।" })}</h1>
        <p className="subtitle">
          {tx({ en: "Queue shows completed claims, publication state, and editorial controls for scope, tags, and featured status.", bn: "কিউতে সম্পন্ন ক্লেম, প্রকাশনা অবস্থা, এবং scope, tags ও featured স্ট্যাটাসের editorial control দেখায়।" })}
        </p>
      </section>

      <section className="panel reveal delay-1">
        <div className="admin-toolbar">
          <input
            className="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tx({ en: "Search completed claims", bn: "সম্পন্ন ক্লেম খুঁজুন" })}
          />
          <button type="button" onClick={load} disabled={loading}>
            {loading ? tx({ en: "Refreshing...", bn: "রিফ্রেশ হচ্ছে..." }) : tx({ en: "Refresh", bn: "রিফ্রেশ" })}
          </button>
          <p className="muted">{tx({ en: "Unpublished", bn: "অপ্রকাশিত" })}: {unpublishedCount}</p>
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
                  <span className="scope-chip">{item.is_published ? tx({ en: "Published", bn: "প্রকাশিত" }) : tx({ en: "Not Published", bn: "প্রকাশিত নয়" })}</span>
                </div>

                <h3>{item.claim_text || item.raw_input || `Claim ${item.claim_id}`}</h3>
                <p className="muted">{tx({ en: "Confidence", bn: "কনফিডেন্স" })}: {item.confidence_score ?? "n/a"}</p>

                <label>
                  <span>{tx({ en: "Card title", bn: "কার্ড শিরোনাম" })}</span>
                  <textarea
                    value={draft.title}
                    onChange={(e) => setDraftField(item.claim_id, "title", e.target.value)}
                    rows={2}
                  />
                </label>

                <label>
                  <span>{tx({ en: "Summary", bn: "সারসংক্ষেপ" })}</span>
                  <textarea
                    value={draft.summary}
                    onChange={(e) => setDraftField(item.claim_id, "summary", e.target.value)}
                    rows={3}
                    placeholder={tx({ en: "Short summary for card and detail page", bn: "কার্ড ও বিস্তারিত পাতার জন্য সংক্ষিপ্ত সারাংশ" })}
                  />
                </label>

                <div className="admin-inline-grid">
                  <label>
                    <span>{tx({ en: "Coverage scope", bn: "কভারেজ স্কোপ" })}</span>
                    <select
                      value={draft.scope}
                      onChange={(e) => setDraftField(item.claim_id, "scope", e.target.value as "bangladesh" | "international")}
                    >
                      <option value="bangladesh">{tx({ en: "Bangladesh", bn: "বাংলাদেশ" })}</option>
                      <option value="international">{tx({ en: "International", bn: "আন্তর্জাতিক" })}</option>
                    </select>
                  </label>

                  <label className="toggle-label">
                    <span>{tx({ en: "Featured", bn: "ফিচার্ড" })}</span>
                    <input
                      type="checkbox"
                      checked={draft.isFeatured}
                      onChange={(e) => setDraftField(item.claim_id, "isFeatured", e.target.checked)}
                    />
                  </label>
                </div>

                <label>
                  <span>{tx({ en: "Tags (comma-separated)", bn: "ট্যাগ (কমা দিয়ে আলাদা)" })}</span>
                  <input
                    className="search-input"
                    value={draft.tagsText}
                    onChange={(e) => setDraftField(item.claim_id, "tagsText", e.target.value)}
                    placeholder={tx({ en: "health, election, social-media", bn: "health, election, social-media" })}
                  />
                </label>

                <div className="actions">
                  {!item.is_published ? (
                    <button type="button" onClick={() => onPublish(item)} disabled={busyClaimId === item.claim_id}>
                      {busyClaimId === item.claim_id ? tx({ en: "Publishing...", bn: "প্রকাশ করা হচ্ছে..." }) : tx({ en: "Publish", bn: "প্রকাশ করুন" })}
                    </button>
                  ) : (
                    <button type="button" className="secondary" onClick={() => onUpdate(item)} disabled={busyClaimId === item.claim_id}>
                      {busyClaimId === item.claim_id ? tx({ en: "Saving...", bn: "সেভ হচ্ছে..." }) : tx({ en: "Save Changes", bn: "পরিবর্তন সংরক্ষণ" })}
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
