import { NextResponse } from "next/server"
import crypto from "crypto"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { CalendarEvent } from "@/lib/habits/types"
import { buildCalendarEventDraft, filterCalendarEvents } from "@/lib/habits/calendar-utils"
import { paginate, wantsPage } from "@/lib/habits/api/paginate"
import { spokenEventTime } from "@/lib/habits/api/event-say"
import { userTimeZone, withZonedTimes } from "@/lib/habits/api/time-zone"

function calendarRange(request: Request): { start: string; end: string; tag?: string; todoId?: string } | { error: string } {
  const { searchParams } = new URL(request.url)
  const days = Math.min(366, Math.max(1, Number(searchParams.get("days") ?? 30) || 30))
  const start = searchParams.get("start") ? new Date(searchParams.get("start")!) : new Date()
  if (Number.isNaN(start.getTime())) return { error: "start must be a valid ISO timestamp" }
  if (!searchParams.get("start")) start.setHours(0, 0, 0, 0)

  const end = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date(start.getTime() + days * 24 * 60 * 60_000)
  if (Number.isNaN(end.getTime())) return { error: "end must be a valid ISO timestamp" }
  if (end <= start) return { error: "end must be after start" }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    tag: searchParams.get("tag") ?? undefined,
    todoId: searchParams.get("todoId") ?? undefined,
  }
}

/**
 * GET /api/v1/calendar
 * Query: start?, end?, days?, tag?, todoId?, limit?, cursor?
 * With limit or cursor the response is { events, nextCursor, total }.
 * Auth: Authorization: Bearer hti_...
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const range = calendarRange(request)
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 })
  }

  const events = filterCalendarEvents(user.data.calendarEvents ?? [], range)
  const { searchParams } = new URL(request.url)
  if (!wantsPage(searchParams)) return NextResponse.json(events)
  const page = paginate(events, searchParams.get("limit") ?? undefined, searchParams.get("cursor") ?? undefined)
  if ("error" in page) return NextResponse.json({ error: page.error }, { status: 400 })
  return NextResponse.json({ events: page.items, nextCursor: page.nextCursor, total: page.total })
}

/**
 * POST /api/v1/calendar
 * Body: { title, startsAt|start, endsAt|end?, durationMinutes?, location?, notes?, tags?, todoId? }
 * Times without an offset ("2026-10-09T15:00") are the user's local time.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "calendar")
  if (user instanceof NextResponse) return user

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const timeZone = userTimeZone(request, user.data)
  const draft = buildCalendarEventDraft(withZonedTimes(body, timeZone))
  if ("error" in draft) {
    return NextResponse.json({ error: draft.error }, { status: 400 })
  }

  const now = new Date().toISOString()
  const newEvent: CalendarEvent = {
    id: crypto.randomUUID(),
    ...draft.event,
    tags: draft.event.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }
  const eventJson = JSON.stringify(newEvent)

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

    return NextResponse.json({ ...newEvent, say: `Added ${newEvent.title}, ${spokenEventTime(newEvent, timeZone)}.` }, { status: 201 })
  } catch (error) {
    console.error("Failed to create calendar event:", error)
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
  }
}
