"use client"

import { useEffect } from "react"
import { AlertTriangle, Check, ExternalLink, Plus, Sparkles, Wallet, X } from "lucide-react"

import { PILLAR_STYLES } from "@/lib/habits/pillars"
import type { CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { formatSourceMeta } from "@/lib/habits/protocols/sources"
import { ModalPortal } from "@/components/habits/ui/modal-portal"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

import { DifficultyTag, PillarTag, useCatalogLabels } from "./pillar-tag"

interface ProtocolReaderProps {
  protocol: CatalogProtocol
  adopted: boolean
  onAdopt: () => void
  onClose: () => void
}

/**
 * Full-text protocol view: the why, the steps, what it buys you, what to watch
 * for, and the references behind it. The point of the marketplace is that a user
 * decides with evidence in front of them, not from a title.
 */
export function ProtocolReader({ protocol, adopted, onAdopt, onClose }: ProtocolReaderProps) {
  const t = useTranslations().habits.app.protocolReader
  const labels = useCatalogLabels()
  const styles = PILLAR_STYLES[protocol.pillar]

  // Escape closes. Scroll locking is ModalPortal's job — it has to lock the
  // shell's own scroll panels, not just <body>.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t.closeProtocolAria}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />

      {/*
        A flex column rather than one tall scroll container with sticky children.
        The sticky version let the header grow without bound — it only had to
        hold a title, and once it also held the description and the author card
        it was eating most of a phone screen and squeezing the actual content
        into a sliver. Here the header and footer take what they need, and the
        body gets everything left over and scrolls.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={protocol.name}
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-border bg-card shadow-2xl sm:max-h-[88dvh] sm:rounded-2xl"
      >
        <header
          className={cn(
            "flex shrink-0 items-start gap-3 border-b border-border p-4 sm:p-5",
            styles.background
          )}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <PillarTag pillar={protocol.pillar} />
              <DifficultyTag difficulty={protocol.difficulty} />
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Wallet className="h-3 w-3" aria-hidden />
                {labels.costSummary(protocol.cost, protocol.costTier)}
              </span>
            </div>
            <h2 className="text-balance text-lg font-bold leading-tight text-foreground sm:text-xl">
              {protocol.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{protocol.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{protocol.duration}</span>
            <span>
              {plural(t.habitCount, protocol.habits.length)}
            </span>
          </div>

          {/* Who is making the claim. Matters more here than it does elsewhere. */}
          {protocol.author ? (
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-sm font-semibold text-foreground">
                {protocol.author.name}
                {protocol.coAuthors.length > 0
                  ? ` · ${protocol.coAuthors.map((a) => a.name).join(", ")}`
                  : ""}
              </p>
              <p className="text-xs text-muted-foreground">{protocol.author.credentials}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{protocol.author.bio}</p>
              {protocol.author.url ? (
                <a
                  href={protocol.author.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                >
                  {protocol.author.url.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
            </div>
          ) : protocol.creator ? (
            <p className="text-xs text-muted-foreground">{protocol.creator}</p>
          ) : null}

          <Section title={t.whyItWorks}>
            <p className="text-sm leading-relaxed text-muted-foreground">{protocol.why}</p>
          </Section>

          <Section title={t.howToRun}>
            <ol className="space-y-2.5">
              {protocol.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      styles.border,
                      styles.background,
                      styles.text
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={t.whatYouGet}>
            <ul className="space-y-2">
              {protocol.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-nutrition" aria-hidden />
                  <span className="leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </Section>

          {protocol.risks.length > 0 ? (
            <Section title={t.watchOutFor}>
              <ul className="space-y-2">
                {protocol.risks.map((risk) => (
                  <li key={risk} className="flex gap-2.5 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-exercise" aria-hidden />
                    <span className="leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {protocol.equipment.length > 0 ? (
            <Section title={t.whatYouNeed}>
              <div className="flex flex-wrap gap-2">
                {protocol.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          <Section title={t.whatItCosts}>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {labels.costSummary(protocol.cost, protocol.costTier)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {labels.costBlurb[protocol.costTier]}
                </span>
              </p>

              {protocol.cost?.items?.length ? (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {protocol.cost.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                    >
                      <span className="min-w-0 text-muted-foreground">
                        {item.label}
                        {item.optional ? (
                          <span className="ml-1.5 rounded border border-border px-1 py-0.5 text-[10px] uppercase tracking-wide">
                            {t.optional}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-mono text-foreground">
                        {item.amount === undefined ? "—" : `$${item.amount}`}
                        <span className="ml-1 text-muted-foreground">
                          {item.recurrence === "one-time" ? "" : item.recurrence === "monthly" ? t.perMonth : t.perYear}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {protocol.cost?.note ? (
                <p className="rounded-lg border border-border bg-accent/30 p-3 text-xs leading-relaxed text-foreground">
                  {protocol.cost.note}
                </p>
              ) : null}
            </div>
          </Section>

          <Section title={formatMessage(t.habitsTracking, { count: protocol.habits.length })}>
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
          </Section>

          <Section title={t.evidence}>
            <ul className="space-y-3">
              {protocol.evidence.map((source, index) => {
                const meta = formatSourceMeta(source)
                return (
                  <li key={`${source.title}-${index}`} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {labels.sourceType[source.type]}
                      </span>
                      {source.strength ? (
                        <span
                          className={cn(
                            "text-[10px] font-medium uppercase tracking-wide",
                            source.strength === "strong"
                              ? "text-nutrition"
                              : source.strength === "moderate"
                                ? "text-muted-foreground"
                                : "text-muted-foreground/70"
                          )}
                        >
                          {labels.strength[source.strength]}
                        </span>
                      ) : null}
                    </div>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-1 text-xs font-medium leading-relaxed text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                      >
                        {source.title}
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <p className="text-xs font-medium leading-relaxed text-foreground">{source.title}</p>
                    )}
                    {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
                  </li>
                )
              })}
            </ul>
          </Section>
        </div>

        <footer className="flex shrink-0 gap-3 border-t border-border bg-card/95 p-4 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={onAdopt}
            disabled={adopted}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              adopted
                ? cn("cursor-default border", styles.border, styles.background, styles.text)
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {adopted ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                {t.alreadyTracking}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden />
                {plural(t.addHabits, protocol.habits.length)}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
    </ModalPortal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">{title}</h3>
      {children}
    </section>
  )
}
