"use client"

import { memo, useLayoutEffect, useMemo, useRef, useState } from "react"
import { differenceInCalendarDays, format, isSameMonth, startOfDay, subDays } from "date-fns"
import { CalendarRange } from "lucide-react"

import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { calculateSuccessCounts, isHabitDueOnDate, isHabitScheduledOnDate, type WeekStart } from "@/lib/habits/habit-utils"
import {
  PILLAR_HEX,
  PILLAR_IDS,
  PILLAR_STYLES,
  pillarForHabit,
  type PillarId,
} from "@/lib/habits/pillars"
import { cn } from "@/lib/utils"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

/**
 * Full-history completion matrix: every habit as a row, every day in the range
 * as a column. The point is to read months of history at a glance instead of
 * paging through the 7-day window in the standard grid. Desktop only — at these
 * cell sizes it needs the horizontal room.
 *
 * Rows are grouped by pillar so the six colour families read as blocks, and the
 * cell size shrinks as the range grows so a year still fits in a reasonable
 * amount of scrolling.
 */

interface HoveredCell {
  day: Date
  habitName: string
  status: string
}

type RangeKey = "30d" | "90d" | "6m" | "1y" | "all"

/** Labels live in translations (`habitMatrix.ranges`), keyed by `key`. */
const RANGES: Array<{ key: RangeKey; days: number | null }> = [
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
  { key: "6m", days: 180 },
  { key: "1y", days: 365 },
  { key: "all", days: null },
]

/**
 * Cell geometry per range. Short ranges get the chunky 40px-ish toggles of the
 * standard grid; long ranges shrink because a year at that size would be tens
 * of thousands of pixels of scrolling. `row` is the row height for that range —
 * shared by the label column and the cell track so the two stay aligned.
 */
const CELL: Record<RangeKey, { size: number; gap: number; row: number; radius: number }> = {
  "30d": { size: 34, gap: 6, row: 46, radius: 8 },
  "90d": { size: 22, gap: 4, row: 34, radius: 5 },
  "6m": { size: 14, gap: 3, row: 28, radius: 4 },
  "1y": { size: 10, gap: 2, row: 28, radius: 3 },
  all: { size: 8, gap: 2, row: 28, radius: 2 },
}

/** Two years is where this stops being readable, and where the DOM gets heavy. */
const MAX_ALL_DAYS = 730

interface HabitMatrixProps {
  habits: Habit[]
  completions: HabitCompletion[]
  onToggleCompletion: (habitId: string, date: Date) => void
  /** First day of the week, for times-per-week targets. */
  weekStartsOn?: WeekStart
}

