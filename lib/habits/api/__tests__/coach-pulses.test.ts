import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseDateOnly } from "@/lib/habits/date-utils"
import type { CoachRecommendationEntry, HabitCompletion, StorageData } from "@/lib/habits/types"
// vi.mock calls below are hoisted above these imports by vitest.
import { MAX_QUOTE_LENGTH, duePulseSlot, pickPulse, pulseSlots, pulsesPerDay } from "@/lib/habits/coach/pulse-rules"
import { runCoachPulses } from "@/lib/habits/coach/pulses"
import { timeToMinutes } from "@/lib/habits/coach/limits"
import { translations } from "@/lib/translations"

/**
 * Daytime pulses: when they fall, what they say, and the runner against the
 * shared coach limits, with push and the ledger in memory.
 */

const state = vi.hoisted(() => ({
  devices: 1,
  recent: false,
  sentToday: 0,
  claimed: new Set<string>(),
  claims: [] as { key: string; kind: string }[],
  pushes: [] as Record<string, unknown>[],
}))

vi.mock("@/lib/habits/push", () => ({
  pushConfigured: () => true,
  ensurePushTables: async () => {},
  hasPushDevice: async () => state.devices > 0,
  countSentToday: async () => state.sentToday,
  localDayStartUtc: () => new Date("2026-10-20T00:00:00Z"),
  claimNotification: async (_userId: number, key: string, kind: string) => {
    state.claims.push({ key, kind })
    if (state.claimed.has(key)) return false
    state.claimed.add(key)
    state.sentToday++
    return true
  },
  sendPush: async (_userId: number, payload: Record<string, unknown>) => {
    state.pushes.push(payload)
    return { sent: 1, failed: 0, removed: 0 }
  },
}))
vi.mock("@/lib/habits/db", () => ({ getDb: () => async () => [] }))

const DAY = "2026-10-20"
const at = (minutes: number, date = DAY) => ({ date, minutes, dateObj: parseDateOnly(date) })
const sql = (async () => (state.recent ? [{ "?column?": 1 }] : [])) as never

const habit = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  time: "",
  color: "#fff",
  schedule: { type: "daily" },
  createdAt: "2026-01-01T00:00:00.000Z",
  ...extra,
})
const suggestion = (extra: Partial<CoachRecommendationEntry> = {}): CoachRecommendationEntry => ({
  kind: "custom",
  reason: "You sleep better after a short walk.",
  custom: { name: "Evening stroll", why: "Wind down", time: "20:00", pillar: "sleep", scheduleType: "daily" },
  ...extra,
})
const data = (extra: Partial<StorageData> = {}, coach: Record<string, unknown> = { pulsesPerDay: 3 }) =>
  ({
    habits: [habit("h1", "Meditation"), habit("h2", "Read")],
    todos: [],
    preferences: { coach },
    coachRecommendations: { generatedAt: "2026-10-19T10:00:00Z", question: "?", entries: [suggestion()] },
    ...extra,
  }) as unknown as StorageData
const completions: HabitCompletion[] = [{ habitId: "h1", date: DAY, completed: true, completedAt: `${DAY}T09:00:00Z` }]

beforeEach(() => {
  Object.assign(state, { devices: 1, recent: false, sentToday: 0 })
  state.claimed.clear()
  state.claims.length = 0
  state.pushes.length = 0
})

describe("pulsesPerDay", () => {
  it("is off by default and clamps to 3", () => {
    expect(pulsesPerDay({ preferences: {} })).toBe(0)
    expect(pulsesPerDay({ preferences: { coach: { pulsesPerDay: 2 } } })).toBe(2)
    expect(pulsesPerDay({ preferences: { coach: { pulsesPerDay: 9 } } })).toBe(3)
    expect(pulsesPerDay({ preferences: { coach: { pulsesPerDay: -1 } } })).toBe(0)
  })
})

describe("pulseSlots", () => {
  it("puts one slot in each equal part of the waking day, clear of quiet hours", () => {
    for (const perDay of [1, 2, 3]) {
      const slots = pulseSlots(1, DAY, perDay)
      expect(slots).toHaveLength(perDay)
      const from = timeToMinutes("08:30")!
      const segment = Math.floor((timeToMinutes("21:30")! - from) / perDay)
      slots.forEach((slot, i) => {
        expect(slot).toBeGreaterThanOrEqual(from + i * segment)
        expect(slot).toBeLessThan(from + (i + 1) * segment)
      })
    }
  })

  it("is the same all day and differs across days and users", () => {
    expect(pulseSlots(1, DAY, 3)).toEqual(pulseSlots(1, DAY, 3))
    expect(pulseSlots(1, DAY, 3)).not.toEqual(pulseSlots(1, "2026-10-21", 3))
    expect(pulseSlots(1, DAY, 3)).not.toEqual(pulseSlots(2, DAY, 3))
  })

  it("follows the user's quiet hours", () => {
    const slots = pulseSlots(1, DAY, 3, { start: "00:00", end: "07:00" })
    expect(Math.min(...slots)).toBeGreaterThanOrEqual(timeToMinutes("07:30")!)
    expect(Math.max(...slots)).toBeLessThan(timeToMinutes("23:30")!)
  })

  it("gives nothing when off or when the waking window is too short", () => {
    expect(pulseSlots(1, DAY, 0)).toEqual([])
    expect(pulseSlots(1, DAY, 3, { start: "09:00", end: "08:00" })).toEqual([])
  })
})

