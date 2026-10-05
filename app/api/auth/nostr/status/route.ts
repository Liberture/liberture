import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import { nip19 } from "nostr-tools"
import { addNostrPubkeyColumn } from "@/lib/habits/db-migrate"

/**
 * GET /api/auth/nostr/status
 * Check if the current user has a linked Nostr pubkey
 * 
 * Requires: Authorization: Bearer <api_key> (legacy API key auth)
 */
export async function GET(request: Request) {
  try {
    // Check authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.slice(7) // Remove "Bearer " prefix

    if (!apiKey.startsWith("ht_")) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Local storage mode not supported
    if (isLocalStorageMode()) {
      return NextResponse.json({ 
        authMethod: "legacy",
        linkedPubkey: null,
        linkedNpub: null,
      })
    }

    // Ensure nostr_pubkey column exists (idempotent, safe to call every time)
    await addNostrPubkeyColumn()

    const sql = getDb()

    // Get user and check for linked Nostr pubkey
    const userResult = await sql`
      SELECT id, nostr_pubkey FROM habit_users WHERE api_key = ${apiKey}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const user = userResult[0]

    if (user.nostr_pubkey) {
      let npub = ""
      try {
        npub = nip19.npubEncode(user.nostr_pubkey)
      } catch {
        npub = user.nostr_pubkey
      }

      return NextResponse.json({ 
        authMethod: "legacy",
        linkedPubkey: user.nostr_pubkey,
        linkedNpub: npub,
      })
    }

    return NextResponse.json({ 
      authMethod: "legacy",
      linkedPubkey: null,
      linkedNpub: null,
    })
  } catch (error) {
    console.error("Failed to check Nostr status:", error)
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
  }
}
