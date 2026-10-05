import { NextResponse } from "next/server"
import { authUrlTagMatches } from "@/lib/habits/nostr/auth-event"
import { verifyEvent, type Event } from "nostr-tools"
import { getDb } from "@/lib/habits/db"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import { verifyAndConsumeChallenge } from "@/lib/habits/nostr/challenge-store"
import { addNostrPubkeyColumn, createNostrChallengesTable } from "@/lib/habits/db-migrate"

const AUTH_EVENT_KIND = 27235
const MAX_EVENT_AGE_SECONDS = 5 * 60 // 5 minutes

/**
 * Extract challenge nonce from event tags
 */
function getChallengeFromTags(tags: string[][]): string | null {
  const challengeTag = tags.find((tag) => tag[0] === "challenge" && tag.length >= 2)
  return challengeTag ? challengeTag[1] : null
}

/**
 * Validate the signed event structure and content
 */
function validateSignedEvent(
  signedEvent: Event,
  expectedPubkey: string
): { valid: false; error: string } | { valid: true } {
  // Check pubkey matches
  if (signedEvent.pubkey !== expectedPubkey.toLowerCase()) {
    return { valid: false, error: "Event pubkey does not match claimed pubkey" }
  }

  // Check kind
  if (signedEvent.kind !== AUTH_EVENT_KIND) {
    return { valid: false, error: `Invalid event kind: expected ${AUTH_EVENT_KIND}` }
  }

  // Check created_at is recent (within 5 minutes)
  const now = Math.floor(Date.now() / 1000)
  const eventAge = now - signedEvent.created_at
  if (eventAge > MAX_EVENT_AGE_SECONDS) {
    return { valid: false, error: "Event is too old" }
  }
  if (eventAge < -60) {
    // Allow 1 minute clock skew into the future
    return { valid: false, error: "Event timestamp is in the future" }
  }

  // NIP-98 u tag, when present, must name this endpoint
  if (!authUrlTagMatches(signedEvent.tags, "/api/auth/nostr/migrate")) {
    return { valid: false, error: "Auth event is for a different URL" }
  }

  // Check for challenge tag
  const challengeNonce = getChallengeFromTags(signedEvent.tags)
  if (!challengeNonce) {
    return { valid: false, error: "Missing challenge tag in event" }
  }

  return { valid: true }
}

/**
 * POST /api/auth/nostr/migrate
 * Link a Nostr pubkey to an existing legacy API key account
 * 
 * Requires: Authorization: Bearer <api_key> (legacy API key auth)
 * Body: {
 *   pubkey: string (hex),
 *   signedEvent: Event (full signed Nostr event)
 * }
 */
export async function POST(request: Request) {
  try {
    // Check authorization header for legacy API key
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.slice(7) // Remove "Bearer " prefix

    // Must be a legacy API key (not nostr:xxx)
    if (apiKey.startsWith("nostr:")) {
      return NextResponse.json({ 
        error: "Already using Nostr authentication. No migration needed." 
      }, { status: 400 })
    }

    // Parse request body
    const { pubkey, signedEvent } = await request.json()

    // Validate pubkey presence and format
    if (!pubkey || typeof pubkey !== "string") {
      return NextResponse.json({ error: "pubkey is required" }, { status: 400 })
    }

    if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) {
      return NextResponse.json({ error: "Invalid pubkey format" }, { status: 400 })
    }

    // Validate signedEvent presence
    if (!signedEvent || typeof signedEvent !== "object") {
      return NextResponse.json({ error: "signedEvent is required" }, { status: 400 })
    }

    // Local storage mode not supported for Nostr auth
    if (isLocalStorageMode()) {
      return NextResponse.json({ 
        error: "Nostr migration requires database mode. Set DATABASE_URL environment variable." 
      }, { status: 400 })
    }

    // Ensure required database tables/columns exist (idempotent)
    await addNostrPubkeyColumn()
    await createNostrChallengesTable()

    const sql = getDb()

    // Verify the API key is valid and get the user
    const userResult = await sql`
      SELECT id, nostr_pubkey FROM habit_users WHERE api_key = ${apiKey}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const user = userResult[0]

    // Check if user already has a linked Nostr pubkey
    if (user.nostr_pubkey) {
      return NextResponse.json({ 
        error: "This account already has a linked Nostr identity",
        existingPubkey: user.nostr_pubkey
      }, { status: 400 })
    }

    // Validate the signed event structure
    const validation = validateSignedEvent(signedEvent as Event, pubkey)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    // Verify the cryptographic signature
    const isValidSignature = verifyEvent(signedEvent as Event)
    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid event signature" }, { status: 401 })
    }

    // Verify and consume the challenge nonce
    const challengeNonce = getChallengeFromTags((signedEvent as Event).tags)!
    const isValidChallenge = verifyAndConsumeChallenge(pubkey, challengeNonce)
    if (!isValidChallenge) {
      return NextResponse.json({ 
        error: "Invalid or expired challenge. Please request a new challenge." 
      }, { status: 401 })
    }

    // Check if pubkey is already taken by another user
    const existingWithPubkey = await sql`
      SELECT id FROM habit_users WHERE nostr_pubkey = ${pubkey.toLowerCase()} AND id != ${user.id}
    `

    if (existingWithPubkey.length > 0) {
      return NextResponse.json({ 
        error: "This Nostr pubkey is already linked to another account" 
      }, { status: 409 })
    }

    // Link the Nostr pubkey to the user
    await sql`
      UPDATE habit_users 
      SET nostr_pubkey = ${pubkey.toLowerCase()}
      WHERE id = ${user.id}
    `

    return NextResponse.json({ 
      success: true,
      message: "Nostr identity linked successfully. You can now log in with your Nostr extension."
    })
  } catch (error: any) {
    console.error("Failed to migrate to Nostr:", error)
    
    // Handle unique constraint violation (pubkey already taken race condition)
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: "This Nostr pubkey is already linked to another account" 
      }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
