import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName, forwardRequest } from "@/lib/habits/api/find-item"
import { spokenEventTime } from "@/lib/habits/api/event-say"
import { upcomingEvents } from "@/lib/habits/api/events"
import { userTimeZone } from "@/lib/habits/api/time-zone"
import { PUT as putEvent } from "@/app/api/v1/calendar/[id]/route"

/**
 * POST /api/v1/calendar/update
 * Body: { event: "<title as said>", title?, startsAt?, endsAt?, durationMinutes?, location?, notes?, tags? }
 *
 * Moves or edits an event by name (update_event): "move the dentist to
 * Friday at 10". Upcoming events are matched first. Moving keeps the length
 * unless endsAt or durationMinutes is given.
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

  const events = user.data.calendarEvents ?? []
  const found = findItemByName(events, body.event, (e) => e.title, "event", upcomingEvents(events))
  if (found instanceof NextResponse) return found
  const event = found

  const patch = { ...body }
  delete patch.event
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to change: send title, startsAt, endsAt, durationMinutes, location, notes or tags" }, { status: 400 })
  }
  const response = await putEvent(forwardRequest(request, `/api/v1/calendar/${event.id}`, "PUT", patch), { params: Promise.resolve({ id: event.id }) })
  if (!response.ok) return response
  const updated = await response.json()
  return NextResponse.json({ ...updated, say: `Updated ${updated.title}: ${spokenEventTime(updated, userTimeZone(request, user.data))}.` })
}
