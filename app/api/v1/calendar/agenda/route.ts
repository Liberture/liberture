import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { filterCalendarEvents } from "@/lib/habits/calendar-utils"
import { userTimeZone, userToday, zonedToUtc } from "@/lib/habits/api/time-zone"

/**
 * The agenda window. With no `start` it begins at midnight of the user's
 * today in their saved zone, not the server's (UTC) midnight. A `start` or
 * `end` without an offset is wall time in that zone too.
 */
function range(request: Request, timeZone: string | undefined, today: string): { start: string; end: string } | { error: string } {
  const { searchParams } = new URL(request.url)
  const days = Math.min(30, Math.max(1, Number(searchParams.get("days") ?? 7) || 7))
  const rawStart = searchParams.get("start")
  const start = new Date(rawStart ? zonedToUtc(rawStart, timeZone) : zonedToUtc(`${today}T00:00`, timeZone))
  if (Number.isNaN(start.getTime())) return { error: "start must be a valid ISO timestamp" }
  const rawEnd = searchParams.get("end")
  const end = rawEnd ? new Date(zonedToUtc(rawEnd, timeZone)) : new Date(start.getTime() + days * 24 * 60 * 60_000)
  if (Number.isNaN(end.getTime())) return { error: "end must be a valid ISO timestamp" }
  if (end <= start) return { error: "end must be after start" }
  return { start: start.toISOString(), end: end.toISOString() }
}

/** GET /api/v1/calendar/agenda */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const timeZone = userTimeZone(request, user.data)
  const agendaRange = range(request, timeZone, userToday(request, user.data))
  if ("error" in agendaRange) {
    return NextResponse.json({ error: agendaRange.error }, { status: 400 })
  }

  const events = filterCalendarEvents(user.data.calendarEvents ?? [], agendaRange)
  const activeTodos = [...(user.data.todos ?? [])]
    .filter((todo) => todo.status === "in_progress" || todo.status === "incomplete")
    .sort((a, b) => b.priority - a.priority || (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"))

  return NextResponse.json({
    start: agendaRange.start,
    end: agendaRange.end,
    events,
    focusTodos: activeTodos.filter((todo) => todo.status === "in_progress").slice(0, 10),
    nextTodos: activeTodos.filter((todo) => todo.status === "incomplete").slice(0, 10),
  })
}
