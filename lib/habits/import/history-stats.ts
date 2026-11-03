import { calculateStreak, calculateSuccessRate, withCompletionStarts, type WeekStart } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import type { Habit, HabitCompletion, StreakData } from "@/lib/habits/types"

export interface HabitHistoryStats {
  habitId: string
  name: string
  archived: boolean
  totalCompletions: number
  firstDate: string | null
  lastDate: string | null
  currentStreak: number
  longestStreak: number
  streakUnit: "days" | "weeks"
  /** Done ÷ expected over the last 30 days and since the first logged day, 0-1. */
  completionRate30d: number
  completionRateAllTime: number
  /** Days done per month, "YYYY-MM". */
  byMonth: Record<string, number>
}

function daysBetween(from: string, to: string): number {
  return Math.round((parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / 86_400_000) + 1
}

/**
 * Streaks rebuilt from the completions alone: the stored longest is not
 * carried over (a backup's streakData.longest is never trusted), freezes and
 * milestones are. An archived habit gets its real longest run and a current
 * streak of 0; it stays archived. startDate moves back to the first logged
 * day, so imported history counts in every stat.
 */
export function rebuildStreaks(
  habits: Habit[],
  completions: HabitCompletion[],
  habitIds: Set<string>,
  today: string,
  weekStartsOn: WeekStart = 1
): { habits: Habit[]; stats: HabitHistoryStats[] } {
  const todayDate = parseDateOnly(today)
  const started = withCompletionStarts(habits, completions)
  const stats: HabitHistoryStats[] = []
  const next = started.map((habit) => {
    if (!habitIds.has(habit.id)) return habits.find((h) => h.id === habit.id)!
    const previous = habit.streakData
    const seed: StreakData | undefined = previous ? { ...previous, longest: 0 } : undefined
    const live = { ...habit, archived: false }
    const streak = calculateStreak(habit.id, completions, seed, live, todayDate, weekStartsOn)
    const streakData: StreakData = habit.archived ? { ...streak, current: 0 } : streak

    const done = [...new Set(completions.filter((c) => c.habitId === habit.id && c.completed && c.date <= today).map((c) => c.date))].sort()
    const byMonth: Record<string, number> = {}
    for (const date of done) byMonth[date.slice(0, 7)] = (byMonth[date.slice(0, 7)] ?? 0) + 1
    const firstDate = done[0] ?? null
    stats.push({
      habitId: habit.id,
      name: habit.name,
      archived: Boolean(habit.archived),
      totalCompletions: done.length,
      firstDate,
      lastDate: done[done.length - 1] ?? null,
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
      streakUnit: streakData.unit ?? "days",
      completionRate30d: Math.round(calculateSuccessRate(habit, completions, 30, todayDate, weekStartsOn, todayDate) * 100) / 100,
      completionRateAllTime: firstDate
        ? Math.round(calculateSuccessRate(habit, completions, daysBetween(firstDate, today), todayDate, weekStartsOn, todayDate) * 100) / 100
        : 0,
      byMonth,
    })
    return { ...habit, streakData }
  })
  return { habits: next, stats }
}
