import { NextResponse } from "next/server"
import crypto from "crypto"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { CalendarEvent } from "@/lib/habits/types"
import { buildCalendarEventDraft } from "@/lib/habits/calendar-utils"

/** POST /api/v1/todos/:id/schedule */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authorizeIntegration(request, "calendar")
  if (user instanceof NextResponse) return user

  const { id } = await params
  const todo = (user.data.todos ?? []).find((item) => item.id === id)
  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const draft = buildCalendarEventDraft(body, {
    fallbackTitle: todo.title,
    fallbackDurationMinutes: todo.estimatedMinutes || 60,
    fallbackNotes: todo.notes || todo.description,
    fallbackTags: todo.tags ?? [],
    fallbackTodoId: todo.id,
  })
  if ("error" in draft) {
    return NextResponse.json({ error: draft.error }, { status: 400 })
  }

  const now = new Date().toISOString()
  const event: CalendarEvent = {
    id: crypto.randomUUID(),
    ...draft.event,
    tags: draft.event.tags ?? [],
    todoId: todo.id,
    createdAt: now,
    updatedAt: now,
  }
  const eventJson = JSON.stringify(event)

  try {
    const sql = getDb()
    const result = await sql`
      UPDATE habit_users
      SET
        data = jsonb_set(
          jsonb_set(
            data,
            '{calendarEvents}',
            COALESCE(data->'calendarEvents', '[]'::jsonb) || ${eventJson}::jsonb
          ),
          '{lastUpdated}',
          to_jsonb(${now}::text)
        ),
        updated_at = NOW()
      WHERE api_key = ${user.apiKey}
      RETURNING id
    `

    if (!result.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Failed to schedule todo:", error)
    return NextResponse.json({ error: "Failed to schedule todo" }, { status: 500 })
  }
}
