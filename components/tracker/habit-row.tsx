"use client"

import { motion } from "framer-motion"
import { Check, Flame, Trash2 } from "lucide-react"

import { PILLAR_STYLES } from "@/lib/pillars"
import { scheduleLabel } from "@/lib/tracker/streaks"
import type { Habit, StreakSummary } from "@/lib/tracker/types"
import { cn } from "@/lib/utils"

import { PillarTag } from "./pillar-chip"

export function HabitRow({
  habit,
  completed,
  streak,
  onToggle,
  onRemove,
}: {
  habit: Habit
  completed: boolean
  streak: StreakSummary
  onToggle: () => void
  onRemove: () => void
}) {
  const styles = PILLAR_STYLES[habit.pillar]

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "group flex items-center gap-4 rounded-xl border p-4 transition-colors",
        completed ? cn(styles.border, styles.background) : "border-white/10 bg-white/[0.02]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={completed}
        aria-label={completed ? `Mark ${habit.name} as not done` : `Mark ${habit.name} as done`}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          completed
            ? cn(styles.border, styles.background, styles.text)
            : "border-white/20 text-transparent hover:border-primary/60",
        )}
      >
        <motion.span
          initial={false}
          animate={completed ? { scale: [0.6, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Check className="h-5 w-5" aria-hidden />
        </motion.span>
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", completed && "text-muted-foreground line-through")}>
          {habit.name}
        </p>
        <p className="truncate text-sm text-muted-foreground">{habit.why}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <PillarTag pillar={habit.pillar} />
          <span className="font-mono">{habit.time}</span>
          <span>·</span>
          <span>{scheduleLabel(habit.schedule)}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {streak.current > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-exercise/30 bg-exercise/10 px-2.5 py-1 text-xs font-semibold text-exercise">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            {streak.current}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${habit.name}`}
          className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-white/5 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.li>
  )
}
