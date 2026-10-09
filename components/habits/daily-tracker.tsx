"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { addDays, differenceInCalendarDays, format, isSameDay, isValid, parseISO, startOfDay } from "date-fns"
import { CalendarDays, ChevronLeft, ChevronRight, Compass, Flame, Plus, Sparkles, Store, TrendingUp } from "lucide-react"

import { HabitRow } from "@/components/habits/tracker/habit-row"
import {
  calculateStreak,
  calculateSuccessCounts,
  getNextMilestone,
  isHabitDueOnDate,
  weeklyProgress,
  type WeekStart,
} from "@/lib/habits/habit-utils"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

type TrackerStrings = ReturnType<typeof useTranslations>["habits"]["app"]["dailyTracker"]

/**
 * The day view, ported from Liberture's tracker page: a centred column with a
 * stat header, a day navigator, and one card per habit scheduled that day.
 */

interface DailyTrackerProps {
  habits: Habit[]
  completions: HabitCompletion[]
  displayName?: string
  motivationalMessage?: string
  onToggleCompletion: (habitId: string, date: Date) => void
  onLogData: (habitId: string, date: Date) => void
  /** Opens the habit dialog — the only place a habit can be deleted (with a confirm). */
  onEditHabit: (habitId: string) => void
  onAddHabit: () => void
  /** Opens Discover (catalog + coach). */
  onBrowse: () => void
  timeOfDayFilter: string | null
  onTimeOfDayFilterChange: (value: string | null) => void
  /** First day of the week, for times-per-week targets. */
  weekStartsOn?: WeekStart
}

/** Filter buckets, keyed to the habit's inferred `timeOfDay`. Labels live in `dailyTracker.timeFilters`. */
const TIME_FILTERS: Array<{ id: string | null; labelKey: "allDay" | "morning" | "afternoon" | "evening" }> = [
  { id: null, labelKey: "allDay" },
  { id: "morning", labelKey: "morning" },
  { id: "afternoon", labelKey: "afternoon" },
  { id: "evening", labelKey: "evening" },
]

function greeting(t: TrackerStrings, name?: string): string {
  const hour = new Date().getHours()
  const template = hour < 12 ? t.greetingMorning : hour < 18 ? t.greetingAfternoon : t.greetingEvening
  return name ? formatMessage(template, { name }) : t.greetingDefault
}

/**
 * Memoised: the view track keeps every visited screen mounted, so this
 * re-renders whenever it becomes active again. With stable props that is pure
 * waste — this component is one of the expensive ones to rebuild.
 */
