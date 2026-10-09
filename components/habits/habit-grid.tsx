"use client"

import { format, isToday, getDay } from "date-fns"
import { Check, Plus, Pencil, FileText, Brain, Archive, ArchiveRestore, Clock, Layers } from "lucide-react"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import {
  PILLAR_HEX,
  PILLAR_IDS,
  PILLAR_STYLES,
  pillarForHabit,
  type PillarId,
} from "@/lib/habits/pillars"
import { calculateStreak, formatScheduleLabel, isHabitScheduledOnDate, type WeekStart } from "@/lib/habits/habit-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/habits/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { HabitDataTooltip } from "@/components/habits/habit-data-tooltip"
import { StreakDisplay } from "@/components/habits/streak-display"
import { HABIT_TAGS } from "@/lib/habits/motivational-messages"
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

type GridStrings = ReturnType<typeof useTranslations>["habits"]["app"]["habitGrid"]

interface HabitGridProps {
  habits: Habit[]
  dates: Date[]
  completions: HabitCompletion[]
  /**
   * A tap on a scheduled cell. The parent decides what that means (reading
   * modal, data-entry modal, or a plain toggle) and owns those modals, so the
   * grid, day view and matrix all share one copy of them.
   */
  onCellClick: (habitId: string, date: Date) => void
  onAddHabit?: () => void
  /** Opens the habit dialog (schedule, data fields, archive, delete). */
  onEditHabit?: (habitId: string) => void
  onUnarchiveHabit?: (habitId: string) => void
  /** First day of the week, for times-per-week streaks. */
  weekStartsOn?: WeekStart
}

interface DateInfo {
  date: Date
  dateStr: string
  dayShort: string
  dayNum: string
  monthDay: string
  isTodayFlag: boolean
  dayOfWeek: number
  iso: string
}

function getDailyProgress(
  habit: Habit,
  completion: HabitCompletion | undefined
): { progress: number; current: number; goal: number; unit: string } | null {
  if (!habit.dataEntry?.enabled) return null
  const numberField = habit.dataEntry.fields.find(
    (f) => f.type === "number" && f.goalValue && f.goalValue > 0
  )
  if (!numberField) return null
  const value = completion?.data?.[numberField.id]
  const current = typeof value === "number" ? value : typeof value === "string" ? parseFloat(value) : 0
  const numCurrent = isNaN(current) ? 0 : current
  return {
    progress: Math.min((numCurrent / numberField.goalValue!) * 100, 100),
    current: numCurrent,
    goal: numberField.goalValue!,
    unit: numberField.unit || "",
  }
}

function getScheduleText(habit: Habit, t: GridStrings): string {
  return formatScheduleLabel(habit.schedule, {
    everyDay: t.daily,
    timesPerWeek: t.timesPerWeek,
    noDays: t.noDays,
    weekdays: t.weekdays,
    daysShort: t.weekdaysShort,
  })
}

/** Tag labels come from lib/ in English; translate by value, falling back to the lib label. */
function tagLabel(t: GridStrings, value: string, fallback: string): string {
  return (t.tags as Record<string, string>)[value] ?? fallback
}

interface RowProps {
  habit: Habit
  pillar: PillarId
  dateInfos: DateInfo[]
  completionsForHabit: Map<string, HabitCompletion> | undefined
  /** `unit: "weeks"` for times-per-week habits. */
  streak: { current: number; longest: number; unit?: "days" | "weeks" }
  onCellClick: (habit: Habit, date: Date) => void
  onEditHabit?: (habitId: string) => void
  onUnarchiveHabit?: (habitId: string) => void
}

type SortMode = "time" | "category"

/**
 * Completed cells are painted in their habit's pillar colour rather than the
 * one-size-fits-all success green, so a week of ticks reads as six categories
 * at a glance. The pillar hexes are all light enough that near-black text is
 * the legible choice on top of them.
 */
