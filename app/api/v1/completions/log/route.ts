import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findHabitByName } from "@/lib/habits/api/find-habit"
import { forwardRequest } from "@/lib/habits/api/find-item"
import { valuesForHabit } from "@/lib/habits/api/completion-values"
import { POST as postCompletion } from "@/app/api/v1/completions/route"

/**
 * POST /api/v1/completions/log
 * Body: { habit, value?, unit?, values?, note?, date?, timeZone?, completed? }
 *
 * "Log 20 pushups", "slept 7.5 hours, felt rested" in one call
 * (log_habit_value). Numbers add up over the day, the goal decides done,
 * and `note` is saved as the day's note. Wraps POST /api/v1/completions.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "log_completions")
  if (user instanceof NextResponse) return user

  let body: { habit?: unknown; value?: unknown; unit?: unknown; values?: unknown; note?: unknown; date?: unknown; timeZone?: unknown; completed?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const found = findHabitByName(user.data.habits ?? [], body.habit)
  if (found instanceof NextResponse) return found
  const habit = found

  const mapped = valuesForHabit(habit, body)
  if ("error" in mapped) return NextResponse.json({ error: mapped.error }, { status: 400 })
  const note = typeof body.note === "string" ? body.note.trim() : ""
  if (!Object.keys(mapped.data).length && !note) {
    return NextResponse.json({ error: "Send value (or values) and/or note. To just mark it done, use log_habit." }, { status: 400 })
  }

  const response = await postCompletion(
    forwardRequest(request, "/api/v1/completions", "POST", {
      habitId: habit.id,
      ...(Object.keys(mapped.data).length ? { data: mapped.data } : {}),
      ...(note ? { context: note } : {}),
      ...(typeof body.date === "string" ? { date: body.date } : {}),
      ...(typeof body.timeZone === "string" ? { timeZone: body.timeZone } : {}),
      ...(typeof body.completed === "boolean" ? { completed: body.completed } : {}),
    })
  )
  if (!response.ok) return response
  const result = (await response.json()) as { goalReached: boolean; currentStreak: number; totalData: Record<string, number | string> | null; date: string }

  const parts: string[] = []
  for (const field of mapped.fields.filter((f, i, all) => all.indexOf(f) === i)) {
    const total = result.totalData?.[field.id]
    if (typeof total !== "number") continue
    const unit = field.unit ?? field.label.toLowerCase()
    parts.push(field.goalValue ? `${total} of ${field.goalValue} ${unit}` : `${total} ${unit}`)
  }
  if (!parts.length && typeof result.totalData?.value === "number") parts.push(String(result.totalData.value))
  const say =
    `Logged ${habit.name}${parts.length ? `: ${parts.join(", ")}` : ""}${note ? ", with your note" : ""}.` +
    (result.goalReached ? (result.currentStreak > 1 ? ` Done, ${result.currentStreak} days in a row.` : " Done for the day.") : "")

  return NextResponse.json({ ...result, habit: habit.name, say })
}
