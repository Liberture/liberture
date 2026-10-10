import { describe, expect, it } from "vitest"
import { buildCalendarEventPatch } from "@/lib/habits/calendar-utils"
import { todoUrgency } from "@/lib/habits/api/todo-urgency"
import { habitStartDay } from "@/lib/habits/api/time-zone"
import { mergeFieldStamped, stampChangedFields } from "@/lib/habits/habit-sync"
import type { CalendarEvent, UserPreferences } from "@/lib/habits/types"

/** Regressions from the 39-tool MCP validation run (2026-10-09). */

describe("update_event keeps the length when only the start moves", () => {
  const event: CalendarEvent = {
    id: "e1",
    title: "Test",
    startsAt: "2026-10-10T13:00:00.000Z",
    endsAt: "2026-10-10T13:15:00.000Z",
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
  } as CalendarEvent

  it("writes the new end, 15 minutes after the new start", () => {
    const result = buildCalendarEventPatch(event, { startsAt: "2026-10-10T14:00:00.000Z" }, "2026-10-09T01:00:00.000Z")
    if ("error" in result) throw new Error(result.error)
    expect(result.patch.startsAt).toBe("2026-10-10T14:00:00.000Z")
    expect(result.patch.endsAt).toBe("2026-10-10T14:15:00.000Z")
  })

  it("still rejects an explicit end before the start", () => {
    const result = buildCalendarEventPatch(event, { startsAt: "2026-10-10T14:00:00.000Z", endsAt: "2026-10-10T13:15:00.000Z" }, "now")
    expect(result).toEqual({ error: "endsAt must be after startsAt" })
  })

  it("leaves the times alone when only the title changes", () => {
    const result = buildCalendarEventPatch(event, { title: "Renamed" }, "now")
    if ("error" in result) throw new Error(result.error)
    expect(result.patch.startsAt).toBeUndefined()
    expect(result.patch.endsAt).toBeUndefined()
  })
})

describe("todoUrgency", () => {
  it("is done for a finished todo, however overdue", () => {
    expect(todoUrgency({ dueDate: "2026-10-01", status: "completed" }, "2026-10-09")).toBe("done")
  })

  it("counts days against the user's today, not the server clock", () => {
    const open = { status: "incomplete" as const }
    expect(todoUrgency({ ...open, dueDate: "2026-10-08" }, "2026-10-09")).toBe("overdue")
    expect(todoUrgency({ ...open, dueDate: "2026-10-09" }, "2026-10-09")).toBe("today")
    expect(todoUrgency({ ...open, dueDate: "2026-10-10" }, "2026-10-09")).toBe("tomorrow")
    expect(todoUrgency({ ...open, dueDate: "2026-10-15" }, "2026-10-09")).toBe("this_week")
    expect(todoUrgency({ ...open, dueDate: "2026-10-16" }, "2026-10-09")).toBe("later")
    expect(todoUrgency({ ...open }, "2026-10-09")).toBe("no_date")
  })
})

describe("habitStartDay", () => {
  it("is the creation day in the user's zone, not the UTC day", () => {
    // 21:13 in Buenos Aires is 00:13 UTC the next day.
    expect(habitStartDay({ createdAt: "2026-10-10T00:13:00.000Z" }, "America/Argentina/Buenos_Aires")).toBe("2026-10-09")
  })

  it("prefers an earlier startDate (backfilled days) and agrees between tools", () => {
    expect(habitStartDay({ createdAt: "2026-10-10T00:13:00.000Z", startDate: "2026-10-05" }, "America/Argentina/Buenos_Aires")).toBe("2026-10-05")
    expect(habitStartDay({ createdAt: "2026-10-10T00:13:00.000Z", startDate: "2026-10-09" }, "UTC")).toBe("2026-10-09")
  })
})

describe("preferences merge field by field", () => {
  const loaded = "2026-10-09T23:00:00.000Z"

  it("a tab that changed another preference doesn't revert habitsLayout set by an assistant", () => {
    // The tab loaded with layout "day".
    const tabCopy: UserPreferences = { habitsLayout: "day", updatedAt: "2026-10-09T22:00:00.000Z" }
    // An assistant then set matrix on the server.
    const server = stampChangedFields(tabCopy, { ...tabCopy, habitsLayout: "matrix" }, "2026-10-09T23:10:00.000Z")
    // Later the tab fills in its time zone and saves its whole copy.
    const tabSave = stampChangedFields(tabCopy, { ...tabCopy, timeZone: "America/Argentina/Buenos_Aires" }, "2026-10-09T23:20:00.000Z")

    const merged = mergeFieldStamped(tabSave, server, loaded)
    expect(merged?.habitsLayout).toBe("matrix")
    expect(merged?.timeZone).toBe("America/Argentina/Buenos_Aires")
  })

  it("the later change wins when both sides changed the same field", () => {
    const base: UserPreferences = { habitsLayout: "day" }
    const server = stampChangedFields(base, { habitsLayout: "matrix" }, "2026-10-09T23:10:00.000Z")
    const tab = stampChangedFields(base, { habitsLayout: "week" }, "2026-10-09T23:30:00.000Z")
    expect(mergeFieldStamped(tab, server, loaded)?.habitsLayout).toBe("week")
  })

  it("falls back to the newer whole copy for data saved before field stamps", () => {
    const server: UserPreferences = { habitsLayout: "matrix", updatedAt: "2026-10-09T23:10:00.000Z" }
    const tab: UserPreferences = { habitsLayout: "day", updatedAt: "2026-10-09T22:00:00.000Z" }
    expect(mergeFieldStamped(tab, server, loaded)?.habitsLayout).toBe("matrix")
  })

  it("stamps only the fields that changed", () => {
    const before: UserPreferences = { weekStartsOn: 1, timeFormat: "24h" }
    const next = stampChangedFields(before, { ...before, weekStartsOn: 0 }, "T1")
    expect(next.fieldsUpdatedAt).toEqual({ weekStartsOn: "T1" })
    expect(next.updatedAt).toBe("T1")
  })
})
