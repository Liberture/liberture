import type { CalendarEvent } from "@/lib/habits/types"

/** Events that haven't ended, soonest first: what "the dentist" most likely means. */
export function upcomingEvents(events: CalendarEvent[], now = Date.now()): CalendarEvent[] {
  return events
    .filter((e) => Date.parse(e.endsAt) >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}
