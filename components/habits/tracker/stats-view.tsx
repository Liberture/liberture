"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { CheckCheck, CircleDot, ListChecks, Repeat } from "lucide-react"

import { DateRangeFilter, type DateRange } from "@/components/habits/date-range-filter"
import { HabitSummary } from "@/components/habits/habit-summary"
import { HabitMatrix } from "@/components/habits/habit-matrix"
import { useTranslations } from "@/components/i18n/locale-provider"
import { useMobile } from "@/hooks/use-mobile"
import type { Habit, HabitCompletion, Todo } from "@/lib/habits/types"
import type { WeekStart } from "@/lib/habits/habit-utils"

function StatisticsLoading() {
  const t = useTranslations().habits.app.habitTracker
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card/60">
      <span className="text-sm text-muted-foreground">{t.loadingStatistics}</span>
    </div>
  )
}

function HelixLoading() {
  const t = useTranslations().habits.app.habitTracker
  return (
    <div className="flex h-[420px] items-center justify-center rounded-xl border border-border bg-card/60 sm:h-[520px]">
      <span className="text-sm text-muted-foreground">{t.loadingHelix}</span>
    </div>
  )
}

// recharts is only needed on the Stats view, so it loads on demand rather than
// being parsed on every cold start.
const HabitStatistics = dynamic(
  () => import("@/components/habits/habit-statistics").then((m) => m.HabitStatistics),
  { ssr: false, loading: () => <StatisticsLoading /> },
)

// The helix runs an animation loop over a canvas; it only matters once the
// stats view is open, so keep it out of the initial parse like the calendar.
const HabitHelix = dynamic(() => import("@/components/habits/habit-helix").then((m) => m.HabitHelix), {
  ssr: false,
  loading: () => <HelixLoading />,
})

interface StatsViewProps {
  /** Every habit; Stats is not filtered by the Habits view's toggles. */
  habits: Habit[]
  completions: HabitCompletion[]
  todos: Todo[]
  onToggleCompletion: (habitId: string, date: Date) => void
  /** Owned by the tracker so it survives switching views. */
  range: DateRange
  onRangeChange: (range: DateRange) => void
  /** First day of the week, for the picker and times-per-week targets. */
  weekStartsOn?: WeekStart
}

/**
 * The Stats view. The time-of-day filter and "show archived" belong to the
 * Habits view and deliberately do not reach in here: Stats always covers every
 * current (unarchived) habit, whatever the Habits view happens to be showing.
 */
export function StatsView({ habits, completions, todos, onToggleCompletion, range, onRangeChange, weekStartsOn = 1 }: StatsViewProps) {
  const app = useTranslations().habits.app
  const counts = app.settingsDialog
  const isMobile = useMobile()

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])
  const sortedHabits = useMemo(
    () => [...activeHabits].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00")),
    [activeHabits],
  )

  // Account totals — moved here from Settings, where they had no context.
  const totals = useMemo(() => [
    { icon: Repeat, label: counts.statHabits, value: activeHabits.length },
    { icon: CheckCheck, label: counts.statCheckIns, value: completions.filter((c) => c.completed).length },
    { icon: CircleDot, label: counts.statOpenTodos, value: todos.filter((item) => item.status !== "completed").length },
    { icon: ListChecks, label: counts.statDoneTodos, value: todos.filter((item) => item.status === "completed").length },
  ], [activeHabits.length, completions, todos, counts])

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {totals.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card/60 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </dt>
            <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <DateRangeFilter value={range} onChange={onRangeChange} weekStartsOn={weekStartsOn} />
      <HabitStatistics habits={activeHabits} completions={completions} range={range} weekStartsOn={weekStartsOn} />
      <HabitSummary habits={activeHabits} completions={completions} range={range} weekStartsOn={weekStartsOn} />
      <HabitHelix habits={activeHabits} completions={completions} range={range} weekStartsOn={weekStartsOn} />
      {!isMobile && (
        <HabitMatrix
          habits={sortedHabits}
          completions={completions}
          weekStartsOn={weekStartsOn}
          // Same routing as the Habits view: data/reading habits open their modal.
          onToggleCompletion={onToggleCompletion}
        />
      )}
    </div>
  )
}
