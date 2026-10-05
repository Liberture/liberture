import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { createIcsCalendar, filterCalendarEvents } from "@/lib/habits/calendar-utils"

function range(request: Request): { start: string; end: string } | { error: string } {
  const { searchParams } = new URL(request.url)
  const days = Math.min(366, Math.max(1, Number(searchParams.get("days") ?? 365) || 365))
  const start = searchParams.get("start") ? new Date(searchParams.get("start")!) : new Date(Date.now() - 30 * 24 * 60 * 60_000)
  if (Number.isNaN(start.getTime())) return { error: "start must be a valid ISO timestamp" }
  const end = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date(start.getTime() + days * 24 * 60 * 60_000)
  if (Number.isNaN(end.getTime())) return { error: "end must be a valid ISO timestamp" }
  if (end <= start) return { error: "end must be after start" }
  return { start: start.toISOString(), end: end.toISOString() }
}

/** GET /api/v1/calendar/ics */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const calendarRange = range(request)
  if ("error" in calendarRange) {
    return NextResponse.json({ error: calendarRange.error }, { status: 400 })
  }

  const events = filterCalendarEvents(user.data.calendarEvents ?? [], calendarRange)
  return new Response(createIcsCalendar(events), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="habit-tracker-calendar.ics"',
      "Content-Type": "text/calendar; charset=utf-8",
    },
  })
}
