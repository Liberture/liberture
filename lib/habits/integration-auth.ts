import { getDb } from "@/lib/habits/db"
import crypto from "crypto"
import type { StorageData } from "@/lib/habits/types"
import { createNostrSessionsTable } from "@/lib/habits/db-migrate"
import { getSessionTokenFromCookie, refreshSession, verifySession } from "@/lib/habits/nostr/session-store"
import { NextResponse } from "next/server"
import { hasScope, scopeDeniedMessage, type ApiScope } from "@/lib/habits/api-scopes"
import { checkRateLimit } from "@/lib/habits/rate-limit"
import { ACCESS_PREFIX, lookupConnection } from "@/lib/habits/oauth/store"
import { withCompletionStarts } from "@/lib/habits/habit-utils"

/** Habits count from their earliest completion, so backfilled days show in stats. */
function withHabitStarts(data: StorageData): StorageData {
  if (!data || !Array.isArray(data.habits)) return data
  return { ...data, habits: withCompletionStarts(data.habits, data.completions ?? []) }
}

export interface IntegrationAuthResult {
  userId: number
  apiKey: string | null
  nostrPubkey: string | null
  data: StorageData
  /** The OAuth connection (hta_ token); null for the script token (hti_). */
  connectionId: string | null
}

/** Bearer token from the header if it looks like one of ours (hti_ or hta_). */
function bearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7).trim()
  return token.startsWith("hti_") || token.startsWith(ACCESS_PREFIX) ? token : null
}

/**
 * Verifies an assistant credential from Authorization: Bearer —
 * the user's script token (hti_, hash in the JSONB blob) or a connection
 * token (hta_, lib/oauth/store.ts: OAuth connectors and skill downloads).
 */
export async function verifyIntegrationToken(
  request: Request
): Promise<IntegrationAuthResult | null> {
  const token = bearerToken(request)
  return token ? verifyIntegrationTokenValue(token) : null
}

/**
 * Same lookup for a raw token, for callers that receive it outside the
 * Authorization header (the MCP connector URL).
 */
export async function verifyIntegrationTokenValue(token: string): Promise<IntegrationAuthResult | null> {
  try {
    const sql = getDb()
    let result
    let connectionId: string | null = null
    if (/^hti_[0-9a-f]{64}$/.test(token)) {
      result = await sql`
        SELECT id, api_key, nostr_pubkey, data
        FROM habit_users
        WHERE data->'integrationToken'->>'hash' = ${hashIntegrationToken(token)}
      `
    } else if (new RegExp(`^${ACCESS_PREFIX}[0-9a-f]{64}$`).test(token)) {
      const connection = await lookupConnection(token)
      if (!connection) return null
      connectionId = connection.id
      result = await sql`SELECT id, api_key, nostr_pubkey, data FROM habit_users WHERE id = ${connection.userId}`
    } else {
      return null
    }
    if (!result.length) return null

    return {
      userId: result[0].id as number,
      apiKey: result[0].api_key as string | null,
      nostrPubkey: result[0].nostr_pubkey as string | null,
      data: withHabitStarts(result[0].data as StorageData),
      connectionId,
    }
  } catch {
    return null
  }
}

export function hashIntegrationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

/**
 * Token check, rate limit and permission scope in one step, for every
 * /api/v1 handler an integration token can reach. Returns the user, or the
 * response to send back instead.
 */
export async function authorizeIntegration(
  request: Request,
  scope: ApiScope
): Promise<IntegrationAuthResult | NextResponse> {
  const token = bearerToken(request)
  if (token) {
    const limit = checkRateLimit(hashIntegrationToken(token))
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", code: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      )
    }
  }

  const user = await verifyIntegrationToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const permissions = (user.data as StorageData & { integrationPermissions?: unknown }).integrationPermissions
  if (!hasScope(permissions, scope)) {
    return NextResponse.json(
      { error: "Permission disabled", code: "scope_disabled", scope, message: scopeDeniedMessage(scope) },
      { status: 403 }
    )
  }

  return user
}

/**
 * Verifies user auth for owner-only endpoints.
 * Supports legacy API keys (ht_...) and signed Nostr sessions.
 */
export async function verifyApiKey(
  request: Request
): Promise<IntegrationAuthResult | null> {
  const auth = request.headers.get("Authorization")
  const sql = getDb()

  try {
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7)
      if (!token.startsWith("ht_")) return null

      const result = await sql`
        SELECT id, api_key, nostr_pubkey, data
        FROM habit_users
        WHERE api_key = ${token}
      `
      if (!result.length) return null

      return {
        userId: result[0].id as number,
        apiKey: result[0].api_key as string,
        nostrPubkey: result[0].nostr_pubkey as string | null,
        data: withHabitStarts(result[0].data as StorageData),
        connectionId: null,
      }
    }

    const url = new URL(request.url)
    const sessionToken = getSessionTokenFromCookie(request) ?? url.searchParams.get("token")
    if (!sessionToken) return null

    await createNostrSessionsTable()
    const pubkey = await verifySession(sessionToken)
    if (!pubkey) return null
    await refreshSession(sessionToken)

    const result = await sql`
      SELECT id, api_key, nostr_pubkey, data
      FROM habit_users
      WHERE nostr_pubkey = ${pubkey}
    `
    if (!result.length) return null

    return {
      userId: result[0].id as number,
      apiKey: result[0].api_key as string | null,
      nostrPubkey: result[0].nostr_pubkey as string,
      data: withHabitStarts(result[0].data as StorageData),
      connectionId: null,
    }
  } catch {
    return null
  }
}
