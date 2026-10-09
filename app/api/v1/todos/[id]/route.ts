import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { Todo } from "@/lib/habits/types"
import { parseISO, isToday, isTomorrow, isPast, addDays, startOfDay } from "date-fns"
import {
  deleteTodoRow,
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
 * PUT /api/v1/todos/:id
 * Body: any subset of { title, description, dueDate, dueTime, priority, status, canTopolinoHelp,
 * projectId, estimatedMinutes, energyLevel, tags, subtasks, notes }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  const { id } = await params

  let body: Partial<{
    title: string
    description: string
    dueDate: string
    dueTime: string
    priority: number
    status: string
    canTopolinoHelp: boolean
    projectId: string
    estimatedMinutes: number
    energyLevel: "low" | "medium" | "high"
    tags: string[]
    subtasks: Array<{ id: string; title: string; completed: boolean }>
    notes: string
  }>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const now = new Date().toISOString()

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)

    const existing = await getTodoRow(sql, user.userId, id)
    if (!existing) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    const updatedTodo: Todo = { ...existing, updatedAt: now }
    if (body.title !== undefined) updatedTodo.title = body.title.trim()
    if (body.description !== undefined) updatedTodo.description = body.description?.trim() || undefined
    if (body.dueDate !== undefined) updatedTodo.dueDate = body.dueDate || undefined
    if (body.dueTime !== undefined) updatedTodo.dueTime = body.dueTime || undefined
    if (body.canTopolinoHelp !== undefined) updatedTodo.canTopolinoHelp = body.canTopolinoHelp
    if (body.projectId !== undefined) updatedTodo.projectId = body.projectId || undefined
    if (body.estimatedMinutes !== undefined) updatedTodo.estimatedMinutes = body.estimatedMinutes
    if (body.energyLevel !== undefined) updatedTodo.energyLevel = body.energyLevel
    if (body.tags !== undefined) updatedTodo.tags = body.tags
    if (body.subtasks !== undefined) updatedTodo.subtasks = body.subtasks
    if (body.notes !== undefined) updatedTodo.notes = body.notes?.trim() || undefined

    if (body.priority !== undefined) {
      updatedTodo.priority = Math.min(5, Math.max(1, Math.floor(body.priority))) as Todo["priority"]
    }

    if (body.status !== undefined) {
      const validStatuses = ["incomplete", "in_progress", "completed"]
      if (validStatuses.includes(body.status)) {
        updatedTodo.status = body.status as Todo["status"]
        updatedTodo.completedAt = updatedTodo.status === "completed" ? now : undefined
      }
    }

    await upsertTodoRow(sql, user.userId, updatedTodo)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["todos"], now)

    return NextResponse.json({
      ...updatedTodo,
      urgency: calculateUrgency(updatedTodo.dueDate),
    })
  } catch (error) {
    console.error("Failed to update todo:", error)
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/todos/:id
 * Scope delete_items (off by default), like every delete an assistant can make.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authorizeIntegration(request, "delete_items")
  if (user instanceof NextResponse) return user

  const { id } = await params
  const now = new Date().toISOString()

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)

    const existing = await getTodoRow(sql, user.userId, id)
    if (!existing) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    await deleteTodoRow(sql, user.userId, id)
    await sql`
      UPDATE habit_users
      SET data = jsonb_set(
            COALESCE(data, '{}'::jsonb),
            '{todoTombstones}',
            COALESCE(data->'todoTombstones', '{}'::jsonb) || jsonb_build_object(${id}::text, ${now}::text),
            true
          ),
          updated_at = NOW()
      WHERE id = ${user.userId}
    `
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["todos"], now)

    return NextResponse.json({ success: true, deletedAt: now })
  } catch (error) {
    console.error("Failed to delete todo:", error)
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}
