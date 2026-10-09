import { describe, expect, it } from "vitest"
import {
  calculateStreak,
  calculateSuccessRate,
  isHabitDueOnDate,
  weekBounds,
  weeklyProgress,
} from "@/lib/habits/habit-utils"
import { formatDateOnly, parseDateOnly } from "@/lib/habits/date-utils"
import type { Habit, HabitCompletion } from "@/lib/habits/types"

// 2026-10-05 is a Monday, 2026-10-11 a Sunday.
const day = (key: string) => parseDateOnly(key)

function habit(schedule: Habit["schedule"], createdAt = "2026-09-14"): Habit {
  return { id: "h1", name: "Run", time: "", color: "#000", schedule, createdAt } as Habit
}

const weekly = (times: number, createdAt?: string) => habit({ type: "times_per_week", timesPerWeek: times }, createdAt)

function done(...dates: string[]): HabitCompletion[] {
  return dates.map((date) => ({ habitId: "h1", date, completed: true }))
}

describe("weekBounds", () => {
  it("starts weeks on Monday", () => {
    const { start, end } = weekBounds(day("2026-10-07"), 1)
    expect(formatDateOnly(start)).toBe("2026-10-05")
    expect(formatDateOnly(end)).toBe("2026-10-11")
    expect(formatDateOnly(weekBounds(day("2026-10-11"), 1).start)).toBe("2026-10-05")
  })
  it("starts weeks on Sunday", () => {
    const { start, end } = weekBounds(day("2026-10-07"), 0)
    expect(formatDateOnly(start)).toBe("2026-10-04")
    expect(formatDateOnly(end)).toBe("2026-10-10")
    expect(formatDateOnly(weekBounds(day("2026-10-11"), 0).start)).toBe("2026-10-11")
  })
})

describe("weeklyProgress", () => {
  it("counts this week's distinct done days", () => {
    const c = [...done("2026-10-05", "2026-10-06", "2026-10-04"), { habitId: "h1", date: "2026-10-06", completed: true }]
    expect(weeklyProgress(weekly(3), c, day("2026-10-07"), 1)).toEqual({
      done: 2,
      target: 3,
      met: false,
      remaining: 1,
      daysLeft: 4,
    })
  })
  it("counts the Sunday under a Sunday week start", () => {
    const c = done("2026-10-04", "2026-10-05", "2026-10-06")
    expect(weeklyProgress(weekly(3), c, day("2026-10-07"), 0)).toMatchObject({ done: 3, met: true, remaining: 0, daysLeft: 3 })
  })
})

describe("isHabitDueOnDate", () => {
  const h = weekly(2)
  const c = done("2026-10-05", "2026-10-06")
  it("isn't due once the week's target was met on earlier days", () => {
    expect(isHabitDueOnDate(h, day("2026-10-07"), c, 1, day("2026-10-07"))).toBe(false)
  })
  it("stays due on a day it was done", () => {
    expect(isHabitDueOnDate(h, day("2026-10-06"), c, 1, day("2026-10-07"))).toBe(true)
  })
  it("is due again in the next week", () => {
    expect(isHabitDueOnDate(h, day("2026-10-12"), c, 1, day("2026-10-12"))).toBe(true)
  })
  it("leaves daily habits due every day", () => {
    const daily = habit({ type: "daily" })
    expect(isHabitDueOnDate(daily, day("2026-10-07"), c, 1, day("2026-10-07"))).toBe(true)
  })
})

describe("calculateSuccessRate for weekly targets", () => {
  it("is 100% when 3 of 3 were done", () => {
    const c = done("2026-09-28", "2026-09-30", "2026-10-02")
    expect(calculateSuccessRate(weekly(3), c, 7, day("2026-10-04"), 1, day("2026-10-04"))).toBe(1)
    // The same finished week seen from a later day.
    expect(calculateSuccessRate(weekly(3), c, 7, day("2026-10-04"), 1, day("2026-10-20"))).toBe(1)
  })
  it("doesn't count rest days against the current week while the target is reachable", () => {
    const c = done("2026-10-05")
    // Wednesday, 4 days left: only the one done day is expected so far.
    expect(calculateSuccessRate(weekly(3, "2026-10-05"), c, 3, day("2026-10-07"), 1, day("2026-10-07"))).toBe(1)
    // Friday, 2 days left: 3 − 2 = 1 still expected.
    expect(calculateSuccessRate(weekly(3, "2026-10-05"), c, 5, day("2026-10-09"), 1, day("2026-10-09"))).toBe(1)
    // Saturday, 1 day left: 2 expected, 1 done.
    expect(calculateSuccessRate(weekly(3, "2026-10-05"), c, 6, day("2026-10-10"), 1, day("2026-10-10"))).toBe(0.5)
  })
  it("prorates a first week the habit started mid-way", () => {
    // Started Thursday: 4 of 7 days → ceil(3 × 4 / 7) = 2 expected.
    const c = done("2026-10-02", "2026-10-03")
    expect(calculateSuccessRate(weekly(3, "2026-10-01"), c, 30, day("2026-10-04"), 1, day("2026-10-20"))).toBe(1)
  })
  it("prorates a first week the window starts mid-way", () => {
    // Window Thu 10-01 … Wed 10-07: first week expects 2 (1 done), current week expects 1 (1 done).
    const c = done("2026-10-02", "2026-10-05")
    expect(calculateSuccessRate(weekly(3), c, 7, day("2026-10-07"), 1, day("2026-10-07"))).toBeCloseTo(2 / 3)
  })
  it("caps a week at its target", () => {
    const c = done("2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-06")
    // Two finished weeks, 4 done (counted as 2) then 1: (2 + 1) / (2 + 2).
    expect(calculateSuccessRate(weekly(2), c, 14, day("2026-10-11"), 1, day("2026-10-20"))).toBe(0.75)
  })
})

