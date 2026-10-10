import type { CalendarEvent, StorageData } from "./types"

export type CalendarEventTombstones = NonNullable<StorageData["calendarEventTombstones"]>

export interface CalendarEventDraft {
  title: string
  startsAt: string
  endsAt: string
  location?: string
  notes?: string
  tags?: string[]
  todoId?: string
}

export interface CalendarRange {
  start?: string
  end?: string
  tag?: string
  todoId?: string
}

type CalendarInputObject = Record<string, unknown>

function isObject(value: unknown): value is CalendarInputObject {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined
}

function stringFromInput(value: unknown): string | undefined {
  if (value === null) return ""
  return typeof value === "string" ? value.trim() : undefined
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parsePositiveMinutes(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined
  const minutes = Math.floor(value)
  return minutes > 0 ? minutes : undefined
}

export function normalizeCalendarTags(value: unknown): string[] {
  const rawTags = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : []
  return Array.from(
    new Set(
      rawTags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean),
    ),
  )
}

export function getCalendarEventSyncTimestamp(event: Pick<CalendarEvent, "createdAt" | "updatedAt">): string {
  return [event.createdAt, event.updatedAt]
    .filter(isTimestamp)
    .reduce((latest, timestamp) => (timestamp > latest ? timestamp : latest), "")
}

export function mergeCalendarEventTombstones(
  clientTombstones?: CalendarEventTombstones,
  serverTombstones?: CalendarEventTombstones,
): CalendarEventTombstones {
  const merged: CalendarEventTombstones = {}

  for (const tombstones of [clientTombstones, serverTombstones]) {
    for (const [id, deletedAt] of Object.entries(tombstones ?? {})) {
      if (!isTimestamp(deletedAt)) continue
      if (!merged[id] || deletedAt > merged[id]) {
        merged[id] = deletedAt
      }
    }
  }

  return merged
}

interface MergeCalendarEventsOptions {
  clientEvents?: StorageData["calendarEvents"]
  serverEvents?: StorageData["calendarEvents"]
  clientLastUpdated?: string
  clientTombstones?: CalendarEventTombstones
  serverTombstones?: CalendarEventTombstones
}

export interface MergeCalendarEventsResult {
  calendarEvents: StorageData["calendarEvents"]
  calendarEventTombstones: CalendarEventTombstones
}

function wasDeletedAfterClientSync(deletedAt: string | undefined, clientLastUpdated: string | undefined): boolean {
  return isTimestamp(deletedAt) && (!isTimestamp(clientLastUpdated) || deletedAt > clientLastUpdated)
}

function tombstoneWins(event: CalendarEvent, tombstones: CalendarEventTombstones): boolean {
  const deletedAt = tombstones[event.id]
  return isTimestamp(deletedAt) && deletedAt >= getCalendarEventSyncTimestamp(event)
}

export function mergeCalendarEvents({
  clientEvents,
  serverEvents,
  clientLastUpdated,
  clientTombstones,
  serverTombstones,
}: MergeCalendarEventsOptions): MergeCalendarEventsResult {
  const calendarEventTombstones = mergeCalendarEventTombstones(clientTombstones, serverTombstones)
  const merged = new Map<string, CalendarEvent>()

  for (const event of clientEvents ?? []) {
    const deletedAt = calendarEventTombstones[event.id]

    if (wasDeletedAfterClientSync(deletedAt, clientLastUpdated) || tombstoneWins(event, calendarEventTombstones)) {
      continue
    }

    const existing = merged.get(event.id)
    if (!existing || getCalendarEventSyncTimestamp(event) > getCalendarEventSyncTimestamp(existing)) {
      merged.set(event.id, event)
    }
  }

  for (const event of serverEvents ?? []) {
    const serverTime = getCalendarEventSyncTimestamp(event)

    if (tombstoneWins(event, calendarEventTombstones)) {
      merged.delete(event.id)
      continue
    }

    const existing = merged.get(event.id)

    if (!existing) {
      if (!isTimestamp(clientLastUpdated) || serverTime > clientLastUpdated) {
        merged.set(event.id, event)
      }
      continue
    }

    if (serverTime > getCalendarEventSyncTimestamp(existing)) {
      merged.set(event.id, event)
    }
  }

  return {
    calendarEvents: Array.from(merged.values()).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    calendarEventTombstones,
  }
}

interface BuildCalendarEventOptions {
  fallbackTitle?: string
  fallbackDurationMinutes?: number
  fallbackNotes?: string
  fallbackTags?: string[]
  fallbackTodoId?: string
}

