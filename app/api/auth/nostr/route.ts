import { NextResponse } from "next/server"
import { authUrlTagMatches } from "@/lib/habits/nostr/auth-event"
import { verifyEvent, type Event } from "nostr-tools"
import { getDb } from "@/lib/habits/db"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import type { StorageData } from "@/lib/habits/types"
import { verifyAndConsumeChallenge } from "@/lib/habits/nostr/challenge-store"
import { createSession, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/habits/nostr/session-store"
import { addNostrPubkeyColumn, createNostrChallengesTable, createNostrSessionsTable } from "@/lib/habits/db-migrate"

const AUTH_EVENT_KIND = 27235
const MAX_EVENT_AGE_SECONDS = 5 * 60 // 5 minutes

function withSessionCookie(body: Record<string, unknown>, sessionToken: string) {
  const response = NextResponse.json(body)
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
  return response
}

const defaultData: StorageData = {
  habits: [],
  completions: [],
  todos: [],
  projects: [],
  projectTombstones: {},
  todoTombstones: {},
  calendarEvents: [],
  calendarEventTombstones: {},
  lastUpdated: new Date().toISOString(),
  schemaVersion: 7,
  onboarding: {
    completed: false,
    currentStep: 1,
    skipped: false
  },
  profile: {
    checkInTimes: {
      morning: '08:00',
      midday: '12:00',
      evening: '20:00'
    }
  },
  habitStacks: [],
  thoughtRecords: [],
  aiInsights: [],
  focusMode: {
    enabled: false,
    hidePastDates: false,
    showOnlyPending: false,
    singleColumn: false
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    simpleLanguage: false,
    extraReminders: false,
    stepByStepMode: false,
    compassionateMode: false,
    adhdSupport: false
  },
  rewardConfig: {
    celebrationsEnabled: true,
    soundEnabled: false,
    confettiEnabled: true,
    sharePrompts: true,
    variableRewards: true
  },
  accountabilityPartners: [],
  commitmentContracts: []
}

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
  if (!authUrlTagMatches(signedEvent.tags, "/api/auth/nostr")) {
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
 * POST /api/auth/nostr
 * Verify a signed challenge event and create/authenticate user
 * 
 * Body: {
 *   pubkey: string (hex),
 *   signedEvent: Event (full signed Nostr event)
 * }
 */
export async function POST(request: Request) {
  try {
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
        error: "Nostr auth requires database mode. Set DATABASE_URL environment variable." 
      }, { status: 400 })
    }

    // Ensure required database tables/columns exist (idempotent)
    await addNostrPubkeyColumn()
    await createNostrChallengesTable()
    await createNostrSessionsTable()

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
    const isValidChallenge = await verifyAndConsumeChallenge(pubkey, challengeNonce)
    if (!isValidChallenge) {
      return NextResponse.json({ 
        error: "Invalid or expired challenge. Please request a new challenge." 
      }, { status: 401 })
    }

    // All verification passed - create or fetch user
    const sql = getDb()

    // Check if user already exists
    const existing = await sql`
      SELECT id, created_at FROM habit_users WHERE nostr_pubkey = ${pubkey.toLowerCase()}
    `

    // Create session token for persistent auth (7 days)
    const sessionToken = await createSession(pubkey.toLowerCase())

    if (existing.length > 0) {
      return withSessionCookie({
        exists: true,
        createdAt: existing[0].created_at,
        sessionToken,
      }, sessionToken)
    }

    // Create new user with Nostr pubkey
    const internalApiKey = `npub_${pubkey.slice(0, 16)}`
    
    await sql`
      INSERT INTO habit_users (api_key, nostr_pubkey, data)
      VALUES (${internalApiKey}, ${pubkey.toLowerCase()}, ${JSON.stringify(defaultData)}::jsonb)
    `

    return withSessionCookie({
      exists: false,
      created: true,
      sessionToken,
    }, sessionToken)
  } catch (error: any) {
    console.error("Failed to verify Nostr auth:", error)
    
    // Handle unique constraint violation (user already exists race condition)
    if (error.code === '23505') {
      // Still need to create a session for the existing user
      try {
        const { pubkey } = await request.clone().json()
        const sessionToken = await createSession(pubkey.toLowerCase())
        return withSessionCookie({ exists: true, sessionToken }, sessionToken)
      } catch {
        return NextResponse.json({ exists: true })
      }
    }
    
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
