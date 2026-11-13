"use client"

import { useLocale, useTranslations } from "next-intl"
import Link from "@/components/i18n/localized-link"
import { useCallback, useEffect, useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { DirectoryLayout, DirectoryHeader } from "@/components/directory/layout"
import { MarketplaceView } from "@/components/habits/marketplace/marketplace-view"
import { useHabitsSession } from "@/components/habits/session-provider"
import type { CatalogProtocol } from "@/lib/habits/protocols/catalog"

export function ProtocolsBrowser({ protocols }: { protocols: CatalogProtocol[] }) {
  const locale = useLocale()
  const t = useTranslations("habits.protocolLibrary")
  const { isSignedIn, auth } = useHabitsSession()
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
    fetch("/api/tracker/protocols", { headers: auth.apiKey ? { Authorization: `Bearer ${auth.apiKey}` } : undefined, cache: "no-store" })
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
  }, [isSignedIn, auth.apiKey, auth.pubkey])

  const adopt = useCallback(async (slug: string) => {
    const res = await fetch("/api/tracker/protocols", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth.apiKey && { Authorization: `Bearer ${auth.apiKey}` }) },
      body: JSON.stringify({ slug, locale }),
    })
    if (res.ok) setAdopted((prev) => new Set(prev).add(slug))
  }, [locale, auth.apiKey])

  return (
    <DirectoryLayout>
        <MarketplaceView catalog={protocols} adopted={adopted} shareable
          onAdoptProtocol={isSignedIn ? protocol => void adopt(protocol.slug) : undefined} heading={<>
        <DirectoryHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

          {hydrated && adopted.size > 0 ? (
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Check className="h-4 w-4" aria-hidden />
              {t("inTracker", { count: adopted.size })}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </>} />
    </DirectoryLayout>
  )
}
