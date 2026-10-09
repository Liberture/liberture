import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/habits/db-migrate", () => ({ createPushTables: vi.fn(async () => undefined) }))
vi.mock("@/lib/habits/db", () => ({ getDb: vi.fn(() => { throw new Error("no database in unit tests") }) }))

import {
  dueReminders,
  inQuietHours,
  localNowFor,
  parseTimeToMinutes,
  randomReminderSlots,
  reminderKey,
  type LocalNow,
} from "@/lib/habits/reminders/due"
import { claimNotification } from "@/lib/habits/push"
import { parseDateOnly } from "@/lib/habits/date-utils"
import type { Habit, HabitCompletion, StorageData } from "@/lib/habits/types"

// 2026-10-05 is a Monday.
function at(date: string, time: string): LocalNow {
  return { date, minutes: parseTimeToMinutes(time)!, dateObj: parseDateOnly(date) }
}

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Read",
    time: "08:00",
    color: "#000",
    schedule: { type: "daily" },
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  } as Habit
}

const data = (habits: Habit[], preferences: StorageData["preferences"] = {}) => ({ habits, preferences })
const strings = { reminderTitle: "Reminder", reminderBody: "Do {name}", dueBody: "{time}: {name}" }

describe("dueReminders at the habit's time", () => {
  it("fires from the minute it is set for, for 15 minutes", () => {
    expect(dueReminders(data([habit()]), [], at("2026-10-07", "07:59"), 1, strings)).toEqual([])
    const first = dueReminders(data([habit()]), [], at("2026-10-07", "08:00"), 1, strings)
    expect(first).toHaveLength(1)
    expect(first[0]).toMatchObject({
      habitId: "h1",
      kind: "habit",
      key: "habit:h1:2026-10-07:habit",
      title: "Reminder",
      body: "08:00: Read",
      url: "/tracker?view=habits",
    })
    expect(dueReminders(data([habit()]), [], at("2026-10-07", "08:14"), 1, strings)).toHaveLength(1)
    expect(dueReminders(data([habit()]), [], at("2026-10-07", "08:15"), 1, strings)).toEqual([])
    expect(dueReminders(data([habit()]), [], at("2026-10-07", "20:00"), 1, strings)).toEqual([])
  })

  it("reads 12-hour times", () => {
    expect(dueReminders(data([habit({ time: "7:30 PM" })]), [], at("2026-10-07", "19:35"), 1, strings)).toHaveLength(1)
  })

  it("stays quiet once the habit is done today", () => {
    const completions: HabitCompletion[] = [{ habitId: "h1", date: "2026-10-07", completed: true }]
    expect(dueReminders(data([habit()]), completions, at("2026-10-07", "08:05"), 1, strings)).toEqual([])
    // A data-only record (completed: false) does not count as done.
    const dataOnly: HabitCompletion[] = [{ habitId: "h1", date: "2026-10-07", completed: false }]
    expect(dueReminders(data([habit()]), dataOnly, at("2026-10-07", "08:05"), 1, strings)).toHaveLength(1)
  })

  it("stays quiet once a weekly target is met", () => {
    const h = habit({ schedule: { type: "times_per_week", timesPerWeek: 2 } })
    const met: HabitCompletion[] = [
      { habitId: "h1", date: "2026-10-05", completed: true },
      { habitId: "h1", date: "2026-10-06", completed: true },
    ]
    expect(dueReminders(data([h]), met, at("2026-10-07", "08:00"), 1, strings)).toEqual([])
    expect(dueReminders(data([h]), met.slice(0, 1), at("2026-10-07", "08:00"), 1, strings)).toHaveLength(1)
  })

  it("skips archived habits and days off the schedule", () => {
    const archived = habit({ archived: true, archivedAt: "2026-10-01T00:00:00.000Z" })
    expect(dueReminders(data([archived]), [], at("2026-10-07", "08:00"), 1, strings)).toEqual([])
    const mondays = habit({ schedule: { type: "specific_days", days: [1] } })
    expect(dueReminders(data([mondays]), [], at("2026-10-07", "08:00"), 1, strings)).toEqual([])
    expect(dueReminders(data([mondays]), [], at("2026-10-05", "08:00"), 1, strings)).toHaveLength(1)
  })

  it("is not silenced by quiet hours: the user picked that time", () => {
    const late = habit({ time: "23:00" })
    const prefs = { coach: { quietHours: { start: "22:00", end: "08:00" } } }
    expect(dueReminders(data([late], prefs), [], at("2026-10-07", "23:00"), 1, strings)).toHaveLength(1)
  })

  it("uses the user's language by default", () => {
    const [es] = dueReminders(data([habit()], { language: "es" }), [], at("2026-10-07", "08:00"))
    expect(es.title).toBe("Recordatorio de hábito")
    const [en] = dueReminders(data([habit()]), [], at("2026-10-07", "08:00"))
    expect(en.title).toBe("Habit Reminder")
  })
})

