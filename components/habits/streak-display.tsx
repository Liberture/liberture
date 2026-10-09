"use client"

import { Card } from "@/components/habits/ui/card"
import { Badge } from "@/components/habits/ui/badge"
import { Flame, Award, Clock } from "lucide-react"
import { StreakData } from "@/lib/habits/types"
import { getNextMilestone } from "@/lib/habits/habit-utils"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface StreakDisplayProps {
  streakData: StreakData
  showFreezesCompact?: boolean
}

export function StreakDisplay({ streakData, showFreezesCompact = false }: StreakDisplayProps) {
  const t = useTranslations().habits.app.streakDisplay
  const { current, longest, freezesAvailable } = streakData
  // Times-per-week habits count weeks that met the target; milestones count days.
  const weeks = streakData.unit === "weeks"
  const nextMilestone = getNextMilestone(current)
  const daysToMilestone = nextMilestone - current
  const compactNumberClass = (value: number) =>
    cn("font-semibold leading-tight text-foreground tabular-nums", value >= 100 ? "text-base" : "text-lg")

  return (
    <div className="grid max-w-full grid-cols-[minmax(64px,auto)_1px_minmax(58px,auto)_1px_minmax(58px,auto)] items-center gap-x-3 overflow-hidden">
      {/* Current Streak */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative flex-shrink-0">
          <Flame className={`h-6 w-6 ${
            current >= 7 ? 'text-exercise' :
            current >= 3 ? 'text-finance' :
            'text-muted-foreground'
          }`} />
          {current >= 21 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-nutrition rounded-full border-2 border-border " />
          )}
        </div>
        <div className="min-w-[2.25rem] text-left">
          <div className={compactNumberClass(current)}>
            {current}
          </div>
          <div className="text-[11px] leading-tight text-muted-foreground">
            {weeks ? t.currentWeeks : t.current}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-10 w-px bg-secondary" />

      {/* Longest Streak */}
      <div className="flex min-w-0 items-center gap-2">
        <Award className="h-5 w-5 flex-shrink-0 text-primary" />
        <div className="min-w-[2.25rem] text-left">
          <div className={compactNumberClass(longest)}>
            {longest}
          </div>
          <div className="text-[11px] leading-tight text-muted-foreground">
            {weeks ? t.bestWeeks : t.best}
          </div>
        </div>
      </div>

      {/* Streak Freezes */}
      {freezesAvailable > 0 && (
        <>
          <div className="h-10 w-px bg-secondary" />
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🧊</div>
            <div>
              <div className="font-semibold text-work ">
                {freezesAvailable}
              </div>
              <div className="text-xs text-muted-foreground">
                {freezesAvailable === 1 ? t.freeze : t.freezes}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Next Milestone */}
      {!weeks && current < 100 && daysToMilestone > 0 && (
        <>
          <div className="h-10 w-px bg-secondary" />
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-semibold text-muted-foreground">
                {daysToMilestone}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatMessage(t.toMilestone, { milestone: nextMilestone })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
