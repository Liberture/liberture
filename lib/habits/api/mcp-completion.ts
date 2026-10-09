import { hasScope } from "@/lib/habits/api-scopes"
import { normalizeName } from "@/lib/habits/api/resolve"
import { PROTOCOL_TEMPLATE, protocolSlugs } from "@/lib/habits/api/mcp-resources"
import { verifyIntegrationTokenValue } from "@/lib/habits/integration-auth"
import { PILLAR_IDS } from "@/lib/habits/pillars"
import type { StorageData } from "@/lib/habits/types"

/**
 * completion/complete: suggestions as the user types an argument. Covers
 * the protocol slug of liberture://protocol/{slug}, prompt arguments, and —
 * for clients that ask with a non-standard ref/tool — the name arguments the
 * write tools take (habit, todo, project, event). Names come from the user's
 * data, so they need the read permission like any other read.
 */

const MAX_VALUES = 100

export type NameKind = "habit" | "todo" | "project" | "event"

const NAME_ARGS: Record<string, NameKind> = { habit: "habit", todo: "todo", project: "project", event: "event" }

/** Matches first by prefix, then anywhere, ignoring case and accents. */
export function rankMatches(candidates: string[], typed: string): string[] {
  const q = normalizeName(typed)
  const unique = [...new Set(candidates.filter(Boolean))]
  if (!q) return unique
  const starts = unique.filter((c) => normalizeName(c).startsWith(q))
  const contains = unique.filter((c) => !starts.includes(c) && normalizeName(c).includes(q))
  return [...starts, ...contains]
}

export function namesOf(kind: NameKind, data: StorageData): string[] {
  switch (kind) {
    case "habit":
      return (data.habits ?? []).filter((h) => !h.archived).map((h) => h.name)
    case "todo":
      return (data.todos ?? []).filter((t) => t.status !== "completed").map((t) => t.title)
    case "project":
      return (data.projects ?? []).map((p) => p.name)
    case "event": {
      const now = Date.now()
      return (data.calendarEvents ?? []).filter((e) => Date.parse(e.endsAt) >= now).map((e) => e.title)
    }
  }
}

export interface CompletionResult {
  completion: { values: string[]; total: number; hasMore: boolean }
}

function result(values: string[]): CompletionResult {
  return { completion: { values: values.slice(0, MAX_VALUES), total: values.length, hasMore: values.length > MAX_VALUES } }
}

export async function completeArgument(
  ref: { type?: unknown; uri?: unknown; name?: unknown },
  argument: { name?: unknown; value?: unknown },
  token: string
): Promise<CompletionResult> {
  const name = typeof argument.name === "string" ? argument.name : ""
  const value = typeof argument.value === "string" ? argument.value : ""

  if (ref.type === "ref/resource") {
    return ref.uri === PROTOCOL_TEMPLATE && name === "slug" ? result(rankMatches(protocolSlugs(), value)) : result([])
  }
  if (name === "pillar") return result(rankMatches([...PILLAR_IDS], value))

  const kind = NAME_ARGS[name]
  if (!kind) return result([])
  const user = await verifyIntegrationTokenValue(token)
  if (!user) return result([])
  const permissions = (user.data as StorageData & { integrationPermissions?: unknown }).integrationPermissions
  if (!hasScope(permissions, "read")) return result([])
  return result(rankMatches(namesOf(kind, user.data), value))
}
