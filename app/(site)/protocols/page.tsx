import { unstable_cache } from "next/cache"
import type { Metadata } from "next"

import { getLocale, getTranslations } from "next-intl/server"
import { translatedAlternates } from "@/lib/seo/translated-routes"
import { directoryClientForLocale } from "@/lib/i18n/directory-records.server"
import { catalogProtocols } from "@/lib/habits/protocols/localized-catalog"
import { type CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { normalizeSources } from "@/lib/habits/protocols/sources"
import type { Locale, PillarId } from "@/lib/translations"

import { ProtocolsBrowser } from "./protocols-browser"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations("habits.protocolLibrary")
  const title = t("seoTitle")
  const description = t("description")
  const imageAlt = t("imageAlt")
  const alternates = translatedAlternates("/protocols", locale)
  const images = [{ url: "/og-image.jpg", width: 1200, height: 630, alt: imageAlt }]
  return {
    title, description, alternates,
    openGraph: {
      type: "website", siteName: "Liberture", title, description, url: alternates.canonical,
      locale: locale === "es" ? "es_ES" : "en_US", alternateLocale: locale === "es" ? "en_US" : "es_ES", images,
    },
    twitter: { card: "summary_large_image", title, description, images, site: "@liberture", creator: "@liberture" },
  }
}

function parseList(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

const DIFFICULTY: Record<string, CatalogProtocol["difficulty"]> = {
  beginner: "easy",
  intermediate: "moderate",
  advanced: "hard",
}

const publishedProtocols = unstable_cache(
  (locale: Locale) => directoryClientForLocale(locale).protocol.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: { slug: true, name: true, description: true, why: true, pillar: true, difficulty: true, duration: true, benefits: true, risks: true, references: true },
  }),
  ["public-protocol-library-v1"],
  { revalidate: 60 },
)

/**
 * Published protocols from the database, shaped for the browser. Habit
 * breakdowns aren't stored per-protocol, so they're taken from the bundled
 * catalog by slug — the same source the seeder writes from.
 */
async function loadProtocols(): Promise<CatalogProtocol[]> {
  const locale = await getLocale()
  const bundled = catalogProtocols(locale)
  try {
    const rows = await publishedProtocols(locale)
    if (rows.length === 0) return bundled

    const bySlug = new Map(bundled.map(protocol => [protocol.slug, protocol]))
    const trackable = rows.flatMap(row => {
      const catalog = bySlug.get(row.slug)
      if (!catalog) return []
      return [{
        ...catalog,
        name: row.name,
        searchText: [row.name, row.description, row.why, catalog.searchText].filter(Boolean).join(" ").toLowerCase(),
        description: row.description,
        why: row.why ?? catalog.why,
        pillar: row.pillar as PillarId,
        difficulty: DIFFICULTY[row.difficulty] ?? catalog.difficulty,
        duration: row.duration ?? catalog.duration,
        benefits: parseList(row.benefits),
        risks: parseList(row.risks),
        evidence: row.references ? normalizeSources(parseList(row.references)) : catalog.evidence,
      }]
    })
    return trackable.length ? trackable : bundled
  } catch (error) {
    console.error("protocols: database unavailable, using bundled catalog", error)
    return bundled
  }
}

export default async function ProtocolsPage() {
  const protocols = await loadProtocols()
  return <ProtocolsBrowser protocols={protocols} />
}
