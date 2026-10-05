import { getDb } from "@/lib/habits/db"
import { getLocalUser, isLocalStorageMode, updateLocalUser } from "@/lib/habits/local-storage"

/**
 * Records that an account exported a backup.
 *
 * Server-side only — see `lib/backup-status.ts` for the pure logic the UI uses.
 *
 * The write is a targeted `jsonb_set`, not a read-modify-write of the whole
 * blob. Exporting is a read path that can run at any time, including while the
 * app is mid-save, so loading the blob here and writing it back would sooner or
 * later overwrite a habit someone had just added. Setting one key touches
 * nothing else.
 */
export async function markBackedUp(userId: number, at: string): Promise<void> {
  if (isLocalStorageMode()) return

  const sql = getDb()
  await sql`
    UPDATE habit_users
    SET data = jsonb_set(coalesce(data, '{}'::jsonb), '{lastBackupAt}', to_jsonb(${at}::text), true),
        updated_at = NOW()
    WHERE id = ${userId}
  `
}

/**
 * The API-key variant, for the local-file dev mode where there is no database
 * and no numeric id.
 */
export async function markBackedUpLocal(apiKey: string, at: string): Promise<void> {
  const data = await getLocalUser(apiKey)
  if (!data) return
  await updateLocalUser(apiKey, { ...data, lastBackupAt: at })
}
