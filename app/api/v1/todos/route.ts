import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { Todo } from "@/lib/habits/types"
import { parseISO, isToday, isTomorrow, isPast, addDays, startOfDay } from "date-fns"
import {
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
  upsertTodoRow,
} from "@/lib/habits/optimized-storage"
import crypto from "crypto"

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

/** "Friday 9 Oct" — short enough to read aloud, unambiguous within the year. */
function spokenDate(date: string): string {
  const d = parseISO(date)
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })
}

/**
 * GET /api/v1/todos
 * Query params:
 *   - status: "pending" (incomplete+in_progress), "completed", "all" (default)
 *   - sort: "deadline", "priority", "created" (default: created DESC)
 *   - overdue: "true" to return only past-due items
 *   - projectId: a project id, or "uncategorized"
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get("status") ?? "all"
  const sortBy = searchParams.get("sort") ?? "created"
  const overdueOnly = searchParams.get("overdue") === "true"
  const projectId = searchParams.get("projectId")

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)

    const rows = await sql`
      SELECT body
      FROM habit_todos todo
      WHERE todo.user_id = ${user.userId}
        AND (${statusFilter} != 'pending' OR todo.status IN ('incomplete', 'in_progress'))
        AND (${statusFilter} != 'completed' OR todo.status = 'completed')
        AND (${overdueOnly} = false OR (todo.due_date IS NOT NULL AND todo.due_date < CURRENT_DATE))
        AND (
          ${projectId}::text IS NULL
          OR (${projectId} = 'uncategorized' AND (
            todo.project_id IS NULL
            OR NOT EXISTS (
              SELECT 1 FROM habit_projects project
              WHERE project.user_id = todo.user_id AND project.id = todo.project_id
            )
          ))
          OR (${projectId} != 'uncategorized' AND todo.project_id = ${projectId})
        )
      ORDER BY
        CASE WHEN ${sortBy} = 'deadline' THEN todo.due_date END ASC NULLS LAST,
        CASE WHEN ${sortBy} = 'priority' THEN todo.priority END DESC,
        todo.created_at DESC,
        todo.id ASC
    `

    return NextResponse.json(rows.map((row) => {
      const todo = row.body as Todo
      return { ...todo, urgency: calculateUrgency(todo.dueDate) }
    }))
  } catch (error) {
    console.error("Failed to list todos:", error)
    return NextResponse.json({ error: "Failed to list todos" }, { status: 500 })
  }
}

/**
 * POST /api/v1/todos
 * Body: { title, description?, dueDate?, dueTime?, priority?, status?, canTopolinoHelp?, projectId? }
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  let body: {
    title?: string
    description?: string
    dueDate?: string
    dueTime?: string
    priority?: number
    status?: string
    canTopolinoHelp?: boolean
    projectId?: string
    estimatedMinutes?: number
    energyLevel?: "low" | "medium" | "high"
    tags?: string[]
    subtasks?: Array<{ id: string; title: string; completed: boolean }>
    notes?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const {
    title, description, dueDate, dueTime, priority, status, canTopolinoHelp,
    projectId, estimatedMinutes, energyLevel, tags, subtasks, notes
  } = body

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  const validPriority = priority !== undefined ? Math.min(5, Math.max(1, Math.floor(priority))) as Todo["priority"] : 3
  const validStatuses = ["incomplete", "in_progress", "completed"]
  const validStatus: Todo["status"] = status && validStatuses.includes(status)
    ? status as Todo["status"]
    : "incomplete"

  const now = new Date().toISOString()
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description?.trim() || undefined,
    dueDate: dueDate || undefined,
    dueTime: dueTime || undefined,
    priority: validPriority,
    status: validStatus,
    createdAt: now,
    updatedAt: now,
    completedAt: validStatus === "completed" ? now : undefined,
    canTopolinoHelp: canTopolinoHelp ?? false,
    projectId,
    estimatedMinutes,
    energyLevel,
    tags,
    subtasks,
    notes: notes?.trim() || undefined,
  }

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    await upsertTodoRow(sql, user.userId, newTodo)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["todos"], now)

    return NextResponse.json({
      ...newTodo,
      urgency: calculateUrgency(newTodo.dueDate),
      say: `Added: ${newTodo.title}${newTodo.dueDate ? `, due ${spokenDate(newTodo.dueDate)}` : ""}.`,
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}
