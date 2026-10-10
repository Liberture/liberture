import { getDb } from "@/lib/habits/db"
import { resolveByName } from "@/lib/habits/api/resolve"
import { parseTime } from "@/lib/habits/api/habit-writes"
import { isTimeZone } from "@/lib/habits/api/time-zone"
import { DEFAULT_COACH_PREFERENCES, DEFAULT_PREFERENCES, type CoachPreferences, type Habit, type UserPreferences, type UserProfile } from "@/lib/habits/types"
import { stampChangedFields } from "@/lib/habits/habit-sync"

/**
 * Profile and preferences for the assistant API (get_profile /
 * update_profile). Both live in the blob and carry updatedAt; the storage
 * POST keeps whichever copy is newer, so an open tab can't revert a change
 * made here.
 */

export interface ProfileUpdateInput {
  name?: unknown
  missionStatement?: unknown
  /** Habit names (or ids), 0-3. */
  focusHabits?: unknown
  checkInTimes?: unknown
  theme?: unknown
  weekStartsOn?: unknown
  timeFormat?: unknown
  timeZone?: unknown
  morningDashboard?: unknown
  habitsLayout?: unknown
  defaultReminderTime?: unknown
  notifications?: unknown
  /** "en" | "es": the language of server-sent messages. */
  language?: unknown
  /** Partial CoachPreferences; merged into the saved group. */
  coach?: unknown
}

export interface ProfileState {
  profile: UserProfile
  preferences: UserPreferences
}

export type ProfileUpdateResult =
  | { profile: UserProfile; preferences: UserPreferences; changes: string[] }
  | { error: string; code?: "ambiguous" | "not_found"; options?: string[] }

function bool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  if (value === "true" || value === "on") return true
  if (value === "false" || value === "off") return false
  return null
}

function weekStart(value: unknown): 0 | 1 | null {
  if (value === 0 || value === "0") return 0
  if (value === 1 || value === "1") return 1
  const key = String(value ?? "").toLowerCase().trim()
  if (["sun", "sunday", "domingo"].includes(key)) return 0
  if (["mon", "monday", "lunes"].includes(key)) return 1
  return null
}

/**
 * Pure: the next profile/preferences after an update, or an error. Habit
 * names in focusHabits are resolved against `habits` the same way log_habit
 * resolves them.
 */
