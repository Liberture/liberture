import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseDateOnly } from "@/lib/habits/date-utils"

const ledger = vi.hoisted(() => ({ claimed: new Set<string>(), sentToday: 0, claims: [] as { key: string; kind: string; channel: string }[] }))

vi.mock("@/lib/habits/push", () => ({
  claimNotification: async (_userId: number, key: string, kind: string, channel: string) => {
    ledger.claims.push({ key, kind, channel })
    if (ledger.claimed.has(key)) return false
    ledger.claimed.add(key)
    return true
  },
  countSentToday: async () => ledger.sentToday,
  localDayStartUtc: () => new Date("2026-10-09T00:00:00Z"),
}))
vi.mock("@/lib/habits/db", () => ({ getDb: () => ({}) }))

import { canNudge, coachPrefs, inQuietHours, isoWeekKey, nudgeDedupeKey, timeToMinutes } from "@/lib/habits/coach/limits"
import type { StorageData } from "@/lib/habits/types"

const at = (time: string) => ({ date: "2026-10-09", minutes: timeToMinutes(time)!, dateObj: parseDateOnly("2026-10-09") })
const data = (coach: NonNullable<StorageData["preferences"]>["coach"] = {}) => ({ preferences: { coach } }) as Pick<StorageData, "preferences">

beforeEach(() => {
  ledger.claimed.clear()
  ledger.claims.length = 0
  ledger.sentToday = 0
})

describe("inQuietHours", () => {
  it("wraps midnight", () => {
    const quiet = { start: "22:00", end: "08:00" }
    expect(inQuietHours(timeToMinutes("23:30")!, quiet)).toBe(true)
    expect(inQuietHours(timeToMinutes("00:00")!, quiet)).toBe(true)
    expect(inQuietHours(timeToMinutes("07:59")!, quiet)).toBe(true)
    expect(inQuietHours(timeToMinutes("08:00")!, quiet)).toBe(false)
    expect(inQuietHours(timeToMinutes("21:59")!, quiet)).toBe(false)
  })

  it("handles a same-day window and an empty one", () => {
    expect(inQuietHours(timeToMinutes("13:00")!, { start: "12:00", end: "14:00" })).toBe(true)
    expect(inQuietHours(timeToMinutes("14:00")!, { start: "12:00", end: "14:00" })).toBe(false)
    expect(inQuietHours(600, { start: "09:00", end: "09:00" })).toBe(false)
    expect(inQuietHours(600, undefined)).toBe(false)
  })
})

describe("coachPrefs and keys", () => {
  it("fills defaults: everything off, 22-08 quiet, 3 a day", () => {
    expect(coachPrefs({ preferences: {} } as StorageData)).toEqual({
      missedLogging: false,
      quietHours: { start: "22:00", end: "08:00" },
      maxNudgesPerDay: 3,
      checkIns: {},
    })
  })

  it("keys the weekly review by ISO week and the rest by day", () => {
    expect(isoWeekKey("2026-10-09")).toBe("2026-W41")
    expect(isoWeekKey("2027-01-01")).toBe("2026-W53")
    expect(isoWeekKey("2026-01-01")).toBe("2026-W01")
    expect(nudgeDedupeKey("weekly", "2026-10-09")).toBe("coach:weekly:2026-W41")
    expect(nudgeDedupeKey("morning", "2026-10-09")).toBe("coach:morning:2026-10-09")
    expect(nudgeDedupeKey("other", "2026-10-09", "a")).not.toBe(nudgeDedupeKey("other", "2026-10-09", "b"))
  })
})

describe("canNudge", () => {
  it("refuses in quiet hours without touching the ledger", async () => {
    const verdict = await canNudge({ userId: 1, kind: "morning", localNow: at("23:00"), data: data() })
    expect(verdict).toMatchObject({ allowed: false, reason: "quiet_hours" })
    expect(ledger.claims).toHaveLength(0)
  })

  it("refuses at the daily limit", async () => {
    ledger.sentToday = 2
    const verdict = await canNudge({ userId: 1, kind: "morning", localNow: at("09:00"), data: data({ maxNudgesPerDay: 2 }) })
    expect(verdict).toMatchObject({ allowed: false, reason: "daily_limit", sentToday: 2, limit: 2 })
    expect(ledger.claims).toHaveLength(0)
  })

  it("allows once per kind per day and records it, then calls a repeat a duplicate", async () => {
    const first = await canNudge({ userId: 1, kind: "morning", localNow: at("09:00"), data: data(), channel: "assistant" })
    expect(first).toMatchObject({ allowed: true, reason: null, sentToday: 1 })
    expect(ledger.claims[0]).toEqual({ key: "coach:morning:2026-10-09", kind: "coach:morning", channel: "assistant" })
    const second = await canNudge({ userId: 1, kind: "morning", localNow: at("09:02"), data: data() })
    expect(second).toMatchObject({ allowed: false, reason: "duplicate" })
    const other = await canNudge({ userId: 1, kind: "afternoon", localNow: at("15:00"), data: data() })
    expect(other.allowed).toBe(true)
  })
})
