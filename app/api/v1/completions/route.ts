import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { calculateStreak } from "@/lib/habits/habit-utils"
import { isDateOnlyString, parseDateOnly } from "@/lib/habits/date-utils"
import { userToday } from "@/lib/habits/api/time-zone"
import { format, subDays } from "date-fns"
import type { HabitCompletion } from "@/lib/habits/types"
import {
  deleteCompletionRow,
  getCompletionRow,
  getCompletionRows,
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
  upsertCompletionRow,
} from "@/lib/habits/optimized-storage"

/**
 * DELETE /api/v1/completions
 * Remove a habit completion record.
 * Body: { habitId: string, date?: string }
 */
export async function DELETE(request: Request) {
  const user = await authorizeIntegration(request, "log_completions")
  if (user instanceof NextResponse) return user

  let body: { habitId?: string; date?: string; timeZone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { habitId, date } = body
  if (!habitId || typeof habitId !== "string") {
    return NextResponse.json({ error: "habitId is required" }, { status: 400 })
  }

  const requestToday = userToday(request, user.data, undefined, body.timeZone)
  const completionDate = isDateOnlyString(date) ? date : requestToday
  const now = new Date().toISOString()
  const habit = (user.data.habits ?? []).find((h) => h.id === habitId)

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    await deleteCompletionRow(sql, user.userId, habitId, completionDate)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["completions"], now)

    const updatedCompletions = await getCompletionRows(sql, user.userId)
    const streakData = calculateStreak(habitId, updatedCompletions, undefined, habit, parseDateOnly(requestToday))

    return NextResponse.json({
      success: true,
      currentStreak: streakData.current,
    })
  } catch (error) {
    console.error("Failed to remove completion:", error)
    return NextResponse.json({ error: "Failed to remove completion" }, { status: 500 })
  }
}

/**
 * GET /api/v1/completions?days=30
 * Returns recent completions with habit name.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10), 365)
  const requestToday = parseDateOnly(userToday(request, user.data))
  const cutoff = format(subDays(requestToday, days - 1), "yyyy-MM-dd")

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    const habitMap = new Map((user.data.habits ?? []).map((h) => [h.id, h.name]))
    const completions = (await getCompletionRows(sql, user.userId, cutoff))
      .filter((c) => c.completed)
      .map((c) => ({
        habitId: c.habitId,
        habitName: habitMap.get(c.habitId) ?? "Unknown",
        date: c.date,
        completedAt: c.completedAt ?? null,
      }))

    return NextResponse.json(completions)
  } catch (error) {
    console.error("Failed to list completions:", error)
    return NextResponse.json({ error: "Failed to list completions" }, { status: 500 })
  }
}

/**
 * POST /api/v1/completions
 * Log a habit completion.
 * Body: { habitId: string, date?: string, data?: Record<string, any>, completed?: boolean, completedAt?: string, context?: string }
 * `context` is the completion note (a reflection, "felt strong"); a new note
 * replaces the old one for that day.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "log_completions")
  if (user instanceof NextResponse) return user

  let body: { habitId?: string; date?: string; data?: Record<string, any>; completed?: boolean; completedAt?: string; timeZone?: string; context?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { habitId, date, data: completionData } = body
  if (!habitId || typeof habitId !== "string") {
    return NextResponse.json({ error: "habitId is required" }, { status: 400 })
  }

  const habits = user.data.habits ?? []
  const habit = habits.find((h) => h.id === habitId)
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 })
  }

  const requestToday = userToday(request, user.data, undefined, body.timeZone)
  const completionDate = isDateOnlyString(date) ? date : requestToday
  const now = new Date().toISOString()
  const completedAt = typeof body.completedAt === "string" && !Number.isNaN(Date.parse(body.completedAt))
    ? body.completedAt
    : now

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    const existingCompletion = await getCompletionRow(sql, user.userId, habitId, completionDate)

    let finalData = completionData
    if (existingCompletion?.data && completionData) {
      finalData = { ...existingCompletion.data }
      for (const [key, value] of Object.entries(completionData)) {
        if (typeof value === "number" && typeof finalData[key] === "number") {
          finalData[key] = (finalData[key] as number) + value
        } else {
          finalData[key] = value
        }
      }
    }

    let isGoalMet = true
    if (typeof body.completed === "boolean") {
      isGoalMet = body.completed
    } else if (habit.dataEntry?.enabled && habit.dataEntry.fields.length > 0) {
      isGoalMet = habit.dataEntry.fields.every(field => {
        if (!field.goalValue) return true
        const checkData = finalData ?? existingCompletion?.data
        const value = checkData ? checkData[field.id] : null
        return typeof value === "number" && value >= field.goalValue
      })
    }

    const note = typeof body.context === "string" ? body.context.trim().slice(0, 1000) : ""
    const newCompletion: HabitCompletion = {
      ...existingCompletion,
      habitId,
      date: completionDate,
      completed: isGoalMet,
      completedAt,
      data: finalData ?? existingCompletion?.data,
      ...(note ? { context: note } : {}),
    }

    await upsertCompletionRow(sql, user.userId, newCompletion)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["completions"], now)

    const updatedCompletions = await getCompletionRows(sql, user.userId)
    const streakData = calculateStreak(habitId, updatedCompletions, undefined, habit, parseDateOnly(requestToday))

    return NextResponse.json({
      success: true,
      goalReached: isGoalMet,
      currentStreak: streakData.current,
      totalData: finalData ?? existingCompletion?.data ?? null,
      date: completionDate,
    })
  } catch (error) {
    console.error("Failed to save completion:", error)
    return NextResponse.json({ error: "Failed to save completion" }, { status: 500 })
  }
}
