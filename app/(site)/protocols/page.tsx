import type { Metadata } from "next"

import { prisma } from "@/lib/prisma"
import { CATALOG_PROTOCOLS } from "@/lib/tracker/catalog"
import type { CatalogProtocol } from "@/lib/tracker/types"
import type { PillarId } from "@/lib/translations"

import { ProtocolsBrowser } from "./protocols-browser"

const url = "https://liberture.com/protocols"

export const metadata: Metadata = {
  title: "Protocols | Evidence-Backed Routines",
  description:
    "Explore structured protocols with the evidence attached. Share what works, download a protocol to keep, or add one and it becomes daily habits in your tracker.",
  alternates: { canonical: url },
  openGraph: {
    title: "Protocols | Liberture",
    description:
      "Structured routines with the evidence attached — explore, share, download, or add them to your habit tracker.",
    url,
    siteName: "Liberture",
    locale: "en_US",
    type: "website",
    images: [
      { url: "/og-image.jpg", width: 1200, height: 630, alt: "Liberture protocol library" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Protocols | Liberture",
    description: "Evidence-backed routines you can explore, share, download and track.",
    images: ["/og-image.jpg"],
    site: "@liberture",
    creator: "@liberture",
  },
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

    const habitsBySlug = new Map(CATALOG_PROTOCOLS.map((p) => [p.slug, p.habits]))

    return rows
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        tagline: row.description,
        description: row.description,
        why: row.why ?? "",
        pillar: row.pillar as PillarId,
        difficulty: DIFFICULTY[row.difficulty] ?? "moderate",
        duration: row.duration ?? "Ongoing",
        benefits: parseList(row.benefits),
        risks: parseList(row.risks),
        evidence: parseList(row.references),
        habits: habitsBySlug.get(row.slug) ?? [],
      }))
      // Without a habit breakdown a protocol can't be added or tracked.
      .filter((p) => p.habits.length > 0)
  } catch (error) {
    console.error("protocols: database unavailable, using bundled catalog", error)
    return CATALOG_PROTOCOLS
  }
}

export default async function ProtocolsPage() {
  const protocols = await loadProtocols()
  return <ProtocolsBrowser protocols={protocols} />
}
