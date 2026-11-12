"use client"

import { FieldSelect, FieldOption } from "@/components/ui/select"
import { memo, useCallback, useMemo, useState } from "react"
import { ArrowDownUp, Search, Store, X } from "lucide-react"

import { PILLAR_ICON_MAP, PILLAR_IDS, PILLAR_STYLES, type PillarId } from "@/lib/habits/pillars"
import {
  CATALOG_PROTOCOLS,
  DIFFICULTY_ORDER,
  STANDALONE_HABITS,
  type CatalogHabit,
  type CatalogProtocol,
} from "@/lib/habits/protocols/catalog"
import { COST_TIER_ORDER } from "@/lib/habits/protocols/cost"
import {
  activeFilterCount,
  DEFAULT_FILTER,
  filterCatalogHabits,
  filterProtocols,
  SORT_LABEL,
  type CatalogFilter,
  type SortMode,
} from "@/lib/habits/protocols/filter"
import { adoptedProtocolSlugs, adoptedSlugs } from "@/lib/habits/protocols/adopt"
import type { Habit } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

import { useCatalogLabels } from "./pillar-tag"
import { CatalogHabitCard, ProtocolCard } from "./protocol-card"
import { AuthorFilter } from "./author-filter"
import { ProtocolReader } from "./protocol-reader"

interface MarketplaceViewProps {
  habits: Habit[]
  onAdoptProtocol: (protocol: CatalogProtocol) => void
  onAdoptHabit: (habit: CatalogHabit) => void
}

/**
 * Memoised: the view track keeps every visited screen mounted, so this
 * re-renders whenever it becomes active again. With stable props that is pure
 * waste — this component is one of the expensive ones to rebuild.
 */
export const MarketplaceView = memo(function MarketplaceView({ habits, onAdoptProtocol, onAdoptHabit }: MarketplaceViewProps) {
  const t = useTranslations().habits.app.marketplaceView
  const labels = useCatalogLabels()
  const [filter, setFilter] = useState<CatalogFilter>(DEFAULT_FILTER)
  const [readingSlug, setReadingSlug] = useState<string | null>(null)

  const habitSlugs = useMemo(() => adoptedSlugs(habits), [habits])
  const protocolSlugs = useMemo(() => adoptedProtocolSlugs(habits, CATALOG_PROTOCOLS), [habits])

  const protocols = useMemo(() => filterProtocols(CATALOG_PROTOCOLS, filter), [filter])
  const standalone = useMemo(() => filterCatalogHabits(STANDALONE_HABITS, filter), [filter])

  const reading = readingSlug ? CATALOG_PROTOCOLS.find((p) => p.slug === readingSlug) : undefined
  const activeCount = activeFilterCount(filter)

  const update = useCallback(
    <K extends keyof CatalogFilter>(key: K, value: CatalogFilter[K]) =>
      setFilter((current) => ({ ...current, [key]: value })),
    []
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-2">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Store aria-hidden className="size-5 text-primary" /> {t.title}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{t.description}</p>
      </header>

      {/* Search and filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] sm:items-center" data-no-swipe>
        <div className="relative col-span-2 sm:col-span-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={filter.query}
            onChange={(e) => update("query", e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchAria}
            className="w-full rounded-lg border border-border bg-card/60 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <AuthorFilter value={filter.authorId} onChange={value => update("authorId", value)} />
        <FieldSelect value={filter.maxCost} aria-label={t.cost} prefix={t.cost} className="w-full sm:w-auto" onValueChange={value => update("maxCost", value as CatalogFilter["maxCost"])}>
          <FieldOption value="any">{t.any}</FieldOption>
          {COST_TIER_ORDER.map(tier => <FieldOption key={tier} value={tier} title={labels.costBlurb[tier]}>{labels.costTier[tier]}</FieldOption>)}
        </FieldSelect>
        <FieldSelect value={filter.difficulty} aria-label={t.effort} prefix={t.effort} className="w-full sm:w-auto" onValueChange={value => update("difficulty", value as CatalogFilter["difficulty"])}>
          <FieldOption value="all">{t.any}</FieldOption>
          {DIFFICULTY_ORDER.map(level => <FieldOption key={level} value={level}>{labels.difficulty[level]}</FieldOption>)}
        </FieldSelect>
      </div>

      {/* Pillar filter */}
      <div data-no-swipe className="custom-scrollbar lb-scroll-x -mx-1 flex gap-2 px-1 pb-1">
        <FilterChip active={filter.pillar === "all"} onClick={() => update("pillar", "all")}>
          {t.all}
        </FilterChip>
        {PILLAR_IDS.map((pillar) => {
          const Icon = PILLAR_ICON_MAP[pillar]
          const styles = PILLAR_STYLES[pillar]
          const active = filter.pillar === pillar
          return (
            <FilterChip
              key={pillar}
              active={active}
              className={active ? cn(styles.border, styles.background, styles.text) : undefined}
              onClick={() => update("pillar", pillar as PillarId)}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {labels.pillar[pillar]}
            </FilterChip>
          )
        })}
      </div>

      {activeCount > 0 ? (
        <button
          type="button"
          onClick={() => setFilter(DEFAULT_FILTER)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-3 w-3" aria-hidden />
          {formatMessage(t.clear, { count: activeCount })}
        </button>
      ) : null}

      <section className="space-y-4">
        <div data-no-swipe className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            {formatMessage(t.protocolsHeading, { count: protocols.length })}
          </h3>
          <FieldSelect
            prefix={<ArrowDownUp aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
            value={filter.sort}
            onValueChange={(value) => update("sort", value as SortMode)}
            aria-label={t.sortAria}
            className="w-auto max-w-full"
          >
            {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
              <FieldOption key={mode} value={mode}>
                {labels.sort[mode]}
              </FieldOption>
            ))}
          </FieldSelect>
        </div>
        {protocols.length === 0 ? (
          <EmptyShelf>{t.noProtocols}</EmptyShelf>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {protocols.map((protocol) => (
              <ProtocolCard
                key={protocol.slug}
                protocol={protocol}
                adopted={protocolSlugs.has(protocol.slug)}
                onRead={() => setReadingSlug(protocol.slug)}
                onAdopt={() => onAdoptProtocol(protocol)}
              />
            ))}
          </div>
        )}
      </section>

      {filter.authorId === "all" ? (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            {formatMessage(t.singleHabitsHeading, { count: standalone.length })}
          </h3>
          {standalone.length === 0 ? (
            <EmptyShelf>{t.noHabits}</EmptyShelf>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {standalone.map((habit) => (
                <CatalogHabitCard
                  key={habit.slug}
                  habit={habit}
                  adopted={habitSlugs.has(habit.slug)}
                  onAdopt={() => onAdoptHabit(habit)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {reading ? (
        <ProtocolReader
          protocol={reading}
          adopted={protocolSlugs.has(reading.slug)}
          onAdopt={() => {
            onAdoptProtocol(reading)
            setReadingSlug(null)
          }}
          onClose={() => setReadingSlug(null)}
        />
      ) : null}
    </div>
  )
})

function FilterChip({
  active,
  className,
  onClick,
  title,
  children,
}: {
  active: boolean
  className?: string
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

function EmptyShelf({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
