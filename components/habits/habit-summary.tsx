"use client"

import { memo } from "react"

import { format, eachDayOfInterval, parseISO } from "date-fns"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { calculateSuccessRate, isHabitActiveOnDate } from "@/lib/habits/habit-utils"
import { cn } from "@/lib/utils"
import { BarChart3, Calendar } from "lucide-react"
import type { DateRange } from "@/components/habits/date-range-filter"
import { PILLAR_HEX, pillarForHabit } from "@/lib/habits/pillars"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { plural } from "@/lib/i18n-format"

interface HabitSummaryProps {
  habits: Habit[]
  completions: HabitCompletion[]
  /** Explicit period, owned by the stats view's DateRangeFilter. */
  range: DateRange
}

/**
 * Memoised: the view track keeps every visited screen mounted, so this
 * re-renders whenever it becomes active again. With stable props that is pure
 * waste — this component is one of the expensive ones to rebuild.
 */
export const HabitSummary = memo(function HabitSummary({
  habits,
  completions,
  range,
}: HabitSummaryProps) {
  const t = useTranslations().habits.app.habitSummary
  const dateLocale = useDateLocale()
  const currentStart = range.start
  const currentEnd = range.end
  const daysInPeriod = eachDayOfInterval({ start: currentStart, end: currentEnd })

  const periodHabits = habits.filter((habit) =>
    daysInPeriod.some((day) => isHabitActiveOnDate(habit, day, currentEnd))
  )

  const habitById = new Map(habits.map((habit) => [habit.id, habit]))

  const calculateCompletionRate = (habitId: string) => {
    const habit = habitById.get(habitId)
    if (!habit) return 0
    const days = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / 86400000) + 1
    return Math.round(calculateSuccessRate(habit, completions, days, currentEnd) * 100)
  }

  const totalCompletions = completions.filter((c) => {
    if (!c.completed) return false
    const compDate = parseISO(c.date)
    const habit = habitById.get(c.habitId)
    return Boolean(habit) && compDate >= currentStart && compDate <= currentEnd && isHabitActiveOnDate(habit, compDate, currentEnd)
  }).length

  const averageRate =
    periodHabits.length > 0
      ? Math.round(periodHabits.reduce((sum, habit) => sum + calculateCompletionRate(habit.id), 0) / periodHabits.length)
      : 0

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20 sm:px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(currentStart, "d MMM", { locale: dateLocale })} – {format(currentEnd, "d MMM yyyy", { locale: dateLocale })}
        </span>
      </div>

      <div className="p-4 space-y-6 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-2xl font-bold text-foreground">{totalCompletions}</div>
            <div className="text-xs text-muted-foreground mt-1">{t.totalCompletions}</div>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="relative">
              <svg width="52" height="52" className="transform -rotate-90">
                <circle cx="26" cy="26" r="22" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/30" />
                <circle
                  cx="26" cy="26" r="22"
                  stroke={averageRate >= 80 ? "#10B981" : averageRate >= 50 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="4" fill="none"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - averageRate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{averageRate}%</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t.averageRate}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-2xl font-bold text-foreground">{periodHabits.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t.activeHabits}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.habitPerformance}</h3>
          {periodHabits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t.noHabits}</p>
          ) : (
            periodHabits.map((habit) => {
              const rate = calculateCompletionRate(habit.id)
              return (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: PILLAR_HEX[pillarForHabit(habit)] }} />
                      <span className="truncate font-medium text-foreground">{habit.name}</span>
                    </div>
                    <span
                      className={cn(
                        "font-bold",
                        rate >= 80 ? "text-success" : rate >= 50 ? "text-exercise" : "text-destructive",
                      )}
                    >
                      {rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        rate >= 80 ? "bg-success" : rate >= 50 ? "bg-exercise" : "bg-destructive",
                      )}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="truncate">
                {format(currentStart, t.monthDayFormat, { locale: dateLocale })} - {format(currentEnd, t.monthDayYearFormat, { locale: dateLocale })}
              </span>
            </div>
            <span className="font-medium text-primary">
              {plural(t.days, daysInPeriod.length)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
