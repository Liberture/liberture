import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { Todo } from "@/lib/habits/types"
import { parseISO, isToday, isTomorrow, isPast, addDays, startOfDay } from "date-fns"
import {
  getTodoRow,
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
  upsertTodoRow,
} from "@/lib/habits/optimized-storage"

type Urgency = "overdue" | "today" | "tomorrow" | "this_week" | "later" | "no_date"

function calculateUrgency(dueDate?: string): Urgency {
  if (!dueDate) return "no_date"

  const date = parseISO(dueDate)
  const today = startOfDay(new Date())

  if (isPast(date) && !isToday(date)) return "overdue"
  if (isToday(date)) return "today"
  if (isTomorrow(date)) return "tomorrow"

  const weekFromNow = addDays(today, 7)
  if (date < weekFromNow) return "this_week"

  return "later"
}

/**
 * PATCH /api/v1/todos/:id/status
 * Body: { status: "incomplete" | "in_progress" | "completed" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  const { id } = await params

  let body: { status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { status } = body
  const validStatuses = ["incomplete", "in_progress", "completed"]

  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({
      error: "status is required and must be one of: incomplete, in_progress, completed"
    }, { status: 400 })
  }

  const now = new Date().toISOString()

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)

    const existing = await getTodoRow(sql, user.userId, id)
    if (!existing) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    const updatedTodo: Todo = {
      ...existing,
      status: status as Todo["status"],
      updatedAt: now,
      completedAt: status === "completed" ? now : undefined,
    }

    await upsertTodoRow(sql, user.userId, updatedTodo)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["todos"], now)

    return NextResponse.json({
      ...updatedTodo,
      urgency: calculateUrgency(updatedTodo.dueDate),
    })
  } catch (error) {
    console.error("Failed to update todo status:", error)
    return NextResponse.json({ error: "Failed to update todo status" }, { status: 500 })
  }
}
