"use client"

import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRight, Check, Search, SlidersHorizontal } from "lucide-react"

import { IslandRidge, RippleBloom } from "@/components/patterns"
import { ProtocolCard } from "@/components/tracker/protocol-card"
import { ProtocolReader } from "@/components/tracker/protocol-reader"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import { useHabitsSession } from "@/components/habits/session-provider"
import type { CatalogProtocol } from "@/lib/tracker/types"
import { translations, type PillarId } from "@/lib/translations"
import { cn } from "@/lib/utils"

type Filter = "all" | PillarId

const PILLARS = translations.en.common.pillars

export function ProtocolsBrowser({ protocols }: { protocols: CatalogProtocol[] }) {
  const router = useRouter()
  const { isSignedIn, openSignIn } = useHabitsSession()
  const [adopted, setAdopted] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  // A pick made while signed out, added once sign-in completes.
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pillar, setPillar] = useState<Filter>("all")
  const [reading, setReading] = useState<string | null>(null)

  const selected = adopted

  // What's already in the signed-in user's tracker (database, via the session cookie).
  useEffect(() => {
    if (!isSignedIn) {
      setAdopted(new Set())
      setHydrated(false)
      return
    }
    let cancelled = false
    fetch("/api/tracker/protocols")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        setAdopted(new Set<string>(d.adopted ?? []))
        setHydrated(true)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [isSignedIn])

  const adopt = useCallback(async (slug: string) => {
    const res = await fetch("/api/tracker/protocols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
    if (res.ok) setAdopted((prev) => new Set(prev).add(slug))
  }, [])

  useEffect(() => {
    if (!isSignedIn || !pendingSlug) return
    setPendingSlug(null)
    void adopt(pendingSlug)
  }, [isSignedIn, pendingSlug, adopt])

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
    // Already tracked: the tracker is where it lives now.
    if (selected.has(slug)) {
      router.push("/tracker")
      return
    }
    if (!isSignedIn) {
      setPendingSlug(slug)
      openSignIn({ next: null })
      return
    }
    void adopt(slug)
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
          {hydrated && selected.size > 0 ? (
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Check className="h-4 w-4" aria-hidden />
              {`${selected.size} in your tracker`}
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
                    selected={selected.has(protocol.slug)}
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
        selected={reading ? selected.has(reading) : false}
        onToggle={() => reading && toggle(reading)}
        onClose={() => setReading(null)}
        shareable
        addLabel={
          isSignedIn
            ? { add: "Add to my tracker", added: "In your tracker — open it" }
            : { add: "Sign in & add to my tracker", added: "In your tracker — open it" }
        }
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
