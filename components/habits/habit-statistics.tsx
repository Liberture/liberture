"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subWeeks, subMonths, subDays, isWithinInterval, getDay } from "date-fns"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import type { DateRange } from "@/components/habits/date-range-filter"
import { PILLAR_HEX, PILLAR_IDS, pillarForHabit, type PillarId } from "@/lib/habits/pillars"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import { calculateStreak, calculateSuccessRate, isHabitActiveOnDate, isHabitScheduledOnDate } from "@/lib/habits/habit-utils"
import { Button } from "@/components/habits/ui/button"
import {
  BarChart3, Calendar, ChevronLeft, ChevronRight, RotateCcw,
  TrendingUp, TrendingDown, Activity, ListChecks, FileText,
  Flame, Clock
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts"

interface HabitStatisticsProps {
  habits: Habit[]
  completions: HabitCompletion[]
  /** Explicit period, owned by the stats view's DateRangeFilter. */
  range: DateRange
}

interface NumericFieldStats {
  fieldId: string
  label: string
  unit?: string
  goal?: number
  average: number
  min: number
  max: number
  total: number
}

interface HabitDataStats {
  habitId: string
  habitName: string
  color: string
  totalCompletions: number
  completionsWithData: number
  numericStats: NumericFieldStats[]
  textEntries: number
  averageCompletionTime?: string
  scheduleDifference?: string
  completionRate: number
  trend: "up" | "down" | "stable"
  prevRate: number
}

/**
 * Memoised: the view track keeps every visited screen mounted, so this
 * re-renders whenever it becomes active again. With stable props that is pure
 * waste — this component is one of the expensive ones to rebuild.
 */
export const HabitStatistics = memo(function HabitStatistics({
  habits,
  completions,
  range,
}: HabitStatisticsProps) {
  const t = useTranslations().habits.app.habitStatistics
  const dateLocale = useDateLocale()
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [chartRange, setChartRange] = useState<"7d" | "30d" | "90d">("30d")
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{ date: Date; count: number } | null>(null)

  const today = new Date()
  const currentStart = range.start
  const currentEnd = range.end
  const daysInPeriod = eachDayOfInterval({ start: currentStart, end: currentEnd })

  // "Previous period" is the window of equal length immediately before this one,
  // whatever length the user picked.
  const periodLength = daysInPeriod.length
  const prevEnd = subDays(currentStart, 1)
  const prevStart = subDays(prevEnd, periodLength - 1)

  const periodHabits = habits.filter((habit) =>
    daysInPeriod.some((day) => isHabitActiveOnDate(habit, day, currentEnd))
  )
  const prevDaysInPeriod = eachDayOfInterval({ start: prevStart, end: prevEnd })
  const prevPeriodHabits = habits.filter((habit) =>
    prevDaysInPeriod.some((day) => isHabitActiveOnDate(habit, day, prevEnd))
  )
  const habitById = new Map(habits.map((habit) => [habit.id, habit]))

  useEffect(() => {
    if (periodHabits.length === 0) {
      setSelectedHabitId(null)
      return
    }
    if (!selectedHabitId || !periodHabits.some((habit) => habit.id === selectedHabitId)) {
      setSelectedHabitId(periodHabits[0].id)
    }
  }, [periodHabits, selectedHabitId])

  const isScheduledForDay = (habit: Habit, date: Date): boolean => {
    return isHabitScheduledOnDate(habit, date, currentEnd)
  }

  const calculateCompletionRate = (habitId: string, days?: Date[]) => {
    const habit = habitById.get(habitId)
    if (!habit) return 0
    const period = days || daysInPeriod
    const endDate = period[period.length - 1] || currentEnd
    if (period.length === daysInPeriod.length && period[0]?.getTime() === daysInPeriod[0]?.getTime()) {
      return Math.round(calculateSuccessRate(habit, completions, period.length, endDate) * 100)
    }

    let scheduledDays = 0
    let completedDays = 0
    period.forEach((day) => {
      if (!isHabitScheduledOnDate(habit, day, endDate)) return
      scheduledDays++
      const dateStr = format(day, "yyyy-MM-dd")
      if (completions.some((c) => c.habitId === habitId && c.date === dateStr && c.completed)) completedDays++
    })
    return scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0
  }

  const calculatePrevRate = (habitId: string): number => calculateCompletionRate(habitId, prevDaysInPeriod)

  const calculateTrend = (habitId: string): "up" | "down" | "stable" => {
    const currentRate = calculateCompletionRate(habitId)
    const prevRate = calculatePrevRate(habitId)
    const difference = currentRate - prevRate
    if (difference > 5) return "up"
    if (difference < -5) return "down"
    return "stable"
  }

  const minutesFromTime = (time?: string): number | null => {
    if (!time) return null
    const [hours, minutes] = time.split(":").map(Number)
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
    return hours * 60 + minutes
  }

  const formatMinutesAsTime = (minutes: number): string => {
    const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440
    const hours = Math.floor(normalized / 60)
    const mins = normalized % 60
    const suffix = hours >= 12 ? t.pm : t.am
    const hour12 = hours % 12 || 12
    return hour12 + ":" + String(mins).padStart(2, "0") + " " + suffix
  }

  const formatScheduleDifference = (averageMinutes: number, scheduledMinutes: number | null): string | undefined => {
    if (scheduledMinutes === null) return undefined
    let diff = Math.round(averageMinutes - scheduledMinutes)
    if (diff > 720) diff -= 1440
    if (diff < -720) diff += 1440
    if (diff === 0) return t.onTime
    const absolute = Math.abs(diff)
    const hours = Math.floor(absolute / 60)
    const minutes = absolute % 60
    const label = hours > 0 ? hours + "h" + (minutes ? " " + minutes + "m" : "") : minutes + "m"
    return formatMessage(diff > 0 ? t.later : t.earlier, { duration: label })
  }

  const averageTimeOfDayMinutes = (minutes: number[]): number | undefined => {
    if (minutes.length === 0) return undefined
    const vector = minutes.reduce((sum, minute) => {
      const angle = (minute / 1440) * Math.PI * 2
      return { sin: sum.sin + Math.sin(angle), cos: sum.cos + Math.cos(angle) }
    }, { sin: 0, cos: 0 })
    const angle = Math.atan2(vector.sin / minutes.length, vector.cos / minutes.length)
    return (((angle < 0 ? angle + Math.PI * 2 : angle) / (Math.PI * 2)) * 1440)
  }

  const calculateDataStatistics = (): HabitDataStats[] => {
    return periodHabits.map(habit => {
      const habitCompletions = completions.filter(c => {
        const compDate = parseISO(c.date)
        return c.habitId === habit.id &&
          isWithinInterval(compDate, { start: currentStart, end: currentEnd }) &&
          c.completed &&
          isHabitScheduledOnDate(habit, compDate, currentEnd)
      })

      const numberFields = habit.dataEntry?.fields?.filter(f => f.type === "number") || []
      const textFields = habit.dataEntry?.fields?.filter(f => f.type === "text") || []

      const numericStats = numberFields.flatMap(field => {
        const numbers = habitCompletions
          .map(c => c.data?.[field.id])
          .filter(value => value !== undefined && value !== null && value !== "")
          .map(value => typeof value === "number" ? value : parseFloat(value as string))
          .filter(n => !isNaN(n))

        if (numbers.length === 0) return []
        return [{
          fieldId: field.id,
          label: field.label,
          unit: field.unit,
          goal: field.goalValue,
          average: numbers.reduce((sum, n) => sum + n, 0) / numbers.length,
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          total: numbers.reduce((sum, n) => sum + n, 0),
        }]
      })

      const completionsWithText = habitCompletions.filter(c => {
        if (!c.data) return false
        return textFields.some(field => {
          const value = c.data![field.id]
          return value && typeof value === "string" && value.trim().length > 0
        })
      })

      const completionsWithData = habitCompletions.filter(c => {
        if (!c.data) return false
        return Object.keys(c.data).some(key => {
          const value = c.data![key]
          if (typeof value === "string") return value.trim().length > 0
          return value !== undefined && value !== null
        })
      }).length

      const completionMinutes = habitCompletions
        .map(c => c.completedAt ? new Date(c.completedAt) : null)
        .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()))
        .map(date => date.getHours() * 60 + date.getMinutes())
      const averageCompletionMinutes = averageTimeOfDayMinutes(completionMinutes)

      return {
        habitId: habit.id,
        habitName: habit.name,
        color: habit.color,
        totalCompletions: habitCompletions.length,
        completionsWithData,
        numericStats,
        textEntries: completionsWithText.length,
        averageCompletionTime: averageCompletionMinutes !== undefined ? formatMinutesAsTime(averageCompletionMinutes) : undefined,
        scheduleDifference: averageCompletionMinutes !== undefined ? formatScheduleDifference(averageCompletionMinutes, minutesFromTime(habit.time)) : undefined,
        completionRate: calculateCompletionRate(habit.id),
        trend: calculateTrend(habit.id),
        prevRate: calculatePrevRate(habit.id)
      }
    })
  }

  const dataStats = calculateDataStatistics()
  const selectedStats = selectedHabitId ? dataStats.find(s => s.habitId === selectedHabitId) : null

  const totalCompletions = completions.filter((c) => {
    const compDate = parseISO(c.date)
    const habit = habitById.get(c.habitId)
    return Boolean(habit) && compDate >= currentStart && compDate <= currentEnd && c.completed && isHabitActiveOnDate(habit, compDate, currentEnd)
  }).length

  const prevTotalCompletions = completions.filter((c) => {
    const compDate = parseISO(c.date)
    const habit = habitById.get(c.habitId)
    return Boolean(habit) && compDate >= prevStart && compDate <= prevEnd && c.completed && isHabitActiveOnDate(habit, compDate, prevEnd)
  }).length

  const completionsChange = totalCompletions - prevTotalCompletions

  const averageRate = periodHabits.length > 0
    ? Math.round(periodHabits.reduce((sum, habit) => sum + calculateCompletionRate(habit.id), 0) / periodHabits.length)
    : 0

  const prevAverageRate = prevPeriodHabits.length > 0
    ? Math.round(prevPeriodHabits.reduce((sum, habit) => sum + calculatePrevRate(habit.id), 0) / prevPeriodHabits.length)
    : 0

  const rateChange = averageRate - prevAverageRate

  // ── Completion Trend Area Chart Data ──
  const trendChartData = useMemo(() => {
    const rangeDays = chartRange === "7d" ? 7 : chartRange === "30d" ? 30 : 90
    const days = Array.from({ length: rangeDays }, (_, i) => subDays(today, rangeDays - 1 - i))

    return days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd")
      const totalScheduled = habits.reduce((sum, h) => sum + (isHabitScheduledOnDate(h, day, today) ? 1 : 0), 0)
      const totalCompleted = completions.filter(c => {
        const habit = habitById.get(c.habitId)
        return Boolean(habit) && c.date === dateStr && c.completed && isHabitScheduledOnDate(habit, day, today)
      }).length
      const rate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0

      return {
        date: format(day, t.monthDayFormat, { locale: dateLocale }),
        shortDate: format(day, "d"),
        fullDate: format(day, t.fullDateFormat, { locale: dateLocale }),
        completions: totalCompleted,
        rate,
        scheduled: totalScheduled
      }
    })
  }, [habits, completions, chartRange, today, t, dateLocale])

  // ── Pillar Balance ──
  // The whole app is keyed to six pillars, so the most useful single read is
  // which of them are actually being served this period.
  const pillarBalance = useMemo(() => {
    const buckets = new Map<PillarId, { habits: number; rateSum: number }>()
    for (const habit of periodHabits) {
      const pillar = pillarForHabit(habit)
      const bucket = buckets.get(pillar) ?? { habits: 0, rateSum: 0 }
      bucket.habits += 1
      bucket.rateSum += calculateCompletionRate(habit.id)
      buckets.set(pillar, bucket)
    }
    return PILLAR_IDS.filter((p) => buckets.has(p)).map((pillar) => {
      const bucket = buckets.get(pillar)!
      return {
        pillar,
        habits: bucket.habits,
        rate: Math.round(bucket.rateSum / bucket.habits),
      }
    })
  }, [periodHabits, completions, daysInPeriod])

  const strongestPillar = pillarBalance.reduce<(typeof pillarBalance)[number] | null>(
    (best, entry) => (!best || entry.rate > best.rate ? entry : best),
    null
  )
  const weakestPillar = pillarBalance.reduce<(typeof pillarBalance)[number] | null>(
    (worst, entry) => (!worst || entry.rate < worst.rate ? entry : worst),
    null
  )

  // ── Radar Chart Data ──
  const radarData = useMemo(() => {
    if (periodHabits.length < 3) return []
    return periodHabits.map(h => ({
      habit: h.name.length > 12 ? h.name.substring(0, 12) + "..." : h.name,
      rate: calculateCompletionRate(h.id),
      fullMark: 100,
    }))
  }, [periodHabits, completions, daysInPeriod])

  // ── Numeric Data Line Chart (for selected habit) ──
  const numericTrendData = useMemo(() => {
    if (!selectedHabitId) return []
    const habit = habits.find(h => h.id === selectedHabitId)
    if (!habit?.dataEntry?.enabled) return []
    const numberField = habit.dataEntry.fields.find(f => f.type === "number")
    if (!numberField) return []

    return daysInPeriod.map(day => {
      const dateStr = format(day, "yyyy-MM-dd")
      const completion = completions.find(c => c.habitId === selectedHabitId && c.date === dateStr && isHabitScheduledOnDate(habit, day, currentEnd))
      const rawValue = completion?.data?.[numberField.id]
      const value = typeof rawValue === "number" ? rawValue : typeof rawValue === "string" ? parseFloat(rawValue) : null

      return {
        date: format(day, t.monthDayFormat, { locale: dateLocale }),
        shortDate: format(day, "EEE", { locale: dateLocale }),
        fullDate: format(day, t.fullDateFormat, { locale: dateLocale }),
        value: value && !isNaN(value) ? value : null,
        goal: numberField.goalValue || null,
        unit: numberField.unit || "",
      }
    })
  }, [selectedHabitId, habits, completions, daysInPeriod, t, dateLocale])

  // ── 365-Day Heatmap Data ──
  const yearHeatmapData = useMemo(() => {
    const days = Array.from({ length: 365 }, (_, i) => subDays(today, 364 - i))
    return days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd")
      const count = completions.filter(c => c.date === dateStr && c.completed).length
      return { date: day, dateStr, count, dayOfWeek: getDay(day) }
    })
  }, [completions, today])

  const streakLeaderboard = useMemo(() => {
    const todayDate = new Date()
    return periodHabits.map(habit => {
      const streak = calculateStreak(habit.id, completions, habit.streakData, habit, todayDate)
      return { habit, currentStreak: streak.current, longestStreak: streak.longest, color: habit.color }
    }).sort((a, b) => b.currentStreak - a.currentStreak)
  }, [periodHabits, completions])

  // ── Time of Day Patterns ──
  const timeOfDayData = useMemo(() => {
    const buckets = { morning: { scheduled: 0, completed: 0 }, afternoon: { scheduled: 0, completed: 0 }, evening: { scheduled: 0, completed: 0 } }

    daysInPeriod.forEach(day => {
      habits.forEach(habit => {
        if (!isScheduledForDay(habit, day)) return
        const tod = habit.timeOfDay || "anytime"
        const bucket = tod === "morning" ? "morning" : tod === "afternoon" ? "afternoon" : tod === "evening" ? "evening" : "morning"
        buckets[bucket].scheduled++
        const dateStr = format(day, "yyyy-MM-dd")
        if (completions.some(c => c.habitId === habit.id && c.date === dateStr && c.completed)) {
          buckets[bucket].completed++
        }
      })
    })

    return [
      { key: "morning", time: t.morning, rate: buckets.morning.scheduled > 0 ? Math.round((buckets.morning.completed / buckets.morning.scheduled) * 100) : 0, completed: buckets.morning.completed, scheduled: buckets.morning.scheduled },
      { key: "afternoon", time: t.afternoon, rate: buckets.afternoon.scheduled > 0 ? Math.round((buckets.afternoon.completed / buckets.afternoon.scheduled) * 100) : 0, completed: buckets.afternoon.completed, scheduled: buckets.afternoon.scheduled },
      { key: "evening", time: t.evening, rate: buckets.evening.scheduled > 0 ? Math.round((buckets.evening.completed / buckets.evening.scheduled) * 100) : 0, completed: buckets.evening.completed, scheduled: buckets.evening.scheduled },
    ]
  }, [habits, completions, daysInPeriod, t])

  // ── Day of Week Performance (for selected habit) ──
  const dayOfWeekData = useMemo(() => {
    const dayNames = t.weekdaysShort
    const targetId = selectedHabitId
    return dayNames.map((name, idx) => {
      let scheduled = 0
      let completed = 0
      daysInPeriod.forEach(day => {
        if (getDay(day) !== idx) return
        if (targetId) {
          const habit = habits.find(h => h.id === targetId)
          if (!habit || !isScheduledForDay(habit, day)) return
          scheduled++
          const dateStr = format(day, "yyyy-MM-dd")
          if (completions.some(c => c.habitId === targetId && c.date === dateStr && c.completed)) completed++
        } else {
          habits.forEach(habit => {
            if (!isScheduledForDay(habit, day)) return
            scheduled++
            const dateStr = format(day, "yyyy-MM-dd")
            if (completions.some(c => c.habitId === habit.id && c.date === dateStr && c.completed)) completed++
          })
        }
      })
      return { day: name, rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0, completed, scheduled }
    })
  }, [habits, completions, daysInPeriod, selectedHabitId, t])

  // ── Weekly Consistency ──
  const weeklyConsistency = useMemo(() => {
    const weeks: Array<{ week: string; fullDate: string; rate: number; perfect: boolean }> = []
    for (let w = 11; w >= 0; w--) {
      const wStart = startOfWeek(subWeeks(today, w))
      const wEnd = endOfWeek(subWeeks(today, w))
      const wDays = eachDayOfInterval({ start: wStart, end: wEnd })
      let totalScheduled = 0
      let totalCompleted = 0
      wDays.forEach(day => {
        habits.forEach(habit => {
          if (!isScheduledForDay(habit, day)) return
          totalScheduled++
          const dateStr = format(day, "yyyy-MM-dd")
          if (completions.some(c => c.habitId === habit.id && c.date === dateStr && c.completed)) totalCompleted++
        })
      })
      const rate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0
      weeks.push({
        week: format(wStart, t.monthDayFormat, { locale: dateLocale }),
        fullDate: `${format(wStart, t.monthDayFormat, { locale: dateLocale })} – ${format(wEnd, t.monthDayYearFormat, { locale: dateLocale })}`,
        rate,
        perfect: rate === 100,
      })
    }
    return weeks
  }, [habits, completions, today, t, dateLocale])

  // Heatmap color helper
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return "bg-muted-foreground/10"
    if (count <= 1) return "bg-success/25"
    if (count <= 2) return "bg-success/40"
    if (count <= 4) return "bg-success/65"
    return "bg-success"
  }

  // Custom tooltip for recharts. The heading is the datum's full date, not the
  // axis tick — ticks are abbreviated ("14", "Mon") to fit, which reads as no
  // date at all once you hover.
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string; payload?: { fullDate?: string } }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-foreground mb-1">{payload[0].payload?.fullDate ?? label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: p.color || "#8B5CF6" }} />
            {p.name}: <span className="font-medium text-foreground">{p.value}</span>
          </p>
        ))}
      </div>
    )
  }

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

        {/* ─── Pillar Balance ─── */}
        {pillarBalance.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.pillarBalance}
              </h3>
              {strongestPillar && weakestPillar && strongestPillar.pillar !== weakestPillar.pillar && (
                <p className="text-xs text-muted-foreground">
                  {t.strongest}{" "}
                  <span style={{ color: PILLAR_HEX[strongestPillar.pillar] }}>
                    {t.pillars[strongestPillar.pillar]}
                  </span>
                  <span aria-hidden> · </span>
                  {t.needsWork}{" "}
                  <span style={{ color: PILLAR_HEX[weakestPillar.pillar] }}>
                    {t.pillars[weakestPillar.pillar]}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
              {pillarBalance.map(({ pillar, habits: count, rate }) => (
                <div key={pillar} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-medium" style={{ color: PILLAR_HEX[pillar] }}>
                    {t.pillars[pillar]}
                  </span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${rate}%`, backgroundColor: PILLAR_HEX[pillar] }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-foreground">
                    {rate}%
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                    {plural(t.habitCount, count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Section 1: Summary Cards ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ListChecks className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalCompletions}</div>
            <div className="text-xs text-muted-foreground mt-1">{t.totalCompletions}</div>
            {completionsChange !== 0 && (
              <div className={cn("text-[10px] font-medium mt-1", completionsChange > 0 ? "text-success" : "text-destructive")}>
                {completionsChange > 0 ? "+" : ""}{completionsChange} {formatMessage(t.vsPrevious, { days: periodLength })}
              </div>
            )}
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="relative flex items-center justify-center mb-2">
              <svg width="48" height="48" className="transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/30" />
                <circle
                  cx="24" cy="24" r="20"
                  stroke={averageRate >= 80 ? "#10B981" : averageRate >= 50 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="4" fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - averageRate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{averageRate}%</div>
            </div>
            <div className="text-xs text-muted-foreground">{t.averageRate}</div>
            {rateChange !== 0 && (
              <div className={cn("text-[10px] font-medium mt-1", rateChange > 0 ? "text-success" : "text-destructive")}>
                {rateChange > 0 ? "+" : ""}{rateChange}% {formatMessage(t.vsPrevious, { days: periodLength })}
              </div>
            )}
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-exercise" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {streakLeaderboard.length > 0 ? Math.max(...streakLeaderboard.map(s => s.currentStreak)) : 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t.bestActiveStreak}</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{periodHabits.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t.activeHabits}</div>
          </div>
        </div>

        {/* ─── Section 2: Completion Trend Area Chart ─── */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.completionTrend}</h3>
            <div className="flex gap-1">
              {(["7d", "30d", "90d"] as const).map(range => (
                <Button key={range} onClick={() => setChartRange(range)} size="sm" variant={chartRange === range ? "default" : "ghost"} className="h-10 text-[10px] px-3">
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-muted/20 border border-border/50 p-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey={chartRange === "7d" ? "date" : "shortDate"}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  interval={chartRange === "90d" ? 13 : chartRange === "30d" ? 4 : 0}
                />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} domain={[0, "dataMax + 1"]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#completionGradient)"
                  name={t.completions}
                  dot={chartRange === "7d"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Section 4: Radar Chart (3+ habits) ─── */}
        {radarData.length >= 3 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.habitBalance}</h3>
            <div className="rounded-lg bg-muted/20 border border-border/50 p-4">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="habit" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Radar name={t.completionPercent} dataKey="rate" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ─── Section 5: 365-Day Heatmap ─── */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.yearOverview}</h3>
          <div data-no-swipe className="rounded-lg bg-muted/20 border border-border/50 p-3 overflow-x-auto custom-scrollbar horizontal-touch-scroll sm:p-4">
            <div className="flex gap-[3px]" style={{ minWidth: 700 }}>
              {Array.from({ length: 53 }, (_, weekIdx) => {
                const weekCells = yearHeatmapData.slice(weekIdx * 7, weekIdx * 7 + 7)
                return (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {weekCells.map((cell, dayIdx) => (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        className={cn("h-[11px] w-[11px] rounded-[2px] transition-colors", getHeatmapColor(cell.count))}
                        title={`${format(cell.date, t.monthDayYearFormat, { locale: dateLocale })}: ${plural(t.completionsCount, cell.count)}`}
                        onPointerEnter={() => setHoveredHeatmapCell(cell)}
                        onClick={() => setHoveredHeatmapCell(cell)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              {/* Native titles are slow on desktop and never show on touch. */}
              <span className="mr-auto text-[11px] text-muted-foreground" aria-live="polite">
                {hoveredHeatmapCell ? (
                  <>
                    <span className="font-medium text-foreground">{format(hoveredHeatmapCell.date, t.fullDateFormat, { locale: dateLocale })}</span>
                    {` · ${plural(t.completionsCount, hoveredHeatmapCell.count)}`}
                  </>
                ) : (
                  t.hoverDay
                )}
              </span>
              <span className="text-[10px] text-muted-foreground">{t.less}</span>
              <div className="h-[11px] w-[11px] rounded-[2px] bg-muted-foreground/10" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-success/25" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-success/40" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-success/65" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-success" />
              <span className="text-[10px] text-muted-foreground">{t.more}</span>
            </div>
          </div>
        </div>

        {/* ─── Section 7: Weekly Consistency ─── */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.weeklyConsistency}</h3>
          <div className="rounded-lg bg-muted/20 border border-border/50 p-4">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyConsistency} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} className="text-muted-foreground" tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={100} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Bar dataKey="rate" name={t.consistencyPercent} radius={[3, 3, 0, 0]}>
                  {weeklyConsistency.map((entry, idx) => (
                    <Cell key={idx} fill={entry.perfect ? "#10B981" : entry.rate >= 80 ? "#8B5CF6" : entry.rate >= 50 ? "#F59E0B" : "#EF4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-3 mt-2 justify-center text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-success" /> {t.perfectWeek}</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[#8B5CF6]" /> 80%+</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-exercise" /> 50%+</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-destructive" /> &lt;50%</div>
            </div>
          </div>
        </div>

        {/* ─── Section 8: Time of Day Patterns ─── */}
        {timeOfDayData.some(slot => slot.scheduled > 0) && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.timeOfDayPerformance}</h3>
            <div className="rounded-lg bg-muted/20 border border-border/50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {timeOfDayData.map(slot => (
                  <div key={slot.key} className="text-center p-3 rounded-lg bg-background border border-border/50">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{slot.time}</span>
                    </div>
                    <div className={cn(
                      "text-xl font-bold",
                      slot.rate >= 80 ? "text-success" : slot.rate >= 50 ? "text-exercise" : slot.scheduled === 0 ? "text-muted-foreground" : "text-destructive"
                    )}>
                      {slot.scheduled > 0 ? `${slot.rate}%` : "—"}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatMessage(t.completedOf, { completed: slot.completed, scheduled: slot.scheduled })}
                    </div>
                    {slot.scheduled > 0 && (
                      <div className="h-1 bg-secondary rounded-full overflow-hidden mt-2">
                        <div
                          className={cn(
                            "h-full transition-all duration-500 rounded-full",
                            slot.rate >= 80 ? "bg-success" : slot.rate >= 50 ? "bg-exercise" : "bg-destructive"
                          )}
                          style={{ width: `${slot.rate}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Habit Selection Tabs ─── */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.selectHabit}</h3>
          <div className="flex flex-wrap gap-2">
            {periodHabits.map(habit => (
              <Button
                key={habit.id}
                onClick={() => setSelectedHabitId(habit.id)}
                size="sm"
                variant={selectedHabitId === habit.id ? "default" : "outline"}
                className="max-w-full gap-2 text-xs"
              >
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
                <span className="truncate">{habit.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* ─── Section 9: Per-Habit Detail Panel ─── */}
        {selectedStats ? (
          <div className="space-y-4 p-4 rounded-lg bg-muted/20 border border-border/50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: selectedStats.color }} />
                <h3 className="truncate font-semibold text-foreground">{selectedStats.habitName}</h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedStats.trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
                {selectedStats.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                <span className={cn(
                  "text-sm font-semibold",
                  selectedStats.trend === "up" ? "text-success" :
                  selectedStats.trend === "down" ? "text-destructive" :
                  "text-muted-foreground"
                )}>
                  {selectedStats.trend === "up" ? t.improving : selectedStats.trend === "down" ? t.declining : t.stable}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <div className="text-lg font-bold text-foreground">{selectedStats.totalCompletions}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.completions}</div>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <div className="text-lg font-bold text-foreground">{selectedStats.completionRate}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.successRate}</div>
                {selectedStats.prevRate !== selectedStats.completionRate && (
                  <div className={cn("text-[10px] font-medium",
                    selectedStats.completionRate > selectedStats.prevRate ? "text-success" : "text-destructive"
                  )}>
                    {selectedStats.completionRate > selectedStats.prevRate ? "+" : ""}{selectedStats.completionRate - selectedStats.prevRate}%
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <div className="text-lg font-bold text-foreground">{selectedStats.completionsWithData}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.withData}</div>
              </div>
            </div>

            {/* Numeric Data Trend Line Chart */}
            {numericTrendData.length > 0 && numericTrendData.some(d => d.value !== null) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t.numericDataTrend}
                </h4>
                <div className="rounded-lg bg-background border border-border/50 p-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={numericTrendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="shortDate" tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
                            <p className="font-semibold text-foreground mb-1">{(payload[0].payload as { fullDate?: string } | undefined)?.fullDate ?? label}</p>
                            {payload.map((p, i) => (
                              p.value !== null && <p key={i} className="text-muted-foreground">
                                {p.name}: <span className="font-medium text-foreground">{p.value} {numericTrendData[0]?.unit || ""}</span>
                              </p>
                            ))}
                          </div>
                        )
                      }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={selectedStats.color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: selectedStats.color }}
                        connectNulls
                        name={t.value}
                      />
                      {numericTrendData[0]?.goal && (
                        <ReferenceLine
                          y={numericTrendData[0].goal}
                          stroke="#10B981"
                          strokeDasharray="5 5"
                          strokeWidth={1.5}
                          label={{ value: formatMessage(t.goal, { goal: numericTrendData[0].goal }), position: "right", fontSize: 10, fill: "#10B981" }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Completion Time Statistics */}
            {(selectedStats.averageCompletionTime || selectedStats.scheduleDifference) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedStats.averageCompletionTime && (
                  <div className="p-3 rounded-lg bg-background border border-border/50">
                    <div className="text-lg font-bold text-foreground">{selectedStats.averageCompletionTime}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.averageCompletedAt}</div>
                  </div>
                )}
                {selectedStats.scheduleDifference && (
                  <div className="p-3 rounded-lg bg-background border border-border/50">
                    <div className="text-lg font-bold text-foreground">{selectedStats.scheduleDifference}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.vsScheduledTime}</div>
                  </div>
                )}
              </div>
            )}

            {/* Number Data Statistics */}
            {selectedStats.numericStats.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.numericData}</h4>
                {selectedStats.numericStats.map((field) => (
                  <div key={field.fieldId} className="space-y-2">
                    <h5 className="text-sm font-medium text-foreground">{field.label}</h5>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="text-lg font-bold text-primary">
                          {field.average.toFixed(1)}
                          {field.unit && <span className="text-sm ml-1">{field.unit}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.average}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-background border border-border/50">
                        <div className="text-lg font-bold text-foreground">
                          {field.total.toFixed(1)}
                          {field.unit && <span className="text-sm ml-1">{field.unit}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.total}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-background border border-border/50">
                        <div className="text-lg font-bold text-foreground">
                          {field.min.toFixed(1)}
                          {field.unit && <span className="text-sm ml-1">{field.unit}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.minimum}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-background border border-border/50">
                        <div className="text-lg font-bold text-foreground">
                          {field.max.toFixed(1)}
                          {field.unit && <span className="text-sm ml-1">{field.unit}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.maximum}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Day of Week Performance */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.dayOfWeekPerformance}</h4>
              <div data-no-swipe className="overflow-x-auto custom-scrollbar horizontal-touch-scroll pb-1">
                <div className="grid min-w-[360px] grid-cols-7 gap-2">
                  {dayOfWeekData.map(d => (
                    <div key={d.day} className="text-center">
                      <div className="text-[10px] text-muted-foreground mb-1">{d.day}</div>
                      <div className={cn(
                        "text-xs font-bold",
                        d.rate >= 80 ? "text-success" : d.rate >= 50 ? "text-exercise" : d.scheduled === 0 ? "text-muted-foreground/30" : "text-destructive"
                      )}>
                        {d.scheduled > 0 ? `${d.rate}%` : "—"}
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            d.rate >= 80 ? "bg-success" : d.rate >= 50 ? "bg-exercise" : "bg-destructive"
                          )}
                          style={{ width: `${d.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text Entries Count */}
            {selectedStats.textEntries > 0 && (
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{plural(t.textEntries, selectedStats.textEntries)}</div>
                    <div className="text-xs text-muted-foreground">{t.notesAdded}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-muted/20 border border-border/50 p-6 text-center text-sm text-muted-foreground">
            {t.noHabits}
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="truncate">
                {format(currentStart, t.monthDayFormat, { locale: dateLocale })} - {format(currentEnd, t.monthDayYearFormat, { locale: dateLocale })}
              </span>
            </div>
            <span className="font-medium text-primary">
              {plural(t.days, periodLength)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
