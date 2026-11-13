import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getDb } from "@/lib/habits/db"

const migrations = [
  "20261113020000_organization_profiles",
  "20261113030000_directory_projects",
  "20261113040000_project_profiles",
]

export async function ensureDirectoryProfiles() {
  const db = getDb()
  await db.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(1519137567)`
    await tx`CREATE TABLE IF NOT EXISTS "DirectoryDataMigration" (
      name TEXT PRIMARY KEY, "appliedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now()
    )`
    const rows = await tx`SELECT name FROM "DirectoryDataMigration"`
    const applied = new Set(rows.map(row => row.name))
    for (const name of migrations) {
      if (applied.has(name)) continue
      const sql = await readFile(join(process.cwd(), "prisma", "migrations", name, "migration.sql"), "utf8")
      // The SQL files also run standalone. Here the enclosing transaction owns the lock and records completion.
      if (!/^BEGIN;[\s\S]*COMMIT;\s*$/i.test(sql.trim())) throw new Error(`Expected a single transaction in ${name}`)
      await tx.unsafe(sql.trim().replace(/^BEGIN;/i, "").replace(/COMMIT;$/i, ""))
      await tx`INSERT INTO "DirectoryDataMigration" (name) VALUES (${name})`
    }
  })
}
