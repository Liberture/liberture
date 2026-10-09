import { spokenList } from "@/lib/habits/api/resolve"
import { formatDateOnly, parseDateOnly } from "@/lib/habits/date-utils"
import { isHabitActiveOnDate, isHabitDueOnDate, weeklyProgress, type WeekStart, type WeeklyProgress } from "@/lib/habits/habit-utils"
import type { Habit, HabitCompletion, StorageData, Todo } from "@/lib/habits/types"
import { formatMessage } from "@/lib/i18n-format"
import { translations, type Locale } from "@/lib/translations"
import type { LocalNow } from "@/lib/habits/coach/limits"

/**
 * The coach's proactive check-ins as pure functions of the user's data and
 * wall clock: (data, completions, localNow, locale) → a message, or null when
 * there is nothing worth saying. The scheduler (checkins.ts) decides when to
 * run them and whether the limits allow sending; nothing here touches the
 * database. Archived habits never appear.
 */

export interface CoachMessage {
  title: string
  body: string
  url: string
}

export interface MissedLoggingMessage extends CoachMessage {
  habits: { id: string; name: string; unloggedDueDays: number }[]
}

export const COACH_URL = "/tracker?view=discover"

/** How many due days without any record before the coach asks. */
export const MISSED_LOGGING_DAYS = 3
const LOOKBACK_DAYS = 21

type CoachData = Pick<StorageData, "habits" | "todos" | "preferences">

export function coachLocale(data: Pick<StorageData, "preferences"> | null | undefined): Locale {
  return data?.preferences?.language === "es" ? "es" : "en"
}

function copy(locale: Locale) {
  return translations[locale].habits.app.coachMessages
}

function weekStart(data: CoachData): WeekStart {
  return data.preferences?.weekStartsOn === 0 ? 0 : 1
}

function activeHabits(data: CoachData): Habit[] {
  return (data.habits ?? []).filter((h) => !h.archived)
}

function minutesOf(time: string | undefined): number | null {
  const m = time?.match(/^(\d{1,2}):(\d{2})$/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

function doneOn(habitId: string, date: string, completions: HabitCompletion[]): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === date && c.completed)
}

/** Habits due today and not done yet, most important first, then by time (untimed last). */
function pendingHabits(data: CoachData, completions: HabitCompletion[], localNow: LocalNow): Habit[] {
  const today = parseDateOnly(localNow.date)
  return activeHabits(data)
    .filter((h) => isHabitDueOnDate(h, today, completions, weekStart(data), today) && !doneOn(h.id, localNow.date, completions))
    .sort((a, b) => (b.priority ?? 3) - (a.priority ?? 3) || (minutesOf(a.time) ?? 1e4) - (minutesOf(b.time) ?? 1e4))
}

/** Open todos due today or earlier: overdue first, then by priority. */
function urgentTodos(data: CoachData, localNow: LocalNow): Todo[] {
  return (data.todos ?? [])
    .filter((t) => t.status !== "completed" && t.dueDate && t.dueDate <= localNow.date)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0) || b.priority - a.priority)
}

function habitLabel(habit: Habit, locale: Locale): string {
  const t = copy(locale)
  return habit.time ? formatMessage(t.atTime, { name: habit.name.trim(), time: habit.time }) : habit.name.trim()
}

function todoLabel(todo: Todo, localNow: LocalNow, locale: Locale): string {
  const t = copy(locale)
  return formatMessage(todo.dueDate! < localNow.date ? t.overdue : t.dueToday, { name: todo.title.trim() })
}

/**
 * Morning: two priorities — the most important habit due today and the most
 * urgent todo (or the top two of whichever exists) — and a first action: the
 * habit's tiny behaviour or the todo's first open step.
 */
export function morningCheckIn(data: CoachData, completions: HabitCompletion[], localNow: LocalNow, locale: Locale = coachLocale(data)): CoachMessage | null {
  const t = copy(locale)
  const habits = pendingHabits(data, completions, localNow)
  const todos = urgentTodos(data, localNow)
  type Item = { kind: "habit"; habit: Habit } | { kind: "todo"; todo: Todo }
  const picks: Item[] = []
  if (habits[0]) picks.push({ kind: "habit", habit: habits[0] })
  if (todos[0]) picks.push({ kind: "todo", todo: todos[0] })
  if (picks.length < 2 && habits[1]) picks.push({ kind: "habit", habit: habits[1] })
  if (picks.length < 2 && todos[1]) picks.push({ kind: "todo", todo: todos[1] })
  if (!picks.length) return null

  const labels = picks.map((p) => (p.kind === "habit" ? habitLabel(p.habit, locale) : todoLabel(p.todo, localNow, locale)))
  const first = picks[0]
  const action =
    first.kind === "habit"
      ? first.habit.implementationIntention?.behavior?.trim() || first.habit.name.trim()
      : first.todo.subtasks?.find((s) => !s.completed)?.title?.trim() || first.todo.title.trim()

  return {
    title: picks.length === 2 ? t.morningTitle : t.morningTitleOne,
    body: formatMessage(t.morningBody, { priorities: labels.join(" · "), action }),
    url: COACH_URL,
  }
}

/**
 * Afternoon: the next pending thing that still makes sense — a habit or todo
 * whose time hasn't passed (soonest first), else the most important one with
 * no time at all. Anything whose time is already behind us is left alone.
 */