describe("duePulseSlot", () => {
  it("is due for five minutes from the slot", () => {
    const d = data()
    const slots = pulseSlots(1, DAY, 3, d.preferences?.coach?.quietHours)
    expect(duePulseSlot(1, d, at(slots[1]))).toBe(1)
    expect(duePulseSlot(1, d, at(slots[1] + 4))).toBe(1)
    expect(duePulseSlot(1, d, at(slots[1] + 5))).toBeNull()
    expect(duePulseSlot(1, data({}, {}), at(slots[1]))).toBeNull()
  })
})

describe("pickPulse", () => {
  const en = translations.en.habits.app.coachMessages
  const pick = (d: StorageData, slot: number, locale: "en" | "es" = "en", date = DAY) =>
    pickPulse({ data: d, completions, localNow: at(600, date), slot, locale, now: new Date(`${date}T12:00:00Z`) })

  it("rotates through suggestion, progress, idea and quote", () => {
    const titles = [0, 1, 2, 3].map((slot) => pick(data(), slot)?.title)
    expect(new Set(titles).size).toBe(4)
    expect(titles).toContain(en.pulseSuggestionTitle)
    expect(titles).toContain(en.pulseProgressTitle)
    expect(titles).toContain(en.pulseQuoteTitle)
    expect(titles.some((t) => t?.startsWith("Something for "))).toBe(true)
  })

  it("links each kind to the right place", () => {
    const bySlot = [0, 1, 2, 3].map((slot) => pick(data(), slot)!)
    expect(bySlot.find((m) => m.title === en.pulseSuggestionTitle)?.url).toBe("/tracker?view=discover&tab=coach")
    expect(bySlot.find((m) => m.title === en.pulseProgressTitle)?.body).toBe("1 of 2 done. Next: Read.")
  })

  it("skips dismissed, snoozed and already adopted suggestions", () => {
    const entries = [
      suggestion({ status: "dismissed" }),
      suggestion({ status: "snoozed", snoozedUntil: "2026-11-01T00:00:00Z" }),
      suggestion({ custom: { name: "Meditation", why: "", time: "", pillar: "mind", scheduleType: "daily" } }),
    ]
    const d = data({ coachRecommendations: { generatedAt: "", question: "", entries } })
    for (const slot of [0, 1, 2, 3]) expect(pick(d, slot)?.title).not.toBe(en.pulseSuggestionTitle)
  })

  it("brings back a suggestion whose snooze ran out", () => {
    const d = data({ coachRecommendations: { generatedAt: "", question: "", entries: [suggestion({ status: "snoozed", snoozedUntil: "2026-10-01T00:00:00Z" })] } })
    expect([0, 1, 2, 3].map((slot) => pick(d, slot)?.title)).toContain(en.pulseSuggestionTitle)
  })

  it("never sends progress when no habit is due", () => {
    const d = data({ habits: [] })
    for (const slot of [0, 1, 2, 3]) expect(pick(d, slot)?.title).not.toBe(en.pulseProgressTitle)
  })

  it("only uses short quotes", () => {
    for (const date of ["2026-10-20", "2026-10-21", "2026-11-02", "2027-01-15"]) {
      for (const slot of [0, 1, 2]) {
        const message = pick(data({ habits: [], coachRecommendations: undefined }), slot, "en", date)
        if (message?.title !== en.pulseQuoteTitle) continue
        const text = message.body.match(/^“(.*)” — /)?.[1] ?? ""
        expect(text.length).toBeLessThanOrEqual(MAX_QUOTE_LENGTH)
      }
    }
  })

  it("speaks Spanish when the user does", () => {
    const es = translations.es.habits.app.coachMessages
    const titles = [0, 1, 2, 3].map((slot) => pick(data(), slot, "es")?.title)
    expect(titles).toContain(es.pulseSuggestionTitle)
    expect(titles).toContain(es.pulseQuoteTitle)
  })
})

describe("runCoachPulses", () => {
  const d = data({}, { pulsesPerDay: 2 })
  const slot = pulseSlots(1, DAY, 2)[0]
  const ctx = (minutes = slot, extra: Partial<Parameters<typeof runCoachPulses>[0]> = {}) => ({
    sql,
    userId: 1,
    data: d,
    completions,
    localNow: at(minutes),
    now: new Date(`${DAY}T12:00:00Z`),
    ...extra,
  })

  it("sends once per slot through the coach ledger", async () => {
    expect(await runCoachPulses(ctx())).toBe(0)
    expect(await runCoachPulses(ctx(slot + 1))).toBeNull()
    expect(state.pushes).toHaveLength(1)
    expect(state.pushes[0]).toMatchObject({ tag: "coach-pulse" })
    expect(state.claims.at(-1)).toEqual({ key: `coach:pulse:${DAY}:0`, kind: "coach:pulse" })
  })

  it("does nothing outside a slot, when off, or without a device", async () => {
    expect(await runCoachPulses(ctx(slot + 10))).toBeNull()
    expect(await runCoachPulses(ctx(slot, { data: data({}, {}) }))).toBeNull()
    state.devices = 0
    expect(await runCoachPulses(ctx())).toBeNull()
    expect(state.pushes).toHaveLength(0)
  })

  it("keeps clear of a coach message sent in the last half hour", async () => {
    state.recent = true
    expect(await runCoachPulses(ctx())).toBeNull()
    expect(state.claims).toHaveLength(0)
  })

  it("counts toward the daily cap", async () => {
    state.sentToday = 3
    expect(await runCoachPulses(ctx())).toBeNull()
    expect(state.pushes).toHaveLength(0)
  })
})
