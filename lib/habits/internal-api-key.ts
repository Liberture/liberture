import crypto from "crypto"
import type { getDb } from "@/lib/habits/db"

/**
 * habit_users.api_key for accounts that don't sign in with an API key (Nostr).
 * Random, and with a prefix no auth path accepts (they all require `ht_`), so
 * it is never a credential even if it leaks.
 */
export function randomInternalApiKey(): string {
  return `nostr_${crypto.randomBytes(32).toString("hex")}`
}

/**
 * One-time repair: Nostr accounts created before 2026-10-11 got
 * `npub_<first 16 hex of the public key>`, which anyone can compute from a
 * public npub. Replace every such key with a random one. Idempotent; run at
 * startup (instrumentation.ts) so every deployment fixes itself.
 */
export async function rotateDerivedApiKeys(sql: ReturnType<typeof getDb>): Promise<number> {
  const rows = await sql`SELECT id FROM habit_users WHERE api_key LIKE 'npub\\_%'`
  for (const row of rows) {
    await sql`UPDATE habit_users SET api_key = ${randomInternalApiKey()} WHERE id = ${row.id as number}`
  }
  return rows.length
}
