import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { calculateStreak, isHabitActiveOnDate, isHabitScheduledOnDate } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { userToday } from "@/lib/habits/api/time-zone"
import { format, subDays } from "date-fns"

/**
 * GET /api/v1/stats
 * Returns overall habit tracking statistics.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { data } = user
  const today = userToday(request, data, undefined, new URL(request.url).searchParams.get("tz"))
  const todayDate = parseDateOnly(today)
  const allHabits = data.habits ?? []
  const habits = allHabits.filter((h) => !h.archived)
  const completions = data.completions ?? []

  // Completions by day (last 30 days)
  const completionsByDay: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(todayDate, i), "yyyy-MM-dd")
    const count = completions.filter((c) => {
      const habit = allHabits.find((h) => h.id === c.habitId)
      return c.date === date && c.completed && isHabitScheduledOnDate(habit, subDays(todayDate, i), todayDate)
    }).length
    completionsByDay.push({ date, count })
  }

  // Per-habit streaks
  const streaks = habits.map((h) => {
    const s = calculateStreak(h.id, completions, undefined, h, todayDate)
    return { name: h.name, current: s.current }
  })

  const bestStreak = streaks.reduce(
    (best, s) => (s.current > best.current ? s : best),
    { name: "", current: 0 }
  )

  // Active habits: at least 1 completion in last 30 days
  const cutoff30 = format(subDays(todayDate, 29), "yyyy-MM-dd")
  const activeHabitsCount = allHabits.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.completed && c.date >= cutoff30 && isHabitActiveOnDate(h, parseDateOnly(c.date), todayDate))
  ).length

  // Completion rate today (context-aware)
  const habitsScheduledToday = allHabits.filter(h => isHabitScheduledOnDate(h, todayDate, todayDate))

  const completedToday = habitsScheduledToday.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === today && c.completed)
  ).length

  const completionRateToday =
    habitsScheduledToday.length > 0
      ? Math.round((completedToday / habitsScheduledToday.length) * 100) / 100
      : 0

  // 7-day completion rate (context-aware average across scheduled active days)
  let totalPossibleCompletions7d = 0
  let totalActualCompletions7d = 0
  
  for (let i = 0; i < 7; i++) {
    const d = subDays(todayDate, i)
    const dStr = format(d, "yyyy-MM-dd")
    const habitsScheduledOnDay = allHabits.filter(h => isHabitScheduledOnDate(h, d, todayDate))
    
    totalPossibleCompletions7d += habitsScheduledOnDay.length
    totalActualCompletions7d += completions.filter(c => 
      c.completed && c.date === dStr && habitsScheduledOnDay.some(h => h.id === c.habitId)
    ).length
  }

  const completionRate7d =
    totalPossibleCompletions7d > 0
      ? Math.round((totalActualCompletions7d / totalPossibleCompletions7d) * 100) / 100
      : 0

  const totalStreakDays = streaks.reduce((sum, s) => sum + s.current, 0)

  return NextResponse.json({
    totalHabits: habits.length,
    activeHabits: activeHabitsCount,
    habitsLoggedLast30d: activeHabitsCount,
    totalCompletions: completions.filter((c) => {
      const habit = allHabits.find((h) => h.id === c.habitId)
      return c.completed && isHabitActiveOnDate(habit, parseDateOnly(c.date), todayDate)
    }).length,
    completionRateToday,
    completionRate7d,
    bestCurrentStreak: bestStreak.current,
    bestHabitName: bestStreak.name,
    totalStreakDays,
    completionsByDay,
    // So an assistant can explain the numbers instead of guessing them.
    definitions: {
      totalHabits: "Habits that aren't archived. Archived habits are left out of every number here.",
      activeHabits: "Of those, habits marked done at least once in the last 30 days (same as habitsLoggedLast30d).",
      completionRateToday: "Done today ÷ habits scheduled today (and created by then). A times-per-week habit counts as scheduled every day, so days off lower the rate.",
      completionRate7d: "Done ÷ scheduled over the last 7 days, same rule.",
      bestCurrentStreak: "Longest current run among habits, in scheduled days.",
      totalCompletions: "Every day marked done, all time.",
      completionsByDay: "Habits marked done on each of the last 30 days.",
    },
  })
}
