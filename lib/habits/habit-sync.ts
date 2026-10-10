import type { Habit } from "@/lib/habits/types"

/**
 * Habits are not merged field by field: the client's array is the truth for
 * every habit it knew about. What it cannot know about is a change made on the
 * server after its last sync by the user's own assistant (/api/v1/habits*):
 *
 * - a habit created then (createdAt after the client's sync) is added back;
 * - a habit edited then (updatedAt after the sync) keeps the server's version;
 * - a habit deleted then (in habitTombstones) stays deleted.
 *
 * Edits and deletes made in the tab itself still win, because they happen
 * after that tab's last sync and the server copy predates them.
 */
export function mergeHabits(
  clientHabits: Habit[] | undefined,
  serverHabits: Habit[] | undefined,
  clientLastUpdated: string | undefined,
  tombstones: Record<string, string> = {}
): Habit[] {
  const client = Array.isArray(clientHabits) ? clientHabits : []
  const server = Array.isArray(serverHabits) ? serverHabits : []
  const since = clientLastUpdated ? Date.parse(clientLastUpdated) : Number.NaN
  const after = (iso: string | undefined) => {
    const t = iso ? Date.parse(iso) : Number.NaN
    return !Number.isNaN(t) && !Number.isNaN(since) && t > since
  }

  const serverById = new Map(server.map((h) => [h.id, h]))
  const merged = client
    .filter((h) => !(h.id in tombstones) || !after(tombstones[h.id]))
    .map((h) => {
      const fresh = serverById.get(h.id)
      return fresh && after(fresh.updatedAt) ? fresh : h
    })

  if (Number.isNaN(since)) return merged
  const known = new Set(client.map((h) => h.id))
  const addedSinceSync = server.filter((h) => !known.has(h.id) && after(h.createdAt))
  return addedSinceSync.length ? [...merged, ...addedSinceSync] : merged
}

/** Union of both sides' tombstones, newest timestamp per id. */
export function mergeHabitTombstones(
  client: Record<string, string> | undefined,
  server: Record<string, string> | undefined
): Record<string, string> {
  const result: Record<string, string> = { ...(client ?? {}) }
  for (const [id, at] of Object.entries(server ?? {})) {
    if (!result[id] || result[id] < at) result[id] = at
  }
  return result
}

/**
 * Profile and preferences are single objects stamped with updatedAt. The
 * server's copy wins only when it changed after everything the client knew:
 * later than the client's own stamp and later than its last sync. That keeps
 * an assistant's update_profile from being reverted by a tab that loaded
 * before it, while edits made in the tab (newer, or simply unstamped but
 * after its sync) still win.
 */
type FieldStamped = { updatedAt?: string; fieldsUpdatedAt?: Record<string, string> }

const STAMP_KEYS = new Set(["updatedAt", "fieldsUpdatedAt"])

/**
 * `next` with `fieldsUpdatedAt[key] = now` for every field that differs from
 * `before` (and `updatedAt = now` when any did). Both the app and the server
 * (update_profile) stamp this way, so a save can be merged per field.
 */
export function stampChangedFields<T extends FieldStamped>(before: T | undefined, next: T, now: string): T {
  const stamps = { ...(before?.fieldsUpdatedAt ?? {}), ...(next.fieldsUpdatedAt ?? {}) }
  let changed = false
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(next)])
  for (const key of keys) {
    if (STAMP_KEYS.has(key)) continue
    const a = (before as Record<string, unknown> | undefined)?.[key]
    const b = (next as Record<string, unknown>)[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      stamps[key] = now
      changed = true
    }
  }
  return changed ? { ...next, fieldsUpdatedAt: stamps, updatedAt: now } : next
}

/**
 * Profile/preferences on save: each field from whichever side changed it
 * last. Whole-object "newest wins" let a tab that changed one preference
 * (say, the auto-filled time zone) bring back its stale copy of another one
 * an assistant had just set. Fields nobody stamped fall back to the
 * whole-object rule (mergeStamped), so older data keeps working.
 */
export function mergeFieldStamped<T extends FieldStamped>(
  client: T | undefined,
  server: T | undefined,
  clientLastUpdated: string | undefined
): T | undefined {
  if (!client || !server) return client ?? server
  const fallback = mergeStamped(client, server, clientLastUpdated) ?? client
  const synced = clientLastUpdated ? Date.parse(clientLastUpdated) || 0 : 0
  const cs = client.fieldsUpdatedAt ?? {}
  const ss = server.fieldsUpdatedAt ?? {}
  const result: Record<string, unknown> = {}
  const stamps: Record<string, string> = {}
  const keys = new Set([...Object.keys(client), ...Object.keys(server)])
  for (const key of keys) {
    if (STAMP_KEYS.has(key)) continue
    const c = cs[key] ? Date.parse(cs[key]) || 0 : 0
    const s = ss[key] ? Date.parse(ss[key]) || 0 : 0
    const fromClient = client as Record<string, unknown>
    const fromServer = server as Record<string, unknown>
    let source: Record<string, unknown>
    if (c && s) source = c >= s ? fromClient : fromServer // both changed it: the later change
    else if (c) source = fromClient // only this tab changed it
    else if (s) source = s > synced ? fromServer : fromClient // changed on the server after this tab last synced
    else source = fallback as Record<string, unknown> // nobody stamped it: whole-object rule
    if (key in source) result[key] = source[key]
    const stamp = c >= s ? cs[key] : ss[key]
    if (stamp) stamps[key] = stamp
  }
  const latest = [client.updatedAt, server.updatedAt].filter(Boolean).sort().pop()
  return { ...(result as T), ...(latest ? { updatedAt: latest } : {}), ...(Object.keys(stamps).length ? { fieldsUpdatedAt: stamps } : {}) }
}

export function mergeStamped<T extends { updatedAt?: string }>(
  client: T | undefined,
  server: T | undefined,
  clientLastUpdated: string | undefined
): T | undefined {
  if (!server?.updatedAt) return client ?? server
  if (!client) return server
  const serverAt = Date.parse(server.updatedAt)
  if (Number.isNaN(serverAt)) return client
  const clientAt = Math.max(
    client.updatedAt ? Date.parse(client.updatedAt) || 0 : 0,
    clientLastUpdated ? Date.parse(clientLastUpdated) || 0 : 0
  )
  return serverAt > clientAt ? server : client
}
