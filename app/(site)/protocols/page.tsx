import type { Metadata } from "next"

import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getDictionary } from "@/lib/habits/i18n"
import { translatedAlternates } from "@/lib/seo/translated-routes"
import { prisma } from "@/lib/prisma"
import { CATALOG_PROTOCOLS, findProtocol, type CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { normalizeSources } from "@/lib/habits/protocols/sources"
import type { PillarId } from "@/lib/translations"

import { ProtocolsBrowser } from "./protocols-browser"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { seoTitle: title, description, imageAlt } = getDictionary(locale).protocolLibrary
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

/**
 * Published protocols from the database, shaped for the browser. Habit
 * breakdowns aren't stored per-protocol, so they're taken from the bundled
 * catalog by slug — the same source the seeder writes from.
 */
async function loadProtocols(): Promise<CatalogProtocol[]> {
  try {
    const rows = await prisma.protocol.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    })
    if (rows.length === 0) return CATALOG_PROTOCOLS

    const trackable = rows.flatMap(row => {
      const catalog = findProtocol(row.slug)
      if (!catalog) return []
      return [{
        ...catalog,
        name: row.name,
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
    return trackable.length ? trackable : CATALOG_PROTOCOLS
  } catch (error) {
    console.error("protocols: database unavailable, using bundled catalog", error)
    return CATALOG_PROTOCOLS
  }
}

export default async function ProtocolsPage() {
  const protocols = await loadProtocols()
  return <ProtocolsBrowser protocols={protocols} />
}
