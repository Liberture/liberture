import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName, forwardRequest } from "@/lib/habits/api/find-item"
import { DELETE as deleteTodo } from "@/app/api/v1/todos/[id]/route"

/**
 * POST /api/v1/todos/delete — body { todo: "<title as said>" } (delete_todo).
 * Scope delete_items, OFF by default; finishing a todo is set_todo_status.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "delete_items")
  if (user instanceof NextResponse) return user

  let body: { todo?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const todos = user.data.todos ?? []
  const found = findItemByName(todos, body.todo, (t) => t.title, "todo", todos.filter((t) => t.status !== "completed"))
  if (found instanceof NextResponse) return found
  const todo = found

  const response = await deleteTodo(forwardRequest(request, `/api/v1/todos/${todo.id}`, "DELETE"), { params: Promise.resolve({ id: todo.id }) })
  if (!response.ok) return response
  return NextResponse.json({ ...(await response.json()), deleted: { id: todo.id, title: todo.title }, say: `Deleted ${todo.title}.` })
}