const COMPLETED_TEXT = "#0b0d13"

function completedCellStyle(pillar: PillarId): React.CSSProperties {
  return {
    backgroundColor: PILLAR_HEX[pillar],
    borderColor: PILLAR_HEX[pillar],
    color: COMPLETED_TEXT,
  }
}

function byTime(a: Habit, b: Habit): number {
  return (a.time || "00:00").localeCompare(b.time || "00:00")
}

/** Pillar order for category sort — PILLAR_IDS is the canonical Liberture order. */
const PILLAR_RANK = new Map(PILLAR_IDS.map((pillar, index) => [pillar, index]))

/**
 * The five info columns on the left of the desktop table. They're resizable so
 * a wide habit name or a narrow screen can trade space against the day columns;
 * drag a divider left to shrink its column and hand the room to the days.
 */
type InfoColKey = "habit" | "actions" | "time" | "schedule" | "streak"

const INFO_COLS: Array<{ key: InfoColKey; min: number; default: number }> = [
  { key: "habit", min: 140, default: 280 },
  { key: "actions", min: 56, default: 96 },
  { key: "time", min: 56, default: 88 },
  { key: "schedule", min: 70, default: 112 },
  // StreakDisplay's grid needs 64+58+58 plus two dividers and four 12px gaps —
  // 230px of content, 262px with the cell padding. Under the old auto table
  // layout the column just grew to fit; table-fixed means the default has to
  // reserve it up front or three-digit streaks get clipped.
  { key: "streak", min: 180, default: 264 },
]

const DAY_COL_WIDTH = 88

type ColWidths = Record<InfoColKey, number>

const DEFAULT_WIDTHS = Object.fromEntries(INFO_COLS.map((c) => [c.key, c.default])) as ColWidths

const WIDTHS_STORAGE_KEY = "habit-grid:info-col-widths"

function loadWidths(): ColWidths {
  if (typeof window === "undefined") return DEFAULT_WIDTHS
  try {
    const raw = window.localStorage.getItem(WIDTHS_STORAGE_KEY)
    if (!raw) return DEFAULT_WIDTHS
    const parsed = JSON.parse(raw) as Partial<Record<InfoColKey, unknown>>
    const next = { ...DEFAULT_WIDTHS }
    for (const col of INFO_COLS) {
      const value = parsed[col.key]
      if (typeof value === "number" && Number.isFinite(value)) {
        next[col.key] = Math.max(col.min, Math.round(value))
      }
    }
    return next
  } catch {
    return DEFAULT_WIDTHS
  }
}

