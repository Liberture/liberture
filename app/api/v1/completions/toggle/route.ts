import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { calculateStreak } from "@/lib/habits/habit-utils"
import { dateForRequest, isDateOnlyString, parseDateOnly } from "@/lib/habits/date-utils"
import type { HabitCompletion } from "@/lib/habits/types"
import { resolveByName, spokenList } from "@/lib/habits/api/resolve"
import {
  deleteCompletionRow,
  getCompletionRow,
  getCompletionRows,
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
  upsertCompletionRow,
} from "@/lib/habits/optimized-storage"

function dayPhrase(date: string, today: string): string {
  if (date === today) return ""
  const yesterday = new Date(parseDateOnly(today).getTime() - 864e5)
  const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`
  return date === y ? " for yesterday" : ` for ${date}`
}

function streakPhrase(streak: number): string {
  if (streak <= 1) return "That starts a new streak."
  return `${streak} days in a row.`
}

/**
 * POST /api/v1/completions/toggle
 * Toggle a habit completion on/off for a given date.
 * Body: { habitId?: string, habit?: string, date?: string, completed?: boolean }
 *
 * `habit` is what the user called it ("the walk", "meditación"); it is matched
 * to one active habit so an assistant can log in a single call. Every answer
 * carries `say`, a sentence ready to be read aloud.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "log_completions")
  if (user instanceof NextResponse) return user

  let body: { habitId?: string; habit?: string; date?: string; completed?: boolean; timeZone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { date } = body
  // By name (assistants) means "I did it" unless told otherwise; a bare
  // habitId keeps the original toggle behaviour for existing scripts.
  const requestedState = body.completed ?? (body.habit !== undefined ? true : undefined)
  const habits = user.data.habits ?? []
  let habit = typeof body.habitId === "string" ? habits.find((h) => h.id === body.habitId) : undefined

  if (!habit && typeof (body.habit ?? body.habitId) === "string") {
    const active = habits.filter((h) => !h.archived)
    const resolved = resolveByName(active, String(body.habit ?? body.habitId), (h) => h.name)
    if (resolved.kind === "ambiguous") {
      const names = resolved.options.map((h) => h.name)
      return NextResponse.json(
        { error: "More than one habit matches", code: "ambiguous", options: names, say: `Which one: ${spokenList(names)}?` },
        { status: 409 }
      )
    }
    if (resolved.kind === "none") {
      const names = active.map((h) => h.name)
      return NextResponse.json(
        {
          error: "No habit matches",
          code: "not_found",
          options: names,
          say: `I can't find that habit. You track ${spokenList(names, "and")}. Want me to create it?`,
        },
        { status: 404 }
      )
    }
    habit = resolved.item
  }

  if (!habit) {
    return NextResponse.json({ error: "habit (a name) or habitId is required" }, { status: 400 })
  }
  const habitId = habit.id

  const requestToday = dateForRequest(request, undefined, body.timeZone)
  const completionDate = isDateOnlyString(date) ? date : requestToday
  const now = new Date().toISOString()

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    const existingCompletion = await getCompletionRow(sql, user.userId, habitId, completionDate)
    const isCurrentlyCompleted = !!existingCompletion?.completed
    const targetCompleted = requestedState ?? !isCurrentlyCompleted

    if (targetCompleted === isCurrentlyCompleted) {
      const completions = await getCompletionRows(sql, user.userId)
      const streakData = calculateStreak(habitId, completions, undefined, habit, parseDateOnly(requestToday))
      return NextResponse.json({
        success: true,
        habit: habit.name,
        date: completionDate,
        completed: targetCompleted,
        currentStreak: streakData.current,
        noChange: true,
        say: targetCompleted
          ? `${habit.name} was already marked done${dayPhrase(completionDate, requestToday)}.`
          : `${habit.name} wasn't marked${dayPhrase(completionDate, requestToday)}.`,
      })
    }

    if (targetCompleted) {
      const newCompletion: HabitCompletion = {
        ...existingCompletion,
        habitId,
        date: completionDate,
        completed: true,
        completedAt: now,
      }
      await upsertCompletionRow(sql, user.userId, newCompletion)
    } else {
      await deleteCompletionRow(sql, user.userId, habitId, completionDate)
    }

    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["completions"], now)
    const updatedCompletions = await getCompletionRows(sql, user.userId)
    const streakData = calculateStreak(habitId, updatedCompletions, undefined, habit, parseDateOnly(requestToday))

    return NextResponse.json({
      success: true,
      habit: habit.name,
      date: completionDate,
      completed: targetCompleted,
      currentStreak: streakData.current,
      say: targetCompleted
        ? `Done: ${habit.name}${dayPhrase(completionDate, requestToday)}. ${streakPhrase(streakData.current)}`
        : `Unmarked ${habit.name}${dayPhrase(completionDate, requestToday)}.`,
    })
  } catch (error) {
    console.error("Failed to toggle completion:", error)
    return NextResponse.json({ error: "Failed to toggle completion" }, { status: 500 })
  }
}