describe("random reminders", () => {
  it("are one or two deterministic slots between 09:00 and 20:00", () => {
    for (const id of ["a", "b", "c", "habit-42", "x".repeat(30)]) {
      const slots = randomReminderSlots(id, "2026-10-07")
      expect(slots).toEqual(randomReminderSlots(id, "2026-10-07"))
      expect(slots.length).toBeGreaterThanOrEqual(1)
      expect(slots.length).toBeLessThanOrEqual(2)
      for (const slot of slots) {
        expect(slot).toBeGreaterThanOrEqual(9 * 60)
        expect(slot).toBeLessThan(20 * 60)
      }
    }
    const days = new Set(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"].map((d) => randomReminderSlots("a", d).join(",")))
    expect(days.size).toBeGreaterThan(1)
  })

  it("fire at their slot with a per-slot key", () => {
    const h = habit({ time: "", randomRemindersEnabled: true })
    const [slot] = randomReminderSlots("h1", "2026-10-07")
    const now: LocalNow = { date: "2026-10-07", minutes: slot, dateObj: parseDateOnly("2026-10-07") }
    const due = dueReminders(data([h], { coach: { quietHours: { start: "23:00", end: "07:00" } } }), [], now, 1, strings)
    expect(due.map((r) => r.kind)).toContain("habit_random")
    expect(due.find((r) => r.kind === "habit_random")?.key).toBe(reminderKey("h1", "2026-10-07", "habit_random", 0))
    expect(due.find((r) => r.kind === "habit_random")?.body).toBe("Do Read")
  })

  it("respect quiet hours", () => {
    const h = habit({ time: "", randomRemindersEnabled: true })
    const [slot] = randomReminderSlots("h1", "2026-10-07")
    const now: LocalNow = { date: "2026-10-07", minutes: slot, dateObj: parseDateOnly("2026-10-07") }
    const quietAllDay = { coach: { quietHours: { start: "00:00", end: "23:59" } } }
    expect(dueReminders(data([h], quietAllDay), [], now, 1, strings)).toEqual([])
  })
})

describe("inQuietHours", () => {
  it("handles ranges that wrap midnight", () => {
    const q = { start: "22:00", end: "08:00" }
    expect(inQuietHours(23 * 60, q)).toBe(true)
    expect(inQuietHours(7 * 60 + 59, q)).toBe(true)
    expect(inQuietHours(8 * 60, q)).toBe(false)
    expect(inQuietHours(12 * 60, { start: "12:00", end: "14:00" })).toBe(true)
    expect(inQuietHours(14 * 60, { start: "12:00", end: "14:00" })).toBe(false)
  })
})

describe("localNowFor", () => {
  it("computes the date and minutes in the user's zone", () => {
    const instant = new Date("2026-10-08T02:30:00Z")
    const ba = localNowFor("America/Argentina/Buenos_Aires", instant) // UTC-3
    expect(ba.date).toBe("2026-10-07")
    expect(ba.minutes).toBe(23 * 60 + 30)
    expect(ba.dateObj.getDate()).toBe(7)
    const tokyo = localNowFor("Asia/Tokyo", instant) // UTC+9
    expect(tokyo.date).toBe("2026-10-08")
    expect(tokyo.minutes).toBe(11 * 60 + 30)
  })

  it("drives dueReminders in that zone", () => {
    const instant = new Date("2026-10-07T11:05:00Z") // 08:05 in Buenos Aires
    const now = localNowFor("America/Argentina/Buenos_Aires", instant)
    expect(dueReminders(data([habit()]), [], now, 1, strings)).toHaveLength(1)
    expect(dueReminders(data([habit()]), [], localNowFor("Europe/Madrid", instant), 1, strings)).toEqual([])
  })
})

describe("claimNotification", () => {
  it("returns true to the first claimer only", async () => {
    const claimed = new Set<string>()
    const sql = vi.fn(async (_strings: TemplateStringsArray, ...values: unknown[]) => {
      const [userId, key] = values
      const id = `${userId}|${key}`
      if (claimed.has(id)) return []
      claimed.add(id)
      return [{ dedupe_key: key }]
    })
    const db = sql as unknown as Parameters<typeof claimNotification>[4]
    expect(await claimNotification(1, "habit:h1:2026-10-07:habit", "habit", "push", db)).toBe(true)
    expect(await claimNotification(1, "habit:h1:2026-10-07:habit", "habit", "local", db)).toBe(false)
    expect(await claimNotification(2, "habit:h1:2026-10-07:habit", "habit", "local", db)).toBe(true)
    const query = sql.mock.calls[0][0].join("?")
    expect(query).toMatch(/ON CONFLICT \(user_id, dedupe_key\) DO NOTHING/)
    expect(query).toMatch(/RETURNING/)
  })
})
