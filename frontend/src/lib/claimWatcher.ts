"use client";

/**
 * Client-side claim watcher.
 *
 * Polls the user's completed claims and detects when a claim is published
 * (admin reviewed/published it). Creates local notifications in localStorage
 * because the backend does not emit notifications for admin publish actions.
 *
 * Detection signals (any one is enough):
 *   1. claim_result.is_published === true
 *   2. claim_result.fact_check is a non-null object
 *   3. claim_result.status === "published"
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { getMyClaims } from "@/lib/api";

const STATES_KEY   = "jxu_claim_states_v2"; // {[claimId]: {published: boolean}}
const NOTIFS_KEY   = "jxu_local_notifs_v2"; // LocalNotif[]
const POLL_MS      = 30_000;                // 30 s active poll

export interface LocalNotif {
  id: string;
  type: "CLAIM_PUBLISHED";
  title: string;
  message: string;
  entity_id: number;
  entity_type: "claim";
  is_read: boolean;
  created_at: string;
}

// ── localStorage helpers ─────────────────────────────────────────────────────

type StateMap = Record<string, { published: boolean }>;

function loadStates(): StateMap {
  try { return JSON.parse(localStorage.getItem(STATES_KEY) ?? "{}"); } catch { return {}; }
}
function saveStates(s: StateMap) {
  try { localStorage.setItem(STATES_KEY, JSON.stringify(s)); } catch {}
}
export function loadNotifs(): LocalNotif[] {
  try { return JSON.parse(localStorage.getItem(NOTIFS_KEY) ?? "[]"); } catch { return []; }
}
function saveNotifs(n: LocalNotif[]) {
  try { localStorage.setItem(NOTIFS_KEY, JSON.stringify(n.slice(0, 100))); } catch {}
}

export function clearLocalNotifs() {
  try { localStorage.removeItem(NOTIFS_KEY); } catch {}
}

function pushNotif(n: Omit<LocalNotif, "id" | "created_at" | "is_read">) {
  const list = loadNotifs();
  const dup  = list.find(x => x.entity_id === n.entity_id && x.type === n.type);
  if (dup) return; // already notified
  list.unshift({ ...n, id: `local-${n.type}-${n.entity_id}`, is_read: false, created_at: new Date().toISOString() });
  saveNotifs(list);
}

// ── published detection — any signal is enough ───────────────────────────────

function detectPublished(r: Record<string, unknown>): boolean {
  if (r.is_published === true)                                   return true;
  if (r.fact_check != null && typeof r.fact_check === "object") return true;
  if (r.status === "published")                                  return true;
  return false;
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useClaimWatcher(token: string | null, isAdmin: boolean) {
  const [localNotifs, setLocalNotifs] = useState<LocalNotif[]>(() => {
    if (typeof window === "undefined") return [];
    return loadNotifs();
  });

  const running = useRef(false);

  const syncState = useCallback(() => setLocalNotifs(loadNotifs()), []);

  const check = useCallback(async () => {
    if (!token || isAdmin || running.current) return;
    running.current = true;
    try {
      // 1. Get the user's completed claims (most recent 20)
      const claimsRes = await getMyClaims(token, { perPage: 20, status: "completed" });
      const items = claimsRes?.items ?? [];
      if (!items.length) return;

      const states  = loadStates();
      let   dirty   = false;

      // 2. For each claim fetch its result to check published state
      await Promise.all(
        items.slice(0, 15).map(async (claim) => {
          const key = String(claim.id);
          try {
            const res = await fetch(`/api/v1/claims/${claim.id}/result`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            if (!res.ok) return;
            const data: Record<string, unknown> = await res.json();

            const isPublished = detectPublished(data);
            const prev = states[key];

            if (prev === undefined) {
              // First time we see this claim — just record; do NOT notify
              // (avoid alerting on claims that were already published before
              //  the user installed the watcher)
              states[key] = { published: isPublished };
              dirty = true;
            } else if (!prev.published && isPublished) {
              // Transition: unpublished → published → NOTIFY
              states[key] = { published: true };
              dirty = true;

              const claimText = typeof data.claim_text === "string" ? data.claim_text : "";
              pushNotif({
                type: "CLAIM_PUBLISHED",
                title: "Your claim has been reviewed & published",
                message: claimText
                  ? `"${claimText.slice(0, 100)}${claimText.length > 100 ? "…" : ""}" is now live on the public fact-check hub.`
                  : "Your submitted claim is now live on the public fact-check hub.",
                entity_id: claim.id,
                entity_type: "claim",
              });
            }
          } catch {
            // individual claim failure — skip silently
          }
        })
      );

      if (dirty) {
        saveStates(states);
        syncState();
      }
    } catch {
      // network failure — skip
    } finally {
      running.current = false;
    }
  }, [token, isAdmin, syncState]);

  // On mount: load stored notifs, then run first check
  useEffect(() => {
    syncState();
    check();
  }, [check, syncState]);

  // Regular poll
  useEffect(() => {
    if (!token || isAdmin) return;
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, [check, token, isAdmin]);

  // Re-check immediately when user switches back to the tab
  useEffect(() => {
    if (!token || isAdmin) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [check, token, isAdmin]);

  // ── mutation helpers ────────────────────────────────────────────────────────

  const markLocalRead = useCallback((notifId: string) => {
    const list = loadNotifs().map(n => n.id === notifId ? { ...n, is_read: true } : n);
    saveNotifs(list);
    setLocalNotifs(list);
  }, []);

  const markAllLocalRead = useCallback(() => {
    const list = loadNotifs().map(n => ({ ...n, is_read: true }));
    saveNotifs(list);
    setLocalNotifs(list);
  }, []);

  const localUnreadCount = localNotifs.filter(n => !n.is_read).length;

  return { localNotifs, localUnreadCount, markLocalRead, markAllLocalRead };
}
