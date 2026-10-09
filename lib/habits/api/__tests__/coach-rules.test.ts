import { describe, expect, it } from "vitest"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { afternoonCheckIn, missedLoggingCheckIn, morningCheckIn, unloggedDueDays, weeklyCheckIn } from "@/lib/habits/coach/rules"
import { dueCheckIns } from "@/lib/habits/coach/checkins"
import type { Habit, HabitCompletion, StorageData, Todo } from "@/lib/habits/types"

// 2026-10-09 is a Friday; the week (Monday start) began on 2026-10-05.
const TODAY = "2026-10-09"
const at = (time: string, date = TODAY) => {
  const [h, m] = time.split(":").map(Number)
  return { date, minutes: h * 60 + m, dateObj: parseDateOnly(date) }
}

const habit = (id: string, name: string, extra: Partial<Habit> = {}): Habit =>
  ({ id, name, time: "", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-09-01T00:00:00.000Z", ...extra }) as Habit
const done = (habitId: string, date: string, completed = true): HabitCompletion => ({ habitId, date, completed })
const todo = (id: string, title: string, extra: Partial<Todo> = {}): Todo =>
  ({ id, title, priority: 3, status: "incomplete", createdAt: "2026-09-01T00:00:00.000Z", ...extra }) as Todo

const habits: Habit[] = [
  habit("med", "Meditate", { time: "07:00", priority: 5, implementationIntention: { trigger: "wake up", behavior: "sit for 2 minutes" } }),
  habit("run", "Run", { schedule: { type: "times_per_week", timesPerWeek: 3 }, priority: 3 }),
  habit("read", "Read", { time: "21:00", priority: 2 }),
  habit("old", "Old habit", { archived: true, archivedAt: "2026-09-10T00:00:00.000Z", priority: 5, time: "06:00" }),
]
const todos: Todo[] = [
  todo("rent", "Pay rent", { dueDate: "2026-10-07", priority: 4, subtasks: [{ id: "s1", title: "open the bank app", completed: false }] }),
  todo("mom", "Call mom", { dueDate: TODAY, dueTime: "16:00" }),
  todo("later", "Taxes", { dueDate: "2026-11-01", priority: 5 }),
]
const data = (extra: Partial<StorageData> = {}) => ({ habits, todos, preferences: { weekStartsOn: 1 as const }, ...extra }) as StorageData

describe("morning check-in", () => {
  it("picks two priorities — top habit and most urgent todo — and a first step", () => {
    const message = morningCheckIn(data(), [], at("07:30"))!
    expect(message.title).toBe("Two priorities for today")
    expect(message.body).toBe("Meditate at 07:00 · Pay rent (overdue). First step: sit for 2 minutes.")
    expect(message.url).toBe("/tracker?view=discover")
    expect(message.body).not.toContain("Old habit")
  })

  it("skips what's done and falls back to two habits, in Spanish when asked", () => {
    const message = morningCheckIn(data({ todos: [], preferences: { language: "es" } }), [done("med", TODAY)], at("07:30"))!
    expect(message.title).toBe("Dos prioridades para hoy")
    expect(message.body).toBe("Run · Read a las 21:00. Primer paso: Run.")
  })

  it("says nothing when nothing is due", () => {
    expect(morningCheckIn(data({ habits: [], todos: [] }), [], at("07:30"))).toBeNull()
  })
})

describe("afternoon check-in", () => {
  it("skips items whose time has passed and picks the soonest one ahead", () => {
    expect(afternoonCheckIn(data(), [], at("15:00"))!.body).toBe("Call mom at 16:00. Still a good moment for it.")
    expect(afternoonCheckIn(data(), [], at("16:30"))!.body).toBe("Read at 21:00. Still a good moment for it.")
  })

  it("falls back to an untimed item, and to nothing", () => {
    const completions = [done("read", TODAY)]
    expect(afternoonCheckIn(data(), completions, at("16:30"))!.body).toBe("Run is still open today. A few minutes now would do it.")
    expect(afternoonCheckIn(data({ habits: [habits[0]], todos: [] }), [], at("15:00"))).toBeNull()
  })
})

describe("weekly check-in", () => {
  const week = [
    ...["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"].map((d) => done("med", d)),
    ...["2026-10-05", "2026-10-07", "2026-10-08"].map((d) => done("run", d)),
  ]

  it("names what worked and where it slipped, and proposes one change", () => {
    const message = weeklyCheckIn(data(), week, at("18:00"))!
    expect(message.title).toBe("Your week")
    expect(message.body).toBe(
      "Worked: Run 3/3. Slipped: Read 0/7 and Meditate 4/7. Proposal: try Read at a different time than 21:00?"
    )
  })

  it("proposes a lower target when a habit is partly done, and phrases it as a question", () => {
    const message = weeklyCheckIn(data({ habits: [habits[0]] }), week, at("18:00"))!
    expect(message.body).toContain("Proposal: set Meditate to 4 times a week for now?")
  })

  it("proposes keeping the plan when everything was met", () => {
    const message = weeklyCheckIn(data({ habits: [habits[1]] }), week, at("18:00"))!
    expect(message.body).toBe("Worked: Run 3/3. Proposal: keep the same plan next week?")
  })
})

describe("missed logging", () => {
  const journal = habit("j", "Journal")
  const stretch = habit("s", "Stretch")
  const fresh = habit("f", "New one", { createdAt: "2026-10-08T12:00:00.000Z" })
  const completions = [done("j", "2026-10-05"), done("s", "2026-10-05"), done("s", "2026-10-06", false)]

  it("counts due days with no record at all; a 'not done' record counts as logged", () => {
    expect(unloggedDueDays(journal, completions, TODAY)).toBe(3)
    expect(unloggedDueDays(stretch, completions, TODAY)).toBe(2)
    expect(unloggedDueDays(fresh, completions, TODAY)).toBe(1)
  })

  it("asks about habits not logged for 3+ due days, not about ones logged as not done", () => {
    const message = missedLoggingCheckIn(data({ habits: [journal, stretch, fresh, { ...journal, id: "x", archived: true }] }), completions, at("18:00"))!
    expect(message.title).toBe("Skipped, or forgot to log?")
    expect(message.habits).toEqual([{ id: "j", name: "Journal", unloggedDueDays: 3 }])
    expect(message.body).toContain("Journal has no record for 3 due days")
  })

  it("says nothing when everything is logged", () => {
    expect(missedLoggingCheckIn(data({ habits: [stretch] }), completions, at("18:00"))).toBeNull()
  })
})

describe("which check-ins are due", () => {
  const prefs = (coach: NonNullable<StorageData["preferences"]>["coach"]) => ({ preferences: { coach } }) as StorageData

  it("fires in a five-minute window from the configured time; off by default", () => {
    const coach = { checkIns: { morning: "08:30", weekly: { day: 5, time: "18:00" } }, missedLogging: true }
    expect(dueCheckIns(prefs({}), at("08:30"))).toEqual([])
    expect(dueCheckIns(prefs(coach), at("08:29"))).toEqual([])
    expect(dueCheckIns(prefs(coach), at("08:34"))).toEqual(["morning"])
    expect(dueCheckIns(prefs(coach), at("08:35"))).toEqual([])
    // Friday 18:00: the weekly review (day 5) and missed logging.
    expect(dueCheckIns(prefs(coach), at("18:00"))).toEqual(["weekly", "missed_logging"])
    expect(dueCheckIns(prefs(coach), at("18:00", "2026-10-10"))).toEqual(["missed_logging"])
  })
})
