import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName, forwardRequest } from "@/lib/habits/api/find-item"
import { normalizeSubtasks, normalizeTags, projectIdFromName } from "@/lib/habits/api/todo-fields"
import { PUT as putTodo } from "@/app/api/v1/todos/[id]/route"

const FIELDS = ["title", "description", "dueDate", "dueTime", "priority", "notes", "estimatedMinutes", "energyLevel"] as const
const CLEARABLE: ReadonlySet<string> = new Set(["description", "dueDate", "dueTime", "notes", "energyLevel"])

/**
 * POST /api/v1/todos/update
 * Body: { todo: "<title as said>", title?, description?, dueDate?, dueTime?, priority?, project?, tags?,
 *   subtasks?, notes?, estimatedMinutes?, energyLevel? }
 *
 * PUT /api/v1/todos/:id by name (update_todo): "move the dentist todo to
 * Friday" is one call. project is a name ("" removes it); a new name creates
 * the project. Open todos are matched first.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const todos = user.data.todos ?? []
  const found = findItemByName(todos, body.todo, (t) => t.title, "todo", todos.filter((t) => t.status !== "completed"))
  if (found instanceof NextResponse) return found
  const todo = found

  const patch: Record<string, unknown> = {}
  for (const key of FIELDS) {
    if (body[key] === undefined) continue
    // null clears the optional text fields; it means nothing for the rest.
    if (body[key] === null) {
      if (CLEARABLE.has(key)) patch[key] = ""
      continue
    }
    patch[key] = body[key]
  }
  if (patch.title !== undefined && (typeof patch.title !== "string" || !patch.title.trim())) {
    return NextResponse.json({ error: "title can't be empty" }, { status: 400 })
  }
  if (patch.energyLevel !== undefined && patch.energyLevel !== "" && !["low", "medium", "high"].includes(String(patch.energyLevel))) {
    return NextResponse.json({ error: "energyLevel must be low, medium or high" }, { status: 400 })
  }
  if (patch.energyLevel === "") patch.energyLevel = undefined
  if (body.tags !== undefined) patch.tags = normalizeTags(body.tags) ?? []
  if (body.subtasks !== undefined) {
    const subtasks = normalizeSubtasks(body.subtasks)
    if (!subtasks) return NextResponse.json({ error: "subtasks must be a list of strings or { title } objects" }, { status: 400 })
    patch.subtasks = subtasks
  }
  let projectSay = ""
  if (body.project !== undefined) {
    if (body.project === "" || body.project === null) {
      patch.projectId = ""
      projectSay = "removed from its project"
    } else {
      const project = await projectIdFromName(user.userId, user.data, body.project, { create: true })
      if (project instanceof NextResponse) return project
      patch.projectId = project.id
      projectSay = project.created ? `moved to a new project, ${project.name}` : `moved to ${project.name}`
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to change: send title, dueDate, dueTime, priority, project, tags, subtasks, notes, description, estimatedMinutes or energyLevel" }, { status: 400 })
  }

  const response = await putTodo(forwardRequest(request, `/api/v1/todos/${todo.id}`, "PUT", patch), { params: Promise.resolve({ id: todo.id }) })
  if (!response.ok) return response
  const updated = await response.json()

  const changes: string[] = []
  if (patch.title !== undefined) changes.push(`renamed to ${patch.title}`)
  if (patch.dueDate !== undefined) changes.push(patch.dueDate ? `due ${patch.dueDate}${patch.dueTime ? ` at ${patch.dueTime}` : ""}` : "no due date")
  else if (patch.dueTime !== undefined) changes.push(patch.dueTime ? `at ${patch.dueTime}` : "no time")
  if (patch.priority !== undefined) changes.push(`priority ${updated.priority}`)
  if (projectSay) changes.push(projectSay)
  const rest = Object.keys(patch).filter((k) => !["title", "dueDate", "dueTime", "priority", "projectId"].includes(k))
  if (rest.length) changes.push(`${rest.join(", ")} updated`)
  return NextResponse.json({ ...updated, say: `Updated ${todo.title}: ${changes.join(", ")}.` })
}
