import { createHash } from "node:crypto"
import { getDb } from "@/lib/habits/db"
import { mutateHabits } from "@/lib/habits/api/habit-writes"
import {
  ensureOptimizedStorageTables,
  getCompletionRows,
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
} from "@/lib/habits/optimized-storage"
import {
  buildHabitMapping,
  CONFLICT_POLICIES,
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  parseHabitHistoryBackup,
  parseHabitMapping,
  planImport,
  type ConflictPolicy,
  type HabitMatch,
  type PlannedRecord,
} from "@/lib/habits/import/habit-history"
import { rebuildStreaks, type HabitHistoryStats } from "@/lib/habits/import/history-stats"
import type { WeekStart } from "@/lib/habits/habit-utils"
import type { Habit, HabitCompletion, StorageData } from "@/lib/habits/types"

/**
 * POST /api/v1/import/habit-history (assistants, MCP import_habit_history)
 * and POST /api/import/habit-history (the app) both end here.
 *
 * Writes go in batches, each one transaction, inserting with ON CONFLICT DO
 * NOTHING on (user, habit, date): a day that gained a record since the plan
 * was made is reported, not overwritten, and running the same backup again
 * writes nothing. A failed batch doesn't undo the others; running again
 * picks up exactly what is missing. The backup itself is kept (habit_imports)
 * so records left pending can be imported later by importId, with a mapping,
 * without sending the file again.
 */

const DETAIL_LIMIT = 500
/** Pending records are listed in full up to this many: they are what a later run with habitMapping picks up. */
const UNRESOLVED_LIMIT = 5_000

export interface HabitHistoryImportRequest {
  data?: unknown
  importId?: unknown
  mode?: unknown
  dryRun?: unknown
  habitMapping?: unknown
  conflictPolicy?: unknown
  batchSize?: unknown
}

export interface BatchResult {
  batch: number
  records: number
  imported: number
  merged: number
  /** Days that gained a record while the import ran: left as they are. */
  changedMeanwhile: number
  failed: number
  error?: string
}

type Sql = ReturnType<typeof getDb>

