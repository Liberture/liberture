import { describe, expect, it } from "vitest"
import {
  buildFieldMap,
  buildHabitMapping,
  nameSimilarity,
  parseHabitHistoryBackup,
  parseHabitMapping,
  planImport,
  type ConflictPolicy,
  type ParsedBackup,
} from "@/lib/habits/import/habit-history"
import { rebuildStreaks } from "@/lib/habits/import/history-stats"
import type { Habit, HabitCompletion } from "@/lib/habits/types"

function habit(id: string, name: string, extra: Partial<Habit> = {}): Habit {
  return { id, name, time: "08:00", color: "#000", schedule: { type: "daily" }, createdAt: "2026-10-01T12:00:00.000Z", ...extra }
}

const pullUps = habit("uuid-pull", "25 pull ups", {
  dataEntry: { enabled: true, fields: [{ id: "reps-new", type: "number", label: "Reps", unit: "reps", goalValue: 25 }] },
})
const current: Habit[] = [
  pullUps,
  habit("uuid-mind", "10 minutes of mindfulness"),
  habit("uuid-hspu", "25 Wall Handstand Pushup"),
  habit("uuid-journal", "Nighttime Journal and Reflection"),
  habit("uuid-push10", "4x10 Push Ups"),
  habit("uuid-study", "Studying"),
  habit("uuid-yoga", "Yoga Night", { archived: true, archivedAt: "2026-10-20T00:00:00.000Z" }),
]

const backup = {
  habits: [
    { id: "1770931788860", name: "25Pull Ups", dataEntry: { enabled: true, fields: [{ id: "4513ac01-84d9-4c61-9471-a5856b0bead7", type: "number", label: "Already Done" }] } },
    { id: "3", name: "10m Mindfulness Meditation" },
    { id: "h1", name: "25 Wall Handstand Pushups" },
    { id: "h2", name: "Nightime Journal and Reflection of Habits 1B1" },
    { id: "h3", name: "4x30 Push Ups" },
    { id: "h4", name: "Studying Macroeconomics" },
    { id: "h5", name: "Study" },
    { id: "h6", name: "Yoga Night" },
  ],
  completions: [
    { habitId: "1770931788860", date: "2026-01-07", completed: true, completedAt: "2026-01-08T11:49:22.162Z", data: { "4513ac01-84d9-4c61-9471-a5856b0bead7": 25 } },
    { habitId: "1770931788860", date: "2026-01-08", completed: true, completedAt: "2026-01-08T20:00:00.000Z", data: {} },
    { habitId: "3", date: "2026-01-07", completed: false, completedAt: "2026-01-07T09:00:00.000Z", data: {} },
    { habitId: "1770460035823", date: "2026-01-07", completed: true, completedAt: "2026-01-07T22:00:00.000Z", data: {} },
    { habitId: "h3", date: "2026-01-07", completed: true, data: {} },
    { habitId: "h6", date: "2026-01-05", completed: true, data: {} },
    { habitId: "h6", date: "2026-01-06", completed: true, data: {} },
    { habitId: "3", date: "2026-02-30", completed: true },
    { date: "2026-01-07", completed: true },
  ],
}

function parsed(): ParsedBackup {
  const result = parseHabitHistoryBackup(backup)
  if ("error" in result) throw new Error(result.error)
  return result
}

function plan(existing: HabitCompletion[] = [], policy: ConflictPolicy = "preserve_existing", habits = current, mapping: unknown = undefined) {
  const p = parsed()
  const explicit = parseHabitMapping(mapping)
  if ("error" in explicit) throw new Error(explicit.error)
  const { matches } = buildHabitMapping(p.habits, p.records, habits, explicit)
  return {
    matches,
    ...planImport({
      records: p.records, matches, backupHabits: p.habits, currentHabits: habits, explicit,
      existing: new Map(existing.map((c) => [`${c.habitId}:${c.date}`, c])), conflictPolicy: policy,
    }),
  }
}

describe("parsing", () => {
  it("reports invalid records instead of dropping them", () => {
    const p = parsed()
    expect(p.records).toHaveLength(7)
    expect(p.failures.map((f) => f.index)).toEqual([7, 8])
    expect(p.failures[0].error).toMatch(/calendar day/)
  })

  it("accepts a JSON string and a bare completions array", () => {
    expect("error" in parseHabitHistoryBackup(JSON.stringify(backup))).toBe(false)
    const bare = parseHabitHistoryBackup(backup.completions)
    expect("error" in bare ? 0 : bare.records.length).toBe(7)
    expect(parseHabitHistoryBackup({ habits: [] })).toEqual({ error: expect.stringMatching(/completions/) })
  })
})

