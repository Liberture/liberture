import { getDb } from "@/lib/habits/db"
import { freshStorageData } from "@/lib/habits/default-data"
import { getLocalUser, isLocalStorageMode, updateLocalUser } from "@/lib/habits/local-storage"
import type { AuthInfo } from "@/lib/habits/app-auth"
import type { StorageData } from "@/lib/habits/types"

/**
 * Settings → Reset account: the account goes back to exactly what a new one
 * starts with. Only the sign-in survives (the habit_users row, its Nostr
 * pubkey or API key, and open sessions).
 *
 * Done server-side in one transaction because a client-side "clear" can't
 * work: the storage POST merges a save with what the server holds, so
 * emptied lists came back, and data in the per-row tables, coach history,
 * assistant connections and push devices was never touched at all.
 */

/** Every per-user table outside the blob. Each is created lazily, so any may not exist yet. */
const USER_TABLES = [
  "habit_completions",
  "habit_todos",
  "habit_projects",
  "habit_coach_messages",
  "habit_push_subscriptions",
  "habit_notifications_sent",
  "habit_api_connections",
  "habit_oauth_codes",
  "habit_connector_syncs",
] as const

export function resetStorageData(now: string = new Date().toISOString()): StorageData {
  // No integrationToken or integrationPermissions: the script token is
  // revoked and assistant permissions return to their defaults.
  return { ...freshStorageData(now), resetAt: now }
}

/** Resets the signed-in account. Returns the new blob, or null when the account doesn't exist. */
export async function resetAccount(auth: AuthInfo): Promise<StorageData | null> {
  const now = new Date().toISOString()
  const fresh = resetStorageData(now)

  if (isLocalStorageMode()) {
    if (auth.type !== "api-key" || !auth.apiKey || !(await getLocalUser(auth.apiKey))) return null
    return (await updateLocalUser(auth.apiKey, fresh)) ? fresh : null
  }

  const sql = getDb()
  const rows = auth.type === "api-key"
    ? await sql`SELECT id FROM habit_users WHERE api_key = ${auth.apiKey ?? ""}`
    : await sql`SELECT id FROM habit_users WHERE nostr_pubkey = ${(auth.pubkey ?? "").toLowerCase()}`
  const userId = rows[0]?.id as number | undefined
  if (userId === undefined) return null

  const existing = await sql`
    SELECT name FROM unnest(${USER_TABLES as unknown as string[]}::text[]) AS name
    WHERE to_regclass('public.' || name) IS NOT NULL`
  const tables = existing.map((row) => row.name as string)

  await sql.begin(async (tx) => {
    for (const table of tables) {
      await tx`DELETE FROM ${tx(table)} WHERE user_id = ${userId}`
    }
    await tx`
      UPDATE habit_users
      SET data = ${JSON.stringify(fresh)}::jsonb, updated_at = NOW()
      WHERE id = ${userId}`
  })
  return fresh
}
