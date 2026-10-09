import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { calculateStreak, calculateSuccessRate, isHabitDueOnDate, isHabitScheduledOnDate, weeklyProgress } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { userToday } from "@/lib/habits/api/time-zone"
import { appendHabits, buildCustomHabit, type CustomHabitInput } from "@/lib/habits/api/habit-writes"
import { normalizeName } from "@/lib/habits/api/resolve"

/** Rounded to two decimals, like the other rates in the API. */
function rate(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * GET /api/v1/habits?tz=&includeArchived=true
 * Returns all habits with computed streak and completion stats. Archived
 * habits only with includeArchived.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { data } = user
  const url = new URL(request.url)
  const today = userToday(request, data, undefined, url.searchParams.get("tz"))
  const includeArchived = url.searchParams.get("includeArchived") === "true"
  const currentDate = parseDateOnly(today)
  const weekStartsOn = data.preferences?.weekStartsOn ?? 1
  const completions = data.completions ?? []

  const habits = (data.habits ?? [])
    .filter((h) => includeArchived || !h.archived)
    .map((habit) => {
      const streakData = calculateStreak(habit.id, completions, undefined, habit, currentDate, weekStartsOn)
      const weekly = habit.schedule?.type === "times_per_week"
        ? weeklyProgress(habit, completions, currentDate, weekStartsOn)
        : null
      const completedToday = (data.completions ?? []).some(
        (c) => c.habitId === habit.id && c.date === today && c.completed
      )
      const lastCompletion = (data.completions ?? [])
        .filter((c) => c.habitId === habit.id && c.completed)
        .sort((a, b) => b.date.localeCompare(a.date))[0]

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description ?? null,
        color: habit.color,
        schedule: habit.schedule,
        time: habit.time || null,
        timeOfDay: habit.timeOfDay ?? null,
        category: habit.category ?? null,
        tags: habit.tags ?? [],
        priority: habit.priority ?? null,
        archived: Boolean(habit.archived),
        protocolSlug: habit.protocolSlug ?? null,
        startDate: habit.startDate ?? habit.createdAt?.slice(0, 10) ?? null,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
        streakUnit: streakData.unit ?? "days",
        completionRate7d: rate(calculateSuccessRate(habit, completions, 7, currentDate, weekStartsOn, currentDate)),
        completionRate30d: rate(calculateSuccessRate(habit, completions, 30, currentDate, weekStartsOn, currentDate)),
        scheduledToday: isHabitScheduledOnDate(habit, currentDate, currentDate),
        dueToday: isHabitDueOnDate(habit, currentDate, completions, weekStartsOn, currentDate),
        weeklyProgress: weekly,
        completedToday,
        lastCompletedAt: lastCompletion?.date ?? null,
        dataEntry: habit.dataEntry ?? null,
      }
    })

  return NextResponse.json(habits)
}

/**
 * POST /api/v1/habits
 * Body: { name, days?, timesPerWeek?, time?, pillar? }
 *
 * Creates a habit that isn't in the catalog ("running", "read 10 pages").
 * Defaults are chosen so a voice assistant never has to ask: every day, no
 * reminder, pillar inferred from the name. Saying the defaults back in `say`
 * lets the user correct them in the same breath. Re-creating an existing
 * name returns that habit instead of a duplicate.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "add_habits")
  if (user instanceof NextResponse) return user

  let body: CustomHabitInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const built = buildCustomHabit(body)
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 })
  }

  const existing = (user.data.habits ?? []).find(
    (h) => !h.archived && normalizeName(h.name) === normalizeName(built.habit.name)
  )
  if (existing) {
    return NextResponse.json({
      created: false,
      habit: { id: existing.id, name: existing.name },
      say: `You already track ${existing.name}.`,
    })
  }

  try {
    await appendHabits(user.userId, [built.habit])
  } catch (error) {
    console.error("Failed to create habit:", error)
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 })
  }

  const h = built.habit
  return NextResponse.json({
    created: true,
    habit: { id: h.id, name: h.name, schedule: h.schedule, time: h.time || null, pillar: h.category },
    say: `Added ${h.name}, ${built.scheduleText}${h.time ? "" : ", no reminder"}.`,
  })
}
