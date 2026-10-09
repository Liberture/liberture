"use client"

import { useRef, type KeyboardEvent } from "react"
import { MessageCircleHeart, Store } from "lucide-react"

import { MarketplaceView } from "@/components/habits/marketplace/marketplace-view"
import { CoachPanel } from "@/components/habits/coach/coach-panel"
import type { DiscoverTab } from "@/components/habits/tracker/use-tracker-view"
import type { CatalogHabit, CatalogProtocol } from "@/lib/habits/protocols/catalog"
import type { CustomHabitSpec } from "@/lib/habits/agent/recommendation"
import type { CoachRecommendationSet, Habit } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

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
}

const TABS: Array<{ id: DiscoverTab; icon: typeof Store }> = [
  { id: "catalog", icon: Store },
  { id: "coach", icon: MessageCircleHeart },
]

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
}: DiscoverViewProps) {
  const t = useTranslations().habits.app.discoverView
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const active: DiscoverTab = coachConfigured ? tab : "catalog"

  const catalog = (
    <MarketplaceView habits={habits} onAdoptProtocol={onAdoptProtocol} onAdoptHabit={onAdoptHabit} />
  )

  if (!coachConfigured) return catalog

  // Arrow keys move between tabs, as the tabs pattern expects.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const index = TABS.findIndex((item) => item.id === active)
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]
    onTabChange(next.id)
    tabRefs.current[TABS.indexOf(next)]?.focus()
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t.tabsLabel}
        onKeyDown={onKeyDown}
        className="inline-flex items-center gap-1 rounded-xl bg-muted/50 p-1"
      >
        {TABS.map(({ id, icon: Icon }, index) => {
          const selected = active === id
          return (
            <button
              key={id}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              type="button"
              role="tab"
              id={`discover-tab-${id}`}
              aria-selected={selected}
              aria-controls={`discover-panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t.tabs[id]}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`discover-panel-${active}`} aria-labelledby={`discover-tab-${active}`}>
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
          />
        )}
      </div>
    </div>
  )
}