let tableReady = false
async function ensureImportTable(sql: Sql): Promise<void> {
  if (tableReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS habit_imports (
      user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source JSONB NOT NULL,
      last_result JSONB,
      PRIMARY KEY (user_id, id)
    )
  `
  tableReady = true
}

/** Same backup, same id: the hash of its completions and habits. */
function importIdFor(source: unknown): string {
  return `imp_${createHash("sha256").update(JSON.stringify(source)).digest("hex").slice(0, 20)}`
}

function limited<T>(items: T[], max = DETAIL_LIMIT): { items: T[]; truncated: boolean } {
  return { items: items.slice(0, max), truncated: items.length > max }
}

function bad(error: string) {
  return { status: 400, body: { error, code: "invalid_import" } }
}

export async function runHabitHistoryImport(
  userId: number,
  data: StorageData,
  request: HabitHistoryImportRequest,
  today: string
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (request.mode !== undefined && request.mode !== "merge") return bad("mode must be \"merge\": an import never replaces what is in the account")
  const conflictPolicy = (request.conflictPolicy ?? "preserve_existing") as ConflictPolicy
  if (!CONFLICT_POLICIES.includes(conflictPolicy)) return bad(`conflictPolicy must be one of ${CONFLICT_POLICIES.join(", ")}`)
  const dryRun = request.dryRun === true
  const batchSize = request.batchSize === undefined ? DEFAULT_BATCH_SIZE : Number(request.batchSize)
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) return bad(`batchSize must be a whole number from 1 to ${MAX_BATCH_SIZE}`)
  const mapping = parseHabitMapping(request.habitMapping)
  if ("error" in mapping) return bad(mapping.error)

  const sql = getDb()
  await ensureImportTable(sql)

  // The backup: sent now, or kept from an earlier import.
  let source: unknown = request.data
  let importId: string | null = null
  if (source === undefined || source === null || source === "") {
    if (typeof request.importId !== "string" || !request.importId) return bad("Send data (the backup JSON) or the importId of an earlier import")
    const rows = await sql`SELECT source FROM habit_imports WHERE user_id = ${userId} AND id = ${request.importId}`
    if (!rows.length) return { status: 404, body: { error: "No import with that importId in this account", code: "not_found" } }
    source = rows[0].source
    importId = request.importId
  } else if (typeof source === "string") {
    try {
      source = JSON.parse(source)
    } catch {
      return bad("data is not valid JSON")
    }
  }
  const parsed = parseHabitHistoryBackup(source)
  if ("error" in parsed) return bad(parsed.error)
  // Only what the import uses is kept: habits and completions, not todos or the profile.
  const kept = Array.isArray(source) ? { completions: source } : { habits: (source as { habits?: unknown }).habits ?? [], completions: (source as { completions: unknown }).completions }
  importId ??= importIdFor(kept)

  await ensureOptimizedStorageTables()
  await syncOptimizedStorageTablesIfEmpty(sql, userId, data)
  const currentHabits = (data.habits ?? []) as Habit[]
  const { matches, errors } = buildHabitMapping(parsed.habits, parsed.records, currentHabits, mapping)
  const existingRows = await getCompletionRows(sql, userId)
  const existing = new Map(existingRows.map((c) => [`${c.habitId}:${c.date}`, c]))
  const { planned } = planImport({
    records: parsed.records, matches, backupHabits: parsed.habits, currentHabits, explicit: mapping, existing, conflictPolicy,
  })

  const writes = planned.filter((p) => p.action === "import" || p.action === "merge")
  const batches: BatchResult[] = []
  const changedMeanwhile = new Set<PlannedRecord>()
  const failedWrites = new Map<PlannedRecord, string>()

  if (!dryRun) {
    await sql`
      INSERT INTO habit_imports (user_id, id, source) VALUES (${userId}, ${importId}, ${JSON.stringify(kept)}::jsonb)
      ON CONFLICT (user_id, id) DO UPDATE SET updated_at = NOW()
    `
    for (let start = 0, n = 0; start < writes.length; start += batchSize, n++) {
      const batch = writes.slice(start, start + batchSize)
      const inserts = batch.filter((p) => p.action === "import")
      const merges = batch.filter((p) => p.action === "merge")
      const result: BatchResult = { batch: n + 1, records: batch.length, imported: 0, merged: 0, changedMeanwhile: 0, failed: 0 }
      try {
        await sql.begin(async (tx) => {
          const written = new Set<string>()
          if (inserts.length) {
            const rows = await tx`
              INSERT INTO habit_completions (user_id, habit_id, date, completed, completed_at, entry_data, body)
              SELECT ${userId}, c->>'habitId', (c->>'date')::date, (c->>'completed')::boolean,
                     NULLIF(c->>'completedAt', ''), COALESCE(c->'data', '{}'::jsonb), c
              FROM jsonb_array_elements(${JSON.stringify(inserts.map((p) => p.completion))}::jsonb) AS c
              ON CONFLICT (user_id, habit_id, date) DO NOTHING
              RETURNING habit_id, date::text AS date
            `
            for (const row of rows) written.add(`${row.habit_id}:${row.date}`)
          }
          for (const p of merges) {
            const c = p.completion as HabitCompletion
            // Only if the day is still what the plan saw.
            const rows = await tx`
              UPDATE habit_completions
              SET completed = ${c.completed}, completed_at = ${c.completedAt ?? null},
                  entry_data = ${JSON.stringify(c.data ?? {})}::jsonb, body = ${JSON.stringify(c)}::jsonb
              WHERE user_id = ${userId} AND habit_id = ${c.habitId} AND date = ${c.date}::date
                AND body = ${JSON.stringify(p.previous)}::jsonb
              RETURNING habit_id
            `
            if (rows.length) written.add(`${c.habitId}:${c.date}`)
          }
          for (const p of batch) {
            if (written.has(`${p.newHabitId}:${p.date}`)) {
              if (p.action === "import") result.imported++
              else result.merged++
            } else {
              changedMeanwhile.add(p)
              result.changedMeanwhile++
            }
          }
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("Habit history import batch failed:", error)
        result.imported = result.merged = result.changedMeanwhile = 0
        result.failed = batch.length
        result.error = message
        for (const p of batch) {
          changedMeanwhile.delete(p)
          failedWrites.set(p, message)
        }
      }
      batches.push(result)
    }
  }

  // Counts. A write that found its day taken meanwhile is a conflict, like any other.
  const count = (action: PlannedRecord["action"]) => planned.filter((p) => p.action === action).length
  const written = (action: "import" | "merge") =>
    dryRun ? count(action) : writes.filter((p) => p.action === action && !changedMeanwhile.has(p) && !failedWrites.has(p)).length
  const imported = written("import")
  const merged = written("merge")
  const conflictList = [
    ...planned.filter((p) => p.action === "conflict"),
    ...[...changedMeanwhile].map((p) => ({ ...p, action: "conflict" as const, reason: "this day got a record while the import ran; kept as it is" })),
  ]
  const unresolvedList = planned.filter((p) => p.action === "unresolved")
  const failures = [
    ...parsed.failures.map((f) => ({ index: f.index, habitId: f.habitId, date: f.date, error: f.error })),
    ...[...failedWrites].map(([p, error]) => ({ index: p.index, habitId: p.oldHabitId, date: p.date, error })),
  ]

  // Streaks and stats, rebuilt from every completion of the habits that got history.
  const touched = new Set(matches.filter((m) => m.status === "mapped" && m.newHabitId).map((m) => m.newHabitId!))
  let streaksRecalculated = false
  let stats: HabitHistoryStats[] = []
  const weekStartsOn = (data.preferences?.weekStartsOn ?? 1) as WeekStart
  const legacyIds = new Map<string, string[]>()
  for (const m of matches) if (m.status === "mapped" && m.newHabitId && m.oldHabitId !== m.newHabitId) {
    legacyIds.set(m.newHabitId, [...(legacyIds.get(m.newHabitId) ?? []), m.oldHabitId])
  }
  if (dryRun) {
    const replaced = new Set(writes.filter((w) => w.action === "merge").map((w) => `${w.newHabitId}:${w.date}`))
    const preview = [...existingRows.filter((c) => !replaced.has(`${c.habitId}:${c.date}`)), ...writes.map((w) => w.completion!)]
    stats = rebuildStreaks(currentHabits, preview, touched, today, weekStartsOn).stats
  } else if (touched.size) {
    // Always: a run that died after its batches but before this still leaves the blob behind the rows.
    await refreshStorageJsonFromOptimizedTables(sql, userId, ["completions"])
    const completions = await getCompletionRows(sql, userId)
    const now = new Date().toISOString()
    try {
      streaksRecalculated = await mutateHabits(userId, (current) => {
        const rebuilt = rebuildStreaks(current.habits, completions, touched, today, weekStartsOn)
        stats = rebuilt.stats
        return {
          habits: rebuilt.habits.map((h) => {
            if (!touched.has(h.id)) return h
            const ids = [...new Set([...(h.importedIds ?? []), ...(legacyIds.get(h.id) ?? [])])]
            // updatedAt: an older tab's save keeps this version (lib/habits/habit-sync.ts).
            return { ...h, ...(ids.length ? { importedIds: ids } : {}), updatedAt: now }
          }),
        }
      })
    } catch (error) {
      console.error("Habit history import: streak rebuild failed:", error)
    }
  }

  const ambiguous = matches.filter((m) => m.status === "ambiguous")
  const unmatched = matches.filter((m) => m.status === "unmatched")
  const unmappedFields = [...new Set(planned.flatMap((p) => (p.unmappedFields ?? []).map((k) => `${p.oldHabitId}:${k}`)))]
  const failedBatches = batches.filter((b) => b.error).length
  const status = dryRun ? "dry_run" : failedBatches ? (failedBatches === batches.length ? "failed" : "partial") : "completed"
  const summary = {
    status,
    dryRun,
    importId: dryRun ? null : importId,
    total: parsed.records.length + parsed.failures.length,
    imported,
    merged,
    skipped: count("skip"),
    conflicts: conflictList.length,
    unresolved: unresolvedList.length,
    failed: failures.length,
    habitsMapped: matches.filter((m) => m.status === "mapped").length,
    habitsAmbiguous: ambiguous.length,
    habitsUnmatched: unmatched.length,
    streaksRecalculated: dryRun ? false : streaksRecalculated || touched.size === 0,
  }
  const sayParts = [
    dryRun ? `Preview: ${imported} of ${summary.total} records would be imported` : `Imported ${imported} of ${summary.total} records`,
    summary.skipped ? `${summary.skipped} already there` : "",
    summary.conflicts ? `${summary.conflicts} kept as they are in Liberture (conflicts)` : "",
    summary.unresolved ? `${summary.unresolved} pending until their habit is matched` : "",
    summary.failed ? `${summary.failed} failed` : "",
  ].filter(Boolean)
  const say =
    `${sayParts.join(", ")}.` +
    (ambiguous.length ? ` ${ambiguous.length} habit match${ambiguous.length === 1 ? " needs" : "es need"} confirming: send habitMapping.` : "") +
    (!dryRun && summary.unresolved ? ` Run again with importId ${importId} and habitMapping to import the pending ones.` : "")

  const conflicts = limited(conflictList.map((p) => ({ index: p.index, oldHabitId: p.oldHabitId, habitId: p.newHabitId, date: p.date, reason: p.reason })))
  const unresolvedRecords = limited(unresolvedList.map((p) => ({ index: p.index, oldHabitId: p.oldHabitId, date: p.date, reason: p.reason })), UNRESOLVED_LIMIT)
  const failedRecords = limited(failures)
  const body = {
    ...summary,
    conflictPolicy,
    say,
    habitMapping: matches.map((m: HabitMatch) => ({
      oldHabitId: m.oldHabitId, newHabitId: m.newHabitId, oldName: m.oldName, newName: m.newName, status: m.status,
      ...(m.method ? { method: m.method } : {}), ...(m.confidence !== undefined ? { confidence: m.confidence } : {}),
      ...(m.candidates ? { candidates: m.candidates } : {}), ...(m.reason ? { reason: m.reason } : {}), records: m.records,
    })),
    ambiguous: ambiguous.map((m) => ({ oldHabitId: m.oldHabitId, oldName: m.oldName, records: m.records, candidates: m.candidates ?? [], reason: m.reason })),
    unresolvedHabits: [...ambiguous, ...unmatched].map((m) => ({ oldHabitId: m.oldHabitId, oldName: m.oldName, records: m.records, reason: m.reason })),
    unresolvedRecords: unresolvedRecords.items,
    conflictRecords: conflicts.items,
    failedRecords: failedRecords.items,
    truncated: unresolvedRecords.truncated || conflicts.truncated || failedRecords.truncated,
    unmappedFields,
    mappingErrors: errors,
    batches,
    stats,
  }
  if (!dryRun) {
    await sql`UPDATE habit_imports SET last_result = ${JSON.stringify({ ...summary, at: new Date().toISOString() })}::jsonb, updated_at = NOW() WHERE user_id = ${userId} AND id = ${importId}`
  }
  return { status: status === "failed" ? 500 : 200, body }
}
