import { getDb } from "@/lib/habits/db"
import { inferTimeOfDay } from "@/lib/habits/habit-utils"
import { PILLAR_HEX, PILLAR_IDS, pillarForHabit, type PillarId } from "@/lib/habits/pillars"
import { PILLAR_TAG, freshStreakData } from "@/lib/habits/protocols/adopt"
import type { Habit } from "@/lib/habits/types"

/**
 * Server-side habit writes for the assistant API. Habits live only in the
 * JSONB blob, so additions are one atomic append; the storage POST's habit
 * merge (lib/habit-sync.ts) keeps them when an older tab saves afterwards.
 */

export async function appendHabits(userId: number, habits: Habit[]): Promise<void> {
  if (habits.length === 0) return
  const now = new Date().toISOString()
  await getDb()`
    UPDATE habit_users
    SET data = jsonb_set(
      jsonb_set(data, '{habits}', COALESCE(data->'habits', '[]'::jsonb) || ${JSON.stringify(habits)}::jsonb),
      '{lastUpdated}', to_jsonb(${now}::text)
    ),
    updated_at = NOW()
    WHERE id = ${userId}
  `
}

const DAY_NAMES: Record<string, number> = {
  sun: 0, sunday: 0, dom: 0, domingo: 0,
  mon: 1, monday: 1, lun: 1, lunes: 1,
  tue: 2, tuesday: 2, mar: 2, martes: 2,
  wed: 3, wednesday: 3, mie: 3, miercoles: 3,
  thu: 4, thursday: 4, jue: 4, jueves: 4,
  fri: 5, friday: 5, vie: 5, viernes: 5,
  sat: 6, saturday: 6, sab: 6, sabado: 6,
}

const DAY_GROUPS: Record<string, number[]> = {
  weekdays: [1, 2, 3, 4, 5],
  weekday: [1, 2, 3, 4, 5],
  "dias habiles": [1, 2, 3, 4, 5],
  "entre semana": [1, 2, 3, 4, 5],
  weekends: [0, 6],
  weekend: [0, 6],
  "fin de semana": [0, 6],
  "fines de semana": [0, 6],
  "every day": [0, 1, 2, 3, 4, 5, 6],
  everyday: [0, 1, 2, 3, 4, 5, 6],
  daily: [0, 1, 2, 3, 4, 5, 6],
  "todos los dias": [0, 1, 2, 3, 4, 5, 6],
}

const SPOKEN_DAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"]

/** "on weekdays", "on weekends", or "on Mondays, Thursdays". */
function spokenDays(days: number[]): string {
  const key = [...days].sort().join()
  if (key === "1,2,3,4,5") return "on weekdays"
  if (key === "0,6") return "on weekends"
  return `on ${days.map((d) => SPOKEN_DAYS[d]).join(", ")}`
}