export function buildCalendarEventDraft(
  input: unknown,
  options: BuildCalendarEventOptions = {},
): { event: CalendarEventDraft } | { error: string } {
  if (!isObject(input)) {
    return { error: "JSON body must be an object" }
  }

  const title = optionalString(input.title) || options.fallbackTitle
  if (!title) {
    return { error: "title is required" }
  }

  const start = parseDate(input.startsAt ?? input.start)
  if (!start) {
    return { error: "startsAt is required and must be a valid ISO timestamp" }
  }

  const durationMinutes = parsePositiveMinutes(input.durationMinutes) ?? options.fallbackDurationMinutes ?? 60
  const end = parseDate(input.endsAt ?? input.end) ?? new Date(start.getTime() + durationMinutes * 60_000)

  if (end <= start) {
    return { error: "endsAt must be after startsAt" }
  }

  const location = optionalString(input.location)
  const notes = optionalString(input.notes) ?? options.fallbackNotes
  const tags = input.tags === undefined ? options.fallbackTags ?? [] : normalizeCalendarTags(input.tags)
  const todoId = optionalString(input.todoId) ?? options.fallbackTodoId

  return {
    event: {
      title,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      location: location || undefined,
      notes: notes || undefined,
      tags,
      todoId: todoId || undefined,
    },
  }
}

export function buildCalendarEventPatch(
  existing: CalendarEvent,
  input: unknown,
  now: string,
): { patch: Partial<CalendarEvent>; updatedEvent: CalendarEvent } | { error: string } {
  if (!isObject(input)) {
    return { error: "JSON body must be an object" }
  }

  const patch: Partial<CalendarEvent> = { updatedAt: now }
  const existingStart = parseDate(existing.startsAt)
  const existingEnd = parseDate(existing.endsAt)
  const existingDurationMs = existingStart && existingEnd ? existingEnd.getTime() - existingStart.getTime() : 60 * 60_000

  if (input.title !== undefined) {
    const title = optionalString(input.title)
    if (!title) return { error: "title must not be empty" }
    patch.title = title
  }

  const nextStart = input.startsAt !== undefined || input.start !== undefined
    ? parseDate(input.startsAt ?? input.start)
    : parseDate(existing.startsAt)
  if (!nextStart) return { error: "startsAt must be a valid ISO timestamp" }

  let nextEnd = input.endsAt !== undefined || input.end !== undefined
    ? parseDate(input.endsAt ?? input.end)
    : parseDate(existing.endsAt)

  const durationMinutes = parsePositiveMinutes(input.durationMinutes)
  if (durationMinutes) {
    nextEnd = new Date(nextStart.getTime() + durationMinutes * 60_000)
  } else if ((input.startsAt !== undefined || input.start !== undefined) && input.endsAt === undefined && input.end === undefined) {
    nextEnd = new Date(nextStart.getTime() + Math.max(existingDurationMs, 60_000))
  }

  if (!nextEnd) return { error: "endsAt must be a valid ISO timestamp" }
  if (nextEnd <= nextStart) return { error: "endsAt must be after startsAt" }

  const startChanged = input.startsAt !== undefined || input.start !== undefined
  if (startChanged) patch.startsAt = nextStart.toISOString()
  // A move with no new end keeps the length: the end computed above has to be
  // written too, or the old end stays and the event runs backwards.
  if (startChanged || input.endsAt !== undefined || input.end !== undefined || input.durationMinutes !== undefined) {
    patch.endsAt = nextEnd.toISOString()
  }

  if (input.location !== undefined) patch.location = stringFromInput(input.location)
  if (input.notes !== undefined) patch.notes = stringFromInput(input.notes)
  if (input.tags !== undefined) patch.tags = normalizeCalendarTags(input.tags)
  if (input.todoId !== undefined) patch.todoId = stringFromInput(input.todoId)

  return {
    patch,
    updatedEvent: {
      ...existing,
      ...patch,
      updatedAt: now,
    },
  }
}

export function filterCalendarEvents(events: CalendarEvent[], range: CalendarRange): CalendarEvent[] {
  const start = parseDate(range.start)
  const end = parseDate(range.end)
  const tag = range.tag?.trim()
  const todoId = range.todoId?.trim()

  return [...events]
    .filter((event) => {
      const eventStart = parseDate(event.startsAt)
      const eventEnd = parseDate(event.endsAt)
      if (!eventStart || !eventEnd) return false
      if (start && eventEnd <= start) return false
      if (end && eventStart >= end) return false
      if (tag && !(event.tags ?? []).includes(tag)) return false
      if (todoId && event.todoId !== todoId) return false
      return true
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function foldIcsLine(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= 75) return line

  const lines: string[] = []
  let current = ""

  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > 75) {
      lines.push(current)
      current = " " + char
    } else {
      current += char
    }
  }

  lines.push(current)
  return lines.join("\r\n")
}

function toUtcStamp(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

export function createIcsCalendar(events: CalendarEvent[], generatedAt = new Date()): string {
  const generated = generatedAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Habit Tracker//Integrated Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  for (const event of events) {
    const description = [event.notes, event.todoId ? `Todo: ${event.todoId}` : ""].filter(Boolean).join("\n")

    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscape(event.id)}@habit-tracker-calendar`,
      `DTSTAMP:${generated}`,
      `DTSTART:${toUtcStamp(event.startsAt)}`,
      `DTEND:${toUtcStamp(event.endsAt)}`,
      `SUMMARY:${icsEscape(event.title)}`,
    )

    if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`)
    if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`)
    if (event.tags?.length) lines.push(`CATEGORIES:${icsEscape(event.tags.join(","))}`)

    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.map(foldIcsLine).join("\r\n") + "\r\n"
}
