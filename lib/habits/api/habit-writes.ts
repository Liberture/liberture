import { getDb } from "@/lib/habits/db"
import { inferTimeOfDay } from "@/lib/habits/habit-utils"
import { PILLAR_HEX, PILLAR_IDS, pillarForHabit, type PillarId } from "@/lib/habits/pillars"
import { PILLAR_TAG, freshStreakData } from "@/lib/habits/protocols/adopt"
import type { DataEntryField, Habit, HabitTag } from "@/lib/habits/types"

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

export interface CustomHabitInput extends HabitDetailsInput {
  name?: unknown
  days?: unknown
  timesPerWeek?: unknown
  time?: unknown
  pillar?: unknown
  description?: unknown
}

/**
 * The richer fields an assistant can set on create or edit. Kept flat and
 * forgiving like the rest: each is optional, and only what's sent changes.
 */
export interface HabitDetailsInput {
  priority?: unknown
  color?: unknown
  tags?: unknown
  /** { unit?, goalValue?, label? } turns on a number to log ("pushups", goal 100); null/false turns it off. */
  dataEntry?: unknown
  /** { trigger, behavior }: "After I <trigger>, I will <behavior>". null clears it. */
  intention?: unknown
  /** "runner", "reader"… ; empty clears it. */
  identity?: unknown
  randomReminders?: unknown
}

const HABIT_TAGS: readonly HabitTag[] = [
  "exercise", "reading", "meditation", "health", "productivity", "social", "creative",
  "personal", "nutrition", "sleep", "mindfulness", "learning", "finance", "selfcare",
]

const IDENTITY_MILESTONES = [
  { days: 7, message: "One week in. You're becoming {identity}.", achieved: false },
  { days: 21, message: "21 days. This is part of who you are.", achieved: false },
  { days: 66, message: "66 days. It's automatic now.", achieved: false },
]

function plainObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

/**
 * Applies HabitDetailsInput to `next` in place, pushing a spoken phrase per
 * change. Returns an error message, or null.
 */
