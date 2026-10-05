import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { CalendarEvent } from "@/lib/habits/types"
import { buildCalendarEventPatch } from "@/lib/habits/calendar-utils"

/** GET /api/v1/calendar/:id */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { id } = await params
  const event = (user.data.calendarEvents ?? []).find((item) => item.id === id)
  if (!event) {
    return NextResponse.json({ error: "Calendar event not found" }, { status: 404 })
  }

  return NextResponse.json(event)
}

/** PUT /api/v1/calendar/:id */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authorizeIntegration(request, "calendar")
  if (user instanceof NextResponse) return user

  const { id } = await params
  const existing = (user.data.calendarEvents ?? []).find((item) => item.id === id)
  if (!existing) {
    return NextResponse.json({ error: "Calendar event not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const patchResult = buildCalendarEventPatch(existing, body, now)
  if ("error" in patchResult) {
    return NextResponse.json({ error: patchResult.error }, { status: 400 })
  }

  const patchJson = JSON.stringify(patchResult.patch)

  try {
    const sql = getDb()
    const result = await sql`
      UPDATE habit_users
      SET
        data = jsonb_set(
          jsonb_set(
            data,
            '{calendarEvents}',
            (
              SELECT COALESCE(jsonb_agg(
                CASE WHEN event->>'id' = ${id}
                  THEN event || ${patchJson}::jsonb
                  ELSE event
                END
              ), '[]'::jsonb)
              FROM jsonb_array_elements(COALESCE(data->'calendarEvents', '[]'::jsonb)) AS event
            )
          ),
          '{lastUpdated}',
          to_jsonb(${now}::text)
        ),
        updated_at = NOW()
      WHERE api_key = ${user.apiKey}
      RETURNING data
    `

    if (!result.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedEvent = (result[0].data.calendarEvents as CalendarEvent[] | undefined)?.find((item) => item.id === id)
    return NextResponse.json(updatedEvent ?? patchResult.updatedEvent)
  } catch (error) {
    console.error("Failed to update calendar event:", error)
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 })
  }
}

/** DELETE /api/v1/calendar/:id */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authorizeIntegration(request, "calendar")
  if (user instanceof NextResponse) return user

  const { id } = await params
  const existing = (user.data.calendarEvents ?? []).find((item) => item.id === id)
  if (!existing) {
    return NextResponse.json({ error: "Calendar event not found" }, { status: 404 })
  }

  const now = new Date().toISOString()

  try {
    const sql = getDb()
    await sql`
      UPDATE habit_users
      SET
        data = jsonb_set(
          jsonb_set(
            jsonb_set(
              data,
              '{calendarEvents}',
              COALESCE(
                (SELECT jsonb_agg(event)
                 FROM jsonb_array_elements(COALESCE(data->'calendarEvents', '[]'::jsonb)) AS event
                 WHERE event->>'id' != ${id}),
                '[]'::jsonb
              )
            ),
            '{calendarEventTombstones}',
            COALESCE(data->'calendarEventTombstones', '{}'::jsonb) || jsonb_build_object(${id}::text, ${now}::text)
          ),
          '{lastUpdated}',
          to_jsonb(${now}::text)
        ),
        updated_at = NOW()
      WHERE api_key = ${user.apiKey}
    `

    return NextResponse.json({ success: true, deletedAt: now })
  } catch (error) {
    console.error("Failed to delete calendar event:", error)
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 })
  }
}