describe("habit matching", () => {
  it.each([
    ["25Pull Ups", "25 pull ups"],
    ["10m Mindfulness Meditation", "10 minutes of mindfulness"],
    ["25 Wall Handstand Pushups", "25 Wall Handstand Pushup"],
    ["Nightime Journal and Reflection of Habits 1B1", "Nighttime Journal and Reflection"],
  ])("%s → %s confidently", (a, b) => {
    expect(nameSimilarity(a, b)?.confident).toBe(true)
  })

  it("never maps different counts or one-word overlaps on its own", () => {
    expect(nameSimilarity("4x30 Push Ups", "4x10 Push Ups")?.confident).toBe(false)
    expect(nameSimilarity("Studying Macroeconomics", "Studying")?.confident).toBe(false)
  })

  it("maps the clear ones and leaves ambiguous and orphan ids pending", () => {
    const { matches } = plan()
    const by = Object.fromEntries(matches.map((m) => [m.oldHabitId, m]))
    expect(by["1770931788860"]).toMatchObject({ status: "mapped", newHabitId: "uuid-pull" })
    expect(by["3"]).toMatchObject({ status: "mapped", newHabitId: "uuid-mind" })
    expect(by.h1).toMatchObject({ status: "mapped", newHabitId: "uuid-hspu" })
    expect(by.h2).toMatchObject({ status: "mapped", newHabitId: "uuid-journal" })
    expect(by.h6).toMatchObject({ status: "mapped", newHabitId: "uuid-yoga", method: "exact_name" })
    expect(by.h3.status).toBe("ambiguous")
    expect(by.h3.candidates?.[0].habitId).toBe("uuid-push10")
    expect(by.h4.status).toBe("ambiguous")
    expect(by["1770460035823"]).toMatchObject({ status: "unmatched", oldName: null, records: 1 })
  })

  it("takes confirmed matches from habitMapping and habits from an earlier import", () => {
    const withEarlier = current.map((h) => (h.id === "uuid-study" ? { ...h, importedIds: ["h4"] } : h))
    const { matches } = plan([], "preserve_existing", withEarlier, { h3: "uuid-push10", "1770460035823": "Studying" })
    const by = Object.fromEntries(matches.map((m) => [m.oldHabitId, m]))
    expect(by.h3).toMatchObject({ status: "mapped", method: "explicit", newHabitId: "uuid-push10" })
    expect(by["1770460035823"]).toMatchObject({ status: "mapped", newHabitId: "uuid-study" })
    expect(by.h4).toMatchObject({ status: "mapped", method: "previous_import" })
  })
})

describe("field mapping", () => {
  it("moves values to the new habit's field, converting units", () => {
    const target = habit("t", "Read", { dataEntry: { enabled: true, fields: [{ id: "hours", type: "number", label: "Time", unit: "h" }] } })
    const map = buildFieldMap(["old-min"], [{ id: "old-min", type: "number", label: "Minutes", unit: "min" }], target)
    expect(map["old-min"]).toEqual({ fieldId: "hours", factor: 1 / 60 })
  })

  it("keeps values with no matching field under their old id", () => {
    const { planned } = plan()
    const first = planned.find((p) => p.index === 0)!
    expect(first.completion?.data).toEqual({ "reps-new": 25 })
    const target = habit("t", "Plain")
    expect(buildFieldMap(["a", "b"], [], target)).toEqual({})
  })
})

