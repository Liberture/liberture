import { describe, expect, it } from "vitest"
import { applyHabitEdit, archiveHabitRecord, buildCustomHabit, parseDays, parseTime, unarchiveHabitRecord } from "@/lib/habits/api/habit-writes"
import type { Habit } from "@/lib/habits/types"

describe("parseDays", () => {
  it("reads names, groups and numbers", () => {
    expect(parseDays(["mon", "thu"])).toEqual([1, 4])
    expect(parseDays("weekdays")).toEqual([1, 2, 3, 4, 5])
    expect(parseDays("fin de semana")).toEqual([0, 6])
    expect(parseDays("lunes y jueves")).toEqual([1, 4])
    expect(parseDays([5, 1])).toEqual([1, 5])
    expect(parseDays(["every day"])).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
  it("returns null for empty or unreadable input", () => {
    expect(parseDays(undefined)).toBeNull()
    expect(parseDays("")).toBeNull()
    expect(parseDays(["someday"])).toBeNull()
  })
})

describe("parseTime", () => {
  it("normalizes to HH:MM", () => {
    expect(parseTime("7")).toBe("07:00")
    expect(parseTime("7:30 pm")).toBe("19:30")
    expect(parseTime("12am")).toBe("00:00")
    expect(parseTime("21:05")).toBe("21:05")
  })
  it("treats empty as no reminder and rejects nonsense", () => {
    expect(parseTime("")).toBe("")
    expect(parseTime(undefined)).toBe("")
    expect(parseTime("25:00")).toBeNull()
    expect(parseTime("soon")).toBeNull()
  })
})

function habit(overrides: Partial<Habit> = {}): Habit {
  const built = buildCustomHabit({ name: "running" })
  if ("error" in built) throw new Error(built.error)
  return { ...built.habit, ...overrides }
}

describe("applyHabitEdit", () => {
  it("renames, reschedules and sets a time", () => {
    const result = applyHabitEdit(habit(), { name: "jogging", days: ["mon", "wed"], time: "7am" })
    if ("error" in result) throw new Error(result.error)
    expect(result.habit.name).toBe("Jogging")
    expect(result.habit.schedule).toEqual({ type: "specific_days", days: [1, 3] })
    expect(result.habit.time).toBe("07:00")
    expect(result.habit.timeOfDay).toBe("morning")
    expect(result.habit.updatedAt).toBeTruthy()
    expect(result.changes).toEqual(["renamed to Jogging", "now on Mondays, Wednesdays", "time 07:00"])
  })

  it("turns 7 days a week into daily", () => {
    const result = applyHabitEdit(habit(), { timesPerWeek: 7 })
    if ("error" in result) throw new Error(result.error)
    expect(result.habit.schedule).toEqual({ type: "daily" })
  })

  it("sets priority, a tracked number with a goal, and a plan", () => {
    const result = applyHabitEdit(habit(), {
      priority: 5,
      dataEntry: { unit: "km", goalValue: 5 },
      intention: { trigger: "I finish work", behavior: "run 20 minutes" },
      identity: "runner",
    })
    if ("error" in result) throw new Error(result.error)
    expect(result.habit.priority).toBe(5)
    expect(result.habit.dataEntry).toEqual({ enabled: true, fields: [{ id: "value", type: "number", label: "km", unit: "km", goalValue: 5 }] })
    expect(result.habit.implementationIntention).toMatchObject({ trigger: "I finish work", behavior: "run 20 minutes" })
    expect(result.habit.identity?.identityType).toBe("runner")
  })

  it("moves color and pillar tag with the pillar", () => {
    const result = applyHabitEdit(habit(), { pillar: "mind" })
    if ("error" in result) throw new Error(result.error)
    expect(result.habit.category).toBe("mind")
    expect(result.habit.tags).toContain("mindfulness")
    expect(result.habit.tags).not.toContain("exercise")
  })

  it("rejects bad input and empty edits", () => {
    expect(applyHabitEdit(habit(), {})).toHaveProperty("error")
    expect(applyHabitEdit(habit(), { days: ["someday"] })).toHaveProperty("error")
    expect(applyHabitEdit(habit(), { time: "noonish" })).toHaveProperty("error")
    expect(applyHabitEdit(habit(), { priority: 9 })).toHaveProperty("error")
    expect(applyHabitEdit(habit(), { tags: ["nonsense"] })).toHaveProperty("error")
  })
})

describe("archive / unarchive", () => {
  it("keeps one open interval per archive, like the app", () => {
    const archived = archiveHabitRecord(habit(), "2026-10-01T00:00:00.000Z")
    expect(archived).toMatchObject({ archived: true, archivedAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" })
    expect(archived.archiveHistory).toEqual([{ archivedAt: "2026-10-01T00:00:00.000Z" }])

    const again = archiveHabitRecord(archived, "2026-10-02T00:00:00.000Z")
    expect(again.archiveHistory).toHaveLength(1)

    const back = unarchiveHabitRecord(again, "2026-10-05T00:00:00.000Z")
    expect(back.archived).toBe(false)
    expect(back.archivedAt).toBeUndefined()
    expect(back.archiveHistory).toEqual([{ archivedAt: "2026-10-01T00:00:00.000Z", unarchivedAt: "2026-10-05T00:00:00.000Z" }])
  })
})
