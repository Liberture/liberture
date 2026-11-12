import { expect, it } from "vitest"
import { progressStarterHabits } from "../starter-progression"
import type { Habit, HabitCompletion } from "../types"

const walk = {
  id: "walk", name: "Walk for 20 minutes",
  tinyHabit: { fullVersion: "Walk for 20 minutes", tinyVersion: "Take a five-minute walk", currentLevel: "tiny" },
} as Habit

it("upgrades an existing walking plan and assigns the next level only after completed days", () => {
  const logs: HabitCompletion[] = Array.from({ length: 14 }, (_, i) => ({
    habitId: walk.id, completed: true, date: `2026-11-${String(i + 1).padStart(2, "0")}`,
  }))
  const task = (today: string, records = logs) => progressStarterHabits([walk], records, today)[0].name
  expect(task("2026-11-07")).toBe("Take a five-minute walk")
  expect(task("2026-11-08")).toBe("Walk for 10 minutes")
  expect(task("2026-11-15")).toBe(walk.name)
  const skipped = logs.map((entry, index) => index === 3 ? { ...entry, completed: false } : entry)
  expect(task("2026-11-15", [...skipped, skipped[0]])).toBe("Walk for 10 minutes")
  const renamed = { ...walk, name: "My own walk" }
  expect(progressStarterHabits([renamed], logs, "2026-11-15")[0]).toBe(renamed)
})

it("uses the chosen weekly frequency and duration for each stage", () => {
  const weekly: Habit = { ...walk, schedule: { type: "times_per_week", timesPerWeek: 3 },
    tinyHabit: { ...walk.tinyHabit!, targetWeeks: 4 } }
  const logs = Array.from({ length: 12 }, (_, i) => ({
    habitId: walk.id, completed: true, date: `2026-11-${String(i + 1).padStart(2, "0")}`,
  }))
  const stage = (n: number) => progressStarterHabits([weekly], logs.slice(0, n), "2026-12-01")[0].tinyHabit?.currentLevel
  expect([stage(5), stage(6), stage(11), stage(12)]).toEqual(["tiny", "medium", "medium", "full"])
})
