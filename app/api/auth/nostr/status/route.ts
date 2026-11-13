import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import { nip19 } from "nostr-tools"
import { getAuthFromRequest } from "@/lib/habits/app-auth"

/**
 * GET /api/auth/nostr/status
 * Check if the current user has a linked Nostr pubkey
 * 
 * Requires: Authorization: Bearer <api_key> (legacy API key auth)
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthFromRequest(request)
    if (auth?.type !== "api-key") return NextResponse.json({ error: "Invalid API key" }, { status: 401 })

    // Local storage mode not supported
    if (isLocalStorageMode()) {
      return NextResponse.json({ 
        authMethod: "legacy",
        linkedPubkey: null,
        linkedNpub: null,
      })
    }

    const sql = getDb()

    // Get user and check for linked Nostr pubkey
    const userResult = await sql`
      SELECT id, nostr_pubkey FROM habit_users WHERE id = ${auth.userId!}
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