export function applyProfileUpdate(state: ProfileState, input: ProfileUpdateInput, habits: Habit[], now: string): ProfileUpdateResult {
  const profile: UserProfile = { ...state.profile }
  const preferences: UserPreferences = { ...state.preferences }
  const profileChanges: string[] = []
  const prefChanges: string[] = []

  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim().slice(0, 60) : ""
    profile.name = name || undefined
    profileChanges.push(name ? `name ${name}` : "name cleared")
  }
  if (input.missionStatement !== undefined) {
    const mission = typeof input.missionStatement === "string" ? input.missionStatement.trim().slice(0, 300) : ""
    profile.missionStatement = mission || undefined
    profileChanges.push(mission ? "mission updated" : "mission cleared")
  }
  if (input.focusHabits !== undefined) {
    const raw = Array.isArray(input.focusHabits) ? input.focusHabits : input.focusHabits ? [input.focusHabits] : []
    if (raw.length > 3) return { error: "focusHabits takes up to 3 habits" }
    const active = habits.filter((h) => !h.archived)
    const ids: string[] = []
    const names: string[] = []
    for (const query of raw) {
      const resolved = resolveByName(active, String(query), (h) => h.name)
      if (resolved.kind !== "match") {
        return {
          error: resolved.kind === "ambiguous" ? `More than one habit matches "${query}"` : `No habit matches "${query}"`,
          code: resolved.kind === "ambiguous" ? "ambiguous" : "not_found",
          options: resolved.options.slice(0, 6).map((h) => h.name),
        }
      }
      if (!ids.includes(resolved.item.id)) {
        ids.push(resolved.item.id)
        names.push(resolved.item.name)
      }
    }
    profile.focusHabits = ids
    profileChanges.push(names.length ? `focus on ${names.join(", ")}` : "focus habits cleared")
  }
  if (input.checkInTimes !== undefined) {
    const times = input.checkInTimes && typeof input.checkInTimes === "object" ? (input.checkInTimes as Record<string, unknown>) : null
    if (!times) return { error: "checkInTimes must be { morning?, midday?, evening? } as HH:MM" }
    const next = { ...(profile.checkInTimes ?? {}) }
    for (const slot of ["morning", "midday", "evening"] as const) {
      if (times[slot] === undefined) continue
      const time = parseTime(times[slot])
      if (!time) return { error: `checkInTimes.${slot} must be HH:MM` }
      next[slot] = time
      profileChanges.push(`${slot} check-in ${time}`)
    }
    profile.checkInTimes = next
  }

  if (input.theme !== undefined) {
    if (!["system", "light", "dark"].includes(String(input.theme))) return { error: "theme must be system, light or dark" }
    preferences.theme = input.theme as UserPreferences["theme"]
    prefChanges.push(`${input.theme} theme`)
  }
  if (input.weekStartsOn !== undefined) {
    const day = weekStart(input.weekStartsOn)
    if (day === null) return { error: "weekStartsOn must be monday or sunday" }
    preferences.weekStartsOn = day
    prefChanges.push(`weeks start on ${day === 1 ? "Monday" : "Sunday"}`)
  }
  if (input.timeFormat !== undefined) {
    if (!["24h", "12h"].includes(String(input.timeFormat))) return { error: "timeFormat must be 24h or 12h" }
    preferences.timeFormat = input.timeFormat as UserPreferences["timeFormat"]
    prefChanges.push(`${input.timeFormat} clock`)
  }
  if (input.timeZone !== undefined) {
    if (input.timeZone === "" || input.timeZone === null) {
      preferences.timeZone = undefined
      prefChanges.push("time zone cleared")
    } else {
      if (!isTimeZone(input.timeZone)) return { error: "timeZone must be an IANA zone, e.g. Europe/Madrid" }
      preferences.timeZone = input.timeZone
      prefChanges.push(`time zone ${input.timeZone}`)
    }
  }
  if (input.morningDashboard !== undefined) {
    const on = bool(input.morningDashboard)
    if (on === null) return { error: "morningDashboard must be true or false" }
    preferences.morningDashboard = on
    prefChanges.push(on ? "morning dashboard on" : "morning dashboard off")
  }
  if (input.habitsLayout !== undefined) {
    if (!["day", "week", "matrix"].includes(String(input.habitsLayout))) return { error: "habitsLayout must be day, week or matrix" }
    preferences.habitsLayout = input.habitsLayout as UserPreferences["habitsLayout"]
    prefChanges.push(`${input.habitsLayout} layout`)
  }
  if (input.defaultReminderTime !== undefined) {
    const time = parseTime(input.defaultReminderTime)
    if (time === null) return { error: "defaultReminderTime must be HH:MM, or empty for none" }
    preferences.defaultReminderTime = time
    prefChanges.push(time ? `new habits remind at ${time}` : "new habits have no reminder")
  }
  if (input.notifications !== undefined) {
    const on = bool(input.notifications)
    if (on === null) return { error: "notifications must be true or false" }
    preferences.notifications = on
    prefChanges.push(on ? "reminders on" : "reminders off")
  }

  if (input.language !== undefined) {
    if (input.language !== "en" && input.language !== "es") return { error: "language must be en or es" }
    preferences.language = input.language
    prefChanges.push(`messages in ${input.language === "es" ? "Spanish" : "English"}`)
  }
  if (input.coach !== undefined) {
    const coach = applyCoachUpdate(preferences.coach, input.coach)
    if ("error" in coach) return coach
    preferences.coach = coach.coach
    prefChanges.push(...coach.changes)
  }

  if (!profileChanges.length && !prefChanges.length) {
    return { error: "Nothing to change: send name, missionStatement, focusHabits, checkInTimes, coach or a preference" }
  }
  // Per-field stamps, so a tab that loaded earlier can't revert these on save (mergeFieldStamped).
  return {
    profile: stampChangedFields(state.profile, profile, now),
    preferences: stampChangedFields(state.preferences, preferences, now),
    changes: [...profileChanges, ...prefChanges],
  }
}

function strictTime(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{1,2}:\d{2}$/.test(value.trim())) return null
  const time = parseTime(value)
  return time || null
}

/**
 * Pure: the coach preference group after a partial update. A check-in time of
 * "" or null turns that check-in off; times must be HH:MM, the weekly day
 * 0 (Sunday) to 6, the daily limit 1 to 10.
 */