export const DailyTracker = memo(function DailyTracker({
  habits,
  completions,
  displayName,
  motivationalMessage,
  onToggleCompletion,
  onLogData,
  onEditHabit,
  onAddHabit,
  onBrowse,
  timeOfDayFilter,
  onTimeOfDayFilterChange,
  weekStartsOn = 1,
}: DailyTrackerProps) {
  const t = useTranslations().habits.app.dailyTracker
  const locale = useLocale()
  const [offset, setOffset] = useState(0)

  const viewDate = useMemo(() => addDays(startOfDay(new Date()), offset), [offset])
  const viewDateStr = format(viewDate, "yyyy-MM-dd")

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])

  // The shared due check: stepping back to a past day does not list habits
  // that did not exist yet or were archived then, and a times-per-week habit
  // drops off once that week's target was met on earlier days.
  const todays = useMemo(
    () =>
      activeHabits
        .filter((h) => isHabitDueOnDate(h, viewDate, completions, weekStartsOn))
        .filter((h) => !timeOfDayFilter || h.timeOfDay === timeOfDayFilter)
        .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [activeHabits, viewDate, completions, weekStartsOn, timeOfDayFilter]
  )

  // date+habit → completed, so each card is an O(1) lookup.
  const completedKeys = useMemo(() => {
    const set = new Set<string>()
    for (const c of completions) {
      if (c.completed) set.add(`${c.date}:${c.habitId}`)
    }
    return set
  }, [completions])

  /**
   * Done habits sink to the bottom, keeping their time order within each group.
   * They stay on the list rather than disappearing: the day still has to be
   * un-checkable, and a stack of finished rows is the point of the screen.
   */
  const { pending, finished } = useMemo(() => {
    const pending: Habit[] = []
    const finished: Habit[] = []
    for (const habit of todays) {
      if (completedKeys.has(`${viewDateStr}:${habit.id}`)) finished.push(habit)
      else pending.push(habit)
    }
    return { pending, finished }
  }, [todays, completedKeys, viewDateStr])

  // Completions bucketed by habit, built once. calculateStreak filters the array
  // it is given, so handing it the full list made this O(habits × completions) —
  // 28 x 957 on real data, redone on every single toggle. Bucketing first makes
  // it O(completions).
  const completionsByHabit = useMemo(() => {
    const map = new Map<string, HabitCompletion[]>()
    for (const completion of completions) {
      const list = map.get(completion.habitId)
      if (list) list.push(completion)
      else map.set(completion.habitId, [completion])
    }
    return map
  }, [completions])

  const streaks = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateStreak>>()
    const empty: HabitCompletion[] = []
    for (const habit of activeHabits) {
      map.set(
        habit.id,
        calculateStreak(habit.id, completionsByHabit.get(habit.id) ?? empty, habit.streakData, habit, new Date(), weekStartsOn)
      )
    }
    return map
  }, [activeHabits, completionsByHabit, weekStartsOn])

  // "2/3 this week" for times-per-week habits, for the viewed day's week.
  const weekProgress = useMemo(() => {
    const map = new Map<string, { done: number; target: number }>()
    const empty: HabitCompletion[] = []
    for (const habit of activeHabits) {
      if (habit.schedule?.type !== "times_per_week") continue
      const p = weeklyProgress(habit, completionsByHabit.get(habit.id) ?? empty, viewDate, weekStartsOn)
      map.set(habit.id, { done: p.done, target: p.target })
    }
    return map
  }, [activeHabits, completionsByHabit, viewDate, weekStartsOn])

  const stats = useMemo(() => {
    // Milestones and the header count days, so week streaks stay out of them;
    // those show on their own rows with their unit.
    let bestStreak = 0
    let currentBest = 0
    for (const streak of streaks.values()) {
      if (streak.unit === "weeks") continue
      bestStreak = Math.max(bestStreak, streak.longest)
      currentBest = Math.max(currentBest, streak.current)
    }

    // Completion rate over the trailing week: scheduled days, or the weekly
    // target for times-per-week habits (rest days aren't misses).
    let scheduled = 0
    let done = 0
    const today = startOfDay(new Date())
    const empty: HabitCompletion[] = []
    for (const habit of activeHabits) {
      const counts = calculateSuccessCounts(habit, completionsByHabit.get(habit.id) ?? empty, 7, today, weekStartsOn, today)
      scheduled += counts.expected
      done += counts.done
    }

    const protocols = new Set(
      activeHabits.map((h) => h.protocolSlug).filter((slug): slug is string => Boolean(slug))
    )

    return {
      habitCount: activeHabits.length,
      bestStreak,
      currentBest,
      avg7: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
      protocolCount: protocols.size,
    }
  }, [streaks, activeHabits, completionsByHabit, weekStartsOn])

  // Stable per viewed day, so a toggle re-renders one card rather than the list.
  const toggleForDay = useCallback(
    (habitId: string) => onToggleCompletion(habitId, viewDate),
    [onToggleCompletion, viewDate]
  )
  const logForDay = useCallback(
    (habitId: string) => onLogData(habitId, viewDate),
    [onLogData, viewDate]
  )

  const doneToday = todays.filter((h) => completedKeys.has(`${viewDateStr}:${h.id}`)).length
  const progress = todays.length === 0 ? 0 : Math.round((doneToday / todays.length) * 100)

  const isToday = isSameDay(viewDate, new Date())
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const label = isToday
    ? t.today
    : viewDate.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" })

  const milestone = getNextMilestone(stats.currentBest)

  return (
    <div className="relative overflow-hidden">
      <div className="relative mx-auto max-w-3xl px-1 py-6 sm:px-4 sm:py-12">
        {motivationalMessage ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-work/10 p-3">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-foreground">{motivationalMessage}</p>
          </div>
        ) : null}

        <header className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-sm font-medium uppercase tracking-wider text-primary">{t.eyebrow}</span>
              <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{greeting(t, displayName)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBrowse}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
              >
                <Compass className="h-4 w-4" aria-hidden />
                {t.browse}
              </button>
              <button
                type="button"
                onClick={onAddHabit}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t.addHabit}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={CalendarDays} label={t.statHabits} value={String(stats.habitCount)} />
            <Stat icon={Flame} label={t.statBestStreak} value={String(stats.bestStreak)} tone="text-exercise" />
            <Stat icon={TrendingUp} label={t.stat7DayRate} value={`${stats.avg7}%`} tone="text-nutrition" />
            <Stat icon={Store} label={t.statProtocols} value={String(stats.protocolCount)} tone="text-mind" />
          </div>
        </header>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOffset((o) => o - 1)}
                aria-label={t.previousDay}
                className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <h2 className="min-w-[7rem] text-center font-semibold text-foreground" aria-live="polite">{label}</h2>
              <button
                type="button"
                onClick={() => setOffset((o) => Math.min(0, o + 1))}
                disabled={offset >= 0}
                aria-label={t.nextDay}
                className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              {/* Jump to any past day. The native picker is the accessible,
                  touch-friendly one on every platform. */}
              <label className="relative flex cursor-pointer items-center rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-white/25 hover:text-foreground">
                <CalendarDays className="h-4 w-4" aria-hidden />
                <span className="sr-only">{t.pickDate}</span>
                <input
                  type="date"
                  value={viewDateStr}
                  max={todayStr}
                  onChange={(event) => {
                    const picked = parseISO(event.target.value)
                    if (!isValid(picked)) return
                    setOffset(Math.min(0, differenceInCalendarDays(picked, startOfDay(new Date()))))
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              {!isToday ? (
                <button
                  type="button"
                  onClick={() => setOffset(0)}
                  className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  {t.jumpToToday}
                </button>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {formatMessage(t.doneCount, { done: doneToday, total: todays.length })}
            </p>
          </div>

          {/* Time-of-day filter — lives with the list it filters, not in the header. */}
          <div data-no-swipe
            className="custom-scrollbar lb-scroll-x mb-4 -mx-1 flex gap-2 px-1">
            {TIME_FILTERS.map(({ id, labelKey }) => (
              <button
                key={labelKey}
                type="button"
                onClick={() => onTimeOfDayFilterChange(id)}
                aria-pressed={timeOfDayFilter === id}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  timeOfDayFilter === id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                )}
              >
                {t.timeFilters[labelKey]}
              </button>
            ))}
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-sleep to-nutrition transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {todays.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="text-muted-foreground">
                {activeHabits.length === 0
                  ? t.noHabits
                  : t.nothingScheduled}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onAddHabit}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t.addHabit}
                </button>
                <button
                  type="button"
                  onClick={onBrowse}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
                >
                  <Store className="h-4 w-4" aria-hidden />
                  {t.addProtocol}
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {pending.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    completed={false}
                    streak={streaks.get(habit.id) ?? { current: 0 }}
                    week={weekProgress.get(habit.id)}
                    onToggle={toggleForDay}
                    onLogData={logForDay}
                    onEdit={onEditHabit}
                  />
                ))}
              </ul>

              {finished.length > 0 ? (
                <>
                  <div className="mt-6 mb-3 flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.doneHeading}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">
                      {finished.length}
                    </span>
                    <span className="h-px flex-1 bg-border/60" aria-hidden />
                  </div>
                  <ul className="space-y-3 opacity-70 transition-opacity hover:opacity-100">
                    {finished.map((habit) => (
                      <HabitRow
                        key={habit.id}
                        habit={habit}
                        completed
                        streak={streaks.get(habit.id) ?? { current: 0 }}
                        week={weekProgress.get(habit.id)}
                        onToggle={toggleForDay}
                        onLogData={logForDay}
                        onEdit={onEditHabit}
                      />
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </section>

        {stats.currentBest > 0 && milestone > stats.currentBest ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {plural(t.milestoneHint, milestone - stats.currentBest, { milestone })}
          </p>
        ) : null}
      </div>
    </div>
  )
})

function Stat({
  icon: Icon,
  label,
  value,
  tone = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <Icon className={cn("h-4 w-4", tone)} aria-hidden />
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
