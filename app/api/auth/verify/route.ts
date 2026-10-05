import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { isLocalStorageMode, getLocalUser } from "@/lib/habits/local-storage"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey, pubkey } = body

    // Validate input - need either apiKey or pubkey
    if (!apiKey && !pubkey) {
      return NextResponse.json({ error: "API key or pubkey is required" }, { status: 400 })
    }

    // Local storage mode (only for API key auth)
    if (isLocalStorageMode()) {
      if (pubkey) {
        return NextResponse.json({ error: "Nostr auth requires database mode" }, { status: 400 })
      }

      const data = await getLocalUser(apiKey)
      if (!data) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }

      return NextResponse.json({ valid: true, devMode: true })
    }

    const sql = getDb()
    let result

    if (pubkey) {
      // Verify by Nostr pubkey
      if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) {
        return NextResponse.json({ error: "Invalid pubkey format" }, { status: 400 })
      }

      result = await sql`
        SELECT id, created_at FROM habit_users WHERE nostr_pubkey = ${pubkey}
      `
    } else {
      // Verify by API key
      result = await sql`
        SELECT id, created_at, nostr_pubkey FROM habit_users WHERE api_key = ${apiKey}
      `
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json({ valid: true, createdAt: result[0].created_at })
  } catch (error) {
    console.error("Failed to verify:", error)
    return NextResponse.json({ error: "Failed to verify credentials" }, { status: 500 })
  }
}
