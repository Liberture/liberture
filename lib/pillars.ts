import type { LucideIcon } from "lucide-react"
import { Brain, Briefcase, Dumbbell, Leaf, Moon, Wallet } from "lucide-react"

import { translations, type PillarId } from "./translations"

/**
 * Maps DB pillar names (cognition, recovery, fueling, mental, physicality)
 * to frontend PillarId values (work, sleep, nutrition, mind, exercise).
 */
const DB_PILLAR_TO_FRONTEND: Record<string, PillarId> = {
  cognition: "work",
  recovery: "sleep",
  fueling: "nutrition",
  mental: "mind",
  physicality: "exercise",
  finance: "finance",
  // Frontend IDs map to themselves
  work: "work",
  sleep: "sleep",
  nutrition: "nutrition",
  mind: "mind",
  exercise: "exercise",
}

export function normalizePillarId(dbPillar: string): PillarId {
  return DB_PILLAR_TO_FRONTEND[dbPillar.toLowerCase()] ?? "work"
}

export const PILLAR_ICON_MAP: Record<PillarId, LucideIcon> = {
  work: Briefcase,
  sleep: Moon,
  nutrition: Leaf,
  mind: Brain,
  exercise: Dumbbell,
  finance: Wallet,
}

export const PILLAR_STYLES: Record<
  PillarId,
  {
    text: string
    border: string
    background: string
    gradient: string
    cardBg: string
  }
> = {
  work: {
    text: "text-work",
    border: "border-work/30",
    background: "bg-work/10",
    gradient: "from-work/20 to-work/5",
    cardBg: "bg-work/10 border-work/30",
  },
  sleep: {
    text: "text-sleep",
    border: "border-sleep/30",
    background: "bg-sleep/10",
    gradient: "from-sleep/20 to-sleep/5",
    cardBg: "bg-sleep/10 border-sleep/30",
  },
  nutrition: {
    text: "text-nutrition",
    border: "border-nutrition/30",
    background: "bg-nutrition/10",
    gradient: "from-nutrition/20 to-nutrition/5",
    cardBg: "bg-nutrition/10 border-nutrition/30",
  },
  mind: {
    text: "text-mind",
    border: "border-mind/30",
    background: "bg-mind/10",
    gradient: "from-mind/20 to-mind/5",
    cardBg: "bg-mind/10 border-mind/30",
  },
  exercise: {
    text: "text-exercise",
    border: "border-exercise/30",
    background: "bg-exercise/10",
    gradient: "from-exercise/20 to-exercise/5",
    cardBg: "bg-exercise/10 border-exercise/30",
  },
  finance: {
    text: "text-finance",
    border: "border-finance/30",
    background: "bg-finance/10",
    gradient: "from-finance/20 to-finance/5",
    cardBg: "bg-finance/10 border-finance/30",
  },
}

export type PillarOption<T extends string = "all"> = {
  id: PillarId | T
  name: string
  icon: LucideIcon | null
  color: string
  background?: string
  description?: string
}

export function createPillarFilterOptions<T extends string = "all">(
  allLabel: string,
  options?: { includeBackground?: boolean },
): PillarOption<T>[] {
  const includeBackground = options?.includeBackground ?? true

  return [
    {
      id: "all" as T,
      name: allLabel,
      icon: null,
      color: "text-muted-foreground",
      background: includeBackground ? "bg-card/70 border-border/60" : undefined,
    },
    ...translations.en.common.pillars.map((pillar) => ({
      id: pillar.id,
      name: pillar.name,
      description: pillar.description,
      icon: PILLAR_ICON_MAP[pillar.id],
      color: PILLAR_STYLES[pillar.id].text,
      background: includeBackground ? PILLAR_STYLES[pillar.id].cardBg : undefined,
    })),
  ]
}