export function HabitMatrix({ habits, completions, onToggleCompletion, weekStartsOn = 1 }: HabitMatrixProps) {
  const t = useTranslations().habits.app.habitMatrix
  const dateLocale = useDateLocale()
  const [range, setRange] = useState<RangeKey>("90d")
  const [hovered, setHovered] = useState<HoveredCell | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const { size: cellSize, gap: cellGap, row: rowHeight, radius: cellRadius } = CELL[range]
  const step = cellSize + cellGap

  // "All" runs from the earliest completion on record, clamped so an old
  // account doesn't render years of mostly-empty columns.
  const dayCount = useMemo(() => {
    const preset = RANGES.find((r) => r.key === range)?.days
    if (preset) return preset

    let earliest: string | null = null
    for (const c of completions) {
      if (!c.completed) continue
      if (!earliest || c.date < earliest) earliest = c.date
    }
    if (!earliest) return 90

    const span = differenceInCalendarDays(new Date(), new Date(`${earliest}T00:00:00`)) + 1
    return Math.min(Math.max(span, 30), MAX_ALL_DAYS)
  }, [range, completions])

  // Newest → oldest: today is pinned at the left edge and history accumulates
  // to the right, so the day that matters is visible without scrolling.
  const days = useMemo(() => {
    const today = startOfDay(new Date())
    return Array.from({ length: dayCount }, (_, i) => subDays(today, i))
  }, [dayCount])

  const dayStrings = useMemo(() => days.map((d) => format(d, "yyyy-MM-dd")), [days])

  // habitId → set of completed date strings, so cell lookup is O(1).
  const completedByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const completion of completions) {
      if (!completion.completed) continue
      let set = map.get(completion.habitId)
      if (!set) {
        set = new Set()
        map.set(completion.habitId, set)
      }
      set.add(completion.date)
    }
    return map
  }, [completions])

  // Rows grouped by pillar. Both columns render from this one list so the left
  // labels and the right cells stay aligned row-for-row.
  const groups = useMemo(() => {
    const byPillar = new Map<PillarId, Habit[]>()
    for (const habit of habits) {
      if (habit.archived) continue
      const pillar = pillarForHabit(habit)
      const list = byPillar.get(pillar)
      if (list) list.push(habit)
      else byPillar.set(pillar, [habit])
    }
    return PILLAR_IDS.filter((p) => byPillar.has(p)).map((pillar) => ({
      pillar,
      habits: (byPillar.get(pillar) ?? []).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    }))
  }, [habits])

  // Completions per habit, so the shared rate only scans one habit's rows.
  const completionsByHabit = useMemo(() => {
    const map = new Map<string, HabitCompletion[]>()
    for (const c of completions) {
      if (!c.completed) continue
      const list = map.get(c.habitId)
      if (list) list.push(c)
      else map.set(c.habitId, [c])
    }
    return map
  }, [completions])

  /** The shared completion rate over the visible range (weekly targets for times-per-week habits). */
  const rateFor = useMemo(() => {
    return (habit: Habit) => {
      const { done: hit, expected: scheduled } = calculateSuccessCounts(
        habit,
        completionsByHabit.get(habit.id) ?? [],
        days.length,
        days[0],
        weekStartsOn
      )
      return { scheduled, hit, pct: scheduled === 0 ? 0 : Math.round((hit / scheduled) * 100) }
    }
  }, [completionsByHabit, days, weekStartsOn])

  // Today lives at the left edge now, so reset the scroll there when the range
  // changes. Layout effect so it happens before paint.
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollLeft = 0
  }, [range, habits.length])

  // First column of each month as read left-to-right (i.e. its most recent day,
  // since the axis runs backwards), for the ruler and the divider lines.
  const monthStarts = useMemo(() => {
    const marks: Array<{ index: number; label: string }> = []
    days.forEach((day, index) => {
      if (index === 0 || !isSameMonth(day, days[index - 1])) {
        marks.push({ index, label: format(day, dayCount > 200 ? "MMM" : "MMM yyyy", { locale: dateLocale }) })
      }
    })
    return marks
  }, [days, dayCount, dateLocale])

  const trackWidth = days.length * step

  if (habits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
        <CalendarRange className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-sm backdrop-blur-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="font-semibold text-foreground">{t.title}</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(days[days.length - 1], "d MMM yyyy", { locale: dateLocale })} – {format(days[0], "d MMM yyyy", { locale: dateLocale })}
            <span aria-hidden> · </span>
            {plural(t.days, days.length)}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
          {RANGES.map(({ key }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              aria-pressed={range === key}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                range === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {t.ranges[key]}
            </button>
          ))}
        </div>
      </header>

      <div className="flex">
        {/* Habit names stay put while the day columns scroll. */}
        <div className="w-[280px] shrink-0 border-r border-border">
          <div className="h-8 border-b border-border/50" aria-hidden />
          {groups.map(({ pillar, habits: rows }) => (
            <div key={pillar}>
              <div
                className={cn(
                  "flex h-7 items-center gap-2 px-4 text-[11px] font-semibold uppercase tracking-wide",
                  PILLAR_STYLES[pillar].text
                )}
              >
                {t.pillars[pillar]}
                <span className="text-muted-foreground/60">{rows.length}</span>
              </div>
              {rows.map((habit) => {
                const { pct, hit, scheduled } = rateFor(habit)
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2.5 px-4"
                    style={{ height: rowHeight }}
                    title={formatMessage(habit.schedule?.type === "times_per_week" ? t.rowTitleWeekly : t.rowTitle, { name: habit.name, hit, scheduled })}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PILLAR_HEX[pillar] }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {habit.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div ref={scrollerRef} data-no-swipe
          className="custom-scrollbar lb-scroll-x flex-1">
          <div className="relative px-2 pb-3" style={{ width: trackWidth + 16 }}>
            {/* Month dividers, behind the cells. */}
            <div className="pointer-events-none absolute inset-y-0 left-2 right-2" aria-hidden>
              {monthStarts.slice(1).map(({ index }) => (
                <span
                  key={index}
                  className="absolute top-0 h-full w-px bg-border/40"
                  style={{ left: index * step - cellGap / 2 }}
                />
              ))}
            </div>

            {/* Month ruler */}
            <div className="relative h-8 border-b border-border/50">
              {monthStarts.map(({ index, label }) => (
                <span
                  key={index}
                  className="absolute bottom-1 whitespace-nowrap text-[10px] font-medium text-muted-foreground"
                  style={{ left: index * step }}
                >
                  {label}
                </span>
              ))}
            </div>

            {groups.map(({ pillar, habits: rows }) => (
              <div key={pillar}>
                <div className="h-7" aria-hidden />
                {rows.map((habit) => (
                  <MatrixRow
                    key={habit.id}
                    habit={habit}
                    days={days}
                    dayStrings={dayStrings}
                    completed={completedByHabit.get(habit.id)}
                    weekStartsOn={weekStartsOn}
                    color={PILLAR_HEX[pillar]}
                    cellSize={cellSize}
                    cellGap={cellGap}
                    cellRadius={cellRadius}
                    rowHeight={rowHeight}
                    onToggleCompletion={onToggleCompletion}
                    onHover={setHovered}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {PILLAR_IDS.map((pillar) => (
            <span key={pillar} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-[3px]"
                style={{ backgroundColor: PILLAR_HEX[pillar] }}
                aria-hidden
              />
              {t.pillars[pillar]}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] border border-border bg-secondary/50" aria-hidden />
          {t.missed}
        </span>
        {/* Native titles are slow on desktop and never show on touch. */}
        <span className="ml-auto" aria-live="polite">
          {hovered ? (
            <>
              <span className="font-medium text-foreground">{format(hovered.day, "EEE, d MMM yyyy", { locale: dateLocale })}</span>
              {` · ${hovered.habitName} · ${hovered.status}`}
            </>
          ) : (
            t.footerHint
          )}
        </span>
      </footer>
    </section>
  )
}

const MatrixRow = memo(function MatrixRow({
  habit,
  days,
  dayStrings,
  completed,
  color,
  cellSize,
  cellGap,
  cellRadius,
  rowHeight,
  onToggleCompletion,
  onHover,
  weekStartsOn,
}: {
  habit: Habit
  weekStartsOn: WeekStart
  days: Date[]
  dayStrings: string[]
  completed: Set<string> | undefined
  color: string
  cellSize: number
  cellGap: number
  cellRadius: number
  rowHeight: number
  onToggleCompletion: (habitId: string, date: Date) => void
  onHover: (cell: HoveredCell) => void
}) {
  // Big cells get the standard grid's 2px border treatment; tiny ones would be
  // all border and no fill, so they stay hairline.
  const t = useTranslations().habits.app.habitMatrix
  const dateLocale = useDateLocale()
  const chunky = cellSize >= 20

  return (
    <div className="relative flex items-center" style={{ gap: cellGap, height: rowHeight }}>
      {days.map((day, i) => {
        const dateStr = dayStrings[i]
        const isDone = completed?.has(dateStr) ?? false
        // A times-per-week habit isn't "missed" on a rest day once the week's target is met.
        const scheduled = completed
          ? isHabitDueOnDate(habit, day, completed, weekStartsOn)
          : isHabitScheduledOnDate(habit, day)
        const isToday = i === 0
        const status = isDone ? t.statusDone : scheduled ? t.statusMissed : t.statusNotScheduled
        const hover = (): void => onHover({ day, habitName: habit.name, status })

        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => onToggleCompletion(habit.id, day)}
            title={`${habit.name} — ${format(day, "EEE d MMM yyyy", { locale: dateLocale })} — ${status}`}
            onPointerEnter={hover}
            onFocus={hover}
            aria-label={formatMessage(isDone ? t.cellCompleted : t.cellNotCompleted, {
              name: habit.name,
              date: format(day, t.longDateFormat, { locale: dateLocale }),
            })}
            aria-pressed={isDone}
            className={cn(
              "shrink-0 transition-transform hover:ring-1 hover:ring-ring",
              chunky ? "hover:scale-110" : "hover:scale-150",
              !isDone &&
                (scheduled
                  ? cn("bg-secondary/50", chunky ? "border-2 border-border" : "border border-border/60")
                  : "bg-secondary/20"),
              isToday && (chunky ? "ring-2 ring-primary/60" : "ring-1 ring-primary/50")
            )}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: cellRadius,
              // Pillar colour, so the matrix reads as six coherent families
              // rather than a confetti of per-habit hexes.
              backgroundColor: isDone ? color : undefined,
            }}
          />
        )
      })}
    </div>
  )
})
