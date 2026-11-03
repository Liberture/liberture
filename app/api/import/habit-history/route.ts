import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { withCompletionStarts } from "@/lib/habits/habit-utils"
import { userToday } from "@/lib/habits/api/time-zone"
import { runHabitHistoryImport, type HabitHistoryImportRequest } from "@/lib/habits/import/run-habit-history-import"
import type { StorageData } from "@/lib/habits/types"

/**
 * POST /api/import/habit-history — Settings → Data → Merge history.
 * The same import as /api/v1/import/habit-history, signed in with the app's
 * own session (or legacy API key) and only ever into that account.
 */
export async function POST(request: Request) {
  const userId = await verifiedTrackerUserId(request)
  if (userId === null) return NextResponse.json({ error: "Sign in required" }, { status: 401 })

  let body: HabitHistoryImportRequest & { timeZone?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Send { data, dryRun?, habitMapping? }" }, { status: 400 })
  }

  try {
    const rows = await getDb()`SELECT data FROM habit_users WHERE id = ${userId}`
    const stored = (rows[0]?.data ?? {}) as StorageData
    const data = { ...stored, habits: withCompletionStarts(stored.habits ?? [], stored.completions ?? []) }
    const result = await runHabitHistoryImport(userId, data, body, userToday(request, data, undefined, body.timeZone))
    return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Habit history import failed:", error)
    return NextResponse.json({ error: "The import stopped with an error. Anything already written stays, and running it again is safe: it only adds what is missing." }, { status: 500 })
  }
}
