"use client"

import { Sparkles, Wallet } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { PILLAR_STYLES } from "@/lib/habits/pillars"
import type { CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { cn } from "@/lib/utils"
import { DifficultyTag, PillarTag, useCatalogLabels } from "./pillar-tag"

export function ProtocolFacts({ protocol, className }: { protocol: CatalogProtocol; className?: string }) {
  const t = useTranslations().habits.app.protocolReader
  const labels = useCatalogLabels()
  return (
    <aside aria-label={t.facts} className={cn("space-y-3 rounded-xl border border-border bg-card p-4", className)}>
      <h3 className="text-sm font-semibold text-foreground">{t.facts}</h3>
      <div className="flex flex-wrap items-center gap-1.5">
        <PillarTag pillar={protocol.pillar} />
        <DifficultyTag difficulty={protocol.difficulty} />
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Wallet className="h-3 w-3" aria-hidden />
          {labels.costSummary(protocol.cost, protocol.costTier)}
        </span>
      </div>
      <dl className="space-y-2 text-sm">
        <div><dt className="text-xs text-muted-foreground">{t.duration}</dt><dd>{protocol.duration}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t.habits}</dt><dd>{protocol.habits.length}</dd></div>
      </dl>
    </aside>
  )
}

export function ProtocolHabits({ protocol }: { protocol: CatalogProtocol }) {
  const styles = PILLAR_STYLES[protocol.pillar]
  const labels = useCatalogLabels()
  return (
    <ul className="space-y-2">
      {protocol.habits.map((habit) => (
        <li
          key={habit.slug}
          className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3"
        >
          <Sparkles className={cn("mt-0.5 h-4 w-4 shrink-0", styles.text)} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{habit.name}</p>
            <p className="text-xs text-muted-foreground">{habit.why}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-mono">{habit.time}</span>
              <span aria-hidden> · </span>
              {labels.schedule(habit.schedule)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
