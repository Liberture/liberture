import { getDb } from "@/lib/habits/db"
import { deleteLocalUser, isLocalStorageMode } from "@/lib/habits/local-storage"
import type { AuthInfo } from "@/lib/habits/app-auth"

/**
 * Settings → Delete account: the account and everything in it, gone in one
 * transaction — the habit_users row, every per-user table, and the sign-in
 * sessions. The app then signs out and goes to the landing page. Signing in
 * again with the same Nostr key creates a new, empty account; a legacy API
 * key simply stops working.
 *
 * Server-side because a client-side "clear" can't work: the storage POST
 * merges a save with what the server holds, so emptied lists came back, and
 * the per-row tables, coach history, assistant connections and push devices
 * were never touched.
 */

/** Every per-user table outside the blob. Each is created lazily, so any may not exist yet. */
export const USER_TABLES = [
  "habit_completions",
  "habit_todos",
  "habit_projects",
  "habit_coach_messages",
  "habit_push_subscriptions",
  "habit_notifications_sent",
  "habit_api_connections",
  "habit_oauth_codes",
  "habit_connector_syncs",
  "habit_assistant_welcomes",
] as const

/** Deletes the signed-in account. False when there was no such account. */
export async function deleteAccount(auth: AuthInfo): Promise<boolean> {
  if (isLocalStorageMode()) {
    return auth.type === "api-key" && Boolean(auth.apiKey) && deleteLocalUser(auth.apiKey!)
  }

  const sql = getDb()
  const rows = auth.type === "api-key"
    ? await sql`SELECT id, nostr_pubkey FROM habit_users WHERE api_key = ${auth.apiKey ?? ""}`
    : await sql`SELECT id, nostr_pubkey FROM habit_users WHERE nostr_pubkey = ${(auth.pubkey ?? "").toLowerCase()}`
  const userId = rows[0]?.id as number | undefined
  if (userId === undefined) return false
  const pubkey = rows[0].nostr_pubkey as string | null

  const tables = [...USER_TABLES, "nostr_sessions"]
  const existing = await sql`
    SELECT name FROM unnest(${tables}::text[]) AS name
    WHERE to_regclass('public.' || name) IS NOT NULL`
  const present = new Set(existing.map((row) => row.name as string))

  await sql.begin(async (tx) => {
    for (const table of USER_TABLES) {
      if (present.has(table)) await tx`DELETE FROM ${tx(table)} WHERE user_id = ${userId}`
    }
    // Every open session for this key, on every device: no tab can save the old data back.
    if (pubkey && present.has("nostr_sessions")) await tx`DELETE FROM nostr_sessions WHERE pubkey = ${pubkey}`
    await tx`DELETE FROM habit_users WHERE id = ${userId}`
  })
  return true
}