describe("planning", () => {
  it("imports into an empty day with the original date and time", () => {
    const { planned } = plan()
    const first = planned.find((p) => p.index === 0)!
    expect(first.action).toBe("import")
    expect(first.completion).toMatchObject({ habitId: "uuid-pull", date: "2026-01-07", completed: true, completedAt: "2026-01-08T11:49:22.162Z" })
  })

  it("counts every record exactly once", () => {
    const { planned } = plan()
    expect(planned).toHaveLength(7)
    expect(planned.filter((p) => p.action === "unresolved").map((p) => p.oldHabitId).sort()).toEqual(["1770460035823", "h3"])
  })

  it("skips identical days, so a second run writes nothing", () => {
    const first = plan()
    const written = first.planned.filter((p) => p.action === "import").map((p) => p.completion!)
    const second = plan(written)
    expect(second.planned.filter((p) => p.action === "import")).toHaveLength(0)
    expect(second.planned.filter((p) => p.action === "skip")).toHaveLength(written.length)
  })

  it("keeps what Liberture has and reports the conflict", () => {
    const existing = [{ habitId: "uuid-pull", date: "2026-01-07", completed: true, completedAt: "2026-01-07T10:00:00Z", data: { "reps-new": 20 }, context: "mine" }]
    const { planned } = plan(existing)
    expect(planned.find((p) => p.index === 0)).toMatchObject({ action: "conflict", reason: expect.stringMatching(/reps-new/) })
  })

  it("never un-marks a done day from completed: false", () => {
    const existing = [{ habitId: "uuid-mind", date: "2026-01-07", completed: true, data: {} }]
    for (const policy of ["preserve_existing", "merge_values"] as const) {
      const p = plan(existing, policy).planned.find((r) => r.index === 2)!
      expect(p.action).toBe("conflict")
      expect(p.reason).toMatch(/not done/)
    }
  })

  it("merge_values only adds what the day lacks", () => {
    const existing = [{ habitId: "uuid-pull", date: "2026-01-07", completed: true, data: {}, context: "mine" }]
    const p = plan(existing, "merge_values").planned.find((r) => r.index === 0)!
    expect(p.action).toBe("merge")
    expect(p.completion).toMatchObject({ completed: true, data: { "reps-new": 25 }, context: "mine" })
  })
})

describe("stats", () => {
  it("rebuilds streaks from the history, and archived habits keep their longest run", () => {
    const completions: HabitCompletion[] = [
      { habitId: "uuid-yoga", date: "2026-01-05", completed: true },
      { habitId: "uuid-yoga", date: "2026-01-06", completed: true },
      { habitId: "uuid-yoga", date: "2026-01-07", completed: true },
    ]
    const stale = current.map((h) => (h.id === "uuid-yoga" ? { ...h, streakData: { current: 9, longest: 40, freezesAvailable: 1, freezesUsed: 0, milestones: [] } } : h))
    const { habits, stats } = rebuildStreaks(stale, completions, new Set(["uuid-yoga"]), "2026-11-03")
    const yoga = habits.find((h) => h.id === "uuid-yoga")!
    expect(yoga.archived).toBe(true)
    expect(yoga.streakData).toMatchObject({ current: 0, longest: 3, freezesAvailable: 1 })
    expect(yoga.startDate).toBe("2026-01-05")
    expect(stats[0]).toMatchObject({ totalCompletions: 3, firstDate: "2026-01-05", byMonth: { "2026-01": 3 } })
    expect(habits.find((h) => h.id === "uuid-pull")).toBe(stale.find((h) => h.id === "uuid-pull"))
  })
})

describe("scale", () => {
  it("plans 12,000 records against 6,000 existing ones in well under a few seconds", () => {
    const habits = Array.from({ length: 20 }, (_, i) => habit(`new-${i}`, `Habit number ${i}`))
    const big = {
      habits: habits.map((h, i) => ({ id: `old-${i}`, name: h.name })),
      completions: Array.from({ length: 12_000 }, (_, i) => {
        const day = new Date(Date.UTC(2024, 0, 1 + Math.floor(i / 20))).toISOString().slice(0, 10)
        return { habitId: `old-${i % 20}`, date: day, completed: true, completedAt: `${day}T10:00:00.000Z`, data: {} }
      }),
    }
    const p = parseHabitHistoryBackup(big) as ParsedBackup
    const { matches } = buildHabitMapping(p.habits, p.records, habits, [])
    const existing = new Map<string, HabitCompletion>()
    for (const r of p.records.slice(0, 6_000)) existing.set(`new-${r.habitId.slice(4)}:${r.date}`, { habitId: `new-${r.habitId.slice(4)}`, date: r.date, completed: true, data: {} })
    const started = Date.now()
    const { planned } = planImport({ records: p.records, matches, backupHabits: p.habits, currentHabits: habits, explicit: [], existing, conflictPolicy: "preserve_existing" })
    expect(Date.now() - started).toBeLessThan(3_000)
    expect(planned.filter((x) => x.action === "import")).toHaveLength(6_000)
    expect(planned.filter((x) => x.action === "skip")).toHaveLength(6_000)
  })
})
