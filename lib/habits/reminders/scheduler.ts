import { getDb } from "@/lib/habits/db"
import { getCompletionRows } from "@/lib/habits/optimized-storage"
import { claimNotification, ensurePushTables, pushConfigured, sendPush } from "@/lib/habits/push"
import { dueReminders, localNowFor, type LocalNow } from "@/lib/habits/reminders/due"
import { isTimeZone } from "@/lib/habits/api/time-zone"
import type { HabitCompletion, StorageData } from "@/lib/habits/types"

/**
 * The server side of reminders: once a minute, for every user with a push
 * subscription and reminders on, send what is due. One sender across pm2
 * workers and containers (Postgres advisory lock), one delivery per reminder
 * (claimNotification). Started from instrumentation.ts.
 */

type Sql = ReturnType<typeof getDb>

export interface TickContext {
  sql: Sql
  userId: number
  data: StorageData
  /** Completed completions from the last ~8 local days (enough for weekly targets). */
  completions: HabitCompletion[]
  localNow: LocalNow
  /** The zone localNow was computed in (preferences.timeZone, else HABIT_TRACKER_TIME_ZONE). */
  timeZone: string | undefined
  now: Date
}

export type TickHandler = (ctx: TickContext) => Promise<void> | void

/** Arbitrary constant shared by every process: "the reminder sender". */
const REMINDER_LOCK_KEY = 0x4c_52_4d_31 // "LRM1"
const TICK_MS = 60_000

interface SchedulerState {
  handlers: TickHandler[]
  timer: ReturnType<typeof setInterval> | null
  running: boolean
}

/** On globalThis so dev reloads and separately bundled imports share one registry and one timer. */
const STATE_KEY = Symbol.for("liberture.reminders.scheduler")
function state(): SchedulerState {
  const g = globalThis as unknown as Record<symbol, SchedulerState | undefined>
  if (!g[STATE_KEY]) g[STATE_KEY] = { handlers: [], timer: null, running: false }
  return g[STATE_KEY]!
}

/**
 * Plugs more per-user work into the same tick (coach check-ins). Handlers run
 * after the habit reminders, once per eligible user per minute, inside the
 * advisory lock; they must claim their own notifications (claimNotification)
 * so a retried tick never sends twice. Returns an unregister function.
 */
export function registerTickHandler(fn: TickHandler): () => void {
  const s = state()
  if (!s.handlers.includes(fn)) s.handlers.push(fn)
  return () => {
    s.handlers = s.handlers.filter((h) => h !== fn)
  }
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + days))
  return next.toISOString().slice(0, 10)
}

async function completionsFor(sql: Sql, userId: number, data: StorageData, today: string): Promise<HabitCompletion[]> {
  const since = addDays(today, -8)
  const rows = await getCompletionRows(sql, userId, since)
  if (rows.length) return rows
  // Users whose normalized tables are still empty: fall back to the JSON blob.
  return (data.completions ?? []).filter((c) => c?.completed && c.date >= since)
}

async function tickUser(sql: Sql, userId: number, data: StorageData, now: Date): Promise<number> {
  const saved = data.preferences?.timeZone
  const timeZone = isTimeZone(saved) ? saved : process.env.HABIT_TRACKER_TIME_ZONE || undefined
  const localNow = localNowFor(timeZone, now)
  const completions = await completionsFor(sql, userId, data, localNow.date)
  let sent = 0

  for (const reminder of dueReminders(data, completions, localNow)) {
    if (!(await claimNotification(userId, reminder.key, reminder.kind, "push", sql))) continue
    const result = await sendPush(userId, { title: reminder.title, body: reminder.body, tag: reminder.tag, url: reminder.url })
    sent += result.sent
  }

  for (const handler of state().handlers) {
    try {
      await handler({ sql, userId, data, completions, localNow, timeZone, now })
    } catch (error) {
      console.warn(`[reminders] tick handler failed for user ${userId}:`, error instanceof Error ? error.message : error)
    }
  }

  return sent
}

/** One pass. Returns null when another process holds the lock (or one is still running here). */
export async function runReminderTick(now: Date = new Date()): Promise<{ users: number; sent: number } | null> {
  const s = state()
  if (s.running) return null
  s.running = true
  const sql = getDb()
  let reserved: Awaited<ReturnType<Sql["reserve"]>> | null = null
  try {
    await ensurePushTables()
    // Session-level lock: take and release it on the same connection.
    reserved = await sql.reserve()
    const [{ locked }] = await reserved`SELECT pg_try_advisory_lock(${REMINDER_LOCK_KEY}) AS locked`
    if (!locked) return null
    try {
      const users = await sql`
        SELECT u.id, u.data
        FROM habit_users u
        WHERE EXISTS (SELECT 1 FROM habit_push_subscriptions s WHERE s.user_id = u.id)
          AND COALESCE(u.data->'preferences'->>'notifications', 'true') <> 'false'
      `
      let sent = 0
      for (const row of users) {
        try {
          sent += await tickUser(sql, row.id as number, (row.data ?? {}) as StorageData, now)
        } catch (error) {
          console.warn(`[reminders] user ${row.id} skipped:`, error instanceof Error ? error.message : error)
        }
      }
      if (sent > 0) console.info(`[reminders] sent ${sent} push notification(s) to ${users.length} eligible user(s)`)
      return { users: users.length, sent }
    } finally {
      await reserved`SELECT pg_advisory_unlock(${REMINDER_LOCK_KEY})`
    }
  } catch (error) {
    console.warn("[reminders] tick failed:", error instanceof Error ? error.message : error)
    return null
  } finally {
    reserved?.release()
    s.running = false
  }
}

/** Starts the minute ticker once per process. No-op when push isn't configured. */
export function startReminderScheduler(): boolean {
  const s = state()
  if (s.timer) return true
  if (!pushConfigured()) return false
  s.timer = setInterval(() => void runReminderTick(), TICK_MS)
  s.timer.unref?.()
  // First pass shortly after boot, off the startup path.
  setTimeout(() => void runReminderTick(), 5_000).unref?.()
  console.info("[reminders] scheduler started (every 60s)")
  return true
}

export function stopReminderScheduler(): void {
  const s = state()
  if (s.timer) clearInterval(s.timer)
  s.timer = null
}
