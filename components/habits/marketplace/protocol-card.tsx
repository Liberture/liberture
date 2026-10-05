"use client"

import { BookOpen, BookOpenCheck, Check, Clock, ListChecks, Plus, Wallet } from "lucide-react"

import { PILLAR_STYLES } from "@/lib/habits/pillars"
import type { CatalogHabit, CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

import { DifficultyTag, PillarTag, useCatalogLabels } from "./pillar-tag"

interface ProtocolCardProps {
  protocol: CatalogProtocol
  adopted: boolean
  onRead: () => void
  onAdopt: () => void
}

export function ProtocolCard({ protocol, adopted, onRead, onAdopt }: ProtocolCardProps) {
  const t = useTranslations().habits.app.protocolCard
  const labels = useCatalogLabels()
  const styles = PILLAR_STYLES[protocol.pillar]
  const habitCount = protocol.habits.length

  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-xl border p-5 transition-all duration-200 hover:-translate-y-1",
        adopted ? cn(styles.border, styles.background) : "border-border bg-card/60 hover:border-border/80"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PillarTag pillar={protocol.pillar} />
        <DifficultyTag difficulty={protocol.difficulty} />
        <span
          title={labels.costSummary(protocol.cost, protocol.costTier)}
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
            protocol.costTier === "free"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border bg-muted/40 text-muted-foreground"
          )}
        >
          {labels.costTier[protocol.costTier]}
        </span>
        {protocol.featured && !adopted ? (
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {t.featured}
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold leading-snug text-foreground">{protocol.name}</h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{protocol.tagline}</p>
        {protocol.author ? (
          <p className="text-xs text-muted-foreground/80">{protocol.author.name}</p>
        ) : null}
      </div>

      <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          <dd>
            {plural(t.habitCount, habitCount)}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          <dd>{protocol.duration}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          <dd>{labels.costSummary(protocol.cost, protocol.costTier)}</dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRead}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          {t.read}
        </button>
        <button
          type="button"
          onClick={onAdopt}
          disabled={adopted}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            adopted
              ? cn("cursor-default border", styles.border, styles.background, styles.text)
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {adopted ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              {t.added}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              {t.add}
            </>
          )}
        </button>
      </div>
    </article>
  )
}

interface HabitCardProps {
  habit: CatalogHabit
  adopted: boolean
  onAdopt: () => void
}

/** Compact card for the standalone habits shelf. */
export function CatalogHabitCard({ habit, adopted, onAdopt }: HabitCardProps) {
  const t = useTranslations().habits.app.protocolCard
  const labels = useCatalogLabels()
  const styles = PILLAR_STYLES[habit.pillar]

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-1",
        adopted ? cn(styles.border, styles.background) : "border-border bg-card/60 hover:border-border/80"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PillarTag pillar={habit.pillar} />
        {habit.readingContent?.enabled ? (
          <span
            title={t.readToCompleteHint}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground"
          >
            <BookOpenCheck className="h-3 w-3" aria-hidden />
            {t.readToComplete}
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold leading-snug text-foreground">{habit.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{habit.why}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="font-mono">{habit.time}</span>
          <span aria-hidden>·</span>
          <span>{labels.schedule(habit.schedule)}</span>
        </span>
        <button
          type="button"
          onClick={onAdopt}
          disabled={adopted}
          aria-label={formatMessage(adopted ? t.alreadyAddedAria : t.addAria, { name: habit.name })}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
            adopted
              ? cn("cursor-default border", styles.border, styles.background, styles.text)
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {adopted ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
          {adopted ? t.added : t.add}
        </button>
      </div>
    </article>
  )
}
