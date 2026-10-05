import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findHabitByName } from "@/lib/habits/api/find-habit"
import { mutateHabits } from "@/lib/habits/api/habit-writes"
import { refreshStorageJsonFromOptimizedTables, syncOptimizedStorageTablesIfEmpty } from "@/lib/habits/optimized-storage"

/**
 * POST /api/v1/habits/delete
 * Body: { habit: "<name as said>" }
 * Deletes the habit and its completions. Scope delete_habits, OFF by default:
 * the user has to switch it on in Settings. Leaves a tombstone so a tab that
 * still shows the habit can't bring it back on its next save.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "delete_habits")
  if (user instanceof NextResponse) return user

  let body: { habit?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const found = findHabitByName(user.data.habits ?? [], body.habit)
  if (found instanceof NextResponse) return found

  try {
    const now = new Date().toISOString()
    const ok = await mutateHabits(user.userId, ({ habits, habitTombstones }) =>
      habits.some((h) => h.id === found.id)
        ? { habits: habits.filter((h) => h.id !== found.id), habitTombstones: { ...habitTombstones, [found.id]: now } }
        : null
    )
    if (!ok) return NextResponse.json({ error: "That habit no longer exists" }, { status: 404 })

    const sql = getDb()
    // Same order as every other v1 write: make sure the completions table
    // mirrors the blob before deleting rows and rebuilding the blob from it.
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    await sql`DELETE FROM habit_completions WHERE user_id = ${user.userId} AND habit_id = ${found.id}`
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["completions"], new Date().toISOString())
  } catch (error) {
    console.error("Failed to delete habit:", error)
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 })
  }

  return NextResponse.json({ deleted: { id: found.id, name: found.name }, say: `Deleted ${found.name} and its history.` })
}
