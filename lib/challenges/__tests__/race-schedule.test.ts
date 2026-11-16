import { describe, expect, it } from "vitest"
import { challengeDates } from "../race"
import { isHabitScheduledOnDate, calculateSuccessCounts } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import type { Habit } from "@/lib/habits/types"

const habit: Habit = {
  id: "challenge-example", name: "Walk daily", color: "#123", time: "00:00",
  schedule: { type: "daily" }, createdAt: "2026-11-10T00:00:00Z", startDate: "2026-11-10",
  challenge: { id: "example", startDate: "2026-11-10", endDate: "2026-11-12" },
}
const date = parseDateOnly

describe("challenge habit schedule", () => {
  it("uses each participant's local calendar across month and daylight-saving boundaries", () => {
    const deadline = Date.parse("2026-11-03T01:00:00Z") / 1000
    expect(challengeDates(deadline, 3, "UTC")).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"])
    expect(challengeDates(deadline, 3, "America/New_York")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01"])
  })
  it("schedules only challenge dates through today in the shared habit views and matrix", () => {
    const now = date("2026-11-11")
    expect(isHabitScheduledOnDate(habit, date("2026-11-09"), now)).toBe(false)
    expect(isHabitScheduledOnDate(habit, date("2026-11-10"), now)).toBe(true)
    expect(isHabitScheduledOnDate(habit, date("2026-11-11"), now)).toBe(true)
    expect(isHabitScheduledOnDate(habit, date("2026-11-12"), now)).toBe(false)
    expect(isHabitScheduledOnDate(habit, date("2026-11-13"), date("2026-11-15"))).toBe(false)
  })
  it("stops increasing expected days after a challenge ends", () => {
    const result = calculateSuccessCounts(habit, [], 7, date("2026-11-15"), 1, date("2026-11-15"))
    expect(result.expected).toBe(3)
  })
})
