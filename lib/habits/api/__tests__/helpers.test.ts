import { describe, expect, it } from "vitest"
import { decodeCursor, encodeCursor, paginate } from "@/lib/habits/api/paginate"
import { userToday, zonedToUtc } from "@/lib/habits/api/time-zone"
import { mergeStamped } from "@/lib/habits/habit-sync"
import { applyProfileUpdate, profileView } from "@/lib/habits/api/profile"
import { valuesForHabit } from "@/lib/habits/api/completion-values"
import { rankMatches } from "@/lib/habits/api/mcp-completion"
import type { Habit, StorageData } from "@/lib/habits/types"

describe("paginate", () => {
  const items = Array.from({ length: 7 }, (_, i) => i)
  it("walks pages with an opaque cursor", () => {
    const first = paginate(items, 3, undefined)
    if ("error" in first) throw new Error(first.error)
    expect(first.items).toEqual([0, 1, 2])
    expect(first.total).toBe(7)
    const second = paginate(items, 3, first.nextCursor)
    if ("error" in second) throw new Error(second.error)
    expect(second.items).toEqual([3, 4, 5])
    const last = paginate(items, 3, second.nextCursor)
    if ("error" in last) throw new Error(last.error)
    expect(last.items).toEqual([6])
    expect(last.nextCursor).toBeNull()
  })
  it("rejects bad cursors and limits", () => {
    expect(paginate(items, 3, "not-a-cursor")).toHaveProperty("error")
    expect(paginate(items, 0, undefined)).toHaveProperty("error")
    expect(decodeCursor(encodeCursor(4))).toBe(4)
  })
})

describe("time zones", () => {
  it("reads local wall time in the user's zone", () => {
    expect(zonedToUtc("2026-07-01T15:00", "Europe/Madrid")).toBe("2026-07-01T13:00:00.000Z")
    expect(zonedToUtc("2026-01-15T15:00", "Europe/Madrid")).toBe("2026-01-15T14:00:00.000Z")
    expect(zonedToUtc("2026-10-09T09:30", "America/Argentina/Buenos_Aires")).toBe("2026-10-09T12:30:00.000Z")
  })
  it("leaves times with an offset alone", () => {
    expect(zonedToUtc("2026-07-01T15:00:00Z", "Europe/Madrid")).toBe("2026-07-01T15:00:00Z")
    expect(zonedToUtc("2026-07-01T15:00", undefined)).toBe("2026-07-01T15:00")
  })
  it("uses the saved zone when the request names none", () => {
    const data = { preferences: { timeZone: "Pacific/Kiritimati" } } as StorageData
    const request = new Request("https://x.test/")
    const kiritimati = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Kiritimati" }).format(new Date())
    expect(userToday(request, data)).toBe(kiritimati)
    expect(userToday(request, data, "2026-01-02")).toBe("2026-01-02")
  })
})

type Stamped = { name: string; updatedAt?: string }

describe("mergeStamped", () => {
  const sync = "2026-10-01T10:00:00.000Z"
  it("keeps the server copy changed after the client's sync", () => {
    const server = { name: "Assistant", updatedAt: "2026-10-01T11:00:00.000Z" }
    expect(mergeStamped<Stamped>({ name: "Stale" }, server, sync)).toBe(server)
  })
  it("keeps the client copy edited later, or when the server's is old", () => {
    const client: Stamped = { name: "Tab", updatedAt: "2026-10-01T12:00:00.000Z" }
    expect(mergeStamped<Stamped>(client, { name: "Assistant", updatedAt: "2026-10-01T11:00:00.000Z" }, sync)).toBe(client)
    const unstamped: Stamped = { name: "Tab" }
    expect(mergeStamped<Stamped>(unstamped, { name: "Old", updatedAt: "2026-09-01T00:00:00.000Z" }, sync)).toBe(unstamped)
  })
  it("never drops a server copy the client didn't send", () => {
    const server: Stamped = { name: "Kept" }
    expect(mergeStamped<Stamped>(undefined, server, sync)).toBe(server)
  })
})

const habits = [
  { id: "h1", name: "Running", archived: false },
  { id: "h2", name: "Reading" },
] as Habit[]

describe("applyProfileUpdate", () => {
  const now = "2026-10-09T10:00:00.000Z"
  it("updates profile and preferences and stamps both", () => {
    const result = applyProfileUpdate(
      { profile: {}, preferences: {} },
      { name: "Ana", focusHabits: ["run"], weekStartsOn: "sunday", timeZone: "Europe/Madrid", notifications: false },
      habits,
      now
    )
    if ("error" in result) throw new Error(result.error)
    expect(result.profile).toMatchObject({ name: "Ana", focusHabits: ["h1"], updatedAt: now })
    expect(result.preferences).toMatchObject({ weekStartsOn: 0, timeZone: "Europe/Madrid", notifications: false, updatedAt: now })
    expect(profileView(result.profile, result.preferences, habits)).toMatchObject({
      name: "Ana",
      focusHabits: ["Running"],
      preferences: { theme: "system", weekStartsOn: 0, notifications: false, timeZone: "Europe/Madrid" },
    })
  })
  it("leaves untouched sections unstamped and rejects bad values", () => {
    const result = applyProfileUpdate({ profile: { name: "Ana" }, preferences: {} }, { theme: "dark" }, habits, now)
    if ("error" in result) throw new Error(result.error)
    expect(result.profile.updatedAt).toBeUndefined()
    expect(applyProfileUpdate({ profile: {}, preferences: {} }, { timeZone: "Mars/Olympus" }, habits, now)).toHaveProperty("error")
    expect(applyProfileUpdate({ profile: {}, preferences: {} }, { focusHabits: ["swimming"] }, habits, now)).toMatchObject({ code: "not_found" })
    expect(applyProfileUpdate({ profile: {}, preferences: {} }, {}, habits, now)).toHaveProperty("error")
  })
})

describe("valuesForHabit", () => {
  const pushups = {
    id: "h3",
    name: "Pushups",
    dataEntry: { enabled: true, fields: [{ id: "f1", type: "number", label: "Reps", unit: "pushups", goalValue: 100 }, { id: "f2", type: "number", label: "Sets" }] },
  } as Habit
  it("sends a single value to the first number field, or the one named by unit", () => {
    expect(valuesForHabit(pushups, { value: 20 })).toMatchObject({ data: { f1: 20 } })
    expect(valuesForHabit(pushups, { value: 3, unit: "sets" })).toMatchObject({ data: { f2: 3 } })
    expect(valuesForHabit(pushups, { values: { reps: 10, Sets: 2 } })).toMatchObject({ data: { f1: 10, f2: 2 } })
  })
  it("keeps a value for a habit that tracks nothing, and rejects non-numbers", () => {
    expect(valuesForHabit({ id: "x", name: "Walk" } as Habit, { value: 5 })).toMatchObject({ data: { value: 5 } })
    expect(valuesForHabit(pushups, { value: "lots" })).toHaveProperty("error")
  })
})

describe("rankMatches", () => {
  it("puts prefix matches first", () => {
    expect(rankMatches(["Evening walk", "Walk the dog", "Pushups"], "walk")).toEqual(["Walk the dog", "Evening walk"])
    expect(rankMatches(["A", "B"], "")).toEqual(["A", "B"])
  })
})
