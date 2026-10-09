"use client"

import { memo } from "react"
import { Check, FileText, Flame, Pencil } from "lucide-react"

import { PILLAR_ICON_MAP, PILLAR_STYLES, pillarForHabit } from "@/lib/habits/pillars"
import type { Habit } from "@/lib/habits/types"
import { formatScheduleLabel } from "@/lib/habits/habit-utils"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

type RowStrings = ReturnType<typeof useTranslations>["habits"]["app"]["habitRow"]

/**
 * One habit scheduled for the viewed day, as a card. Ported from Liberture's
 * tracker: the whole row takes the pillar tint once it's done, so a finished day
 * reads as a column of colour.
 */

export function scheduleLabel(schedule: Habit["schedule"], t: RowStrings): string {
  return formatScheduleLabel(schedule, {
    everyDay: t.everyDay,
    timesPerWeek: t.timesPerWeek,
    noDays: t.noDaysSet,
    weekdays: t.weekdays,
    daysShort: t.weekdaysShort,
  })
}

interface HabitRowProps {
  habit: Habit
  completed: boolean
  streak: { current: number }
  /** Handlers take the id so the parent can pass stable references — inline
   *  closures here would make the memo above useless. */
  onToggle: (habitId: string) => void
  onLogData?: (habitId: string) => void
  /** Opens the habit dialog, which is also where delete lives (with a confirm). */
  onEdit?: (habitId: string) => void
}

export const HabitRow = memo(function HabitRow({
  habit,
  completed,
  streak,
  onToggle,
  onLogData,
  onEdit,
}: HabitRowProps) {
  const t = useTranslations().habits.app.habitRow
  const pillar = pillarForHabit(habit)
  const styles = PILLAR_STYLES[pillar]
  const PillarIcon = PILLAR_ICON_MAP[pillar]
  const intention = habit.implementationIntention

  return (
    <li
      className={cn(
        "lb-list-item group relative flex items-center gap-4 overflow-hidden rounded-xl border p-4 pl-5 transition-colors duration-200",
        onEdit && "hover:border-white/25",
        completed ? cn(styles.border, styles.background) : "border-white/10 bg-white/[0.02] hover:border-white/20"
      )}
    >
      {/* Pillar spine — gives every card its colour before it is completed. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1 transition-opacity duration-200",
          styles.solid,
          completed ? "opacity-100" : "opacity-60"
        )}
      />

      {/* Whole-card tap target for habit settings. Sits behind every control,
          so it never swallows a toggle or an action tap. It duplicates the
          pencil button, so it is hidden from assistive tech and the tab order:
          keyboard and screen-reader users get one "Edit" target per card. */}
      {onEdit ? (
        <button
          type="button"
          onClick={() => onEdit(habit.id)}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none"
        />
      ) : null}

      <button
        type="button"
        onClick={() => onToggle(habit.id)}
        aria-pressed={completed}
        aria-label={formatMessage(completed ? t.markNotDone : t.markDone, { name: habit.name })}
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90",
          completed
            ? cn(styles.border, styles.background, styles.text)
            : "border-white/20 text-transparent hover:border-primary/60"
        )}
      >
        <Check className="h-5 w-5" aria-hidden />
      </button>

      <div className="pointer-events-none relative z-10 min-w-0 flex-1">
        <p className={cn("font-medium", completed ? "text-muted-foreground line-through" : "text-foreground")}>
          {habit.name}
        </p>
        {intention?.trigger && intention.behavior ? (
          <p className="truncate text-sm text-muted-foreground">
            {formatMessage(t.intention, { trigger: intention.trigger, behavior: intention.behavior })}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium",
              styles.text,
              styles.border,
              styles.background
            )}
          >
            <PillarIcon className="h-3.5 w-3.5" aria-hidden />
            {t.pillars[pillar]}
          </span>
          <span className="font-mono">{habit.time}</span>
          <span aria-hidden>·</span>
          <span>{scheduleLabel(habit.schedule, t)}</span>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
        {streak.current > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-exercise/30 bg-exercise/10 px-2.5 py-1 text-xs font-semibold text-exercise">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            {streak.current}
          </span>
        ) : null}

        {/* Always visible: these used to appear on hover, which put them out of
            reach on touch entirely. Sized for a finger, not a cursor. */}
        <div className="flex items-center gap-0.5">
          {habit.dataEntry?.enabled && onLogData ? (
            <button
              type="button"
              onClick={() => onLogData(habit.id)}
              aria-label={formatMessage(t.logDataNamed, { name: habit.name })}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground active:scale-95"
            >
              <FileText className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(habit.id)}
              aria-label={formatMessage(t.editNamed, { name: habit.name })}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground active:scale-95"
            >
              <Pencil className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </li>
  )
})
