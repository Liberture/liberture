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
 * Store a challenge in the database.
 * Upserts: if a challenge for this pubkey already exists, it's replaced.
 * Also cleans up expired challenges.
 */
export async function storeChallenge(pubkey: string, nonce: string): Promise<void> {
  const sql = getDb()
  const normalizedPubkey = pubkey.toLowerCase()
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000)

  // Clean up expired challenges first (cheap inline cleanup)
  await sql`DELETE FROM nostr_challenges WHERE expires_at < NOW()`

  // Upsert the new challenge
  await sql`
    INSERT INTO nostr_challenges (pubkey, nonce, expires_at)
    VALUES (${normalizedPubkey}, ${nonce}, ${expiresAt})
    ON CONFLICT (pubkey) DO UPDATE SET
      nonce = EXCLUDED.nonce,
      expires_at = EXCLUDED.expires_at
  `
}

/**
 * Verify and consume a challenge for a pubkey.
 * Returns true if valid, false otherwise.
 * The challenge is deleted after verification (one-time use).
 */
export async function verifyAndConsumeChallenge(pubkey: string, nonce: string): Promise<boolean> {
  const sql = getDb()
  const normalizedPubkey = pubkey.toLowerCase()

  // Query the challenge
  const result = await sql`
    SELECT nonce, expires_at FROM nostr_challenges WHERE pubkey = ${normalizedPubkey}
  `

  if (result.length === 0) {
    return false
  }

  const entry = result[0]

  // Check expiry
  if (new Date(entry.expires_at) <= new Date()) {
    // Delete expired challenge
    await sql`DELETE FROM nostr_challenges WHERE pubkey = ${normalizedPubkey}`
    return false
  }

  // Check nonce matches
  if (entry.nonce !== nonce) {
    return false
  }

  // Consume the challenge (one-time use)
  await sql`DELETE FROM nostr_challenges WHERE pubkey = ${normalizedPubkey}`
  return true
}
