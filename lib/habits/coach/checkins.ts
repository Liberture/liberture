import { pushConfigured, sendPush } from "@/lib/habits/push"
import { registerTickHandler } from "@/lib/habits/reminders/scheduler"
import { canNudge, coachPrefs, timeToMinutes, type CoachNudgeKind, type LocalNow } from "@/lib/habits/coach/limits"
import { afternoonCheckIn, coachLocale, missedLoggingCheckIn, morningCheckIn, weeklyCheckIn, type CoachMessage } from "@/lib/habits/coach/rules"
import type { getDb } from "@/lib/habits/db"
import { formatDateOnly, parseDateOnly } from "@/lib/habits/date-utils"
import type { HabitCompletion, StorageData } from "@/lib/habits/types"

/**
 * Liberture's own coach: on each scheduler tick, for each user, run the
 * check-ins whose time has just come, and push the message when the shared
 * limits allow (quiet hours, daily cap, one per kind per day or week). An
 * assistant's automations go through the same limits (record_coach_nudge),
 * so the two never double up.
 */

/** A check-in fires on any tick in [time, time + WINDOW): ticks can drift, and the claim dedupes. */
const WINDOW_MINUTES = 5
/** Missed logging runs once a day, early evening. */
export const MISSED_LOGGING_TIME = "18:00"

export interface CoachTickContext {
  sql: ReturnType<typeof getDb>
  userId: number
  data: StorageData
  completions: HabitCompletion[]
  localNow: LocalNow
}

function inWindow(time: string | undefined, minutes: number): boolean {
  const start = timeToMinutes(time)
  return start !== null && minutes >= start && minutes < start + WINDOW_MINUTES
}

/** Pure: which check-ins are due at this tick, in order. */
export function dueCheckIns(data: Pick<StorageData, "preferences">, localNow: LocalNow): CoachNudgeKind[] {
  const prefs = coachPrefs(data)
  const kinds: CoachNudgeKind[] = []
  if (inWindow(prefs.checkIns.morning, localNow.minutes)) kinds.push("morning")
  if (inWindow(prefs.checkIns.afternoon, localNow.minutes)) kinds.push("afternoon")
  const weekly = prefs.checkIns.weekly
  if (weekly && parseDateOnly(localNow.date).getDay() === weekly.day && inWindow(weekly.time, localNow.minutes)) kinds.push("weekly")
  if (prefs.missedLogging && inWindow(MISSED_LOGGING_TIME, localNow.minutes)) kinds.push("missed_logging")
  return kinds
}

function messageFor(kind: CoachNudgeKind, data: StorageData, completions: HabitCompletion[], localNow: LocalNow): CoachMessage | null {
  const locale = coachLocale(data)
  switch (kind) {
    case "morning":
      return morningCheckIn(data, completions, localNow, locale)
    case "afternoon":
      return afternoonCheckIn(data, completions, localNow, locale)
    case "weekly":
      return weeklyCheckIn(data, completions, localNow, locale)
    case "missed_logging":
      return missedLoggingCheckIn(data, completions, localNow, locale)
    default:
      return null
  }
}

/**
 * The tick's completions are completed-only and ~8 days deep. Missed logging
 * needs three weeks, including "not done" records (logged ≠ done), so it
 * reads its own.
 */
async function completionsForMissedLogging(sql: CoachTickContext["sql"], userId: number, data: StorageData, today: string): Promise<HabitCompletion[]> {
  const since = new Date(parseDateOnly(today).getTime() - 22 * 86_400_000)
  const sinceKey = formatDateOnly(since)
  try {
    const rows = await sql`SELECT body FROM habit_completions WHERE user_id = ${userId} AND date >= ${sinceKey}::date`
    if (rows.length) return rows.map((row) => row.body as HabitCompletion)
  } catch {
    // Normalized tables missing: use the blob.
  }
  return (data.completions ?? []).filter((c) => c?.date >= sinceKey)
}

async function hasDevice(sql: CoachTickContext["sql"], userId: number): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM habit_push_subscriptions WHERE user_id = ${userId} LIMIT 1`
  return rows.length > 0
}

/** One user, one tick. Exported for tests. */
export async function runCoachCheckIns({ sql, userId, data, completions, localNow }: CoachTickContext): Promise<CoachNudgeKind[]> {
  const sent: CoachNudgeKind[] = []
  const kinds = dueCheckIns(data, localNow)
  if (!kinds.length || !pushConfigured()) return sent
  // Without a subscribed device the check-in would only use up the day's
  // slot and make an assistant's nudge of the same kind look like a duplicate.
  if (!(await hasDevice(sql, userId))) return sent
  // The rules read the calendar day from the date string, whatever dateObj's zone.
  const now: LocalNow = { ...localNow, dateObj: parseDateOnly(localNow.date) }

  for (const kind of kinds) {
    const rows = kind === "missed_logging" ? await completionsForMissedLogging(sql, userId, data, now.date) : completions
    const message = messageFor(kind, data, rows, now)
    if (!message) continue
    const verdict = await canNudge({ sql, userId, kind, localNow: now, data, channel: "push" })
    if (!verdict.allowed) continue
    await sendPush(userId, { title: message.title, body: message.body, tag: `coach-${kind}`, url: message.url })
    sent.push(kind)
  }
  return sent
}

let registered = false

/**
 * Hooks the coach into the reminder scheduler. Idempotent. Runs on import:
 * instrumentation.ts imports this module before starting the scheduler.
 */
export function registerCoachCheckIns(): void {
  if (registered) return
  registered = true
  registerTickHandler(async (context) => {
    try {
      await runCoachCheckIns(context as CoachTickContext)
    } catch (error) {
      console.error(`[coach] check-in failed for user ${context.userId}:`, error)
    }
  })
}

registerCoachCheckIns()
