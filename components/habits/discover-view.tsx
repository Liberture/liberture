"use client"

import { Tabs, TabOptions, TabsContent } from "@/components/ui/tabs"
import { MessageCircleHeart, Store } from "lucide-react"

import { MarketplaceView } from "@/components/habits/marketplace/marketplace-view"
import { CoachPanel } from "@/components/habits/coach/coach-panel"
import type { DiscoverTab } from "@/components/habits/tracker/use-tracker-view"
import type { CatalogHabit, CatalogProtocol } from "@/lib/habits/protocols/catalog"
import type { CustomHabitSpec } from "@/lib/habits/agent/recommendation"
import type { CoachRecommendationEntry, CoachRecommendationSet, Habit } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"

interface DiscoverViewProps {
  apiKey: string
  habits: Habit[]
  /** Whether this deployment has a coach. Without one there are no sub-tabs. */
  coachConfigured: boolean
  tab: DiscoverTab
  onTabChange: (tab: DiscoverTab) => void
  onAdoptProtocol: (protocol: CatalogProtocol) => void
  onAdoptHabit: (habit: CatalogHabit) => void
  onAdoptCustom: (spec: CustomHabitSpec) => void
  onRecommendations: (set: CoachRecommendationSet) => void
  storedRecommendations?: CoachRecommendationSet
  onRespondToSuggestion?: (entry: CoachRecommendationEntry, response: "dismiss" | "snooze") => void
}

const TABS = ["catalog", "coach"] as const
const icons = { catalog: Store, coach: MessageCircleHeart }

/**
 * Where new habits come from: the evidence catalog and, when the deployment
 * has one, the coach. One nav slot instead of two, so the mobile bar can hold
 * every view.
 */
export function DiscoverView({
  apiKey,
  habits,
  coachConfigured,
  tab,
  onTabChange,
  onAdoptProtocol,
  onAdoptHabit,
  onAdoptCustom,
  onRecommendations,
  storedRecommendations,
  onRespondToSuggestion,
}: DiscoverViewProps) {
  const t = useTranslations().habits.app.discoverView
  const active: DiscoverTab = coachConfigured ? tab : "catalog"

  const catalog = (
    <MarketplaceView trackerLayout habits={habits} onAdoptProtocol={onAdoptProtocol} onAdoptHabit={onAdoptHabit} />
  )

  if (!coachConfigured) return catalog

  return (
    <Tabs value={active} onValueChange={value => onTabChange(value as DiscoverTab)}>
      <TabOptions ids={TABS} icons={icons} labels={t.tabs} label={t.tabsLabel} />
      <TabsContent value={active}>
        {active === "catalog" ? (
          catalog
        ) : (
          <CoachPanel
            apiKey={apiKey}
            habits={habits}
            onAdoptProtocol={onAdoptProtocol}
            onAdoptHabit={onAdoptHabit}
            onAdoptCustom={onAdoptCustom}
            onRecommendations={onRecommendations}
            storedRecommendations={storedRecommendations}
            onRespondToSuggestion={onRespondToSuggestion}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
