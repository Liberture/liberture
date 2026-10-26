import { createHash } from "node:crypto"
import { getDb } from "@/lib/habits/db"

// Session duration: 30 days. PWA/mobile users should not have to re-auth constantly.
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60
export const SESSION_COOKIE_NAME = "habit_tracker_nostr_session"

export function getSessionTokenFromCookie(request: Request): string | null {
  return request.headers.get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1) ?? null
}

/**
 * Generate a cryptographically secure session token
 * Format: nses_<64 hex chars>
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `nses_${hex}`
}

/**
 * What nostr_sessions stores in place of the token: its SHA-256. The token
 * lives only in the user's httpOnly cookie, so a copy of the table (a backup,
 * a read-only leak) holds no usable sessions.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

const isSessionToken = (token: string) => /^nses_[0-9a-f]{64}$/.test(token)

/**
 * One-time repair: sessions created before 2026-10-26 were stored by their raw
 * token. Replace each with its hash, so the cookies users already hold keep
 * working. Idempotent (hashes don't start with nses_); run at startup.
 */
export async function hashStoredSessionTokens(sql: ReturnType<typeof getDb>): Promise<number> {
  const rows = await sql`
    UPDATE nostr_sessions SET token = encode(sha256(convert_to(token, 'UTF8')), 'hex')
    WHERE token LIKE 'nses\\_%'
    RETURNING pubkey
  `
  return rows.length
}

/**
 * Create a new session for a Nostr pubkey
 * Returns the session token (only its hash is stored)
 */
export async function createSession(pubkey: string): Promise<string> {
  const sql = getDb()
  const normalizedPubkey = pubkey.toLowerCase()
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  // Delete any existing sessions for this pubkey (one session per user)
  await sql`DELETE FROM nostr_sessions WHERE pubkey = ${normalizedPubkey}`

  // Create new session
  await sql`
    INSERT INTO nostr_sessions (pubkey, token, expires_at, created_at)
    VALUES (${normalizedPubkey}, ${hashSessionToken(token)}, ${expiresAt}, NOW())
  `

  return token
}

/**
 * Verify a session token
 * Returns the pubkey if valid, null otherwise
 */
export async function verifySession(token: string): Promise<string | null> {
  if (!token || !isSessionToken(token)) {
    return null
  }

  const sql = getDb()
  const hash = hashSessionToken(token)

  const result = await sql`
    SELECT pubkey, expires_at FROM nostr_sessions WHERE token = ${hash}
  `

  if (result.length === 0) {
    return null
  }

  const session = result[0]

  // Check expiry
  if (new Date(session.expires_at) <= new Date()) {
    // Delete expired session
    await sql`DELETE FROM nostr_sessions WHERE token = ${hash}`
    return null
  }

  return session.pubkey
}

/**
 * Refresh a session's expiry (extend by another SESSION_TTL)
 * Call this on successful API requests to keep active sessions alive
 */
export async function refreshSession(token: string): Promise<boolean> {
  if (!token || !isSessionToken(token)) {
    return false
  }

  const sql = getDb()
  const newExpiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  const result = await sql`
    UPDATE nostr_sessions 
    SET expires_at = ${newExpiresAt}
    WHERE token = ${hashSessionToken(token)} AND expires_at > NOW()
    RETURNING pubkey
  `

  return result.length > 0
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  if (!token || !isSessionToken(token)) {
    return
  }

  const sql = getDb()
  await sql`DELETE FROM nostr_sessions WHERE token = ${hashSessionToken(token)}`
}

/**
 * Delete all sessions for a pubkey
 */
export async function deleteAllSessions(pubkey: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM nostr_sessions WHERE pubkey = ${pubkey.toLowerCase()}`
}

/**
 * Cleanup expired sessions (call periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const sql = getDb()
  const result = await sql`
    DELETE FROM nostr_sessions WHERE expires_at < NOW()
    RETURNING pubkey
  `
  return result.length
}
