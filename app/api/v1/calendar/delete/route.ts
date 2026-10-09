import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName, forwardRequest } from "@/lib/habits/api/find-item"
import { upcomingEvents } from "@/lib/habits/api/events"
import { DELETE as deleteEvent } from "@/app/api/v1/calendar/[id]/route"

/**
 * POST /api/v1/calendar/delete — body { event: "<title as said>" } (delete_event).
 * Scope delete_items, OFF by default. Upcoming events are matched first.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "delete_items")
  if (user instanceof NextResponse) return user

  let body: { event?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const events = user.data.calendarEvents ?? []
  const found = findItemByName(events, body.event, (e) => e.title, "event", upcomingEvents(events))
  if (found instanceof NextResponse) return found
  const event = found

  const response = await deleteEvent(forwardRequest(request, `/api/v1/calendar/${event.id}`, "DELETE"), { params: Promise.resolve({ id: event.id }) })
  if (!response.ok) return response
  return NextResponse.json({ ...(await response.json()), deleted: { id: event.id, title: event.title }, say: `Deleted ${event.title}.` })
}