export function applyHabitDetails(next: Habit, input: HabitDetailsInput, changes: string[]): string | null {
  if (input.priority !== undefined && input.priority !== null) {
    const n = Number(input.priority)
    if (!Number.isInteger(n) || n < 1 || n > 5) return "priority must be 1-5"
    next.priority = n
    changes.push(`priority ${n}`)
  }
  if (input.color !== undefined && input.color !== null && input.color !== "") {
    if (typeof input.color !== "string" || !/^#[0-9a-f]{6}$/i.test(input.color)) return "color must be a hex color like #3fcf8e"
    next.color = input.color.toLowerCase()
    changes.push("new color")
  }
  if (input.tags !== undefined && input.tags !== null) {
    const raw = Array.isArray(input.tags) ? input.tags : String(input.tags).split(/[\s,]+/)
    const tags = raw.map((t) => plainLower(String(t))).filter(Boolean)
    const unknown = tags.filter((t) => !(HABIT_TAGS as readonly string[]).includes(t))
    if (unknown.length) return `unknown tags: ${unknown.join(", ")}. Use: ${HABIT_TAGS.join(", ")}`
    next.tags = [...new Set(tags)] as HabitTag[]
    changes.push(tags.length ? `tags ${tags.join(", ")}` : "tags cleared")
  }
  if (input.dataEntry !== undefined) {
    const entry = plainObject(input.dataEntry)
    if (!entry || entry.enabled === false) {
      if (next.dataEntry) changes.push("stopped tracking a number")
      next.dataEntry = undefined
    } else {
      const goal = entry.goalValue === undefined || entry.goalValue === null || entry.goalValue === "" ? undefined : Number(entry.goalValue)
      if (goal !== undefined && (!Number.isFinite(goal) || goal <= 0)) return "dataEntry.goalValue must be a positive number"
      const unit = typeof entry.unit === "string" && entry.unit.trim() ? entry.unit.trim().slice(0, 20) : undefined
      const label = typeof entry.label === "string" && entry.label.trim() ? entry.label.trim().slice(0, 40) : undefined
      const fields = next.dataEntry?.fields ?? []
      const index = fields.findIndex((f) => f.type === "number")
      const current: DataEntryField = index >= 0 ? fields[index] : { id: "value", type: "number", label: label ?? unit ?? "Amount" }
      const field: DataEntryField = {
        ...current,
        ...(label ? { label } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(goal !== undefined ? { goalValue: goal } : {}),
      }
      const nextFields = index >= 0 ? fields.map((f, i) => (i === index ? field : f)) : [...fields, field]
      next.dataEntry = { enabled: true, fields: nextFields }
      changes.push(`tracks ${field.unit ?? field.label}${field.goalValue ? `, goal ${field.goalValue}` : ""}`)
    }
  }
  if (input.intention !== undefined) {
    const intention = plainObject(input.intention)
    const trigger = typeof intention?.trigger === "string" ? intention.trigger.trim().slice(0, 200) : ""
    const behavior = typeof intention?.behavior === "string" ? intention.behavior.trim().slice(0, 200) : ""
    if (!intention || (!trigger && !behavior)) {
      next.implementationIntention = undefined
      changes.push("plan cleared")
    } else {
      next.implementationIntention = {
        ...next.implementationIntention,
        trigger: trigger || next.implementationIntention?.trigger || "",
        behavior: behavior || next.implementationIntention?.behavior || next.name,
      }
      changes.push(`plan: after ${next.implementationIntention.trigger}, ${next.implementationIntention.behavior}`)
    }
  }
  if (input.identity !== undefined) {
    const identity = typeof input.identity === "string" ? input.identity.trim().slice(0, 40) : ""
    if (!identity) {
      next.identity = undefined
      changes.push("identity cleared")
    } else {
      next.identity = {
        identityType: identity,
        milestones: next.identity?.milestones ?? IDENTITY_MILESTONES.map((m) => ({ ...m, message: m.message.replace("{identity}", `a ${identity}`) })),
      }
      changes.push(`identity: ${identity}`)
    }
  }
  if (input.randomReminders !== undefined && input.randomReminders !== null) {
    next.randomRemindersEnabled = Boolean(input.randomReminders)
    changes.push(next.randomRemindersEnabled ? "random nudges on" : "random nudges off")
  }
  return null
}

/** Pillar change: area, color and the pillar's tag move together, as in the app. */
function applyPillar(next: Habit, pillar: PillarId): void {
  const previous = next.category && (PILLAR_IDS as string[]).includes(next.category) ? (next.category as PillarId) : null
  next.category = pillar
  next.color = PILLAR_HEX[pillar]
  const tags = (next.tags ?? []).filter((t) => !previous || t !== PILLAR_TAG[previous])
  next.tags = tags.includes(PILLAR_TAG[pillar]) ? tags : [PILLAR_TAG[pillar], ...tags]
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
  const ignored: string[] = []
  const detailsError = applyHabitDetails(habit, input, ignored)
  if (detailsError) return { error: detailsError }
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

export interface HabitEditInput extends HabitDetailsInput {
  name?: unknown
  description?: unknown
  days?: unknown
  timesPerWeek?: unknown
  time?: unknown
  pillar?: unknown
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
  if (input.pillar !== undefined && input.pillar !== null && input.pillar !== "") {
    if (typeof input.pillar !== "string" || !(PILLAR_IDS as string[]).includes(input.pillar)) {
      return { error: `pillar must be one of ${PILLAR_IDS.join(", ")}` }
    }
    applyPillar(next, input.pillar as PillarId)
    changes.push(`area ${input.pillar}`)
  }
  const detailsError = applyHabitDetails(next, input, changes)
  if (detailsError) return { error: detailsError }
  if (changes.length === 0) {
    return { error: "Nothing to change: send name, description, days, timesPerWeek, time, pillar, priority, tags, dataEntry, intention, identity or randomReminders" }
  }
  next.updatedAt = new Date().toISOString()
  return { habit: next, changes }
}

// ---------------------------------------------------------------- archive

/**
 * Archive / unarchive, the same bookkeeping as the app (habit-tracker.tsx):
 * archiveHistory gets one open interval per archive so stats can tell the
 * days a habit was paused. updatedAt makes the change survive an older tab's save.
 */
export function archiveHabitRecord(habit: Habit, now: string): Habit {
  const history = habit.archiveHistory ? [...habit.archiveHistory] : []
  const lastOpen = history.length > 0 && !history[history.length - 1].unarchivedAt
  if (!lastOpen) history.push({ archivedAt: now })
  return { ...habit, archived: true, archivedAt: now, archiveHistory: history, updatedAt: now }
}

export function unarchiveHabitRecord(habit: Habit, now: string): Habit {
  const history = habit.archiveHistory ? [...habit.archiveHistory] : []
  if (history.length > 0 && !history[history.length - 1].unarchivedAt) {
    history[history.length - 1] = { ...history[history.length - 1], unarchivedAt: now }
  }
  return { ...habit, archived: false, archivedAt: undefined, archiveHistory: history, updatedAt: now }
}
