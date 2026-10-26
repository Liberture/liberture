import { getDb } from "@/lib/habits/db"

const CHALLENGE_TTL_SECONDS = 5 * 60 // 5 minutes

/**
 * Generate a cryptographically secure random nonce (32 bytes hex)
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * The challenge a pubkey signs to log in: the one still pending, or a new one.
 *
 * A request never replaces a pending challenge. Anyone can ask for any
 * pubkey's challenge, so replacing it would let them keep that user from ever
 * finishing a sign-in. Handing the same nonce out twice is harmless: only a
 * signature over it proves anything, and the first use consumes it. Each
 * request does extend the expiry, so a slow remote signer still has the full
 * window. Also cleans up expired challenges.
 */
export async function issueChallenge(pubkey: string): Promise<string> {
  const sql = getDb()
  const normalizedPubkey = pubkey.toLowerCase()
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000)

  // Clean up expired challenges first (cheap inline cleanup)
  await sql`DELETE FROM nostr_challenges WHERE expires_at < NOW()`

  const rows = await sql`
    INSERT INTO nostr_challenges (pubkey, nonce, expires_at)
    VALUES (${normalizedPubkey}, ${generateNonce()}, ${expiresAt})
    ON CONFLICT (pubkey) DO UPDATE SET
      nonce = CASE WHEN nostr_challenges.expires_at > NOW() THEN nostr_challenges.nonce ELSE EXCLUDED.nonce END,
      expires_at = EXCLUDED.expires_at
    RETURNING nonce
  `
  return rows[0].nonce as string
}

/**
 * Verify and consume a challenge for a pubkey, in one statement: two requests
 * carrying the same signed event can't both see it before either deletes it.
 * Returns true if it was valid (and is now gone).
 */
export async function verifyAndConsumeChallenge(pubkey: string, nonce: string): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    DELETE FROM nostr_challenges
    WHERE pubkey = ${pubkey.toLowerCase()} AND nonce = ${nonce} AND expires_at > NOW()
    RETURNING pubkey
  `
  return rows.length === 1
}
