import type { CalendarEvent, StorageData } from "./types"

export type CalendarEventTombstones = NonNullable<StorageData["calendarEventTombstones"]>

type TimestampedCalendarEvent = Pick<CalendarEvent, "id" | "createdAt" | "updatedAt">

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

export function getCalendarEventSyncTimestamp(event: TimestampedCalendarEvent): string {
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
