import type { LucideIcon } from "lucide-react"
import { Brain, Dumbbell, Heart, Leaf, Wallet, Zap } from "lucide-react"

import { translations, type PillarId } from "./translations"

export const PILLAR_ICON_MAP: Record<PillarId, LucideIcon> = {
  cognition: Brain,
  recovery: Heart,
  fueling: Leaf,
  mental: Zap,
  physicality: Dumbbell,
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
  cognition: {
    text: "text-cognition",
    border: "border-cognition/30",
    background: "bg-cognition/10",
    gradient: "from-cognition/20 to-cognition/5",
    cardBg: "bg-cognition/10 border-cognition/30",
  },
  recovery: {
    text: "text-recovery",
    border: "border-recovery/30",
    background: "bg-recovery/10",
    gradient: "from-recovery/20 to-recovery/5",
    cardBg: "bg-recovery/10 border-recovery/30",
  },
  fueling: {
    text: "text-fueling",
    border: "border-fueling/30",
    background: "bg-fueling/10",
    gradient: "from-fueling/20 to-fueling/5",
    cardBg: "bg-fueling/10 border-fueling/30",
  },
  mental: {
    text: "text-mental",
    border: "border-mental/30",
    background: "bg-mental/10",
    gradient: "from-mental/20 to-mental/5",
    cardBg: "bg-mental/10 border-mental/30",
  },
  physicality: {
    text: "text-physicality",
    border: "border-physicality/30",
    background: "bg-physicality/10",
    gradient: "from-physicality/20 to-physicality/5",
    cardBg: "bg-physicality/10 border-physicality/30",
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
