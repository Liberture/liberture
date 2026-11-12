import { describe, expect, it } from "vitest"
import { habitRunsOnDate } from "@/components/habits/calendar/calendar-utils"
import type { Habit } from "@/lib/habits/types"

const habit: Habit = { id: "walk", name: "Walk", color: "#333", time: "08:00", schedule: { type: "daily" }, createdAt: "2026-11-10" }
const day = (date: number) => new Date(2026, 10, date)

describe("calendar habit visibility", () => {
  it("starts a daily habit on the local day it was created", () => {
    expect(habitRunsOnDate(habit, day(9), false)).toBe(false)
    expect(habitRunsOnDate(habit, day(10), false)).toBe(true)
  })

  it("limits backfilled history to days on or after signup", () => {
    const imported = { ...habit, startDate: "2026-11-01" }
    const signup = day(7).getTime()
    expect(habitRunsOnDate(imported, day(6), true, signup)).toBe(false)
    expect(habitRunsOnDate(imported, day(6), false, signup)).toBe(false)
    expect(habitRunsOnDate(imported, day(7), true, signup)).toBe(true)
  })
})
