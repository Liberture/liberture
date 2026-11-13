"use client"

import { DirectoryGrid } from "@/components/directory/layout"
import { FieldSelect, FieldOption } from "@/components/ui/select"
import { memo, useCallback, useMemo, useState } from "react"
import { ArrowDownUp, Store } from "lucide-react"

import { PILLAR_IDS, type PillarId } from "@/lib/habits/pillars"
import {
  CATALOG_AUTHORS,
  CATALOG_PROTOCOLS,
  DIFFICULTY_ORDER,
  STANDALONE_HABITS,
  type CatalogHabit,
  type CatalogProtocol,
} from "@/lib/habits/protocols/catalog"
import { COST_TIER_ORDER } from "@/lib/habits/protocols/cost"
import {
  DEFAULT_FILTER,
  filterCatalogHabits,
  filterProtocols,
  SORT_LABEL,
  type CatalogFilter,
  type SortMode,
} from "@/lib/habits/protocols/filter"
import { adoptedProtocolSlugs, adoptedSlugs } from "@/lib/habits/protocols/adopt"
import type { Habit } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

import { useCatalogLabels } from "./pillar-tag"
import { CatalogHabitCard, ProtocolCard } from "./protocol-card"
import { MarketplaceSearch } from "./marketplace-search"
import { ProtocolReader } from "./protocol-reader"

interface MarketplaceViewProps {
  catalog?: CatalogProtocol[]
  heading?: React.ReactNode
  adopted?: Set<string>
  shareable?: boolean
  habits?: Habit[]
  onAdoptProtocol?: (protocol: CatalogProtocol) => void
  onAdoptHabit?: (habit: CatalogHabit) => void
}

/**
 * Memoised: the view track keeps every visited screen mounted, so this
 * re-renders whenever it becomes active again. With stable props that is pure
 * waste — this component is one of the expensive ones to rebuild.
 */
const EMPTY_HABITS: Habit[] = []

export const MarketplaceView = memo(function MarketplaceView({ habits = EMPTY_HABITS, catalog = CATALOG_PROTOCOLS, heading, adopted, shareable, onAdoptProtocol, onAdoptHabit }: MarketplaceViewProps) {
  const t = useTranslations().habits.app.marketplaceView
  const labels = useCatalogLabels()
  const [filter, setFilter] = useState<CatalogFilter>(DEFAULT_FILTER)
  const [draft, setDraft] = useState("")
  const [readingSlug, setReadingSlug] = useState<string | null>(null)

  const habitSlugs = useMemo(() => adoptedSlugs(habits), [habits])
  const protocolSlugs = useMemo(() => adopted ?? adoptedProtocolSlugs(habits, catalog), [adopted, habits, catalog])

  const protocols = useMemo(() => filterProtocols(catalog, filter), [catalog, filter])
  const standalone = useMemo(() => filterCatalogHabits(STANDALONE_HABITS, filter), [filter])

  const author = CATALOG_AUTHORS.find(author => author.id === filter.authorId)
  const reading = readingSlug ? catalog.find((p) => p.slug === readingSlug) : undefined
  const filterStyle = (active: boolean) => active ? "w-auto max-w-full font-bold text-primary border-primary/60 [&_.text-muted-foreground]:text-primary" : "w-auto max-w-full"

  const update = useCallback(
    <K extends keyof CatalogFilter>(key: K, value: CatalogFilter[K]) =>
      setFilter((current) => ({ ...current, [key]: value })),
    []
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {heading ?? <header className="space-y-2 text-center">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Store aria-hidden className="size-5 text-primary" /> {t.title}
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">{t.description}</p>
      </header>}

      <MarketplaceSearch catalog={catalog} query={draft} onQuery={setDraft} author={author}
        onSearch={() => update("query", draft.trim())}
        onRemoveAuthor={() => update("authorId", "all")}
        onAuthor={authorId => {
          setDraft("")
          setFilter(current => ({ ...DEFAULT_FILTER, sort: current.sort, authorId }))
        }}
        onProtocol={setReadingSlug} />
      <div data-no-swipe className="flex flex-wrap items-center justify-center gap-2">
        <FieldSelect value={filter.pillar} prefix={t.vertical} aria-label={t.vertical} className={filterStyle(filter.pillar !== DEFAULT_FILTER.pillar)} onValueChange={value => update("pillar", value as PillarId | "all")}>
          <FieldOption value="all">{t.all}</FieldOption>
          {PILLAR_IDS.map(pillar => <FieldOption key={pillar} value={pillar}>{labels.pillar[pillar]}</FieldOption>)}
        </FieldSelect>
        <FieldSelect value={filter.maxCost} aria-label={t.cost} prefix={t.cost} className={filterStyle(filter.maxCost !== DEFAULT_FILTER.maxCost)} onValueChange={value => update("maxCost", value as CatalogFilter["maxCost"])}>
          <FieldOption value="any">{t.any}</FieldOption>
          {COST_TIER_ORDER.map(tier => <FieldOption key={tier} value={tier} title={labels.costBlurb[tier]}>{labels.costTier[tier]}</FieldOption>)}
        </FieldSelect>
        <FieldSelect value={filter.difficulty} aria-label={t.effort} prefix={t.effort} className={filterStyle(filter.difficulty !== DEFAULT_FILTER.difficulty)} onValueChange={value => update("difficulty", value as CatalogFilter["difficulty"])}>
          <FieldOption value="all">{t.any}</FieldOption>
          {DIFFICULTY_ORDER.map(level => <FieldOption key={level} value={level}>{labels.difficulty[level]}</FieldOption>)}
        </FieldSelect>
      </div>

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
          <DirectoryGrid>
            {protocols.map((protocol) => (
              <ProtocolCard
                key={protocol.slug}
                protocol={protocol}
                adopted={protocolSlugs.has(protocol.slug)}
                onRead={() => setReadingSlug(protocol.slug)}
                onAdopt={onAdoptProtocol && (() => onAdoptProtocol(protocol))}
              />
            ))}
          </DirectoryGrid>
        )}
      </section>

      {onAdoptHabit && filter.authorId === "all" ? (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            {formatMessage(t.singleHabitsHeading, { count: standalone.length })}
          </h3>
          {standalone.length === 0 ? (
            <EmptyShelf>{t.noHabits}</EmptyShelf>
          ) : (
            <DirectoryGrid>
              {standalone.map((habit) => (
                <CatalogHabitCard
                  key={habit.slug}
                  habit={habit}
                  adopted={habitSlugs.has(habit.slug)}
                  onAdopt={() => onAdoptHabit(habit)}
                />
              ))}
            </DirectoryGrid>
          )}
        </section>
      ) : null}

      {reading ? (
        <ProtocolReader
          protocol={reading}
          adopted={protocolSlugs.has(reading.slug)}
          shareable={shareable}
          onAdopt={onAdoptProtocol && (() => {
            onAdoptProtocol(reading)
            setReadingSlug(null)
          })}
          onClose={() => setReadingSlug(null)}
        />
      ) : null}
    </div>
  )
})

function EmptyShelf({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
