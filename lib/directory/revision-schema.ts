import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getDb } from "@/lib/habits/db"

// Production prepares tables with Prisma db push. Install the triggers from the
// same migration used by fresh databases before accepting requests.
export async function ensureDirectoryRevisionSchema() {
  const sql = getDb()
  const [state] = await sql`
    SELECT count(*)::integer AS installed FROM pg_trigger
    WHERE tgname='liberture_directory_revision'
      AND tgfoid=to_regprocedure('liberture_directory_revision_v1()')
      AND tgrelid IN (to_regclass('"Person"'),to_regclass('"Book"'),to_regclass('"Protocol"'),
                      to_regclass('"Organization"'),to_regclass('"KnowledgeArticle"'))
      AND tgenabled IN ('O','A')`
  if (state.installed === 5) return
  const migration = await readFile(join(process.cwd(), "prisma/migrations/20261113010000_directory_edit_history/migration.sql"), "utf8")
  await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(1519137567)`
    await tx.unsafe(migration)
  })
}
