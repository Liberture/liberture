"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { IslandRidge, RippleBloom } from "@/components/patterns"
import { MarketplaceView } from "@/components/habits/marketplace/marketplace-view"
import { useHabitsSession } from "@/components/habits/session-provider"
import type { CatalogProtocol } from "@/lib/habits/protocols/catalog"

export function ProtocolsBrowser({ protocols }: { protocols: CatalogProtocol[] }) {
  const { isSignedIn } = useHabitsSession()
  const [adopted, setAdopted] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
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

  return (
    <div className="relative min-h-screen overflow-hidden py-12 px-4">
      <IslandRidge placement="corner" gradient="neon" size="420px" className="-left-24 -top-16" opacity={0.13} />
      <RippleBloom placement="corner" gradient="plasma" size="380px" className="-right-20 top-1/3" opacity={0.11} />

      <div className="container relative mx-auto max-w-7xl">
        <MarketplaceView catalog={protocols} adopted={adopted} shareable
          onAdoptProtocol={isSignedIn ? protocol => void adopt(protocol.slug) : undefined} heading={<>
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

          {hydrated && adopted.size > 0 ? (
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Check className="h-4 w-4" aria-hidden />
              {`${adopted.size} in your tracker`}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </>} />
      </div>
    </div>
  )
}
