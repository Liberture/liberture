import { dateForRequest } from "@/lib/habits/date-utils"
import type { StorageData } from "@/lib/habits/types"

/**
 * Which zone "today" and "3pm" mean for an assistant request. Order: what the
 * request says (tz arg, X-Time-Zone), then the zone the user saved in the app
 * (preferences.timeZone), then the server's configured zone. The saved zone is
 * what makes a bare "what's on today" right for someone far from the server.
 */

export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

function headerTimeZone(request: Request): string | null {
  return request.headers.get("x-time-zone") || request.headers.get("x-timezone")
}

export function userTimeZone(request: Request, data: StorageData | null | undefined, explicit?: unknown): string | undefined {
  if (isTimeZone(explicit)) return explicit
  const header = headerTimeZone(request)
  if (isTimeZone(header)) return header
  const saved = data?.preferences?.timeZone
  if (isTimeZone(saved)) return saved
  return process.env.HABIT_TRACKER_TIME_ZONE || undefined
}

/** dateForRequest, with the user's saved zone as the fallback before the server's. */
export function userToday(request: Request, data: StorageData | null | undefined, explicitDate?: unknown, explicitTimeZone?: unknown): string {
  const requested = (typeof explicitTimeZone === "string" && explicitTimeZone) || headerTimeZone(request)
  return dateForRequest(request, explicitDate, requested || data?.preferences?.timeZone)
}

/** Milliseconds the zone is ahead of UTC at that instant. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant))
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const asUtc = Date.UTC(Number(v.year), Number(v.month) - 1, Number(v.day), Number(v.hour), Number(v.minute), Number(v.second))
  return asUtc - Math.floor(instant / 1000) * 1000
}

const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2}(\.\d+)?)?$/

/**
 * "2026-10-09T15:00" (no offset) read as wall time in `timeZone`, as an ISO
 * UTC string. Anything with an offset, or unreadable, is returned unchanged,
 * so the existing validation reports it.
 */
export function zonedToUtc(value: string, timeZone: string | undefined): string {
  const m = value.trim().match(LOCAL_DATE_TIME)
  if (!m || !isTimeZone(timeZone)) return value
  const guess = Date.parse(`${m[1]}T${m[2]}${m[3] ?? ":00"}Z`)
  if (Number.isNaN(guess)) return value
  let instant = guess - zoneOffsetMs(guess, timeZone)
  // Across a DST change the offset at the guess and at the answer differ.
  const second = zoneOffsetMs(instant, timeZone)
  instant = guess - second
  return new Date(instant).toISOString()
}

/** Calendar bodies: startsAt/start/endsAt/end without an offset mean the user's wall time. */
export function withZonedTimes<T>(body: T, timeZone: string | undefined): T {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body
  const next = { ...(body as Record<string, unknown>) }
  for (const key of ["startsAt", "start", "endsAt", "end"]) {
    if (typeof next[key] === "string") next[key] = zonedToUtc(next[key] as string, timeZone)
  }
  return next as T
}
