"use client"

import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, Check, Search, SlidersHorizontal } from "lucide-react"

import { IslandRidge, RippleBloom } from "@/components/patterns"
import { ProtocolCard } from "@/components/tracker/protocol-card"
import { ProtocolReader } from "@/components/tracker/protocol-reader"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import { useTracker } from "@/lib/tracker/use-tracker"
import type { CatalogProtocol } from "@/lib/tracker/types"
import { translations, type PillarId } from "@/lib/translations"
import { cn } from "@/lib/utils"

type Filter = "all" | PillarId

const PILLARS = translations.en.common.pillars

export function ProtocolsBrowser({ protocols }: { protocols: CatalogProtocol[] }) {
  const { state, hydrated, adoptProtocol, dropProtocol, completeOnboarding } = useTracker()
  const [query, setQuery] = useState("")
  const [pillar, setPillar] = useState<Filter>("all")
  const [reading, setReading] = useState<string | null>(null)

  const adopted = new Set(state.adoptedProtocols)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return protocols.filter((p) => {
      if (pillar !== "all" && p.pillar !== pillar) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.why.toLowerCase().includes(q) ||
        p.habits.some((h) => h.name.toLowerCase().includes(q))
      )
    })
  }, [protocols, query, pillar])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of protocols) map.set(p.pillar, (map.get(p.pillar) ?? 0) + 1)
    return map
  }, [protocols])

  const toggle = (slug: string) => {
    if (adopted.has(slug)) {
      dropProtocol(slug)
      return
    }
    adoptProtocol(slug)
    // Adopting a protocol is itself a first choice, so someone arriving straight
    // from /protocols shouldn't be bounced back into the wizard to see it.
    if (!state.onboarded) completeOnboarding()
  }

  return (
    <div className="relative min-h-screen overflow-hidden py-12 px-4">
      <IslandRidge placement="corner" gradient="neon" size="420px" className="-left-24 -top-16" opacity={0.13} />
      <RippleBloom placement="corner" gradient="plasma" size="380px" className="-right-20 top-1/3" opacity={0.11} />

      <div className="container relative mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            The Protocol Library
          </span>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Protocols</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Structured routines with the evidence attached. Explore them, share what works,
            download a protocol to keep — or add one and it becomes daily habits in your tracker.
          </p>
        </header>

        <div className="mx-auto mt-8 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search protocols, habits, or what they're for…"
              aria-label="Search protocols"
              className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-12 pr-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filter by pillar
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={pillar === "all"} onClick={() => setPillar("all")}>
              All protocols
              <Count n={protocols.length} />
            </FilterChip>
            {PILLARS.map((p) => {
              const Icon = PILLAR_ICON_MAP[p.id]
              const styles = PILLAR_STYLES[p.id]
              const active = pillar === p.id
              return (
                <FilterChip
                  key={p.id}
                  active={active}
                  activeClass={cn(styles.text, styles.border, styles.background)}
                  onClick={() => setPillar(active ? "all" : p.id)}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {p.name}
                  <Count n={counts.get(p.id) ?? 0} />
                </FilterChip>
              )
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {visible.length} of {protocols.length} protocols
          </p>
          {hydrated && adopted.size > 0 ? (
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Check className="h-4 w-4" aria-hidden />
              {adopted.size} in your tracker
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-muted-foreground">No protocols match that search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setPillar("all")
              }}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((protocol) => (
                <motion.div
                  key={protocol.slug}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProtocolCard
                    protocol={protocol}
                    selected={adopted.has(protocol.slug)}
                    onRead={() => setReading(protocol.slug)}
                    onToggle={() => toggle(protocol.slug)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ProtocolReader
        protocol={reading ? protocols.find((p) => p.slug === reading) ?? null : null}
        selected={reading ? adopted.has(reading) : false}
        onToggle={() => reading && toggle(reading)}
        onClose={() => setReading(null)}
        shareable
      />
    </div>
  )
}

function FilterChip({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean
  activeClass?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? (activeClass ?? "border-primary/40 bg-primary/15 text-primary")
          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/25 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Count({ n }: { n: number }) {
  return <span className="text-xs opacity-60">({n})</span>
}
