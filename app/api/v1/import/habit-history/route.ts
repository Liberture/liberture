import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { userToday } from "@/lib/habits/api/time-zone"
import { runHabitHistoryImport, type HabitHistoryImportRequest } from "@/lib/habits/import/run-habit-history-import"

/**
 * POST /api/v1/import/habit-history  (MCP: import_habit_history)
 * Body: { data | importId, mode?, dryRun?, habitMapping?, conflictPolicy?, batchSize?, timeZone? }
 *
 * Merges an older tracker's completion history into this account without
 * replacing or removing anything (lib/habits/import). Repeatable: the same
 * backup imported twice writes nothing the second time.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "log_completions")
  if (user instanceof NextResponse) return user

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
    const result = await runHabitHistoryImport(user.userId, user.data, body, userToday(request, user.data, undefined, body.timeZone))
    return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Habit history import failed:", error)
    return NextResponse.json({ error: "The import stopped with an error. Anything already written stays, and running it again is safe: it only adds what is missing." }, { status: 500 })
  }
}
