"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect } from "react"
import { AlertTriangle, Check, Clock, Plus, Sparkles, X } from "lucide-react"

import { PILLAR_STYLES } from "@/lib/pillars"
import { scheduleLabel } from "@/lib/tracker/streaks"
import type { CatalogProtocol } from "@/lib/tracker/types"
import { cn } from "@/lib/utils"

import { DifficultyTag } from "./protocol-card"
import { PillarTag } from "./pillar-chip"

/**
 * Full-text protocol view. This is the "read before you commit" surface — the
 * why, the habits it becomes, what it's good for, and what to watch out for.
 */
export function ProtocolReader({
  protocol,
  selected,
  onToggle,
  onClose,
}: {
  protocol: CatalogProtocol | null
  selected: boolean
  onToggle: () => void
  onClose: () => void
}) {
  // Escape closes, and the page behind shouldn't scroll while the sheet is open.
  useEffect(() => {
    if (!protocol) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [protocol, onClose])

  return (
    <AnimatePresence>
      {protocol ? (
        <motion.div
          // Above the cookie-consent banner (z-50), which otherwise swallows
          // clicks on this sheet's footer.
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={protocol.name}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-card sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 p-6 pb-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <PillarTag pillar={protocol.pillar} />
                  <DifficultyTag difficulty={protocol.difficulty} />
                </div>
                <h2 className="text-2xl font-bold leading-tight">{protocol.name}</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden />
                  {protocol.duration}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <Section title="Why this works">
                <p className="text-sm leading-relaxed text-muted-foreground">{protocol.why}</p>
              </Section>

              <Section title={`Becomes ${protocol.habits.length} daily habit${protocol.habits.length === 1 ? "" : "s"}`}>
                <ul className="space-y-2">
                  {protocol.habits.map((habit) => {
                    const styles = PILLAR_STYLES[habit.pillar]
                    return (
                      <li
                        key={habit.slug}
                        className={cn("rounded-lg border p-3", styles.border, styles.background)}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{habit.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {habit.time} · {scheduleLabel(habit.schedule)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{habit.why}</p>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Every time and schedule here is editable once it's in your tracker.
                </p>
              </Section>

              <Section title="What you get">
                <ul className="space-y-1.5">
                  {protocol.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2 text-sm text-muted-foreground">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </Section>

              {protocol.risks.length > 0 ? (
                <Section title="Watch out for">
                  <ul className="space-y-1.5">
                    {protocol.risks.map((risk) => (
                      <li key={risk} className="flex gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-exercise" aria-hidden />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              <Section title="Evidence">
                <ul className="space-y-1.5">
                  {protocol.evidence.map((ref) => (
                    <li key={ref} className="text-xs leading-relaxed text-muted-foreground">
                      {ref}
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            <footer className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={onToggle}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-colors",
                  selected
                    ? "border border-white/15 bg-white/5 text-foreground hover:bg-white/10"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {selected ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden />
                    Added — tap to remove
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden />
                    Add to my tracker
                  </>
                )}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</h3>
      {children}
    </section>
  )
}
