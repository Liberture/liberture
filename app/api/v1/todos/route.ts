import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { Todo } from "@/lib/habits/types"
import { parseISO } from "date-fns"
import {
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
  upsertTodoRow,
} from "@/lib/habits/optimized-storage"
import crypto from "crypto"
import { paginate, wantsPage } from "@/lib/habits/api/paginate"
import { userToday } from "@/lib/habits/api/time-zone"
import { normalizeSubtasks, normalizeTags, projectIdFromName } from "@/lib/habits/api/todo-fields"
import { todoUrgency } from "@/lib/habits/api/todo-urgency"


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
 *   - project: a project's name, as the user said it
 *   - limit / cursor: page through the list; the response is then
 *     { todos, nextCursor, total } instead of a bare array
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get("status") ?? "all"
  const sortBy = searchParams.get("sort") ?? "created"
  const overdueOnly = searchParams.get("overdue") === "true"
  let projectId = searchParams.get("projectId")
  const today = userToday(request, user.data)

  if (!projectId && searchParams.get("project")) {
    const project = await projectIdFromName(user.userId, user.data, searchParams.get("project"), { create: false })
    if (project instanceof NextResponse) return project
    projectId = project.id
  }

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)

    const rows = await sql`
      SELECT body
      FROM habit_todos todo
      WHERE todo.user_id = ${user.userId}
        AND (${statusFilter} != 'pending' OR todo.status IN ('incomplete', 'in_progress'))
        AND (${statusFilter} != 'completed' OR todo.status = 'completed')
        AND (${overdueOnly} = false OR (todo.due_date IS NOT NULL AND todo.due_date < ${today}::date))
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

    const todos = rows.map((row) => {
      const todo = row.body as Todo
      return { ...todo, urgency: todoUrgency(todo, userToday(request, user.data)) }
    })
    if (!wantsPage(searchParams)) return NextResponse.json(todos)
    const page = paginate(todos, searchParams.get("limit") ?? undefined, searchParams.get("cursor") ?? undefined)
    if ("error" in page) return NextResponse.json({ error: page.error }, { status: 400 })
    return NextResponse.json({ todos: page.items, nextCursor: page.nextCursor, total: page.total })
  } catch (error) {
    console.error("Failed to list todos:", error)
    return NextResponse.json({ error: "Failed to list todos" }, { status: 500 })
  }
}

/**
 * POST /api/v1/todos
 * Body: { title, description?, dueDate?, dueTime?, priority?, status?, canTopolinoHelp?, projectId?,
 *   project? (a name; created if new), estimatedMinutes?, energyLevel?, tags?, subtasks? (strings ok), notes? }
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
    project?: string
    estimatedMinutes?: number
    energyLevel?: "low" | "medium" | "high"
    tags?: string[]
    subtasks?: unknown
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

  let resolvedProjectId = projectId
  let projectSay = ""
  if (!projectId && body.project) {
    const project = await projectIdFromName(user.userId, user.data, body.project, { create: true })
    if (project instanceof NextResponse) return project
    resolvedProjectId = project.id
    projectSay = project.created ? ` in a new project, ${project.name}` : ` in ${project.name}`
  }
  const cleanSubtasks = normalizeSubtasks(subtasks)
  if (cleanSubtasks === null) {
    return NextResponse.json({ error: "subtasks must be a list of strings or { title } objects" }, { status: 400 })
  }
  if (energyLevel !== undefined && !["low", "medium", "high"].includes(energyLevel)) {
    return NextResponse.json({ error: "energyLevel must be low, medium or high" }, { status: 400 })
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
    projectId: resolvedProjectId,
    estimatedMinutes: typeof estimatedMinutes === "number" && estimatedMinutes > 0 ? Math.round(estimatedMinutes) : undefined,
    energyLevel,
    tags: normalizeTags(tags),
    subtasks: cleanSubtasks,
    notes: notes?.trim() || undefined,
  }

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    await upsertTodoRow(sql, user.userId, newTodo)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["todos"], now)

    return NextResponse.json({
      ...newTodo,
      urgency: todoUrgency(newTodo, userToday(request, user.data)),
      say: `Added: ${newTodo.title}${projectSay}${newTodo.dueDate ? `, due ${spokenDate(newTodo.dueDate)}` : ""}.`,
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}
