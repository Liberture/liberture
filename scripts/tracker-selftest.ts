import { CATALOG_PROTOCOLS, STANDALONE_HABITS } from "../lib/tracker/catalog"
import {
  addDays,
  calculateStreak,
  completionRate,
  dateKey,
  habitsForDate,
  isScheduledOn,
  scheduleLabel,
} from "../lib/tracker/streaks"
import type { Completion, Habit } from "../lib/tracker/types"

let pass = 0
let fail = 0
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) pass++
  else {
    fail++
    console.log(`  ✗ ${name}\n      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    return
  }
  console.log(`  ✓ ${name}`)
}

const TODAY = new Date(2026, 7, 3) // Mon 3 Aug 2026

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Test",
    why: "",
    pillar: "sleep",
    time: "07:00",
    schedule: { type: "daily" },
    difficulty: "easy",
    timeOfDay: "morning",
    createdAt: new Date(2026, 6, 1).toISOString(),
    ...over,
  }
}

const comps = (h: Habit, ...offsets: number[]): Completion[] =>
  offsets.map((o) => ({
    habitId: h.id,
    date: dateKey(addDays(TODAY, -o)),
    completedAt: new Date().toISOString(),
  }))

console.log("\ncatalog")
check("12 protocols, all with habits", CATALOG_PROTOCOLS.length, 12)
check("every protocol has >=1 habit", CATALOG_PROTOCOLS.every((p) => p.habits.length > 0), true)
check("every protocol has evidence", CATALOG_PROTOCOLS.every((p) => p.evidence.length > 0), true)
check(
  "habit slugs are globally unique",
  new Set([
    ...CATALOG_PROTOCOLS.flatMap((p) => p.habits.map((h) => h.slug)),
    ...STANDALONE_HABITS.map((h) => h.slug),
  ]).size,
  CATALOG_PROTOCOLS.reduce((n, p) => n + p.habits.length, 0) + STANDALONE_HABITS.length,
)
check("all six pillars represented", new Set(CATALOG_PROTOCOLS.map((p) => p.pillar)).size, 6)

// A protocol whose duration states "N/week" must not expand into habits scheduled
// more often than that — the tracker would then contradict the protocol it came from.
{
  const drift: string[] = []
  for (const p of CATALOG_PROTOCOLS) {
    const perWeek = /(\d+)\s*\/\s*week|×\s*(\d+)\s*\/\s*week|(\d+)\s*×[^/]*\/week/.exec(p.duration)
    if (!perWeek) continue
    const stated = Number(perWeek[1] ?? perWeek[2] ?? perWeek[3])
    for (const h of p.habits) {
      const days =
        h.schedule.type === "daily"
          ? 7
          : h.schedule.type === "specific_days"
            ? h.schedule.days.length
            : h.schedule.timesPerWeek
      if (days > stated) drift.push(`${p.slug}/${h.slug}: ${days}×/wk vs stated ${stated}×/wk`)
    }
  }
  check("habit cadence never exceeds the protocol's stated frequency", drift, [])
}

console.log("\nstreaks — daily habit")
{
  const h = habit()
  check("3 consecutive days incl. today", calculateStreak(h, comps(h, 0, 1, 2), TODAY).current, 3)
  check("today not yet done doesn't break streak", calculateStreak(h, comps(h, 1, 2), TODAY).current, 2)
  check("gap yesterday resets to 0", calculateStreak(h, comps(h, 2, 3), TODAY).current, 0)
  check("no completions", calculateStreak(h, [], TODAY), { current: 0, longest: 0 })
  check("longest survives a later gap", calculateStreak(h, comps(h, 5, 6, 7, 8, 0), TODAY).longest, 4)
}

console.log("\nstreaks — weekday-only habit")
{
  // Mon-Fri habit. TODAY is Monday; the weekend before must not break the streak.
  const h = habit({ schedule: { type: "specific_days", days: [1, 2, 3, 4, 5] } })
  const weekdayHits = comps(h, 0, 3, 4, 5, 6) // Mon, Fri, Thu, Wed, Tue
  check("weekend skipped, not counted as a miss", calculateStreak(h, weekdayHits, TODAY).current, 5)
  check("Sunday is not scheduled", isScheduledOn(h.schedule, new Date(2026, 7, 2)), false)
  check("Monday is scheduled", isScheduledOn(h.schedule, TODAY), true)
}

console.log("\ncompletion rate")
{
  const h = habit({ createdAt: new Date(2026, 6, 1).toISOString() })
  check("7/7 days done = 100%", completionRate(h, comps(h, 0, 1, 2, 3, 4, 5, 6), 7, TODAY), 100)
  // 6 prior days, 3 done, today not done -> today excluded from the denominator
  check("3 of last 6, today pending = 50%", completionRate(h, comps(h, 1, 2, 3), 7, TODAY), 50)
  check("no history = 0%", completionRate(h, [], 7, TODAY), 0)
}

console.log("\nschedule labels + day view")
{
  check("weekdays label", scheduleLabel({ type: "specific_days", days: [1, 2, 3, 4, 5] }), "Weekdays")
  check("weekends label", scheduleLabel({ type: "specific_days", days: [0, 6] }), "Weekends")
  check("daily label", scheduleLabel({ type: "daily" }), "Every day")
  check("times per week", scheduleLabel({ type: "times_per_week", timesPerWeek: 3 }), "3× per week")

  const a = habit({ id: "a", time: "18:00" })
  const b = habit({ id: "b", time: "06:00" })
  const c = habit({ id: "c", time: "12:00", schedule: { type: "specific_days", days: [0] } })
  check("today's list is time-sorted and schedule-filtered", habitsForDate([a, b, c], TODAY).map((h) => h.id), ["b", "a"])
  check("archived habits excluded", habitsForDate([{ ...a, archived: true }, b], TODAY).map((h) => h.id), ["b"])
}

console.log("\ndate handling")
{
  // The classic bug: toISOString() in a negative UTC offset reports yesterday.
  const d = new Date(2026, 7, 3, 1, 30)
  check("dateKey uses local time", dateKey(d), "2026-08-03")

  // A habit created late in the local day rolls over to the next UTC date.
  // Reading the start day off the raw ISO string then places it after every
  // completion, silently zeroing streaks and rates.
  const lateLocal = new Date(2026, 7, 3, 23, 30)
  const h = habit({ createdAt: lateLocal.toISOString() })
  const doneToday: Completion[] = [
    { habitId: h.id, date: dateKey(lateLocal), completedAt: lateLocal.toISOString() },
  ]
  check("streak counts a habit created late in the local day", calculateStreak(h, doneToday, TODAY).current, 1)
  check("rate counts a habit created late in the local day", completionRate(h, doneToday, 7, TODAY), 100)
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
