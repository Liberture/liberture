import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findHabitByName } from "@/lib/habits/api/find-habit"
import { applyHabitEdit, mutateHabits, type HabitEditInput } from "@/lib/habits/api/habit-writes"
import type { Habit } from "@/lib/habits/types"

/**
 * POST /api/v1/habits/update
 * Body: { habit: "<name as said>", name?, description?, days?, timesPerWeek?, time? }
 * Rename or change a habit. Scope edit_habits (on by default). The edit
 * carries updatedAt, so an open tab saving older data can't revert it.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "edit_habits")
  if (user instanceof NextResponse) return user

  let body: HabitEditInput & { habit?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const found = findHabitByName(user.data.habits ?? [], body.habit)
  if (found instanceof NextResponse) return found

  const edit = applyHabitEdit(found, body)
  if ("error" in edit) return NextResponse.json({ error: edit.error }, { status: 400 })

  let saved: Habit | null = null
  try {
    await mutateHabits(user.userId, ({ habits }) => {
      const current = habits.find((h) => h.id === found.id)
      if (!current) return null
      // Re-apply to the latest copy, in case it changed since we read it.
      const again = applyHabitEdit(current, body)
      if ("error" in again) return null
      saved = again.habit
      return { habits: habits.map((h) => (h.id === found.id ? again.habit : h)) }
    })
  } catch (error) {
    console.error("Failed to update habit:", error)
    return NextResponse.json({ error: "Failed to update habit" }, { status: 500 })
  }
  if (!saved) return NextResponse.json({ error: "That habit no longer exists" }, { status: 404 })

  const h = saved as Habit
  return NextResponse.json({
    habit: { id: h.id, name: h.name, description: h.description ?? null, schedule: h.schedule, time: h.time || null },
    say: `Updated ${found.name}: ${edit.changes.join(", ")}.`,
  })
}
