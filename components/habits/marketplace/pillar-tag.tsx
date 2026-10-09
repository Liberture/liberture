"use client"

import { PILLAR_ICON_MAP, PILLAR_STYLES, type PillarId } from "@/lib/habits/pillars"
import type { Difficulty } from "@/lib/habits/protocols/catalog"
import type { CostTier, ProtocolCost } from "@/lib/habits/protocols/cost"
import type { Habit } from "@/lib/habits/types"
import { formatScheduleLabel } from "@/lib/habits/habit-utils"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

const CURRENCY_SYMBOL: Record<NonNullable<ProtocolCost["currency"]>, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
}

/**
 * Localised labels for the catalog chrome (pillars, difficulty, cost, schedule,
 * sort and source tags). Mirrors the English helpers in lib/habits/protocols so
 * the marketplace, reader and coach cards all speak the visitor's language.
 */
export function useCatalogLabels() {
  const t = useTranslations().habits.app.pillarTag

  const costSummary = (cost: ProtocolCost | undefined, tier: CostTier): string => {
    if (!cost) return tier === "free" ? t.costFree : t.costBlurb[tier]
    const symbol = CURRENCY_SYMBOL[cost.currency ?? "USD"]
    const parts: string[] = []
    if (cost.oneTime) parts.push(formatMessage(t.costOneOff, { amount: `${symbol}${cost.oneTime}` }))
    if (cost.monthly) parts.push(formatMessage(t.costMonthly, { amount: `${symbol}${cost.monthly}` }))
    if (parts.length === 0) return t.costFree
    return parts.join(" + ")
  }

  const schedule = (value: Habit["schedule"]): string =>
    formatScheduleLabel(value, {
      everyDay: t.scheduleEveryDay,
      timesPerWeek: t.scheduleTimesPerWeek,
      noDays: t.scheduleNoDays,
      weekdays: t.scheduleWeekdays,
      daysShort: t.dayNamesShort,
    })

  return {
    pillar: t.pillars,
    difficulty: t.difficulty,
    costTier: t.costTier,
    costBlurb: t.costBlurb,
    sort: t.sort,
    sourceType: t.sourceType,
    strength: t.strength,
    costSummary,
    schedule,
  }
}

export function PillarTag({ pillar, className }: { pillar: PillarId; className?: string }) {
  const labels = useCatalogLabels()
  const Icon = PILLAR_ICON_MAP[pillar]
  const styles = PILLAR_STYLES[pillar]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles.text,
        styles.border,
        styles.background,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {labels.pillar[pillar]}
    </span>
  )
}

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: "text-nutrition border-nutrition/30 bg-nutrition/10",
  moderate: "text-exercise border-exercise/30 bg-exercise/10",
  hard: "text-mind border-mind/30 bg-mind/10",
}

export function DifficultyTag({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  const labels = useCatalogLabels()
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        DIFFICULTY_TONE[difficulty],
        className
      )}
    >
      {labels.difficulty[difficulty]}
    </span>
  )
}
