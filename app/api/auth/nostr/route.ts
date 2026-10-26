import { NextResponse } from "next/server"
import { checkAuthEvent } from "@/lib/habits/nostr/auth-event"
import { verifyEvent, type Event } from "nostr-tools"
import { getDb } from "@/lib/habits/db"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import { verifyAndConsumeChallenge } from "@/lib/habits/nostr/challenge-store"
import { createSession, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/habits/nostr/session-store"
import { freshStorageData } from "@/lib/habits/default-data"
import { randomInternalApiKey } from "@/lib/habits/internal-api-key"
import { checkRateLimit, clientIp } from "@/lib/habits/rate-limit"

/**
 * The session token goes only into the httpOnly cookie, never the response
 * body, so page JavaScript (or anything injected into it) never sees it.
 */
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

/**
 * POST /api/auth/nostr
 * Verify a signed challenge event and create/authenticate user
 *
 * Body: {
 *   pubkey: string (hex),
 *   signedEvent: Event (full signed Nostr event)
 * }
 *
 * Schema (nostr_sessions, nostr_challenges, habit_users.nostr_pubkey) is
 * ensured at startup (instrumentation.ts), not on every sign-in.
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(`nostr-login:${clientIp(request)}`, 20)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    )
  }

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

    // Validate the signed event: pubkey, kind, age, and that it names this site
    const check = checkAuthEvent(signedEvent, pubkey, "/api/auth/nostr")
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 401 })
    }

    // Verify the cryptographic signature
    const isValidSignature = verifyEvent(signedEvent as Event)
    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid event signature" }, { status: 401 })
    }

    // Verify and consume the challenge nonce
    const isValidChallenge = await verifyAndConsumeChallenge(pubkey, check.challenge)
    if (!isValidChallenge) {
      return NextResponse.json({
        error: "Invalid or expired challenge. Please request a new challenge."
      }, { status: 401 })
    }

    // All verification passed - create or fetch user
    const sql = getDb()
    const normalizedPubkey = pubkey.toLowerCase()

    // Check if user already exists
    const existing = await sql`
      SELECT id, created_at FROM habit_users WHERE nostr_pubkey = ${normalizedPubkey}
    `

    // Create session token for persistent auth (cookie)
    const sessionToken = await createSession(normalizedPubkey)

    if (existing.length > 0) {
      return withSessionCookie({
        exists: true,
        createdAt: existing[0].created_at,
      }, sessionToken)
    }

    // Create new user with Nostr pubkey
    // habit_users.api_key is required and unique, but Nostr accounts never use it to
    // sign in. It must still be unguessable: it used to be derived from the public
    // key, and any route matching api_key directly then let anyone in.
    try {
      await sql`
        INSERT INTO habit_users (api_key, nostr_pubkey, data)
        VALUES (${randomInternalApiKey()}, ${normalizedPubkey}, ${JSON.stringify(freshStorageData())}::jsonb)
      `
    } catch (error) {
      // A concurrent first sign-in with the same key created the account
      // between our SELECT and INSERT. This request is verified too: sign it in.
      if ((error as { code?: string }).code !== "23505") throw error
      return withSessionCookie({ exists: true }, sessionToken)
    }

    return withSessionCookie({
      exists: false,
      created: true,
    }, sessionToken)
  } catch (error) {
    console.error("Failed to verify Nostr auth:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
