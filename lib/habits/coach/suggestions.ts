import { resolveByName, type Resolution } from "@/lib/habits/api/resolve"
import { findCatalogHabit, findProtocol } from "@/lib/habits/protocols/catalog"
import type { CoachRecommendationEntry, CoachRecommendationSet } from "@/lib/habits/types"

/**
 * What the user did with the coach's suggestions: accepted, dismissed or
 * snoozed. Pure and shared by the tracker UI, the MCP tools and the storage
 * merge. The database read-modify-write lives in suggestions-store.ts.
 */

export type SuggestionResponse = "accept" | "dismiss" | "snooze"
export type SuggestionStatus = NonNullable<CoachRecommendationEntry["status"]>

export const DEFAULT_SNOOZE_DAYS = 7

/** The slug, or the custom habit's name: what identifies a suggestion across sets. */
export function suggestionKey(entry: Pick<CoachRecommendationEntry, "slug" | "custom">): string {
  return entry.slug ?? entry.custom?.name.trim().toLowerCase() ?? ""
}

/** A human name for the suggestion: the catalog entry's name, or the custom habit's. */
export function suggestionName(entry: CoachRecommendationEntry): string {
  if (entry.kind === "protocol" && entry.slug) return findProtocol(entry.slug)?.name ?? entry.slug
  if (entry.kind === "habit" && entry.slug) return findCatalogHabit(entry.slug)?.name ?? entry.slug
  return entry.custom?.name ?? entry.slug ?? ""
}

/** Status as of `now`: absent is pending, and an expired snooze is pending again. */
export function effectiveStatus(entry: CoachRecommendationEntry, now: Date = new Date()): SuggestionStatus {
  const status = entry.status ?? "pending"
  if (status === "snoozed" && (!entry.snoozedUntil || Date.parse(entry.snoozedUntil) <= now.getTime())) return "pending"
  return status
}

/** Hidden from the coach panel: dismissed, or snoozed and not yet due back. */
export function isSuggestionHidden(entry: CoachRecommendationEntry, now: Date = new Date()): boolean {
  const status = effectiveStatus(entry, now)
  return status === "dismissed" || status === "snoozed"
}

export function respondToEntry(
  entry: CoachRecommendationEntry,
  response: SuggestionResponse,
  now: Date = new Date(),
  days: number = DEFAULT_SNOOZE_DAYS
): CoachRecommendationEntry {
  const respondedAt = now.toISOString()
  const { snoozedUntil: _drop, ...rest } = entry
  void _drop
  if (response === "snooze") {
    const until = new Date(now.getTime() + Math.max(1, Math.min(90, Math.round(days))) * 86_400_000).toISOString()
    return { ...rest, status: "snoozed", snoozedUntil: until, respondedAt }
  }
  return { ...rest, status: response === "accept" ? "accepted" : "dismissed", respondedAt }
}

/** Find a suggestion by slug or by name, the way log_habit finds habits. */
export function findSuggestion(entries: CoachRecommendationEntry[], query: string): Resolution<{ id: string; index: number; name: string }> {
  const items = entries.map((entry, index) => ({ id: entry.slug ?? `#${index}`, index, name: suggestionName(entry) }))
  return resolveByName(items, query, (item) => item.name)
}

/** Applies a response to one entry of the set; returns the same set when the index is out of range. */
export function respondInSet(
  set: CoachRecommendationSet,
  index: number,
  response: SuggestionResponse,
  now: Date = new Date(),
  days?: number
): CoachRecommendationSet {
  if (index < 0 || index >= set.entries.length) return set
  const entries = set.entries.map((entry, i) => (i === index ? respondToEntry(entry, response, now, days) : entry))
  return { ...set, entries }
}

/**
 * Marks as accepted the pending suggestions an adoption just fulfilled
 * (matched by catalog slug, or by name for a custom habit). Returns the same
 * set when nothing matched, so callers can skip a write.
 */
export function markAccepted(
  set: CoachRecommendationSet | undefined,
  match: { slugs?: string[]; names?: string[] },
  now: Date = new Date()
): CoachRecommendationSet | undefined {
  if (!set) return set
  const slugs = new Set(match.slugs ?? [])
  const names = new Set((match.names ?? []).map((n) => n.trim().toLowerCase()))
  let changed = false
  const entries = set.entries.map((entry) => {
    const hit = (entry.slug && slugs.has(entry.slug)) || (entry.custom && names.has(entry.custom.name.trim().toLowerCase()))
    if (!hit || entry.status === "accepted") return entry
    changed = true
    return respondToEntry(entry, "accept", now)
  })
  return changed ? { ...set, entries } : set
}

/** A new set from the coach keeps what the user already said about the same suggestions. */
export function carryResponses(next: CoachRecommendationSet, previous: CoachRecommendationSet | undefined): CoachRecommendationSet {
  if (!previous) return next
  const byKey = new Map(previous.entries.filter((e) => e.status).map((e) => [suggestionKey(e), e]))
  const entries = next.entries.map((entry) => {
    const old = byKey.get(suggestionKey(entry))
    if (!old || entry.status) return entry
    return { ...entry, status: old.status, ...(old.snoozedUntil ? { snoozedUntil: old.snoozedUntil } : {}), ...(old.respondedAt ? { respondedAt: old.respondedAt } : {}) }
  })
  return { ...next, entries }
}

/**
 * Storage merge: a tab saving a copy it loaded before an assistant answered
 * respond_to_suggestion must not undo it. The newer set wins; within the same
 * set, each entry keeps the most recent response.
 */
export function mergeCoachRecommendations(
  client: CoachRecommendationSet | undefined,
  server: CoachRecommendationSet | undefined
): CoachRecommendationSet | undefined {
  if (!client || !server) return client ?? server
  if (client.generatedAt !== server.generatedAt) return client.generatedAt > server.generatedAt ? client : server
  if (client.entries.length !== server.entries.length) return client
  const entries = client.entries.map((entry, i) => {
    const other = server.entries[i]
    return (other.respondedAt ?? "") > (entry.respondedAt ?? "") ? other : entry
  })
  return { ...client, entries }
}
