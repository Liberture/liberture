import { CATALOG_PROTOCOLS as LIBRARY } from "@/lib/habits/protocols/catalog"
import { formatSourceMeta, type Source } from "@/lib/habits/protocols/sources"
import type { CatalogHabit, CatalogProtocol, Difficulty, Schedule } from "./types"

/**
 * The public protocol library (/protocols) in the shape its cards and reader
 * expect. Content comes from the habit tracker's catalog
 * (lib/habits/protocols/library) — the same protocols the tracker's catalog,
 * the coach and the assistant API use, and what
 * scripts/seed-marketplace-protocols.ts writes into Postgres.
 */

/** One line per source: "Title — Authors · Year · Publisher (url)". */
export function sourceLabel(source: Source): string {
  const meta = formatSourceMeta(source)
  const text = meta ? `${source.title} — ${meta}` : source.title
  return source.url ? `${text} (${source.url})` : text
}

export const CATALOG_PROTOCOLS: CatalogProtocol[] = LIBRARY.map((p) => ({
  slug: p.slug,
  name: p.name,
  tagline: p.tagline,
  description: p.description,
  why: p.why,
  pillar: p.pillar,
  difficulty: p.difficulty,
  duration: p.duration,
  benefits: p.benefits,
  risks: p.risks,
  evidence: p.evidence.map(sourceLabel),
  habits: p.habits.map(
    (h): CatalogHabit => ({
      slug: h.slug,
      name: h.name,
      why: h.why,
      pillar: h.pillar,
      time: h.time,
      schedule: h.schedule as Schedule,
      difficulty: h.difficulty,
    })
  ),
}))

export function findProtocol(slug: string): CatalogProtocol | undefined {
  return CATALOG_PROTOCOLS.find((p) => p.slug === slug)
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
}
