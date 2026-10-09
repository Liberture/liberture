import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName, forwardRequest } from "@/lib/habits/api/find-item"
import { spokenEventTime } from "@/lib/habits/api/event-say"
import { userTimeZone } from "@/lib/habits/api/time-zone"
import { POST as scheduleTodo } from "@/app/api/v1/todos/[id]/schedule/route"

/**
 * POST /api/v1/todos/schedule
 * Body: { todo: "<title as said>", startsAt, durationMinutes?, endsAt?, location?, notes? }
 *
 * Blocks time for a todo on the calendar, by name (schedule_todo). Times
 * without an offset are the user's local time.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "calendar")
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

  const rest = { ...body }
  delete rest.todo
  const response = await scheduleTodo(forwardRequest(request, `/api/v1/todos/${todo.id}/schedule`, "POST", rest), {
    params: Promise.resolve({ id: todo.id }),
  })
  if (!response.ok) return response
  const event = await response.json()
  return NextResponse.json({ ...event, say: `Blocked ${spokenEventTime(event, userTimeZone(request, user.data))} for ${todo.title}.` })
}
