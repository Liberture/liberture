import type { CalendarEvent } from "@/lib/habits/types"

/**
 * "Friday 10 Oct, 15:00 to 16:00" in the user's zone, for the `say` of the
 * calendar write tools. Falls back to the server's zone when none is known.
 */
export function spokenEventTime(event: Pick<CalendarEvent, "startsAt" | "endsAt">, timeZone: string | undefined): string {
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)
  if (Number.isNaN(start.getTime())) return "that time"
  const zone = timeZone ? { timeZone } : {}
  const day = start.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", ...zone })
  const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, ...zone })
  return Number.isNaN(end.getTime()) ? `${day}, ${time(start)}` : `${day}, ${time(start)} to ${time(end)}`
}
