import { NextResponse } from "next/server"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import { issueChallenge } from "@/lib/habits/nostr/challenge-store"
import { createNostrChallengesTable } from "@/lib/habits/db-migrate"
import { checkRateLimit, clientIp } from "@/lib/habits/rate-limit"

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
 * The challenge nonce for the given pubkey (see issueChallenge)
 */
export async function GET(request: Request) {
  const limit = checkRateLimit(`nostr-challenge:${clientIp(request)}`, 30)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    )
  }

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

    return NextResponse.json({ challenge: await issueChallenge(pubkey) })
  } catch (error) {
    console.error("Failed to generate challenge:", error)
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 })
  }
}
