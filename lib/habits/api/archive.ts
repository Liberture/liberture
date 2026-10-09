import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findHabitByName } from "@/lib/habits/api/find-habit"
import { archiveHabitRecord, mutateHabits, unarchiveHabitRecord } from "@/lib/habits/api/habit-writes"
import type { Habit } from "@/lib/habits/types"

/**
 * POST /api/v1/habits/archive and /habits/unarchive, body { habit }.
 * Archiving hides a habit and pauses its streak without losing history, the
 * safe alternative to delete_habit. Scope edit_habits.
 */
export function archiveHandler(archive: boolean) {
  return async function POST(request: Request): Promise<Response> {
    const user = await authorizeIntegration(request, "edit_habits")
    if (user instanceof NextResponse) return user

    let body: { habit?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const habits = user.data.habits ?? []
    // Look among the habits this would change first: archived ones to unarchive.
    const pool = habits.filter((h) => Boolean(h.archived) !== archive)
    let found = findHabitByName(pool.length ? pool : habits, body.habit)
    if (found instanceof NextResponse && found.status === 404 && pool.length) found = findHabitByName(habits, body.habit)
    if (found instanceof NextResponse) return found
    const target = found

    if (Boolean(target.archived) === archive) {
      return NextResponse.json({
        habit: { id: target.id, name: target.name, archived: archive },
        noChange: true,
        say: archive ? `${target.name} is already archived.` : `${target.name} isn't archived.`,
      })
    }

    let saved: Habit | null = null
    try {
      const now = new Date().toISOString()
      await mutateHabits(user.userId, ({ habits: current }) => {
        const habit = current.find((h) => h.id === target.id)
        if (!habit) return null
        saved = archive ? archiveHabitRecord(habit, now) : unarchiveHabitRecord(habit, now)
        return { habits: current.map((h) => (h.id === target.id ? saved! : h)) }
      })
    } catch (error) {
      console.error("Failed to archive habit:", error)
      return NextResponse.json({ error: "Failed to update habit" }, { status: 500 })
    }
    if (!saved) return NextResponse.json({ error: "That habit no longer exists" }, { status: 404 })

    return NextResponse.json({
      habit: { id: target.id, name: target.name, archived: archive },
      say: archive
        ? `Archived ${target.name}. Its history is kept; say "unarchive ${target.name}" to bring it back.`
        : `${target.name} is back on your list.`,
    })
  }
}
