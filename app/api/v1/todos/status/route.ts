import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { resolveByName, spokenList } from "@/lib/habits/api/resolve"
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
  if (typeof body.todo !== "string" || !body.todo.trim()) {
    return NextResponse.json({ error: "todo (its title or id) is required" }, { status: 400 })
  }

  const todos = user.data.todos ?? []
  const pool = todos.filter((t) => (status === "incomplete" ? t.status === "completed" : t.status !== "completed"))
  const resolved = resolveByName(pool.length ? pool : todos, body.todo, (t) => t.title)
  if (resolved.kind !== "match") {
    const names = resolved.options.slice(0, 5).map((t) => t.title)
    return NextResponse.json(
      resolved.kind === "ambiguous"
        ? { error: "More than one todo matches", code: "ambiguous", options: names, say: `Which one: ${spokenList(names)}?` }
        : { error: "No todo matches", code: "not_found", options: names, say: "I can't find that todo." },
      { status: resolved.kind === "ambiguous" ? 409 : 404 }
    )
  }

  const todo = resolved.item
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
