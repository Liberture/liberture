import type { Completion, Habit, Schedule, StreakSummary, TimeOfDay } from "./types"

/** Local-time YYYY-MM-DD. Avoids toISOString(), which shifts the day in negative offsets. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Whether the habit is expected on this date. times_per_week has no fixed days, so every day counts as an opportunity. */
export function isScheduledOn(schedule: Schedule, date: Date): boolean {
  switch (schedule.type) {
    case "daily":
      return true
    case "specific_days":
      return schedule.days.includes(date.getDay())
    case "times_per_week":
      return true
  }
}

export function scheduleLabel(schedule: Schedule): string {
  switch (schedule.type) {
    case "daily":
      return "Every day"
    case "specific_days": {
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const days = [...schedule.days].sort((a, b) => a - b)
      if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "Weekdays"
      if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends"
      return days.map((d) => names[d]).join(", ")
    }
    case "times_per_week":
      return `${schedule.timesPerWeek}× per week`
  }
}

export function inferTimeOfDay(time: string): TimeOfDay {
  const hour = Number(time.split(":")[0])
  if (Number.isNaN(hour)) return "anytime"
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}

/**
 * The local calendar day a habit started on. `createdAt` is a UTC ISO string,
 * so slicing its first 10 characters yields the UTC date — which is tomorrow
 * for anyone behind UTC creating a habit in the evening, and would place the
 * start day after every completion. Convert through Date to stay in local time.
 */
function startDay(habit: Habit): Date {
  return parseDateKey(dateKey(new Date(habit.createdAt)))
}

function completionKeys(completions: Completion[], habitId: string): Set<string> {
  const keys = new Set<string>()
  for (const c of completions) {
    if (c.habitId === habitId) keys.add(c.date)
  }
  return keys
}

/**
 * Walks backwards from today counting consecutive scheduled days that were
 * completed. Unscheduled days are skipped rather than breaking the streak.
 * Today counts as pending, not missed — an incomplete today doesn't reset a streak.
 */
export function calculateStreak(
  habit: Habit,
  completions: Completion[],
  today: Date = new Date(),
): { current: number; longest: number } {
  const done = completionKeys(completions, habit.id)
  if (done.size === 0) return { current: 0, longest: 0 }

  const start = startDay(habit)
  const todayKey = dateKey(today)

  let current = 0
  for (let cursor = new Date(today); dateKey(cursor) >= dateKey(start); cursor = addDays(cursor, -1)) {
    const key = dateKey(cursor)
    if (!isScheduledOn(habit.schedule, cursor)) continue
    if (done.has(key)) {
      current++
    } else if (key === todayKey) {
      continue // today is still open
    } else {
      break
    }
  }

  // Longest: sweep forward across every scheduled day since the habit was created.
  let longest = 0
  let run = 0
  for (let cursor = new Date(start); dateKey(cursor) <= todayKey; cursor = addDays(cursor, 1)) {
    const key = dateKey(cursor)
    if (!isScheduledOn(habit.schedule, cursor)) continue
    if (done.has(key)) {
      run++
      if (run > longest) longest = run
    } else if (key !== todayKey) {
      run = 0
    }
  }

  return { current, longest: Math.max(longest, current) }
}

/** Completion rate over the trailing `days`, counting only scheduled days that have already passed. */
export function completionRate(
  habit: Habit,
  completions: Completion[],
  days: number,
  today: Date = new Date(),
): number {
  const done = completionKeys(completions, habit.id)
  const start = startDay(habit)
  let scheduled = 0
  let completed = 0

  for (let i = 0; i < days; i++) {
    const cursor = addDays(today, -i)
    if (dateKey(cursor) < dateKey(start)) break
    if (!isScheduledOn(habit.schedule, cursor)) continue
    // Today isn't a miss yet; only count it once it's done.
    const isToday = dateKey(cursor) === dateKey(today)
    const hit = done.has(dateKey(cursor))
    if (isToday && !hit) continue
    scheduled++
    if (hit) completed++
  }

  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
}

export function summarize(
  habit: Habit,
  completions: Completion[],
  today: Date = new Date(),
): StreakSummary {
  const { current, longest } = calculateStreak(habit, completions, today)
  return {
    current,
    longest,
    rate7: completionRate(habit, completions, 7, today),
    rate30: completionRate(habit, completions, 30, today),
  }
}

export function habitsForDate(habits: Habit[], date: Date): Habit[] {
  return habits
    .filter((h) => !h.archived && isScheduledOn(h.schedule, date))
    .sort((a, b) => a.time.localeCompare(b.time))
}

/** Milestones worth celebrating, matched exactly so a message fires once. */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365]

export function nextMilestone(current: number): number | null {
  return STREAK_MILESTONES.find((m) => m > current) ?? null
}
