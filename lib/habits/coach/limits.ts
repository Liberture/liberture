import { claimNotification, countSentToday, localDayStartUtc, type NotificationChannel } from "@/lib/habits/push"
import { formatDateInTimeZone, parseDateOnly } from "@/lib/habits/date-utils"
import { getDb } from "@/lib/habits/db"
import { DEFAULT_COACH_PREFERENCES, type CoachPreferences, type StorageData } from "@/lib/habits/types"

/**
 * The limits every coach respects — Liberture's own push check-ins and an
 * assistant's automations (MCP record_coach_nudge) alike: no nudges in quiet
 * hours, at most maxNudgesPerDay a local day, and one per kind per day (per
 * ISO week for the weekly review). The ledger is habit_notifications_sent
 * (lib/habits/push.ts); a coach nudge is a row whose kind starts "coach:".
 */

export type CoachNudgeKind = "morning" | "afternoon" | "evening" | "weekly" | "missed_logging" | "other"

export const COACH_NUDGE_KINDS: readonly CoachNudgeKind[] = ["morning", "afternoon", "evening", "weekly", "missed_logging", "other"]

export const COACH_KIND_PREFIX = "coach:"

export type NudgeRefusal = "quiet_hours" | "daily_limit" | "duplicate"

/** The user's wall clock: local date, minutes since midnight, and that date as a local-midnight Date. */
export interface LocalNow {
  date: string
  minutes: number
  dateObj: Date
}

export type ResolvedCoachPreferences = Required<Pick<CoachPreferences, "missedLogging" | "quietHours" | "maxNudgesPerDay">> & {
  checkIns: NonNullable<CoachPreferences["checkIns"]>
}

/** "HH:MM" → minutes since midnight, or null. */
export function timeToMinutes(time: string | undefined | null): number | null {
  const m = typeof time === "string" ? time.match(/^(\d{1,2}):(\d{2})$/) : null
  if (!m) return null
  const hours = Number(m[1])
  const minutes = Number(m[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Whether `minutes` falls in [start, end); a window whose end is before its start wraps midnight. */
export function inQuietHours(minutes: number, quietHours: { start: string; end: string } | undefined): boolean {
  const start = timeToMinutes(quietHours?.start)
  const end = timeToMinutes(quietHours?.end)
  if (start === null || end === null || start === end) return false
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end
}

/** The coach preferences with defaults filled in. */
export function coachPrefs(data: Pick<StorageData, "preferences"> | null | undefined): ResolvedCoachPreferences {
  const saved = data?.preferences?.coach ?? {}
  return {
    missedLogging: saved.missedLogging ?? DEFAULT_COACH_PREFERENCES.missedLogging,
    quietHours: saved.quietHours ?? DEFAULT_COACH_PREFERENCES.quietHours,
    maxNudgesPerDay: saved.maxNudgesPerDay ?? DEFAULT_COACH_PREFERENCES.maxNudgesPerDay,
    checkIns: saved.checkIns ?? {},
  }
}

/** The wall clock in `timeZone` (the server's zone when unset or invalid). */
export function localNowIn(timeZone: string | undefined | null, now: Date = new Date()): LocalNow {
  const zone = timeZone || process.env.HABIT_TRACKER_TIME_ZONE || undefined
  const date = formatDateInTimeZone(now, zone)
  let minutes = now.getHours() * 60 + now.getMinutes()
  if (zone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(now)
      const value = Object.fromEntries(parts.map((p) => [p.type, p.value]))
      minutes = Number(value.hour) * 60 + Number(value.minute)
    } catch {
      // Invalid zone: keep the server's clock, as formatDateInTimeZone does.
    }
  }
  return { date, minutes, dateObj: parseDateOnly(date) }
}

/** ISO 8601 week of a YYYY-MM-DD date, e.g. "2026-W41". */
export function isoWeekKey(date: string): string {
  const [y, m, d] = date.split("-").map(Number)
  const day = new Date(Date.UTC(y, m - 1, d))
  const weekday = day.getUTCDay() || 7
  day.setUTCDate(day.getUTCDate() + 4 - weekday)
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

/** A short stable hash, so "other" nudges with different messages don't collide. */
function shortHash(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** The ledger key: one per kind per local day, or per ISO week for the weekly review. */
export function nudgeDedupeKey(kind: CoachNudgeKind, date: string, message?: string): string {
  const period = kind === "weekly" ? isoWeekKey(date) : date
  const suffix = kind === "other" && message ? `:${shortHash(message.trim().toLowerCase())}` : ""
  return `${COACH_KIND_PREFIX}${kind}:${period}${suffix}`
}

export interface CanNudgeInput {
  sql?: ReturnType<typeof getDb>
  userId: number
  kind: CoachNudgeKind
  localNow: LocalNow
  data: Pick<StorageData, "preferences">
  /** Who is sending: push (in-app check-ins) or an assistant. */
  channel?: NotificationChannel
  message?: string
}

export interface CanNudgeResult {
  allowed: boolean
  reason: NudgeRefusal | null
  sentToday: number
  limit: number
}

/**
 * Checks the limits and, when allowed, claims the nudge in the ledger — so a
 * true answer is also the record that it was sent. Order: quiet hours, the
 * daily cap, then the claim (a second caller for the same kind and day gets
 * `duplicate`).
 */
export async function canNudge({ sql = getDb(), userId, kind, localNow, data, channel = "push", message }: CanNudgeInput): Promise<CanNudgeResult> {
  const prefs = coachPrefs(data)
  const limit = prefs.maxNudgesPerDay
  if (inQuietHours(localNow.minutes, prefs.quietHours)) return { allowed: false, reason: "quiet_hours", sentToday: 0, limit }

  const dayStart = localDayStartUtc(data.preferences?.timeZone)
  const sentToday = await countSentToday(userId, COACH_KIND_PREFIX, dayStart, sql)
  if (sentToday >= limit) return { allowed: false, reason: "daily_limit", sentToday, limit }

  const claimed = await claimNotification(userId, nudgeDedupeKey(kind, localNow.date, message), `${COACH_KIND_PREFIX}${kind}`, channel, sql)
  if (!claimed) return { allowed: false, reason: "duplicate", sentToday, limit }
  return { allowed: true, reason: null, sentToday: sentToday + 1, limit }
}
