import { managedAuthEnabled } from "@/lib/identity/config"
import crypto from "node:crypto"
import { getDb } from "@/lib/habits/db"

import { createNostrSessionsTable } from "@/lib/habits/db-migrate"
import { isLocalStorageMode, localUserExists } from "@/lib/habits/local-storage"
import { getSessionTokenFromCookie, renewSession } from "@/lib/habits/nostr/session-store"

/**
 * Who is making this request.
 *
 * Lifted out of `app/api/storage/route.ts`, where it lived as a private helper,
 * once the coach chat needed exactly the same "is this a logged-in user of this
 * app" check. Both routes now share one implementation so a change to how
 * sessions work cannot leave one of them behind.
 */
export interface AuthInfo {
  userId?: number
  type: "api-key" | "nostr"
  apiKey?: string
  pubkey?: string
}

async function legacyCredential(key: string): Promise<AuthInfo | null> {
  if (!key.startsWith("ht_")) return null
  if (isLocalStorageMode()) {
    return await localUserExists(key) ? { type: "api-key", apiKey: key } : null
  }
  const [user] = await getDb()`SELECT id FROM habit_users WHERE api_key = ${key}`
  if (!user) return null
  if (managedAuthEnabled()) {
    const { activeUser } = await import("@/lib/identity/tracker")
    if (!await activeUser("habit-" + user.id)) return null
  }
  return { type: "api-key", apiKey: key, userId: user.id }
}

/**
 * Parse the auth identifier from the request.
 * Supports legacy API keys (ht_...) and signed Nostr sessions.
 */
export async function getAuthFromRequest(request: Request, allowStreamQueryKey = false): Promise<AuthInfo | null> {
  const authHeader = request.headers.get("authorization")

  if (authHeader !== null) {
    if (!authHeader.startsWith("Bearer ")) return null
    const token = authHeader.slice(7)
    return legacyCredential(token)
  }

  const url = new URL(request.url)
  const apiKey = url.searchParams.get("apiKey")
  if (apiKey) {
    return allowStreamQueryKey && request.method === "GET" ? legacyCredential(apiKey) : null
  }

  if (isLocalStorageMode()) return null

  if (managedAuthEnabled()) {
    const { trackerIdentity } = await import("@/lib/identity/tracker")
    const current = await trackerIdentity(request.headers)
    if (!current) return null
    return current.tracker.nostrPubkey ? { type: "nostr", pubkey: current.tracker.nostrPubkey, userId: current.tracker.id } : { type: "api-key", apiKey: current.tracker.apiKey, userId: current.tracker.id }
  }
  const sessionToken = getSessionTokenFromCookie(request)
  if (!sessionToken) return null

  await createNostrSessionsTable()
  const pubkey = await renewSession(sessionToken)
  if (!pubkey) return null

  return { type: "nostr", pubkey }
}

/**
 * A stable, opaque identifier for a user, safe to hand to the agent sidecar.
 *
 * The sidecar uses this to separate conversations and to check that a run
 * belongs to whoever is asking for it. It must not be the API key or the raw
 * pubkey: those are credentials, and this value ends up in a process
 * environment and a directory name on the host.
 */
export function userKeyFor(auth: AuthInfo): string {
  const identity = auth.type === "nostr" ? `nostr:${auth.pubkey?.toLowerCase()}` : `apikey:${auth.apiKey ?? ""}`
  return crypto.createHash("sha256").update(identity).digest("hex")
}

/**
 * Is this the site operator? Checks `Authorization: Bearer <ADMIN_SECRET>`, the
 * same credential `/api/admin/migrate` takes. Used for things no ordinary user
 * may touch, like the coach's codex login. Constant time, and false when the
 * secret is unset rather than matching an empty header.
 */
export function isAdminRequest(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  const header = request.headers.get("authorization")
  if (!secret || !header?.startsWith("Bearer ")) return false
  const given = Buffer.from(header.slice(7))
  const expected = Buffer.from(secret)
  return given.length === expected.length && crypto.timingSafeEqual(given, expected)
}

/** Only the explicitly configured tracker account can manage the shared coach. */
export async function canManageCoach(auth: AuthInfo): Promise<boolean> {
  const owner = process.env.HABIT_COACH_OWNER_USER_ID
  if (!owner || !/^[1-9][0-9]*$/.test(owner) || isLocalStorageMode()) return false
  const sql = getDb()
  if (auth.userId !== undefined) return String(auth.userId) === owner
  const rows = auth.type === "api-key"
    ? await sql`SELECT id FROM habit_users WHERE id = ${owner} AND api_key = ${auth.apiKey ?? ""}`
    : await sql`SELECT id FROM habit_users WHERE id = ${owner} AND nostr_pubkey = ${auth.pubkey ?? ""}`
  return rows.length === 1
}

export async function isCoachAdminRequest(request: Request): Promise<boolean> {
  if (isAdminRequest(request)) return true
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      if (new URL(origin).host !== (request.headers.get("host") ?? new URL(request.url).host)) return false
    } catch { return false }
  }
  const auth = await getAuthFromRequest(request)
  return auth !== null && await canManageCoach(auth)
}

export async function verifiedTrackerUserId(request: Request, allowStreamQueryKey = false): Promise<number | null> {
  const auth = await getAuthFromRequest(request, allowStreamQueryKey)
  if (!auth || isLocalStorageMode()) return null
  if (auth.userId !== undefined) return auth.userId
  const sql = getDb()
  const rows = auth.type === "api-key"
    ? await sql`SELECT id FROM habit_users WHERE api_key = ${auth.apiKey ?? ""}`
    : await sql`SELECT id FROM habit_users WHERE nostr_pubkey = ${auth.pubkey ?? ""}`
  return rows[0]?.id ?? null
}
