"use client"

import { motion } from "framer-motion"
import { BookOpen, Check, Clock, ListChecks, Plus } from "lucide-react"

import { DIFFICULTY_LABEL } from "@/lib/tracker/catalog"
import { scheduleLabel } from "@/lib/tracker/streaks"
import type { CatalogHabit, CatalogProtocol } from "@/lib/tracker/types"
import { PILLAR_STYLES } from "@/lib/pillars"
import { cn } from "@/lib/utils"

import { PillarTag } from "./pillar-chip"

const DIFFICULTY_TONE = {
  easy: "text-nutrition border-nutrition/30 bg-nutrition/10",
  moderate: "text-exercise border-exercise/30 bg-exercise/10",
  hard: "text-mind border-mind/30 bg-mind/10",
} as const

export function DifficultyTag({ difficulty }: { difficulty: keyof typeof DIFFICULTY_TONE }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        DIFFICULTY_TONE[difficulty],
      )}
    >
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  )
}

export function ProtocolCard({
  protocol,
  selected,
  onRead,
  onToggle,
}: {
  protocol: CatalogProtocol
  selected: boolean
  onRead: () => void
  onToggle: () => void
}) {
  const styles = PILLAR_STYLES[protocol.pillar]

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-xl border p-5 transition-colors",
        selected ? cn(styles.border, styles.background) : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PillarTag pillar={protocol.pillar} />
        <DifficultyTag difficulty={protocol.difficulty} />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold leading-snug">{protocol.name}</h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{protocol.tagline}</p>
      </div>

      <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          <dd>
            {protocol.habits.length} habit{protocol.habits.length === 1 ? "" : "s"}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          <dd>{protocol.duration}</dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRead}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Read
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            selected
              ? cn(styles.background, styles.text, "border", styles.border)
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {selected ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Added
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              Add
            </>
          )}
        </button>
      </div>
    </motion.article>
  )
}

export function HabitCard({
  habit,
  selected,
  onToggle,
}: {
  habit: CatalogHabit
  selected: boolean
  onToggle: () => void
}) {
  const styles = PILLAR_STYLES[habit.pillar]

  return (
    <motion.button
      type="button"
      layout
      onClick={onToggle}
      aria-pressed={selected}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
        selected ? cn(styles.border, styles.background) : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold leading-snug">{habit.name}</h3>
          <p className="text-sm text-muted-foreground">{habit.why}</p>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected ? cn(styles.background, styles.border, styles.text) : "border-white/20 text-transparent",
          )}
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <PillarTag pillar={habit.pillar} />
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {habit.time} · {scheduleLabel(habit.schedule)}
        </span>
      </div>
    </motion.button>
  )
}