function plainLower(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

/** Accepts [1,3,5], ["mon","wed"], "weekdays", "lunes y jueves"… Null when it can't tell. */
export function parseDays(input: unknown): number[] | null {
  if (input === undefined || input === null || input === "") return null
  const parts: unknown[] = Array.isArray(input) ? input : String(input).split(/[\s,;/]+|\by\b|\band\b/)
  const joined = typeof input === "string" ? plainLower(input) : ""
  if (DAY_GROUPS[joined]) return DAY_GROUPS[joined]

  const days = new Set<number>()
  for (const part of parts) {
    if (typeof part === "number" && Number.isInteger(part) && part >= 0 && part <= 6) {
      days.add(part)
      continue
    }
    const key = plainLower(String(part ?? ""))
    if (!key) continue
    if (DAY_GROUPS[key]) DAY_GROUPS[key].forEach((d) => days.add(d))
    else if (key in DAY_NAMES) days.add(DAY_NAMES[key])
    else if (/^[0-6]$/.test(key)) days.add(Number(key))
    else return null
  }
  return days.size ? [...days].sort() : null
}

/** "07:00", "7am", "7:30 pm" → "HH:MM"; "" for none; null if unreadable. */
export function parseTime(input: unknown): string | null {
  if (input === undefined || input === null || input === "") return ""
  const m = String(input).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) return null
  let hour = Number(m[1])
  const minute = Number(m[2] ?? "0")
  if (m[3]) hour = (hour % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0)
  if (hour > 23 || minute > 59) return null
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export interface CustomHabitInput {
  name?: unknown
  days?: unknown
  timesPerWeek?: unknown
  time?: unknown
  pillar?: unknown
  description?: unknown
}

export type BuildResult = { habit: Habit; scheduleText: string } | { error: string }

export function buildCustomHabit(input: CustomHabitInput): BuildResult {
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : ""
  if (!name) return { error: "name is required" }
  if (name.length > 80) return { error: "name is too long (80 characters max)" }
  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  let schedule: Habit["schedule"] = { type: "daily" }
  let scheduleText = "every day"
  const days = parseDays(input.days)
  if (input.days !== undefined && input.days !== null && input.days !== "" && !days) {
    return { error: "days must be weekday names or numbers 0-6 (0 = Sunday), or 'weekdays' / 'weekends'" }
  }
  const perWeek = Number(input.timesPerWeek)
  if (days && days.length < 7) {
    schedule = { type: "specific_days", days }
    scheduleText = spokenDays(days)
  } else if (Number.isInteger(perWeek) && perWeek >= 1 && perWeek <= 6) {
    schedule = { type: "times_per_week", timesPerWeek: perWeek }
    scheduleText = `${perWeek} time${perWeek === 1 ? "" : "s"} a week`
  }

  const parsedTime = parseTime(input.time)
  if (parsedTime === null) return { error: "time must be HH:MM (24h), or omitted for no reminder" }
  const time = parsedTime

  const pillar: PillarId =
    typeof input.pillar === "string" && (PILLAR_IDS as string[]).includes(input.pillar)
      ? (input.pillar as PillarId)
      : pillarForHabit({ name, category: undefined, tags: [] })

  const habit: Habit = {
    id: crypto.randomUUID(),
    name: displayName,
    ...(typeof input.description === "string" && input.description.trim()
      ? { description: input.description.trim().slice(0, 500) }
      : {}),
    // Empty time = no reminder; the app treats it as "any time of day".
    time,
    timeOfDay: time ? inferTimeOfDay(time) : "anytime",
    color: PILLAR_HEX[pillar],
    schedule,
    priority: 3,
    category: pillar,
    tags: [PILLAR_TAG[pillar]],
    archived: false,
    createdAt: new Date().toISOString(),
    randomRemindersEnabled: false,
    // Same shape the catalog writes: the cue is the scheduled time.
    ...(time ? { implementationIntention: { trigger: `it is ${time}`, behavior: displayName } } : {}),
    streakData: freshStreakData(),
  }
  return { habit, scheduleText: time ? `${scheduleText} at ${time}` : scheduleText }
}

// ---------------------------------------------------------------- edit / delete

/**
 * Read-modify-write of the habits array, guarded by lastUpdated so a save
 * from a tab landing in between is never silently overwritten: on a race the
 * row is re-read and the change re-applied.
 */
export async function mutateHabits(
  userId: number,
  change: (data: { habits: Habit[]; habitTombstones: Record<string, string> }) => {
    habits: Habit[]
    habitTombstones?: Record<string, string>
  } | null
): Promise<boolean> {
  const sql = getDb()
  for (let attempt = 0; attempt < 4; attempt++) {
    const rows = await sql`
      SELECT data->'habits' AS habits, data->'habitTombstones' AS tombstones, data->>'lastUpdated' AS last
      FROM habit_users WHERE id = ${userId}`
    if (!rows.length) return false
    const current = {
      habits: (rows[0].habits as Habit[] | null) ?? [],
      habitTombstones: (rows[0].tombstones as Record<string, string> | null) ?? {},
    }
    const next = change(current)
    if (!next) return false
    const now = new Date().toISOString()
    const last = (rows[0].last as string | null) ?? ""
    const updated = await sql`
      UPDATE habit_users
      SET data = jsonb_set(
        jsonb_set(
          jsonb_set(data, '{habits}', ${JSON.stringify(next.habits)}::jsonb),
          '{habitTombstones}', ${JSON.stringify(next.habitTombstones ?? current.habitTombstones)}::jsonb
        ),
        '{lastUpdated}', to_jsonb(${now}::text)
      ),
      updated_at = NOW()
      WHERE id = ${userId} AND COALESCE(data->>'lastUpdated', '') = ${last}
      RETURNING id`
    if (updated.length) return true
  }
  throw new Error("Habits kept changing; try again")
}

export interface HabitEditInput {
  name?: unknown
  description?: unknown
  days?: unknown
  timesPerWeek?: unknown
  time?: unknown
}

/** Applies an edit to one habit; returns the new habit and what changed, or an error. */
export function applyHabitEdit(habit: Habit, input: HabitEditInput): { habit: Habit; changes: string[] } | { error: string } {
  const next: Habit = { ...habit }
  const changes: string[] = []

  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : ""
    if (!name || name.length > 80) return { error: "name must be 1-80 characters" }
    if (name !== habit.name) {
      next.name = name.charAt(0).toUpperCase() + name.slice(1)
      changes.push(`renamed to ${next.name}`)
    }
  }
  if (input.description !== undefined) {
    const description = typeof input.description === "string" ? input.description.trim().slice(0, 500) : ""
    next.description = description || undefined
    changes.push(description ? "description updated" : "description cleared")
  }
  if (input.days !== undefined && input.days !== null && input.days !== "") {
    const days = parseDays(input.days)
    if (!days) return { error: "days must be weekday names or numbers 0-6, or 'weekdays' / 'weekends' / 'every day'" }
    next.schedule = days.length >= 7 ? { type: "daily" } : { type: "specific_days", days }
    changes.push(days.length >= 7 ? "now every day" : `now ${spokenDays(days)}`)
  } else if (input.timesPerWeek !== undefined) {
    const n = Number(input.timesPerWeek)
    if (!Number.isInteger(n) || n < 1 || n > 7) return { error: "timesPerWeek must be 1-7" }
    next.schedule = n === 7 ? { type: "daily" } : { type: "times_per_week", timesPerWeek: n }
    changes.push(n === 7 ? "now every day" : `now ${n} times a week`)
  }
  if (input.time !== undefined) {
    const time = parseTime(input.time)
    if (time === null) return { error: "time must be HH:MM, or empty for no reminder" }
    next.time = time
    next.timeOfDay = time ? inferTimeOfDay(time) : "anytime"
    changes.push(time ? `time ${time}` : "no reminder")
  }
  if (changes.length === 0) return { error: "Nothing to change: send name, description, days, timesPerWeek or time" }
  next.updatedAt = new Date().toISOString()
  return { habit: next, changes }
}
