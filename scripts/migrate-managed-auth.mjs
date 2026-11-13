// Run during cutover while all legacy writers are stopped.
import postgres from "postgres"
import { readFile } from "node:fs/promises"
import { adminPubkeys } from "../lib/identity/admin-keys.ts"

const url = new URL(process.env.DATABASE_URL)
if ((url.searchParams.get("schema") ?? "public") !== "public") throw Error("Expected public schema")
for (const option of ["schema", "connection_limit", "pool_timeout", "pgbouncer", "statement_cache_size"]) {
  url.searchParams.delete(option)
}
const sql = postgres(url.toString(), { max: 1 })
try {
  const ddl = await readFile(new URL("../prisma/migrations/20261113000000_better_auth/migration.sql", import.meta.url), "utf8")
  const migration = await readFile(new URL("./managed-auth-backfill.sql", import.meta.url), "utf8")
  await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(68251791)`
    await tx`SET LOCAL TIME ZONE 'UTC'`
    const [schema] = await tx`SELECT to_regclass('"AuthUser"') AS existing`
    if (!schema.existing) await tx.unsafe(ddl)
    await tx.unsafe(migration)
    await tx`DELETE FROM tracker_bootstrap_admins`
    await tx`INSERT INTO tracker_bootstrap_admins (pubkey) SELECT unnest(${adminPubkeys()}::text[]) ON CONFLICT DO NOTHING`
    await tx`SELECT count(provision_tracker_identity(id)) FROM habit_users`
    const [orphaned] = await tx`SELECT count(*)::integer AS count FROM nostr_sessions s
      WHERE s.expires_at > now() AND NOT EXISTS (SELECT 1 FROM habit_users h WHERE h.nostr_pubkey=s.pubkey)`
    if (orphaned.count) throw Error("Active sessions without matching tracker accounts; migration rolled back")
    await tx`INSERT INTO "AuthSession"(id,token,"userId","createdAt","updatedAt","expiresAt")
      SELECT 'nostr-' || CASE WHEN s.token ~ '^nses_[0-9a-f]{64}$' THEN encode(sha256(convert_to(s.token,'UTF8')),'hex') ELSE s.token END,
        gen_random_uuid()::text || gen_random_uuid()::text, 'habit-' || h.id, s.created_at, now(), s.expires_at
      FROM nostr_sessions s JOIN habit_users h ON h.nostr_pubkey=s.pubkey WHERE s.expires_at > now() ON CONFLICT (id) DO NOTHING`
    await tx`DELETE FROM nostr_sessions`
  })
  console.log("Tracker identities and active sessions migrated.")
} finally { await sql.end() }