export function afternoonCheckIn(data: CoachData, completions: HabitCompletion[], localNow: LocalNow, locale: Locale = coachLocale(data)): CoachMessage | null {
  const t = copy(locale)
  type Item = { name: string; minutes: number | null; time?: string; priority: number }
  const items: Item[] = [
    ...pendingHabits(data, completions, localNow).map((h) => ({ name: h.name.trim(), minutes: minutesOf(h.time), time: h.time, priority: h.priority ?? 3 })),
    ...urgentTodos(data, localNow)
      .filter((todo) => todo.dueDate === localNow.date)
      .map((todo) => ({ name: todo.title.trim(), minutes: minutesOf(todo.dueTime), time: todo.dueTime, priority: todo.priority })),
  ]
  const timed = items.filter((i) => i.minutes !== null && i.minutes >= localNow.minutes).sort((a, b) => a.minutes! - b.minutes!)
  if (timed[0]) {
    return { title: t.afternoonTitle, body: formatMessage(t.afternoonTimed, { name: timed[0].name, time: timed[0].time! }), url: COACH_URL }
  }
  const anytime = items.filter((i) => i.minutes === null).sort((a, b) => b.priority - a.priority)
  if (anytime[0]) return { title: t.afternoonTitle, body: formatMessage(t.afternoonAnytime, { name: anytime[0].name }), url: COACH_URL }
  return null
}

/**
 * Weekly: each habit's progress this week, what worked (target met or on
 * track), where it slipped (furthest behind), and one change — worded as a
 * proposal, never applied.
 */
export function weeklyCheckIn(data: CoachData, completions: HabitCompletion[], localNow: LocalNow, locale: Locale = coachLocale(data)): CoachMessage | null {
  const t = copy(locale)
  const today = parseDateOnly(localNow.date)
  const rows = activeHabits(data)
    .map((habit) => ({ habit, progress: weeklyProgress(habit, completions, today, weekStart(data)) }))
    .filter((r) => r.progress.target > 0)
  if (!rows.length) return null

  const ratio = (p: WeeklyProgress) => Math.min(1, p.done / p.target)
  const item = (r: (typeof rows)[number]) => formatMessage(t.weeklyItem, { name: r.habit.name.trim(), done: r.progress.done, target: r.progress.target })
  const worked = rows.filter((r) => r.progress.met).sort((a, b) => b.progress.done - a.progress.done)
  const slipped = rows.filter((r) => !r.progress.met).sort((a, b) => ratio(a.progress) - ratio(b.progress) || (b.habit.priority ?? 3) - (a.habit.priority ?? 3))

  const parts: string[] = []
  if (worked.length) parts.push(formatMessage(t.weeklyWorked, { list: spokenList(worked.slice(0, 3).map(item), t.and) }))
  if (slipped.length) parts.push(formatMessage(t.weeklyFriction, { list: spokenList(slipped.slice(0, 2).map(item), t.and) }))
  if (!rows.some((r) => r.progress.done > 0)) parts.unshift(t.weeklyNothingYet)

  const focus = slipped[0]
  if (!focus) parts.push(t.proposeKeep)
  else {
    const name = focus.habit.name.trim()
    const { done, target } = focus.progress
    if (done === 0 && focus.habit.time) parts.push(formatMessage(t.proposeTime, { name, time: focus.habit.time }))
    else if (done > 0 && done < target) parts.push(formatMessage(t.proposeLower, { name, count: Math.max(1, done) }))
    else parts.push(formatMessage(t.proposeSmaller, { name }))
  }

  return { title: t.weeklyTitle, body: parts.join(" "), url: COACH_URL }
}

/**
 * Consecutive due days before `date` (today itself is still open) with no
 * record at all. A record that says "not done" counts as logged: not logged
 * is not the same as not done.
 */
export function unloggedDueDays(habit: Habit, completions: HabitCompletion[], date: string, weekStartsOn: WeekStart = 1): number {
  const logged = new Set(completions.filter((c) => c.habitId === habit.id).map((c) => c.date))
  const now = parseDateOnly(date)
  const day = parseDateOnly(date)
  let count = 0
  for (let i = 1; i <= LOOKBACK_DAYS; i++) {
    day.setDate(day.getDate() - 1)
    const key = formatDateOnly(day)
    if (logged.has(key)) break
    // Before the habit existed (or while archived): nothing to ask about.
    if (!isHabitActiveOnDate(habit, day, now)) break
    if (isHabitDueOnDate(habit, day, completions, weekStartsOn, now)) count++
  }
  return count
}

/** The last day with a completed record, or null. */
export function lastLoggedOn(habitId: string, completions: HabitCompletion[]): string | null {
  let last: string | null = null
  for (const c of completions) if (c.habitId === habitId && c.completed && (!last || c.date > last)) last = c.date
  return last
}

/** Missed logging: habits with no record for MISSED_LOGGING_DAYS or more due days. */
export function missedLoggingCheckIn(
  data: CoachData,
  completions: HabitCompletion[],
  localNow: LocalNow,
  locale: Locale = coachLocale(data)
): MissedLoggingMessage | null {
  const t = copy(locale)
  const habits = activeHabits(data)
    .map((h) => ({ id: h.id, name: h.name.trim(), unloggedDueDays: unloggedDueDays(h, completions, localNow.date, weekStart(data)) }))
    .filter((h) => h.unloggedDueDays >= MISSED_LOGGING_DAYS)
    .sort((a, b) => b.unloggedDueDays - a.unloggedDueDays)
  if (!habits.length) return null
  const body =
    habits.length === 1
      ? formatMessage(t.missedBodyOne, { name: habits[0].name, count: habits[0].unloggedDueDays })
      : formatMessage(t.missedBodyMany, { list: spokenList(habits.slice(0, 3).map((h) => h.name), t.and) })
  return { title: t.missedTitle, body, url: COACH_URL, habits }
}
