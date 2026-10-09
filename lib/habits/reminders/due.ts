import { formatDateInTimeZone, parseDateOnly } from "@/lib/habits/date-utils"
import { isHabitDueOnDate, type WeekStart } from "@/lib/habits/habit-utils"
import { getDictionary, isLocale } from "@/lib/habits/i18n"
import { formatMessage } from "@/lib/i18n-format"
import {
  DEFAULT_COACH_PREFERENCES,
  type Habit,
  type HabitCompletion,
  type StorageData,
} from "@/lib/habits/types"

/**
 * Which habit reminders are due right now. Pure: the server tick and the
 * in-tab fallback (NotificationManager) both call it, so they agree on the
 * window and on the dedupe keys they claim.
 */

/** A reminder fires during the first minutes after its time, never later. */
export const REMINDER_WINDOW_MINUTES = 15
/** Random nudges land between 09:00 and 20:00 local. */
export const RANDOM_START_MINUTES = 9 * 60
export const RANDOM_END_MINUTES = 20 * 60

export type ReminderKind = "habit" | "habit_random"

export interface LocalNow {
  /** "YYYY-MM-DD" in the user's zone. */
  date: string
  /** Minutes since local midnight, 0-1439. */
  minutes: number
  /** Local midnight of `date` as a process-local Date (what habit-utils expects). */
  dateObj: Date
}

export interface DueReminder {
  habitId: string
  title: string
  body: string
  /** Dedupe key: habit:<id>:<date>:<kind>, plus :<slot> for random nudges. */
  key: string
  kind: ReminderKind
  /** Notification tag: a later reminder for the same habit replaces the earlier one. */
  tag: string
  url: string
}

export interface ReminderStrings {
  reminderTitle: string
  /** Template with {name}. Random nudges. */
  reminderBody: string
  /** Template with {name} and {time}. At the habit's own time. */
  dueBody: string
}

export const REMINDER_URL = "/tracker?view=habits"

export function reminderKey(habitId: string, date: string, kind: ReminderKind, slot?: number): string {
  return `habit:${habitId}:${date}:${kind}${slot === undefined ? "" : `:${slot}`}`
}

/** "07:30", "7:30 PM" → minutes since midnight; null when unreadable or empty. */
export function parseTimeToMinutes(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null
  const match = value.match(/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3]?.toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Whether `minutes` falls in [start, end), wrapping midnight when end <= start. */
export function inQuietHours(minutes: number, quietHours: { start: string; end: string } | undefined): boolean {
  if (!quietHours) return false
  const start = parseTimeToMinutes(quietHours.start)
  const end = parseTimeToMinutes(quietHours.end)
  if (start === null || end === null || start === end) return false
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end
}

/** FNV-1a, enough to spread slots; must be identical on server and client. */
function hash32(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** One or two minutes in [09:00, 20:00) for this habit on this day, ascending. Deterministic. */
export function randomReminderSlots(habitId: string, date: string): number[] {
  const span = RANDOM_END_MINUTES - RANDOM_START_MINUTES
  const seed = hash32(`${habitId}|${date}`)
  const count = (seed & 1) + 1
  const slots: number[] = []
  for (let i = 0; i < count; i++) {
    slots.push(RANDOM_START_MINUTES + (hash32(`${habitId}|${date}|${i}`) % span))
  }
  return slots.sort((a, b) => a - b)
}

function inWindow(minutes: number, start: number): boolean {
  return minutes >= start && minutes < start + REMINDER_WINDOW_MINUTES
}

/** "Now" in a zone: falls back to HABIT_TRACKER_TIME_ZONE, then the process zone. */
export function localNowFor(timeZone: string | undefined | null, now: Date = new Date()): LocalNow {
  const envZone = typeof process !== "undefined" ? process.env.HABIT_TRACKER_TIME_ZONE : undefined
  const zone = timeZone || envZone || undefined
  const date = formatDateInTimeZone(now, zone)
  let minutes = now.getHours() * 60 + now.getMinutes()
  if (zone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(now)
      const value = Object.fromEntries(parts.map((p) => [p.type, p.value]))
      const h = Number(value.hour)
      const m = Number(value.minute)
      if (Number.isFinite(h) && Number.isFinite(m)) minutes = (h % 24) * 60 + m
    } catch {
      // Invalid zone: formatDateInTimeZone already fell back to process-local.
    }
  }
  return { date, minutes, dateObj: parseDateOnly(date) }
}

function defaultStrings(data: Pick<StorageData, "preferences">): ReminderStrings {
  const language = data.preferences?.language
  const t = getDictionary(isLocale(language) ? language : "en").app.notificationManager
  return { reminderTitle: t.reminderTitle, reminderBody: t.reminderBody, dueBody: t.dueBody }
}

/**
 * Habit reminders due at `localNow`:
 * - at the habit's own time, for REMINDER_WINDOW_MINUTES (always allowed: the user picked that time);
 * - random nudges for habits with randomRemindersEnabled, outside quiet hours;
 * - only for non-archived habits that are due today (isHabitDueOnDate: a met weekly target is not due) and not done.
 */
export function dueReminders(
  data: Pick<StorageData, "habits" | "preferences">,
  completions: HabitCompletion[],
  localNow: LocalNow,
  weekStartsOn: WeekStart = data.preferences?.weekStartsOn ?? 1,
  strings: ReminderStrings = defaultStrings(data),
): DueReminder[] {
  const quietHours = data.preferences?.coach?.quietHours ?? DEFAULT_COACH_PREFERENCES.quietHours
  const quiet = inQuietHours(localNow.minutes, quietHours)
  const doneToday = new Set(
    completions.filter((c) => c.date === localNow.date && c.completed).map((c) => c.habitId)
  )
  const out: DueReminder[] = []

  for (const habit of (data.habits ?? []) as Habit[]) {
    if (!habit?.id || habit.archived) continue
    if (doneToday.has(habit.id)) continue
    if (!isHabitDueOnDate(habit, localNow.dateObj, completions, weekStartsOn, localNow.dateObj)) continue

    const base = { habitId: habit.id, title: strings.reminderTitle, tag: `habit-${habit.id}`, url: REMINDER_URL }

    const at = parseTimeToMinutes(habit.time)
    if (at !== null && inWindow(localNow.minutes, at)) {
      out.push({
        ...base,
        kind: "habit",
        key: reminderKey(habit.id, localNow.date, "habit"),
        body: formatMessage(strings.dueBody, { name: habit.name, time: habit.time }),
      })
    }

    if (habit.randomRemindersEnabled && !quiet) {
      randomReminderSlots(habit.id, localNow.date).forEach((slot, index) => {
        if (!inWindow(localNow.minutes, slot)) return
        out.push({
          ...base,
          kind: "habit_random",
          key: reminderKey(habit.id, localNow.date, "habit_random", index),
          body: formatMessage(strings.reminderBody, { name: habit.name }),
        })
      })
    }
  }

  return out
}
