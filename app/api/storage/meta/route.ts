import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { getLocalUser, isLocalStorageMode } from "@/lib/habits/local-storage"
import { createNostrSessionsTable } from "@/lib/habits/db-migrate"
import { getSessionTokenFromCookie, refreshSession, verifySession } from "@/lib/habits/nostr/session-store"

interface AuthInfo {
  type: 'api-key' | 'nostr'
  apiKey?: string
  pubkey?: string
}

/**
 * Parse the auth identifier from the request
 * Supports legacy API keys (ht_...) and signed Nostr sessions.
 */
async function getAuthFromRequest(request: Request): Promise<AuthInfo | null> {
  const authHeader = request.headers.get("authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    return token.startsWith("ht_") ? { type: 'api-key', apiKey: token } : null
  }

  if (isLocalStorageMode()) return null

  const sessionToken = getSessionTokenFromCookie(request)
  if (!sessionToken) return null

  await createNostrSessionsTable()
  const pubkey = await verifySession(sessionToken)
  if (!pubkey) return null
  await refreshSession(sessionToken)

  return { type: 'nostr', pubkey }
}

// GET - Read only the lastUpdated timestamp so clients can cheaply poll
// for changes without downloading the whole storage blob.
export async function GET(request: Request) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
    }

    if (isLocalStorageMode()) {
      const data = await getLocalUser(auth.apiKey!)
      if (!data) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }
      return NextResponse.json(
        { lastUpdated: data.lastUpdated ?? null },
        { headers: { "Cache-Control": "no-store" } },
      )
    }

    const sql = getDb()
    let result
    if (auth.type === 'nostr' && auth.pubkey) {
      result = await sql`
        SELECT data->>'lastUpdated' AS last_updated FROM habit_users WHERE nostr_pubkey = ${auth.pubkey.toLowerCase()}
      `
    } else if (auth.type === 'api-key' && auth.apiKey) {
      result = await sql`
        SELECT data->>'lastUpdated' AS last_updated
        FROM habit_users
        WHERE api_key = ${auth.apiKey}
      `
    } else {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json(
      { lastUpdated: (result[0].last_updated as string | null) ?? null },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("Failed to read storage meta:", error)
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 })
  }
}
