import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import {
  calculateStreak,
  calculateSuccessCounts,
  isHabitActiveOnDate,
  isHabitDueOnDate,
  isHabitScheduledOnDate,
  weeklyProgress,
} from "@/lib/habits/habit-utils"
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
  const weekStartsOn = data.preferences?.weekStartsOn ?? 1

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

  // Per-habit streaks: days, or weeks that met the target for times-per-week habits.
  const streaks = habits.map((h) => {
    const s = calculateStreak(h.id, completions, undefined, h, todayDate, weekStartsOn)
    return { name: h.name, current: s.current, unit: s.unit ?? "days" }
  })

  const bestStreak = streaks.reduce(
    (best, s) => (s.current > best.current ? s : best),
    { name: "", current: 0, unit: "days" }
  )

  // Active habits: at least 1 completion in last 30 days
  const cutoff30 = format(subDays(todayDate, 29), "yyyy-MM-dd")
  const activeHabitsCount = allHabits.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.completed && c.date >= cutoff30 && isHabitActiveOnDate(h, parseDateOnly(c.date), todayDate))
  ).length

  // Completion rate today: done ÷ habits due today. A times-per-week habit
  // whose target was already met this week isn't due.
  const habitsDueToday = allHabits.filter((h) => isHabitDueOnDate(h, todayDate, completions, weekStartsOn, todayDate))

  const completedToday = habitsDueToday.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === today && c.completed)
  ).length

  const completionRateToday =
    habitsDueToday.length > 0
      ? Math.round((completedToday / habitsDueToday.length) * 100) / 100
      : 0

  // 7-day rate pooled across habits: scheduled days for daily and fixed-day
  // habits, weekly targets for times-per-week habits.
  let expected7d = 0
  let done7d = 0
  for (const h of allHabits) {
    const counts = calculateSuccessCounts(h, completions, 7, todayDate, weekStartsOn, todayDate)
    expected7d += counts.expected
    done7d += counts.done
  }

  const completionRate7d = expected7d > 0 ? Math.round((done7d / expected7d) * 100) / 100 : 0

  const weeklyTargets = habits
    .filter((h) => h.schedule?.type === "times_per_week")
    .map((h) => {
      const p = weeklyProgress(h, completions, todayDate, weekStartsOn)
      return { name: h.name, done: p.done, target: p.target, met: p.met }
    })

  const totalStreakDays = streaks.reduce((sum, s) => sum + (s.unit === "days" ? s.current : 0), 0)

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
    bestCurrentStreakUnit: bestStreak.unit,
    bestHabitName: bestStreak.name,
    totalStreakDays,
    completionsByDay,
    weeklyTargets,
    // So an assistant can explain the numbers instead of guessing them.
    definitions: {
      totalHabits: "Habits that aren't archived. Archived habits are left out of every number here.",
      activeHabits: "Of those, habits marked done at least once in the last 30 days (same as habitsLoggedLast30d).",
      completionRateToday: "Done today ÷ habits due today (and created by then). A times-per-week habit stops being due once this week's target is met, so rest days don't lower the rate.",
      completionRate7d: "Done ÷ expected over the last 7 days. Daily and fixed-day habits expect each scheduled day. A times-per-week habit expects its weekly target (prorated for a part week; this week only what is still needed with the days left), so 3 of 3 is 100%.",
      bestCurrentStreak: "Longest current run among habits: scheduled days in a row, or weeks in a row that met the target for times-per-week habits (see bestCurrentStreakUnit).",
      totalStreakDays: "Sum of the current day streaks. Times-per-week habits are left out; their streaks count weeks.",
      weeklyTargets: "Times-per-week habits: days done this week, the weekly target, and whether it is met. weekStartsOn comes from the user's preferences.",
      totalCompletions: "Every day marked done, all time.",
      completionsByDay: "Habits marked done on each of the last 30 days.",
    },
  })
}