export function applyCoachUpdate(
  current: CoachPreferences | undefined,
  input: unknown
): { coach: CoachPreferences; changes: string[] } | { error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "coach must be an object" }
  const patch = input as Record<string, unknown>
  const coach: CoachPreferences = { ...(current ?? {}), checkIns: { ...(current?.checkIns ?? {}) } }
  const checkIns = coach.checkIns!
  const changes: string[] = []
  const off = (value: unknown) => value === null || value === "" || value === false

  if (patch.checkIns !== undefined) {
    if (!patch.checkIns || typeof patch.checkIns !== "object") return { error: "coach.checkIns must be { morning?, afternoon?, weekly? }" }
    const given = patch.checkIns as Record<string, unknown>
    for (const slot of ["morning", "afternoon"] as const) {
      if (given[slot] === undefined) continue
      if (off(given[slot])) {
        delete checkIns[slot]
        changes.push(`${slot} check-in off`)
        continue
      }
      const time = strictTime(given[slot])
      if (!time) return { error: `coach.checkIns.${slot} must be HH:MM` }
      checkIns[slot] = time
      changes.push(`${slot} check-in at ${time}`)
    }
    if (given.weekly !== undefined) {
      if (off(given.weekly)) {
        delete checkIns.weekly
        changes.push("weekly check-in off")
      } else {
        const weekly = given.weekly as Record<string, unknown>
        const day = Number(weekly?.day)
        const time = strictTime(weekly?.time)
        if (!Number.isInteger(day) || day < 0 || day > 6) return { error: "coach.checkIns.weekly.day must be 0 (Sunday) to 6 (Saturday)" }
        if (!time) return { error: "coach.checkIns.weekly.time must be HH:MM" }
        checkIns.weekly = { day, time }
        changes.push(`weekly check-in on day ${day} at ${time}`)
      }
    }
  }
  if (patch.missedLogging !== undefined) {
    const on = bool(patch.missedLogging)
    if (on === null) return { error: "coach.missedLogging must be true or false" }
    coach.missedLogging = on
    changes.push(on ? "missed-logging check on" : "missed-logging check off")
  }
  if (patch.quietHours !== undefined) {
    const quiet = patch.quietHours as Record<string, unknown> | null
    const start = strictTime(quiet?.start ?? coach.quietHours?.start ?? DEFAULT_COACH_PREFERENCES.quietHours.start)
    const end = strictTime(quiet?.end ?? coach.quietHours?.end ?? DEFAULT_COACH_PREFERENCES.quietHours.end)
    if (!quiet || typeof quiet !== "object" || !start || !end) return { error: "coach.quietHours must be { start, end } as HH:MM" }
    coach.quietHours = { start, end }
    changes.push(`quiet hours ${start}–${end}`)
  }
  if (patch.maxNudgesPerDay !== undefined) {
    const max = Number(patch.maxNudgesPerDay)
    if (!Number.isInteger(max) || max < 1 || max > 10) return { error: "coach.maxNudgesPerDay must be 1 to 10" }
    coach.maxNudgesPerDay = max
    changes.push(`at most ${max} coach messages a day`)
  }
  if (!changes.length) return { error: "Nothing to change in coach: send checkIns, missedLogging, quietHours or maxNudgesPerDay" }
  return { coach, changes }
}

/** What get_profile returns: preferences with defaults filled in, focus habits by name. */
export function profileView(profile: UserProfile | undefined, preferences: UserPreferences | undefined, habits: Habit[]) {
  const byId = new Map(habits.map((h) => [h.id, h.name]))
  return {
    name: profile?.name ?? null,
    missionStatement: profile?.missionStatement ?? null,
    focusHabits: (profile?.focusHabits ?? []).map((id) => byId.get(id)).filter((n): n is string => Boolean(n)),
    checkInTimes: profile?.checkInTimes ?? null,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...Object.fromEntries(Object.entries(preferences ?? {}).filter(([, v]) => v !== undefined)),
      timeZone: preferences?.timeZone ?? null,
      coach: { ...DEFAULT_COACH_PREFERENCES, checkIns: {}, ...(preferences?.coach ?? {}) },
    },
  }
}

/**
 * Read-modify-write of profile + preferences, guarded by lastUpdated like
 * mutateHabits: on a race with a tab's save the row is re-read and the
 * change re-applied.
 */
export async function mutateProfile(
  userId: number,
  change: (state: ProfileState, habits: Habit[]) => ProfileState | { error: unknown }
): Promise<ProfileState | { error: unknown } | null> {
  const sql = getDb()
  for (let attempt = 0; attempt < 4; attempt++) {
    const rows = await sql`
      SELECT data->'profile' AS profile, data->'preferences' AS preferences, data->'habits' AS habits, data->>'lastUpdated' AS last
      FROM habit_users WHERE id = ${userId}`
    if (!rows.length) return null
    const state: ProfileState = {
      profile: (rows[0].profile as UserProfile | null) ?? {},
      preferences: (rows[0].preferences as UserPreferences | null) ?? {},
    }
    const next = change(state, (rows[0].habits as Habit[] | null) ?? [])
    if ("error" in next) return next
    const now = new Date().toISOString()
    const last = (rows[0].last as string | null) ?? ""
    const updated = await sql`
      UPDATE habit_users
      SET data = jsonb_set(
        jsonb_set(
          jsonb_set(data, '{profile}', ${JSON.stringify(next.profile)}::jsonb, true),
          '{preferences}', ${JSON.stringify(next.preferences)}::jsonb, true
        ),
        '{lastUpdated}', to_jsonb(${now}::text)
      ),
      updated_at = NOW()
      WHERE id = ${userId} AND COALESCE(data->>'lastUpdated', '') = ${last}
      RETURNING id`
    if (updated.length) return next
  }
  throw new Error("Profile kept changing; try again")
}
