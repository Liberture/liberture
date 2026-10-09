import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName } from "@/lib/habits/api/find-item"
import { PATCH as patchTodoStatus } from "@/app/api/v1/todos/[id]/status/route"

const STATUSES = ["incomplete", "in_progress", "completed"] as const
type Status = (typeof STATUSES)[number]

/**
 * POST /api/v1/todos/status
 * Body: { todo: string, status?: "completed" | "in_progress" | "incomplete" }
 *
 * Same as PATCH /api/v1/todos/:id/status, but `todo` can be what the user
 * called it ("the bank call"), so "I called the bank" is one assistant call.
 * Completing looks among open todos; reopening among finished ones.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  let body: { todo?: unknown; status?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const status: Status = STATUSES.includes(body.status as Status) ? (body.status as Status) : "completed"

  // Completing looks among open todos first, reopening among finished ones;
  // anything else (an exact id, a todo already in that state) falls back to
  // all todos instead of answering "not found".
  const todos = user.data.todos ?? []
  const preferred = todos.filter((t) => (status === "incomplete" ? t.status === "completed" : t.status !== "completed"))
  const found = findItemByName(todos, body.todo, (t) => t.title, "todo", preferred)
  if (found instanceof NextResponse) return found
  const todo = found

  if (todo.status === status) {
    const say =
      status === "completed" ? `${todo.title} was already done.` : status === "in_progress" ? `${todo.title} is already in progress.` : `${todo.title} is already open.`
    return NextResponse.json({ ...todo, noChange: true, say })
  }

  const forwarded = new Request(new URL(`/api/v1/todos/${todo.id}/status`, request.url), {
    method: "PATCH",
    headers: { Authorization: request.headers.get("Authorization") ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  const response = await patchTodoStatus(forwarded, { params: Promise.resolve({ id: todo.id }) })
  if (!response.ok) return response

  const updated = await response.json()
  const say =
    status === "completed" ? `Done: ${todo.title}.` : status === "in_progress" ? `${todo.title} is in progress.` : `Reopened ${todo.title}.`
  return NextResponse.json({ ...updated, say })
}
