"use client"

import { AlarmClock, Clock, Plus, Sparkles, X } from "lucide-react"

import { CatalogHabitCard, ProtocolCard } from "@/components/habits/marketplace/protocol-card"
import { DifficultyTag, PillarTag, useCatalogLabels } from "@/components/habits/marketplace/pillar-tag"
import type { CustomHabitSpec, Recommendation } from "@/lib/habits/agent/recommendation"
import { PILLAR_STYLES } from "@/lib/habits/pillars"
import { findCatalogHabit, findProtocol } from "@/lib/habits/protocols/catalog"
import type { CatalogHabit, CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"

/** What identifies a card across replies: its slug, or the custom habit's name (as suggestionKey does). */
export function recommendationKey(rec: Recommendation): string {
  return rec.slug ?? rec.custom?.name.trim().toLowerCase() ?? ""
}

interface RecommendationCardsProps {
  recommendations: Recommendation[]
  adoptedHabitSlugs: Set<string>
  adoptedProtocolSlugs: Set<string>
  onAdoptProtocol: (protocol: CatalogProtocol) => void
  onAdoptHabit: (habit: CatalogHabit) => void
  onAdoptCustom: (spec: CustomHabitSpec) => void
  onReadProtocol: (protocol: CatalogProtocol) => void
  /** Keys (recommendationKey) of suggestions the user dismissed or snoozed: not shown. */
  hiddenKeys?: Set<string>
  /** Dismiss or snooze a suggestion; without it the cards have no such buttons. */
  onRespond?: (rec: Recommendation, response: "dismiss" | "snooze") => void
}

/**
 * Renders what the coach suggested as cards with working Add buttons.
 *
 * Catalog suggestions reuse the marketplace's own cards, so a recommendation
 * looks and behaves exactly like browsing to the same entry — same adopted
 * state, same reader, same adoption path. The coach is a way of finding things
 * in the marketplace, not a second way of adding habits.
 */
export function RecommendationCards({
  recommendations,
  adoptedHabitSlugs,
  adoptedProtocolSlugs,
  onAdoptProtocol,
  onAdoptHabit,
  onAdoptCustom,
  onReadProtocol,
  hiddenKeys,
  onRespond,
}: RecommendationCardsProps) {
  const visible = hiddenKeys?.size ? recommendations.filter((rec) => !hiddenKeys.has(recommendationKey(rec))) : recommendations
  if (visible.length === 0) return null

  return (
    <div className="mt-4 space-y-3">
      {visible.map((rec, index) => {
        const respond = onRespond ? (response: "dismiss" | "snooze") => onRespond(rec, response) : undefined
        // Slugs come from a model and the catalog changes between releases, so
        // a miss is expected rather than exceptional. Drop the card and keep
        // the prose — a broken card is worse than one fewer suggestion.
        if (rec.kind === "protocol") {
          const protocol = rec.slug ? findProtocol(rec.slug) : undefined
          if (!protocol) return null
          return (
            <Reason key={`${rec.slug}-${index}`} reason={rec.reason} onRespond={adoptedProtocolSlugs.has(protocol.slug) ? undefined : respond}>
              <ProtocolCard
                protocol={protocol}
                adopted={adoptedProtocolSlugs.has(protocol.slug)}
                onRead={() => onReadProtocol(protocol)}
                onAdopt={() => onAdoptProtocol(protocol)}
              />
            </Reason>
          )
        }

        if (rec.kind === "habit") {
          const habit = rec.slug ? findCatalogHabit(rec.slug) : undefined
          if (!habit) return null
          return (
            <Reason key={`${rec.slug}-${index}`} reason={rec.reason} onRespond={adoptedHabitSlugs.has(habit.slug) ? undefined : respond}>
              <CatalogHabitCard
                habit={habit}
                adopted={adoptedHabitSlugs.has(habit.slug)}
                onAdopt={() => onAdoptHabit(habit)}
              />
            </Reason>
          )
        }

        if (!rec.custom) return null
        return (
          <Reason key={`custom-${index}`} reason={rec.reason} onRespond={respond}>
            <CustomHabitCard spec={rec.custom} onAdopt={() => onAdoptCustom(rec.custom!)} />
          </Reason>
        )
      })}
    </div>
  )
}

/** The coach's justification, above the card it justifies, and Dismiss / Snooze below it. */
function Reason({
  reason,
  children,
  onRespond,
}: {
  reason: string
  children: React.ReactNode
  onRespond?: (response: "dismiss" | "snooze") => void
}) {
  const t = useTranslations().habits.app.coachPanel
  return (
    <div className="space-y-1.5">
      {reason ? (
        <p className="flex gap-2 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>{reason}</span>
        </p>
      ) : null}
      {children}
      {onRespond ? (
        <div role="group" aria-label={t.suggestionActions} className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onRespond("snooze")}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <AlarmClock className="h-3.5 w-3.5" aria-hidden />
            {t.snooze}
          </button>
          <button
            type="button"
            onClick={() => onRespond("dismiss")}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t.dismiss}
          </button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * A habit the coach invented, with no catalog entry behind it. Deliberately
 * plainer than a marketplace card: there is no evidence, author or cost to
 * show, and dressing it up the same way would overstate where it came from.
 */
function CustomHabitCard({ spec, onAdopt }: { spec: CustomHabitSpec; onAdopt: () => void }) {
  const t = useTranslations().habits.app.recommendationCards
  const labels = useCatalogLabels()
  const styles = PILLAR_STYLES[spec.pillar]
  const schedule = labels.schedule(
    spec.scheduleType === "specific_days"
      ? { type: "specific_days", days: spec.days ?? [] }
      : spec.scheduleType === "times_per_week"
        ? { type: "times_per_week", timesPerWeek: spec.timesPerWeek ?? 3 }
        : { type: "daily" }
  )

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-dashed p-4",
        styles.border,
        "bg-card/60"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PillarTag pillar={spec.pillar} />
        <DifficultyTag difficulty="moderate" />
        <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {t.madeForYou}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold leading-snug text-foreground">{spec.name}</h3>
        {spec.why ? <p className="text-sm text-muted-foreground">{spec.why}</p> : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {spec.time} · {schedule}
        </p>
        <button
          type="button"
          onClick={onAdopt}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t.add}
        </button>
      </div>
    </article>
  )
}
