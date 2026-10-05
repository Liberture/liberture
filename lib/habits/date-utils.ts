const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export function isDateOnlyString(value: unknown): value is string {
  return typeof value === "string" && DATE_ONLY_RE.test(value)
}

export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateOnly(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDateInTimeZone(date: Date = new Date(), timeZone?: string | null): string {
  if (!timeZone) return formatDateOnly(date)

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)

    const values = new Map(parts.map((part) => [part.type, part.value]))
    const year = values.get("year")
    const month = values.get("month")
    const day = values.get("day")

    if (year && month && day) {
      return `${year}-${month}-${day}`
    }
  } catch {
    // Fall through to the process-local date if the timezone is invalid.
  }

  return formatDateOnly(date)
}

function configuredTimeZone(): string | undefined {
  if (typeof process === "undefined") return undefined
  return process.env.HABIT_TRACKER_TIME_ZONE
}

export function dateForRequest(
  request: Request,
  explicitDate?: unknown,
  explicitTimeZone?: unknown
): string {
  if (isDateOnlyString(explicitDate)) return explicitDate

  const headerDate = request.headers.get("x-local-date")
  if (isDateOnlyString(headerDate)) return headerDate

  const timeZone =
    (typeof explicitTimeZone === "string" && explicitTimeZone) ||
    request.headers.get("x-time-zone") ||
    request.headers.get("x-timezone") ||
    configuredTimeZone()

  return formatDateInTimeZone(new Date(), timeZone)
}
