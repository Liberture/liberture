import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { isLocalStorageMode, getLocalUser } from "@/lib/habits/local-storage"

/**
 * POST /api/auth/verify  { apiKey: "ht_…" }
 * Restores a legacy API-key session (session-provider.tsx). Only real ht_ keys
 * are credentials: Nostr accounts sign in with a signed challenge
 * (/api/auth/nostr), and their internal api_key must never authenticate.
 * There is no lookup by pubkey — that only told anyone whether a key had an
 * account.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const apiKey = (body as { apiKey?: unknown }).apiKey

    if (typeof apiKey !== "string" || !/^ht_[0-9a-f]{16,}$/.test(apiKey)) {
      return NextResponse.json({ error: "A valid API key is required" }, { status: 400 })
    }

    if (isLocalStorageMode()) {
      const data = await getLocalUser(apiKey)
      if (!data) return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      return NextResponse.json({ valid: true, devMode: true })
    }

    const result = await getDb()`
      SELECT created_at FROM habit_users WHERE api_key = ${apiKey}
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json({ valid: true, createdAt: result[0].created_at })
  } catch (error) {
    console.error("Failed to verify:", error)
    return NextResponse.json({ error: "Failed to verify credentials" }, { status: 500 })
  }
}
