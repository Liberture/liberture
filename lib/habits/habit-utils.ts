import { Habit, HabitCompletion, StreakData } from './types'
import { formatDateOnly, parseDateOnly } from './date-utils'
import { formatMessage } from '../i18n-format'

/**
 * Parse a "YYYY-MM-DD" string as a local-midnight Date.
 * new Date("YYYY-MM-DD") parses as UTC which drifts by a day in non-UTC zones.
 */
function parseLocalDate(s: string): Date {
  return parseDateOnly(s)
}

function dateKey(date: Date): string {
  return formatDateOnly(date)
}

function startOfLocalDay(value: Date | string): Date {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseLocalDate(value)
    : new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function isScheduledForDate(habit: Habit | undefined, date: Date): boolean {
  if (!habit?.schedule || habit.schedule.type === "daily") return true
  if (habit.schedule.type === "specific_days" && habit.schedule.days) {
    return habit.schedule.days.includes(date.getDay())
  }
  return true
}

export function isHabitActiveOnDate(habit: Habit | undefined, date: Date, now: Date = new Date()): boolean {
  if (!habit) return false

  const day = startOfLocalDay(date)
  const createdAt = habit.createdAt ? startOfLocalDay(habit.createdAt) : new Date(0)
  const startDate = habit.startDate ? startOfLocalDay(habit.startDate) : null
  const activeFrom = startDate && startDate < createdAt ? startDate : createdAt
  if (day < activeFrom) return false

  const archiveRanges = habit.archiveHistory?.length
    ? habit.archiveHistory
    : habit.archived && habit.archivedAt
      ? [{ archivedAt: habit.archivedAt }]
      : []

  return !archiveRanges.some((entry) => {
    const archivedAt = startOfLocalDay(entry.archivedAt)
    const unarchivedAt = entry.unarchivedAt ? startOfLocalDay(entry.unarchivedAt) : startOfLocalDay(now)
    return entry.unarchivedAt
      ? day >= archivedAt && day < unarchivedAt
      : day >= archivedAt && day <= unarchivedAt
  })
}

/**
 * Lets completions logged before a habit was created count. The assistant can
 * log past days ("I meditated yesterday") for a habit added today; without
 * this every stat, streak and chart starts at createdAt and drops them.
 * Sets `startDate` to the earliest completed day when that precedes
 * createdAt. createdAt itself is left alone: habit-sync uses it to detect
 * habits added since a tab's last sync. Returns the same objects when nothing
 * changes, so React state and memo dependencies stay stable.
 */
export function withCompletionStarts<T extends Habit>(habits: T[], completions: HabitCompletion[]): T[] {
  const earliest = new Map<string, string>()
  for (const c of completions) {
    if (!c.completed || !/^\d{4}-\d{2}-\d{2}$/.test(c.date)) continue
    const current = earliest.get(c.habitId)
    if (!current || c.date < current) earliest.set(c.habitId, c.date)
  }
  let changed = false
  const result = habits.map((habit) => {
    const first = earliest.get(habit.id)
    if (!first) return habit
    const createdDay = habit.createdAt ? dateKey(startOfLocalDay(habit.createdAt)) : null
    if (createdDay && first >= createdDay) return habit
    if (habit.startDate && habit.startDate <= first) return habit
    changed = true
    return { ...habit, startDate: first }
  })
  return changed ? result : habits
}

export function isHabitScheduledOnDate(habit: Habit | undefined, date: Date, now: Date = new Date()): boolean {
  return isHabitActiveOnDate(habit, date, now) && isScheduledForDate(habit, date)
}

// ---------------------------------------------------------------- weekly targets

export type WeekStart = 0 | 1

/** First and last local day (midnight) of the week holding `date`. */
export function weekBounds(date: Date, weekStartsOn: WeekStart = 1): { start: Date; end: Date } {
  const start = startOfLocalDay(date)
  const offset = (start.getDay() - weekStartsOn + 7) % 7
  start.setDate(start.getDate() - offset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

export interface WeeklyProgress {
  /** Days marked done this week (up to and including `date`'s week end). */
  done: number
  target: number
  met: boolean
  /** Completions still needed, never negative. */
  remaining: number
  /** Days of the week after `date` (0 on its last day). */
  daysLeft: number
}

/** The weekly target of a habit: timesPerWeek, the number of fixed days, or 7. */
export function weeklyTarget(habit: Habit): number {
  const schedule = habit.schedule
  if (!schedule || schedule.type === "daily") return 7
  if (schedule.type === "times_per_week") return Math.min(7, Math.max(1, schedule.timesPerWeek ?? 1))
  return schedule.days?.length ?? 7
}

/** How the week holding `date` is going for one habit. Counts the whole week's completions. */
export function weeklyProgress(
  habit: Habit,
  completions: HabitCompletion[],
  date: Date,
  weekStartsOn: WeekStart = 1
): WeeklyProgress {
  const { start, end } = weekBounds(date, weekStartsOn)
  const from = dateKey(start)
  const to = dateKey(end)
  const days = new Set<string>()
  for (const c of completions) {
    if (c.habitId === habit.id && c.completed && c.date >= from && c.date <= to) days.add(c.date)
  }
  const target = weeklyTarget(habit)
  const done = days.size
  const day = startOfLocalDay(date)
  const daysLeft = Math.round((end.getTime() - day.getTime()) / 86_400_000)
  return { done, target, met: done >= target, remaining: Math.max(0, target - done), daysLeft }
}

/**
 * Whether a habit should be asked for on `date`. Same as isHabitScheduledOnDate,
 * except a times-per-week habit stops being due once that week's target was
 * met on earlier days — rest days are not misses. A habit done on `date`
 * itself stays listed so it can be shown (and undone) as done.
 * `completions` can also be the set of this habit's completed "YYYY-MM-DD"
 * keys, for callers that already index them (grids checking every cell).
 */
export function isHabitDueOnDate(
  habit: Habit | undefined,
  date: Date,
  completions: HabitCompletion[] | ReadonlySet<string>,
  weekStartsOn: WeekStart = 1,
  now: Date = new Date()
): boolean {
  if (!habit || !isHabitScheduledOnDate(habit, date, now)) return false
  if (habit.schedule?.type !== "times_per_week") return true
  const today = dateKey(startOfLocalDay(date))
  const keys = completions instanceof Set
    ? (completions as ReadonlySet<string>)
    : completedKeys(habit.id, completions as HabitCompletion[])
  if (keys.has(today)) return true
  const { start } = weekBounds(date, weekStartsOn)
  let before = 0
  for (let d = new Date(start); dateKey(d) < today; d.setDate(d.getDate() + 1)) {
    if (keys.has(dateKey(d))) before++
  }
  return before < weeklyTarget(habit)
}

/**
 * Localised strings a schedule label needs. Each caller passes its own
 * translation entries, so the wording can differ per surface while the rules
 * (which day sets collapse to "Every day", "Weekdays", ...) live in one place.
 */
export interface ScheduleLabelStrings {
  everyDay: string
  /** Template with {count}. */
  timesPerWeek: string
  noDays: string
  weekdays: string
  /** Optional: without it Sat+Sun prints as two day names. */
  weekends?: string
  /** Short day names, Sunday first. */
  daysShort: readonly string[]
}

/** "Every day", "3× a week", "Weekdays", "Mon, Wed, Fri"… */
export function formatScheduleLabel(schedule: Habit["schedule"] | undefined, t: ScheduleLabelStrings): string {
  if (!schedule || schedule.type === "daily") return t.everyDay
  if (schedule.type === "times_per_week") return formatMessage(t.timesPerWeek, { count: schedule.timesPerWeek ?? 1 })
  const days = [...(schedule.days ?? [])].sort((a, b) => a - b)
  if (days.length === 0) return t.noDays
  if (days.length === 7) return t.everyDay
  if (days.join() === "1,2,3,4,5") return t.weekdays
  if (t.weekends && days.join() === "0,6") return t.weekends
  return days.map((d) => t.daysShort[d]).join(", ")
}

// ------------------------------------------------- weekly-target rates and streaks

function isWeeklyHabit(habit: Habit | undefined): habit is Habit {
  return habit?.schedule?.type === "times_per_week"
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** First local day the habit counts from (the earlier of startDate and createdAt). */
function habitActiveFrom(habit: Habit): Date {
  const createdAt = habit.createdAt ? startOfLocalDay(habit.createdAt) : new Date(0)
  const startDate = habit.startDate ? startOfLocalDay(habit.startDate) : null
  return startDate && startDate < createdAt ? startDate : createdAt
}

/** Distinct completed day keys for one habit. */
function completedKeys(habitId: string, completions: HabitCompletion[]): Set<string> {
  const id = String(habitId)
  const keys = new Set<string>()
  for (const c of completions) {
    if (String(c.habitId) === id && c.completed) keys.add(c.date)
  }
  return keys
}

/** A weekly target scaled to the days of the week the habit could be done: ceil(target × days / 7). */
function proratedTarget(target: number, days: number): number {
  if (days >= 7) return target
  return Math.ceil((target * days) / 7)
}

interface WeekTally {
  /** Completed days in the counted part of the week. */
  done: number
  /** The week's target, prorated when the habit could only be done on part of it. */
  target: number
  /** Whether `today` falls in this week. */
  current: boolean
  /** Days after today left in the week (0 for past weeks). */
  daysLeftAfterToday: number
  doneToday: boolean
}

/**
 * Tallies one week for a times-per-week habit. Days before `from`, days the
 * habit wasn't active (before it started, archived) and days after `today`
 * are left out of `done`. With `openEnd` (today is really today), the rest of
 * the current week still counts towards the prorated target when today is
 * active; without it (a window ending in the past) those days are cut off.
 */
function tallyWeek(
  habit: Habit,
  keys: Set<string>,
  weekStart: Date,
  from: Date,
  today: Date,
  openEnd = true
): WeekTally {
  const target = weeklyTarget(habit)
  const todayActive = isHabitActiveOnDate(habit, today, today)
  let done = 0
  let possible = 0
  let current = false
  let daysLeftAfterToday = 0
  let doneToday = false
  for (let i = 0; i < 7; i++) {
    const day = addLocalDays(weekStart, i)
    if (day < from) continue
    if (day > today) {
      if (!openEnd) continue
      current = true
      daysLeftAfterToday++
      if (todayActive) possible++
      continue
    }
    if (openEnd && day.getTime() === today.getTime()) current = true
    if (!isHabitActiveOnDate(habit, day, today)) continue
    possible++
    const key = dateKey(day)
    if (keys.has(key)) {
      done++
      if (day.getTime() === today.getTime()) doneToday = true
    }
  }
  return { done, target: proratedTarget(target, possible), current, daysLeftAfterToday, doneToday }
}

/**
 * Success rate of a times-per-week habit over [start, end]: per week,
 * min(done, target) ÷ expected. A finished week expects its target; the
 * current week expects clamp(target − daysLeftAfterToday, done, target), so
 * rest days never count against it while the target is reachable. Weeks the
 * window or the habit only partly covers are prorated: ceil(target × days / 7).
 * A window that ends before `now` has no current week: its last week is
 * prorated like the first.
 */
function weeklySuccessCounts(
  habit: Habit,
  completions: HabitCompletion[],
  start: Date,
  end: Date,
  weekStartsOn: WeekStart,
  now: Date
): { done: number; expected: number } {
  const keys = completedKeys(habit.id, completions)
  const openEnd = end >= startOfLocalDay(now)
  let achieved = 0
  let expected = 0
  for (let week = weekBounds(start, weekStartsOn).start; week <= end; week = addLocalDays(week, 7)) {
    const tally = tallyWeek(habit, keys, week, start, end, openEnd)
    const hit = Math.min(tally.done, tally.target)
    const weekExpected = tally.current
      ? Math.min(tally.target, Math.max(hit, tally.target - tally.daysLeftAfterToday))
      : tally.target
    achieved += hit
    expected += weekExpected
  }
  return { done: achieved, expected }
}

/**
 * Week streaks of a times-per-week habit: consecutive weeks that met their
 * target. The current week adds one once met, and doesn't break the run while
 * the target is still reachable (done + days left including today ≥ target).
 */
function weeklyStreak(
  habit: Habit,
  completions: HabitCompletion[],
  today: Date,
  weekStartsOn: WeekStart
): { current: number; longest: number } {
  const keys = completedKeys(habit.id, completions)
  const activeFrom = habitActiveFrom(habit)
  const currentWeek = weekBounds(today, weekStartsOn).start
  // At most ~20 years back, so a habit without createdAt doesn't walk from 1970.
  const earliest = addLocalDays(currentWeek, -7 * 1040)
  const from = activeFrom > today ? today : activeFrom < earliest ? earliest : activeFrom
  const firstWeek = weekBounds(from, weekStartsOn).start

  // Oldest to newest: true = met, false = missed, null = skipped (no active day) or still open.
  const results: (boolean | null)[] = []
  for (let week = new Date(firstWeek); week <= currentWeek; week = addLocalDays(week, 7)) {
    const tally = tallyWeek(habit, keys, week, from, today)
    if (tally.target === 0) {
      results.push(null)
      continue
    }
    const met = tally.done >= tally.target
    if (tally.current && !met) {
      const reachable = tally.done + tally.daysLeftAfterToday + (tally.doneToday ? 0 : 1) >= tally.target
      results.push(reachable ? null : false)
      continue
    }
    results.push(met)
  }

  let longest = 0
  let run = 0
  for (const result of results) {
    if (result === true) longest = Math.max(longest, ++run)
    else if (result === false) run = 0
  }
  let current = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === false) break
    if (results[i] === true) current++
  }
  return { current, longest: Math.max(longest, current) }
}

function previousScheduledDate(habit: Habit | undefined, date: Date): Date {
  const previous = new Date(date)
  for (let i = 0; i < 14; i++) {
    previous.setDate(previous.getDate() - 1)
    if (isScheduledForDate(habit, previous)) return new Date(previous)
  }
  return previous
}

/**
 * Build the set of "YYYY-MM-DD" strings that fall inside any archived range
 * for a habit. End date defaults to `now` for the still-open entry.
 */
function archivedDateSet(habit: Habit | undefined, now: Date): Set<string> {
  const set = new Set<string>()
  if (!habit?.archiveHistory) return set
  for (const entry of habit.archiveHistory) {
    const start = new Date(entry.archivedAt)
    start.setHours(0, 0, 0, 0)
    const end = entry.unarchivedAt ? new Date(entry.unarchivedAt) : new Date(now)
    end.setHours(0, 0, 0, 0)
    if (end < start) continue
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      set.add(`${y}-${m}-${day}`)
    }
  }
  return set
}

/**
 * Calculate streak data from habit completions.
 * If a Habit object is passed and it's currently archived, returns a zeroed
 * current streak (longest and milestones are preserved).
 * A times-per-week habit is counted in weeks that met the target
 * (`unit: "weeks"`); every other habit in scheduled days (`unit: "days"`).
 */
export function calculateStreak(
  habitId: string,
  completions: HabitCompletion[],
  existingStreak?: StreakData,
  habit?: Habit,
  currentDate: Date = new Date(),
  weekStartsOn: WeekStart = 1
): StreakData {
  const weekly = isWeeklyHabit(habit)
  const unit: StreakData["unit"] = weekly ? "weeks" : "days"
  // A stored longest in the other unit would mix days with weeks.
  if (existingStreak && (existingStreak.unit ?? "days") !== unit) {
    existingStreak = { ...existingStreak, longest: 0 }
  }

  // Archived habits have no active streak.
  if (habit?.archived) {
    return {
      unit,
      current: 0,
      longest: existingStreak?.longest || 0,
      freezesAvailable: existingStreak?.freezesAvailable || 0,
      freezesUsed: existingStreak?.freezesUsed || 0,
      lastCompletedDate: existingStreak?.lastCompletedDate,
      milestones: existingStreak?.milestones || initializeMilestones()
    }
  }

  const today = new Date(currentDate)
  today.setHours(0, 0, 0, 0)

  if (weekly) {
    const { current, longest } = weeklyStreak(habit, completions, today, weekStartsOn)
    const lastCompletedDate = [...completedKeys(habitId, completions)]
      .filter((key) => key <= dateKey(today))
      .sort()
      .pop()
    return {
      unit,
      current,
      longest: Math.max(existingStreak?.longest || 0, longest),
      freezesAvailable: existingStreak?.freezesAvailable || 0,
      freezesUsed: existingStreak?.freezesUsed || 0,
      lastCompletedDate,
      // Milestones are counted in days; weeks don't advance them.
      milestones: existingStreak?.milestones || initializeMilestones()
    }
  }

  // Filter completions for this habit and sort by date descending.
  // Future-dated records can be created when a server UTC date is used for
  // a user's local evening. They should not be allowed to zero the streak.
  // Normalize habitId comparison to handle both string and number IDs
  const normalizedHabitId = String(habitId)
  const completedDateSet = new Set<string>()
  for (const completion of completions) {
    if (String(completion.habitId) !== normalizedHabitId || !completion.completed) continue
    const completionDate = parseLocalDate(completion.date)
    if (completionDate.getTime() > today.getTime()) continue
    completedDateSet.add(completion.date)
  }
  const completedDates = [...completedDateSet]
    .sort((a, b) => parseLocalDate(b).getTime() - parseLocalDate(a).getTime())

  if (completedDates.length === 0) {
    return {
      unit,
      current: 0,
      longest: existingStreak?.longest || 0,
      freezesAvailable: existingStreak?.freezesAvailable || 0,
      freezesUsed: existingStreak?.freezesUsed || 0,
      milestones: existingStreak?.milestones || initializeMilestones()
    }
  }

  // Calculate longest streak ever across scheduled dates.
  let longestStreak = existingStreak?.longest || 0
  let tempStreak = 0
  let lastDate: Date | null = null

  for (const completionDateString of [...completedDates].reverse()) {
    const completionDate = parseLocalDate(completionDateString)
    if (!isScheduledForDate(habit, completionDate)) continue

    if (lastDate === null) {
      tempStreak = 1
    } else {
      const previousExpectedDate = previousScheduledDate(habit, completionDate)
      if (previousExpectedDate.getTime() === lastDate.getTime()) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    lastDate = completionDate
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // Calculate current streak
  let currentStreak = 0
  let checkDate = new Date(today)

  // Find the newest scheduled date that should start the live streak. Today
  // is a grace day until it is over; unscheduled days are skipped.
  for (let i = 0; i < 370; i++) {
    if (isScheduledForDate(habit, checkDate)) {
      const key = dateKey(checkDate)
      if (completedDateSet.has(key)) {
        break
      }

      if (checkDate.getTime() !== today.getTime()) {
        return {
          unit,
          current: 0,
          longest: longestStreak,
          freezesAvailable: existingStreak?.freezesAvailable || 0,
          freezesUsed: existingStreak?.freezesUsed || 0,
          lastCompletedDate: completedDates[0],
          milestones: existingStreak?.milestones || initializeMilestones()
        }
      }
    }

    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Count consecutive scheduled days going backwards from checkDate.
  for (let i = 0; i < 370; i++) {
    if (isScheduledForDate(habit, checkDate)) {
      if (!completedDateSet.has(dateKey(checkDate))) {
        break
      }
      currentStreak += 1
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }

  if (currentStreak === 0) {
    return {
      unit,
      current: 0,
      longest: longestStreak,
      freezesAvailable: existingStreak?.freezesAvailable || 0,
      freezesUsed: existingStreak?.freezesUsed || 0,
      lastCompletedDate: completedDates[0],
      milestones: existingStreak?.milestones || initializeMilestones()
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

  // Update milestones
  const milestones = existingStreak?.milestones || initializeMilestones()
  const lastCompletedDate = completedDates[0]

  return {
    unit,
    current: currentStreak,
    longest: longestStreak,
    freezesAvailable: existingStreak?.freezesAvailable || 0,
    freezesUsed: existingStreak?.freezesUsed || 0,
    lastCompletedDate,
    milestones: milestones.map(m => ({
      ...m,
      achievedDate: currentStreak >= m.days && !m.achievedDate ? dateKey(today) : m.achievedDate
    }))
  }
}

/**
 * Initialize default milestone structure
 */
function initializeMilestones(): StreakData["milestones"] {
  return [
    { days: 3, celebrated: false },
    { days: 7, celebrated: false },
    { days: 21, celebrated: false },
    { days: 66, celebrated: false },
    { days: 100, celebrated: false }
  ]
}

/**
 * Check if a streak is at risk (approaching midnight without completion)
 */
export function isStreakAtRisk(
  habit: Habit,
  completions: HabitCompletion[],
  currentDate: Date = new Date(),
  weekStartsOn: WeekStart = 1
): boolean {
  const todayString = dateKey(currentDate)
  const completedToday = completions.some(
    c => String(c.habitId) === String(habit.id) && c.date === todayString && c.completed
  )

  if (completedToday) {
    return false
  }

  // Check if we have a significant streak
  // A weekly habit is only at risk when the week's target needs today.
  if (isWeeklyHabit(habit)) {
    const progress = weeklyProgress(habit, completions, currentDate, weekStartsOn)
    if (progress.remaining <= progress.daysLeft) return false
  }

  const streakData = habit.streakData || calculateStreak(habit.id, completions, undefined, habit, currentDate, weekStartsOn)
  const hasSignificantStreak = streakData.current >= 3

  // Check time of day (at risk if after 8 PM and not completed)
  const hour = currentDate.getHours()
  const isLateInDay = hour >= 20

  return hasSignificantStreak && isLateInDay
}

/**
 * Check if habit is ready to level up (tiny → medium → full)
 */
export function shouldSuggestLevelUp(
  habit: Habit,
  completions: HabitCompletion[]
): boolean {
  if (!habit.tinyHabit || habit.tinyHabit.currentLevel === 'full') {
    return false
  }

  const streakData = habit.streakData || calculateStreak(habit.id, completions, undefined, habit)

  // Suggest level up after 21 days with 85%+ success rate
  if (streakData.current < 21) {
    return false
  }

  const last21Days = completions
    .filter(c => c.habitId === habit.id)
    .slice(0, 21)

  const successRate = last21Days.filter(c => c.completed).length / 21

  return successRate >= 0.85
}

/**
 * Infer time of day from a time string (HH:MM)
 */
export function inferTimeOfDay(time: string): "morning" | "afternoon" | "evening" | "anytime" {
  if (!time) return "anytime"

  const [hours] = time.split(':').map(Number)

  if (hours >= 5 && hours < 12) return "morning"
  if (hours >= 12 && hours < 17) return "afternoon"
  if (hours >= 17 && hours < 22) return "evening"

  return "anytime"
}

/**
 * Generate celebration message based on milestone
 */
export function generateCelebrationMessage(days: number, identityType?: string): string {
  const messages: Record<number, string[]> = {
    3: [
      "3 days in! Your brain is starting to notice a pattern.",
      "First milestone complete! The neural pathway begins.",
      "Great start! Consistency is forming."
    ],
    7: [
      "1 week strong! Dopamine pathways are strengthening.",
      "7 days! You're in the top 20% of habit builders.",
      "A full week! The habit loop is taking shape."
    ],
    21: [
      "21 days! Your neural pathway is well-established.",
      "3 weeks! This is becoming automatic.",
      `21 days${identityType ? ` as a ${identityType}` : ''}! The behavior is solidifying.`
    ],
    66: [
      "66 days! Habit automaticity achieved! 🎉",
      `You're a ${identityType || 'champion'}! This habit is now automatic.`,
      "Neural pathway fully myelinated! This is part of who you are now."
    ],
    100: [
      "100 DAYS! This is legendary status! 🏆",
      "Triple digits! You've proven incredible consistency.",
      `100 days as a ${identityType || 'dedicated person'}! Absolutely remarkable.`
    ]
  }

  const options = messages[days]
  if (!options) return `${days} days strong! Keep going!`

  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Calculate success rate over a period, context-aware of creation/archive dates.
 * Daily and fixed-day habits: done ÷ scheduled days. Times-per-week habits are
 * measured per week against their target (see weeklySuccessCounts), so rest days
 * aren't misses. `now` only decides whether the window's last week is still open.
 */
export function calculateSuccessRate(
  habit: Habit,
  completions: HabitCompletion[],
  days: number = 30,
  endDate: Date = new Date(),
  weekStartsOn: WeekStart = 1,
  now: Date = new Date()
): number {
  const { done, expected } = calculateSuccessCounts(habit, completions, days, endDate, weekStartsOn, now)
  return expected > 0 ? done / expected : 0
}

/**
 * The numerator and denominator behind calculateSuccessRate, so several habits
 * can be pooled into one rate (sum of done ÷ sum of expected).
 */
export function calculateSuccessCounts(
  habit: Habit,
  completions: HabitCompletion[],
  days: number = 30,
  endDate: Date = new Date(),
  weekStartsOn: WeekStart = 1,
  now: Date = new Date()
): { done: number; expected: number } {
  const habitId = String(habit.id)
  const end = startOfLocalDay(endDate)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))

  if (isWeeklyHabit(habit)) return weeklySuccessCounts(habit, completions, start, end, weekStartsOn, now)

  const completionByDate = new Set(
    completions
      .filter(c => String(c.habitId) === habitId && c.completed)
      .map(c => c.date)
  )

  let scheduledDays = 0
  let completedDays = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (!isHabitScheduledOnDate(habit, d, end)) continue
    scheduledDays++
    if (completionByDate.has(dateKey(d))) completedDays++
  }

  return { done: completedDays, expected: scheduledDays }
}

/**
 * Get next milestone for a habit
 */
export function getNextMilestone(currentStreak: number): number {
  const milestones = [3, 7, 21, 66, 100]
  return milestones.find(m => m > currentStreak) || 100
}

/**
 * Check if a freeze can be earned (every 7 days of streak)
 */
export function canEarnFreeze(streakData: StreakData): boolean {
  const freezesEarned = Math.floor(streakData.current / 7)
  const totalFreezesShould = freezesEarned
  const totalFreezesHas = streakData.freezesAvailable + streakData.freezesUsed

  return totalFreezesShould > totalFreezesHas
}

/**
 * Use a streak freeze
 */
export function useStreakFreeze(streakData: StreakData): StreakData {
  if (streakData.freezesAvailable <= 0) {
    return streakData
  }

  return {
    ...streakData,
    freezesAvailable: streakData.freezesAvailable - 1,
    freezesUsed: streakData.freezesUsed + 1
  }
}
