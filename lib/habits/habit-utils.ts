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
 */
export function calculateStreak(
  habitId: string,
  completions: HabitCompletion[],
  existingStreak?: StreakData,
  habit?: Habit,
  currentDate: Date = new Date()
): StreakData {
  // Archived habits have no active streak.
  if (habit?.archived) {
    return {
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
  currentDate: Date = new Date()
): boolean {
  const todayString = dateKey(currentDate)
  const completedToday = completions.some(
    c => String(c.habitId) === String(habit.id) && c.date === todayString && c.completed
  )

  if (completedToday) {
    return false
  }

  // Check if we have a significant streak
  const streakData = habit.streakData || calculateStreak(habit.id, completions, undefined, habit, currentDate)
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
 */
export function calculateSuccessRate(
  habit: Habit,
  completions: HabitCompletion[],
  days: number = 30,
  endDate: Date = new Date()
): number {
  const habitId = String(habit.id)
  const end = startOfLocalDay(endDate)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))

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

  return scheduledDays > 0 ? completedDays / scheduledDays : 0
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