const MobileHabitCard = memo(function MobileHabitCard({
  habit,
  pillar,
  dateInfos,
  completionsForHabit,
  streak,
  onCellClick,
  onEditHabit,
  onUnarchiveHabit,
}: RowProps) {
  const t = useTranslations().habits.app.habitGrid
  const { current, longest, unit } = streak
  const scheduleText = getScheduleText(habit, t)

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm active:scale-[0.98] transition-transform",
        habit.archived && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: PILLAR_HEX[pillar] }}
            title={t.pillars[pillar]}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground text-sm truncate">{habit.name}</p>
              {habit.archived && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border flex-shrink-0">
                  <Archive className="h-2.5 w-2.5" />
                  {t.archived}
                </span>
              )}
              {habit.dataEntry?.enabled && (
                <div className="flex-shrink-0">
                  <FileText className="h-3 w-3 text-primary" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{habit.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {habit.archived && onUnarchiveHabit && (
            <button
              onClick={() => onUnarchiveHabit(habit.id)}
              className="flex h-10 items-center gap-1 px-3 rounded-lg border border-primary/50 bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-xs font-medium"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              {t.restore}
            </button>
          )}
          <button
            onClick={() => onEditHabit?.(habit.id)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/50 hover:bg-primary/10 hover:border-primary transition-colors"
            aria-label={formatMessage(t.editHabitNamed, { name: habit.name })}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {habit.tags && habit.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {habit.tags.map((tag) => {
            const tagDef = HABIT_TAGS.find((def) => def.value === tag)
            return tagDef ? (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                {tagDef.emoji} {tagLabel(t, tagDef.value, tagDef.label)}
              </span>
            ) : null
          })}
        </div>
      )}

      {habit.implementationIntention && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
          <Brain className="h-3 w-3 text-primary flex-shrink-0" />
          <span className="truncate">
            {habit.implementationIntention.trigger} → {habit.implementationIntention.behavior}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-muted-foreground">{scheduleText}</span>
        <StreakDisplay
          streakData={{
            current,
            // calculateStreak already folds in the stored longest when its unit matches.
            longest,
            unit,
            freezesAvailable: habit.streakData?.freezesAvailable ?? 0,
            freezesUsed: habit.streakData?.freezesUsed ?? 0,
            milestones: habit.streakData?.milestones ?? [],
            lastCompletedDate: habit.streakData?.lastCompletedDate,
          }}
        />
      </div>

      <div data-no-swipe className="flex gap-2 overflow-x-auto snap-x custom-scrollbar horizontal-touch-scroll pb-2 -mx-1 px-1">
        {dateInfos.map((di) => {
          const completion = completionsForHabit?.get(di.dateStr)
          const completed = completion?.completed === true
          const scheduled = isHabitScheduledOnDate(habit, di.date)
          const hasData = !!(completion?.data && Object.keys(completion.data).length > 0)
          const dailyProgress = getDailyProgress(habit, completion)
          const hasPartialProgress = !!(dailyProgress && dailyProgress.current > 0 && !completed)

          return (
            <button
              key={di.iso}
              onClick={() => scheduled && onCellClick(habit, di.date)}
              disabled={!scheduled}
              className={cn(
                "flex min-h-[76px] min-w-[64px] snap-start flex-col items-center justify-center gap-1 rounded-lg border-2 p-2.5 transition-all flex-shrink-0 relative overflow-hidden",
                !scheduled && "opacity-30 cursor-not-allowed",
                scheduled && !completed && !hasData && !hasPartialProgress && "border-border bg-secondary/50 active:scale-95",
                scheduled && !completed && (hasData || hasPartialProgress) && "border-primary/40 bg-primary/5 active:scale-95",
                di.isTodayFlag && !completed && "bg-muted border-muted-foreground/30",
                completed && "shadow-sm",
              )}
              style={completed ? completedCellStyle(pillar) : undefined}
              aria-label={formatMessage(t.habitOnDate, { name: habit.name, date: di.monthDay })}
              title={dailyProgress && dailyProgress.current > 0 ? `${dailyProgress.current}/${dailyProgress.goal} ${dailyProgress.unit}` : undefined}
            >
              {hasData && !completed && (
                <div className="absolute top-1 right-1">
                  <FileText className="h-3 w-3 text-primary" />
                </div>
              )}
              {hasData && completed && (
                <div className="absolute top-1 right-1">
                  <FileText className="h-3 w-3 opacity-70" />
                </div>
              )}
              <span className={cn("text-xs font-medium", di.isTodayFlag && !completed && "text-primary")}>
                {di.dayShort}
              </span>
              <span className={cn("text-[10px]", di.isTodayFlag && !completed && "text-primary font-bold")}>
                {di.dayNum}
              </span>
              {completed && <Check className="h-4 w-4 mt-0.5" strokeWidth={2.5} />}
              {dailyProgress && dailyProgress.goal > 0 && !completed && (
                <>
                  {dailyProgress.current > 0 && (
                    <span className="max-w-full truncate text-[10px] font-bold text-primary leading-none">
                      {dailyProgress.current}/{dailyProgress.goal}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        dailyProgress.progress >= 100 ? "bg-success" :
                        dailyProgress.progress >= 50 ? "bg-exercise" :
                        dailyProgress.progress > 0 ? "bg-primary" :
                        "bg-muted-foreground/20"
                      )}
                      style={{ width: `${dailyProgress.progress}%` }}
                    />
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})

const DesktopHabitRow = memo(function DesktopHabitRow({
  habit,
  pillar,
  dateInfos,
  completionsForHabit,
  streak,
  onCellClick,
  onEditHabit,
  onUnarchiveHabit,
}: RowProps) {
  const t = useTranslations().habits.app.habitGrid
  const scheduleText = getScheduleText(habit, t)
  const { current, longest, unit } = streak

  return (
    <tr className={cn("border-b border-border/50 transition-colors hover:bg-accent/30", habit.archived && "opacity-60")}>
      <td className="sticky left-0 z-20 overflow-hidden bg-card/95 backdrop-blur-sm px-4 py-3 border-r border-border/50">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-3.5 w-3.5 flex-shrink-0 rounded-full shadow-sm"
            style={{ backgroundColor: PILLAR_HEX[pillar] }}
            title={t.pillars[pillar]}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-foreground">{habit.name}</span>
              {habit.archived && (
                <span className="inline-flex flex-shrink-0 items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  <Archive className="h-2.5 w-2.5" />
                  {t.archived}
                </span>
              )}
              {habit.dataEntry?.enabled && (
                <div className="flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary font-medium">{t.data}</span>
                </div>
              )}
            </div>
            {habit.tags && habit.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {habit.tags.map((tag) => {
                  const tagDef = HABIT_TAGS.find((def) => def.value === tag)
                  return tagDef ? (
                    <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                      {tagDef.emoji} {tagLabel(t, tagDef.value, tagDef.label)}
                    </span>
                  ) : null
                })}
              </div>
            )}
            {habit.implementationIntention && (
              <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <Brain className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="truncate">
                  {habit.implementationIntention.trigger} → {habit.implementationIntention.behavior}
                </span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="overflow-hidden px-3 py-3">
        <div className="flex items-center justify-center gap-1.5">
          {habit.archived && onUnarchiveHabit && (
            <button
              onClick={() => onUnarchiveHabit(habit.id)}
              className="flex h-10 items-center gap-1.5 px-3 rounded-lg border border-primary/50 bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-xs font-medium group"
              title={t.restoreHabit}
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              {t.restore}
            </button>
          )}
          <button
            onClick={() => onEditHabit?.(habit.id)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/50 hover:bg-primary/10 hover:border-primary transition-colors group"
            title={t.editHabit}
            aria-label={formatMessage(t.editHabitNamed, { name: habit.name })}
          >
            <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </td>
      <td className="overflow-hidden truncate whitespace-nowrap px-4 py-3 text-sm text-muted-foreground font-mono">{habit.time}</td>
      <td className="overflow-hidden truncate whitespace-nowrap px-4 py-3">
        <span className="text-xs text-muted-foreground">{scheduleText}</span>
      </td>
      <td className="overflow-hidden px-4 py-3">
        <div className="flex flex-col items-center">
          <StreakDisplay
            streakData={{
              current,
              // calculateStreak already folds in the stored longest when its unit matches.
              longest,
              unit,
              freezesAvailable: habit.streakData?.freezesAvailable ?? 0,
              freezesUsed: habit.streakData?.freezesUsed ?? 0,
              milestones: habit.streakData?.milestones ?? [],
              lastCompletedDate: habit.streakData?.lastCompletedDate,
            }}
          />
        </div>
      </td>
      {dateInfos.map((di) => {
        const completion = completionsForHabit?.get(di.dateStr)
        const completed = completion?.completed === true
        const scheduled = isHabitScheduledOnDate(habit, di.date)
        const hasData = !!(completion?.data && Object.keys(completion.data).length > 0)
        const dailyProgress = getDailyProgress(habit, completion)
        const hasPartialProgress = !!(dailyProgress && dailyProgress.current > 0 && !completed)

        const cellButton = (
          <button
            onClick={() => scheduled && onCellClick(habit, di.date)}
            disabled={!scheduled}
            className={cn(
              "mx-auto flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all duration-200 relative overflow-hidden",
              !scheduled && "cursor-not-allowed opacity-30 border-border/50 bg-muted/20 hover:scale-100",
              scheduled && !completed && hasData && "hover:scale-110 active:scale-95 border-primary/50 bg-primary/10",
              scheduled && !completed && !hasData && "hover:scale-110 active:scale-95",
              scheduled && completed && "hover:scale-110 active:scale-95",
              completed
                ? "shadow-sm"
                : scheduled && !hasData
                  ? "border-border bg-secondary/50 hover:border-primary/70 hover:bg-secondary"
                  : "",
            )}
            style={completed ? completedCellStyle(pillar) : undefined}
            aria-label={formatMessage(t.habitOnDate, { name: habit.name, date: di.monthDay })}
            title={dailyProgress && dailyProgress.current > 0 ? `${dailyProgress.current}/${dailyProgress.goal} ${dailyProgress.unit}` : undefined}
          >
            {hasData && !completed && (
              <div className="absolute -top-1 -right-1 rounded-full p-0.5 bg-primary">
                <FileText className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
            {hasData && completed && (
              <div className="absolute -top-1 -right-1 rounded-full bg-black/15 p-0.5">
                <FileText className="h-2.5 w-2.5 text-current" />
              </div>
            )}
            {completed && <Check className="h-5 w-5" strokeWidth={2.5} />}
            {hasPartialProgress && !completed && dailyProgress && (
              <span className="max-w-full truncate px-0.5 text-[8px] font-bold text-primary leading-none">
                {dailyProgress.current}/{dailyProgress.goal}
              </span>
            )}
            {dailyProgress && dailyProgress.goal > 0 && !completed && (
              <div className="absolute bottom-0 left-0 right-0 h-1">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    dailyProgress.progress >= 100 ? "bg-success" :
                    dailyProgress.progress >= 50 ? "bg-exercise" :
                    dailyProgress.progress > 0 ? "bg-primary" :
                    "bg-muted-foreground/20"
                  )}
                  style={{ width: `${dailyProgress.progress}%` }}
                />
              </div>
            )}
          </button>
        )

        return (
          <td key={di.iso} className={cn("px-3 py-3", di.isTodayFlag && "bg-muted/40")}>
            {hasData ? (
              <HabitDataTooltip completion={completion!} habit={habit}>
                {cellButton}
              </HabitDataTooltip>
            ) : (
              cellButton
            )}
          </td>
        )
      })}
    </tr>
  )
})

export function HabitGrid({
  habits,
  dates,
  completions,
  onCellClick,
  onAddHabit,
  onEditHabit,
  onUnarchiveHabit,
  weekStartsOn = 1,
}: HabitGridProps) {
  const isMobile = useMobile()
  const t = useTranslations().habits.app.habitGrid
  const dateLocale = useDateLocale()
  const [sortMode, setSortMode] = useState<SortMode>("time")
  const [colWidths, setColWidths] = useState<ColWidths>(DEFAULT_WIDTHS)
  const [hydratedWidths, setHydratedWidths] = useState(false)

  // Stabilize parent callbacks via refs so memoized rows skip re-render
  // when the parent recreates callback identities on each render.
  const onCellClickRef = useRef(onCellClick)
  onCellClickRef.current = onCellClick
  const onEditHabitRef = useRef(onEditHabit)
  onEditHabitRef.current = onEditHabit
  const onUnarchiveHabitRef = useRef(onUnarchiveHabit)
  onUnarchiveHabitRef.current = onUnarchiveHabit

  const stableOnEditHabit = useCallback((habitId: string) => {
    onEditHabitRef.current?.(habitId)
  }, [])
  const stableOnUnarchiveHabit = useCallback((habitId: string) => {
    onUnarchiveHabitRef.current?.(habitId)
  }, [])

  // Per-habit completion Map with stable identity: when only one habit's
  // completions change, other habits' maps keep their previous reference,
  // so React.memo'd rows for unaffected habits skip re-rendering entirely.
  const completionsByHabitCacheRef = useRef<Map<string, { arr: HabitCompletion[]; map: Map<string, HabitCompletion> }>>(new Map())
  const completionsByHabit = useMemo(() => {
    const grouped = new Map<string, HabitCompletion[]>()
    for (const c of completions) {
      let arr = grouped.get(c.habitId)
      if (!arr) { arr = []; grouped.set(c.habitId, arr) }
      arr.push(c)
    }
    const next = new Map<string, Map<string, HabitCompletion>>()
    const cache = completionsByHabitCacheRef.current
    const newCache = new Map<string, { arr: HabitCompletion[]; map: Map<string, HabitCompletion> }>()
    for (const [habitId, arr] of grouped) {
      const cached = cache.get(habitId)
      const unchanged =
        !!cached && cached.arr.length === arr.length && cached.arr.every((c, i) => c === arr[i])
      if (unchanged) {
        newCache.set(habitId, cached!)
        next.set(habitId, cached!.map)
      } else {
        const m = new Map<string, HabitCompletion>()
        for (const c of arr) m.set(c.date, c)
        newCache.set(habitId, { arr, map: m })
        next.set(habitId, m)
      }
    }
    completionsByHabitCacheRef.current = newCache
    return next
  }, [completions])

  // Precompute per-date format strings once per `dates`, avoiding ~5
  // date-fns calls per cell on every render.
  const dateInfos = useMemo<DateInfo[]>(() => dates.map((date) => ({
    date,
    dateStr: format(date, "yyyy-MM-dd"),
    dayShort: format(date, "EEE", { locale: dateLocale }),
    dayNum: format(date, "d"),
    monthDay: format(date, t.monthDayFormat, { locale: dateLocale }),
    isTodayFlag: isToday(date),
    dayOfWeek: getDay(date),
    iso: date.toISOString(),
  })), [dates, dateLocale, t.monthDayFormat])

  // Memoized streaks: use the shared calculator so the grid follows the same
  // grace-period, schedule, and timezone guards as API streaks.
  const streaksByHabit = useMemo(() => {
    const result = new Map<string, { current: number; longest: number; unit?: "days" | "weeks" }>()
    const today = new Date()

    for (const habit of habits) {
      const streakData = calculateStreak(habit.id, completions, habit.streakData, habit, today, weekStartsOn)
      result.set(habit.id, { current: streakData.current, longest: streakData.longest, unit: streakData.unit })
    }
    return result
  }, [habits, completions, weekStartsOn])


  const handleCellClick = useCallback((habit: Habit, date: Date) => {
    onCellClickRef.current(habit.id, date)
  }, [])

  const pillarByHabit = useMemo(() => {
    const map = new Map<string, PillarId>()
    for (const habit of habits) map.set(habit.id, pillarForHabit(habit))
    return map
  }, [habits])

  // The parent already hands us a time-ordered list; sorting again here keeps
  // the grid self-contained so the toggle doesn't have to be lifted.
  const orderedHabits = useMemo(() => {
    const list = [...habits]
    if (sortMode === "time") return list.sort(byTime)
    return list.sort((a, b) => {
      const rankA = PILLAR_RANK.get(pillarByHabit.get(a.id) ?? "work") ?? 0
      const rankB = PILLAR_RANK.get(pillarByHabit.get(b.id) ?? "work") ?? 0
      return rankA !== rankB ? rankA - rankB : byTime(a, b)
    })
  }, [habits, sortMode, pillarByHabit])

  /** True when this habit opens a new pillar block (category sort only). */
  const startsGroup = (index: number): boolean => {
    if (sortMode !== "category") return false
    if (index === 0) return true
    return pillarByHabit.get(orderedHabits[index - 1].id) !== pillarByHabit.get(orderedHabits[index].id)
  }

  // Read after mount so the server and first client render agree.
  useEffect(() => {
    setColWidths(loadWidths())
    setHydratedWidths(true)
  }, [])

  useEffect(() => {
    if (!hydratedWidths) return
    try {
      window.localStorage.setItem(WIDTHS_STORAGE_KEY, JSON.stringify(colWidths))
    } catch {
      // Private mode or a full quota — the widths just won't persist.
    }
  }, [colWidths, hydratedWidths])

  /** Drag on a header divider; tracked on the window so the pointer can leave the strip. */
  const startResize = (key: InfoColKey, min: number) => (event: React.PointerEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = colWidths[key]

    const onMove = (moveEvent: PointerEvent) => {
      const next = Math.max(min, Math.round(startWidth + moveEvent.clientX - startX))
      setColWidths((current) => (current[key] === next ? current : { ...current, [key]: next }))
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const resetColumn = (key: InfoColKey, fallback: number) => {
    setColWidths((current) => ({ ...current, [key]: fallback }))
  }

  /** Grip on the right edge of an info header. Double-click restores the default. */
  const resizeHandle = (col: (typeof INFO_COLS)[number]) => (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={formatMessage(t.resizeColumn, { column: t.columns[col.key] })}
      onPointerDown={startResize(col.key, col.min)}
      onDoubleClick={() => resetColumn(col.key, col.default)}
      title={formatMessage(t.resizeHint, { width: col.default })}
      className="absolute inset-y-0 right-0 z-10 flex w-2 translate-x-1/2 cursor-col-resize touch-none items-center justify-center"
    >
      <span className="h-1/2 w-px bg-border transition-colors group-hover/col:bg-primary" />
    </span>
  )

  const tableWidth =
    INFO_COLS.reduce((sum, col) => sum + colWidths[col.key], 0) + dateInfos.length * DAY_COL_WIDTH

  const sortToggle = (
    // inline-flex + self-start so the pill hugs its two buttons; as a plain
    // `flex` block it stretched to the full width of the sticky Habit column.
    <div className="inline-flex w-fit self-start items-center gap-0.5 rounded-lg bg-background/70 p-0.5">
      {([
        ["time", t.sortTime, t.sortByTime, Clock],
        ["category", t.sortCategory, t.sortByCategory, Layers],
      ] as const).map(([id, label, sortTitle, Icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => setSortMode(id)}
          aria-pressed={sortMode === id}
          title={sortTitle}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
            sortMode === id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{t.yourHabits}</h2>
          <div className="flex items-center gap-2">
            {sortToggle}
            <Button onClick={onAddHabit} size="sm" className="gap-1 h-10 text-xs">
              <Plus className="h-3 w-3" />
              {t.add}
            </Button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-border bg-card">
            <p className="text-muted-foreground text-sm">{t.emptyMobile}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderedHabits.map((habit, index) => {
              const pillar = pillarByHabit.get(habit.id) ?? "work"
              return (
                <Fragment key={habit.id}>
                  {startsGroup(index) && (
                    <div
                      className={cn(
                        "flex items-center gap-2 px-1 pt-3 text-[11px] font-semibold uppercase tracking-wide",
                        PILLAR_STYLES[pillar].text
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PILLAR_HEX[pillar] }}
                        aria-hidden
                      />
                      {t.pillars[pillar]}
                    </div>
                  )}
                  <MobileHabitCard
                    habit={habit}
                    pillar={pillar}
                    dateInfos={dateInfos}
                    completionsForHabit={completionsByHabit.get(habit.id)}
                    streak={streaksByHabit.get(habit.id) ?? { current: 0, longest: 0 }}
                    onCellClick={handleCellClick}
                    onEditHabit={stableOnEditHabit}
                    onUnarchiveHabit={stableOnUnarchiveHabit}
                  />
                </Fragment>
              )
            })}
          </div>
        )}

      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div data-no-swipe className="overflow-x-auto custom-scrollbar horizontal-touch-scroll">
        {/* Fixed layout so the colgroup actually governs the widths. The table
            floors at `tableWidth` (which keeps day columns at DAY_COL_WIDTH and
            scrolls when it must) but stretches to fill a wider screen — and
            since only the info columns declare a width, all that slack lands on
            the day columns. Shrinking an info column feeds the days directly. */}
        <table
          className="w-full table-fixed border-separate border-spacing-0"
          style={{ minWidth: tableWidth }}
        >
          <colgroup>
            {INFO_COLS.map((col) => (
              <col key={col.key} style={{ width: colWidths[col.key] }} />
            ))}
            {dateInfos.map((di) => (
              <col key={di.iso} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="group/col sticky left-0 z-30 bg-muted/95 backdrop-blur-sm px-4 py-3 text-left text-sm font-semibold text-foreground relative">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span>{t.columns.habit}</span>
                    <Button onClick={onAddHabit} size="sm" className="h-8 gap-1.5 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90">
                      <Plus className="h-3.5 w-3.5" />
                      {t.addHabit}
                    </Button>
                  </div>
                  {sortToggle}
                </div>
                {resizeHandle(INFO_COLS[0])}
              </th>
              <th className="group/col relative truncate px-3 py-3 text-center text-sm font-semibold text-muted-foreground">
                {t.columns.actions}
                {resizeHandle(INFO_COLS[1])}
              </th>
              <th className="group/col relative truncate px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                {t.columns.time}
                {resizeHandle(INFO_COLS[2])}
              </th>
              <th className="group/col relative truncate px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                {t.columns.schedule}
                {resizeHandle(INFO_COLS[3])}
              </th>
              <th className="group/col relative truncate px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
                {t.columns.streak}
                {resizeHandle(INFO_COLS[4])}
              </th>
              {dateInfos.map((di) => (
                <th key={di.iso} className={cn("px-3 py-3 text-center text-sm font-medium", di.isTodayFlag && "bg-muted/70")}>
                  <div className={cn("text-muted-foreground font-medium", di.isTodayFlag && "text-primary font-bold")}>
                    {di.dayShort}
                  </div>
                  <div
                    className={cn(
                      "text-xs text-muted-foreground mt-0.5",
                      di.isTodayFlag && "text-primary font-semibold",
                    )}
                  >
                    {di.monthDay}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedHabits.map((habit, index) => {
              const pillar = pillarByHabit.get(habit.id) ?? "work"
              return (
                <Fragment key={habit.id}>
                  {startsGroup(index) && (
                    <tr>
                      <td
                        colSpan={5 + dateInfos.length}
                        className={cn(
                          "border-y border-border/50 bg-muted/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide",
                          PILLAR_STYLES[pillar].text
                        )}
                      >
                        <span className="sticky left-4 flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: PILLAR_HEX[pillar] }}
                            aria-hidden
                          />
                          {t.pillars[pillar]}
                        </span>
                      </td>
                    </tr>
                  )}
                  <DesktopHabitRow
                    habit={habit}
                    pillar={pillar}
                    dateInfos={dateInfos}
                    completionsForHabit={completionsByHabit.get(habit.id)}
                    streak={streaksByHabit.get(habit.id) ?? { current: 0, longest: 0 }}
                    onCellClick={handleCellClick}
                    onEditHabit={stableOnEditHabit}
                    onUnarchiveHabit={stableOnUnarchiveHabit}
                  />
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {habits.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-base">{t.emptyDesktop}</p>
        </div>
      )}

    </div>
  )
}
