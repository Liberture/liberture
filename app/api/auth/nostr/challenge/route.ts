import { NextResponse } from "next/server"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import { generateNonce, storeChallenge } from "@/lib/habits/nostr/challenge-store"
import { createNostrChallengesTable } from "@/lib/habits/db-migrate"

// Module-level flag to track if migration has run this instance
let challengeTableEnsured = false

/**
 * Ensure the nostr_challenges table exists (idempotent, runs once per instance)
 */
async function ensureChallengeTable(): Promise<void> {
  if (challengeTableEnsured) return
  await createNostrChallengesTable()
  challengeTableEnsured = true
}

/**
 * GET /api/auth/nostr/challenge?pubkey=<hex_pubkey>
 * Generate a challenge nonce for the given pubkey
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pubkey = searchParams.get("pubkey")

  if (!pubkey || typeof pubkey !== "string") {
    return NextResponse.json({ error: "pubkey query parameter is required" }, { status: 400 })
  }

  // Validate pubkey format (64 hex characters)
  if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) {
    return NextResponse.json({ error: "Invalid pubkey format" }, { status: 400 })
  }

  // Local storage mode not supported
  if (isLocalStorageMode()) {
    return NextResponse.json({ 
      error: "Nostr auth requires database mode. Set DATABASE_URL environment variable." 
    }, { status: 400 })
  }

  try {
    // Ensure the challenges table exists
    await ensureChallengeTable()

    // Generate and store challenge in database
    const nonce = generateNonce()
    await storeChallenge(pubkey, nonce)

    return NextResponse.json({ challenge: nonce })
  } catch (error) {
    console.error("Failed to generate challenge:", error)
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 })
  }
}