describe("calculateStreak for weekly targets", () => {
  const h = weekly(2)
  const met = done("2026-09-14", "2026-09-16", "2026-09-22", "2026-09-25", "2026-09-29", "2026-10-03")

  it("counts consecutive weeks that met the target", () => {
    const s = calculateStreak("h1", met, undefined, h, day("2026-10-09"))
    expect(s).toMatchObject({ current: 3, longest: 3, unit: "weeks" })
  })
  it("adds the current week once it is met", () => {
    const s = calculateStreak("h1", [...met, ...done("2026-10-05", "2026-10-06")], undefined, h, day("2026-10-07"))
    expect(s.current).toBe(4)
  })
  it("resets when the current week can no longer be met", () => {
    const s = calculateStreak("h1", met, undefined, h, day("2026-10-11"))
    expect(s.current).toBe(0)
    expect(s.longest).toBe(3)
  })
  it("resets after a missed week", () => {
    const c = done("2026-09-14", "2026-09-16", "2026-09-22", "2026-09-29", "2026-10-03")
    expect(calculateStreak("h1", c, undefined, h, day("2026-10-09")).current).toBe(1)
  })
  it("ignores a stored longest counted in days", () => {
    const stored = { current: 9, longest: 9, freezesAvailable: 0, freezesUsed: 0, milestones: [] }
    expect(calculateStreak("h1", met, stored, h, day("2026-10-09")).longest).toBe(3)
  })
})

describe("daily habits (regression)", () => {
  const daily = habit({ type: "daily" }, "2026-10-01")
  const c = done("2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08")

  it("streak counts days and today is a grace day", () => {
    expect(calculateStreak("h1", c, undefined, daily, day("2026-10-09"))).toMatchObject({ current: 4, unit: "days" })
    expect(calculateStreak("h1", c, undefined, daily, day("2026-10-10")).current).toBe(0)
  })
  it("success rate is done ÷ scheduled days", () => {
    expect(calculateSuccessRate(daily, c, 7, day("2026-10-09"))).toBeCloseTo(4 / 7)
  })
  it("fixed-day habits only count their days", () => {
    const mwf = habit({ type: "specific_days", days: [1, 3, 5] }, "2026-10-01")
    const s = calculateStreak("h1", done("2026-10-05", "2026-10-07"), undefined, mwf, day("2026-10-09"))
    expect(s).toMatchObject({ current: 2, unit: "days" })
    expect(calculateSuccessRate(mwf, done("2026-10-05", "2026-10-07"), 7, day("2026-10-09"))).toBeCloseTo(2 / 3)
  })
})

describe("isHabitDueOnDate with indexed keys", () => {
  it("accepts a set of completed days", () => {
    const keys = new Set(["2026-10-05", "2026-10-06"])
    expect(isHabitDueOnDate(weekly(2), day("2026-10-07"), keys, 1, day("2026-10-07"))).toBe(false)
    expect(isHabitDueOnDate(weekly(3), day("2026-10-07"), keys, 1, day("2026-10-07"))).toBe(true)
  })
})

describe("buildSpokenSummary", () => {
  it("shows weekly progress and labels week streaks", async () => {
    const { buildSpokenSummary, habitsForDay } = await import("@/lib/habits/api/assistant")
    const data = {
      habits: [weekly(2)],
      completions: done("2026-09-14", "2026-09-16", "2026-09-22", "2026-09-25", "2026-09-29", "2026-10-03", "2026-10-05"),
    } as unknown as Parameters<typeof buildSpokenSummary>[0]
    const [today] = habitsForDay(data, "2026-10-07")
    expect(today).toMatchObject({ streakUnit: "weeks", currentStreak: 3, week: { done: 1, target: 2, met: false } })
    const text = buildSpokenSummary(data, "2026-10-07")
    expect(text).toContain("Run (1/2 this week) (id: h1, streak 3 weeks)")
    // Target met on Mon+Tue: not due on Wednesday.
    data.completions.push({ habitId: "h1", date: "2026-10-06", completed: true })
    expect(habitsForDay(data, "2026-10-07")).toHaveLength(0)
  })
})
