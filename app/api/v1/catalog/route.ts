import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { catalogLinks, requestOrigin } from "@/lib/habits/api/assistant"
import { adoptedProtocolSlugs, adoptedSlugs } from "@/lib/habits/protocols/adopt"
import { CATALOG_PROTOCOLS, STANDALONE_HABITS, scheduleLabel } from "@/lib/habits/protocols/catalog"
import { PILLAR_IDS } from "@/lib/habits/pillars"

/**
 * GET /api/v1/catalog?q=sleep&pillar=sleep&limit=10
 *
 * Search the protocol and habit catalog. Every result carries `infoUrl`, this
 * site's public page for it, to hand to the user. Adopting
 * goes through POST /api/v1/habits/adopt, which needs the add_habits scope.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const url = new URL(request.url)
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase()
  const pillar = url.searchParams.get("pillar")
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 10, 1), 50)
  const origin = requestOrigin(request)

  const habits = user.data.habits ?? []
  const adoptedHabits = adoptedSlugs(habits)
  const adoptedProtocols = adoptedProtocolSlugs(habits, CATALOG_PROTOCOLS)
  const words = q.split(/\s+/).filter(Boolean)
  const matches = (haystack: string) => words.every((w) => haystack.includes(w))

  const protocols = CATALOG_PROTOCOLS.filter((p) => (!pillar || p.pillar === pillar) && matches(p.searchText))
    .slice(0, limit)
    .map((p) => ({
      kind: "protocol" as const,
      slug: p.slug,
      name: p.name,
      summary: p.tagline,
      pillar: p.pillar,
      difficulty: p.difficulty,
      duration: p.duration,
      adopted: adoptedProtocols.has(p.slug),
      habits: p.habits.map((h) => ({
        slug: h.slug,
        name: h.name,
        time: h.time,
        schedule: scheduleLabel(h.schedule),
        adopted: adoptedHabits.has(h.slug),
      })),
      ...catalogLinks("protocol", p.slug, origin),
    }))

  const standalone = STANDALONE_HABITS.filter(
    (h) => (!pillar || h.pillar === pillar) && matches(`${h.name} ${h.why} ${h.pillar}`.toLowerCase())
  )
    .slice(0, limit)
    .map((h) => ({
      kind: "habit" as const,
      slug: h.slug,
      name: h.name,
      summary: h.why,
      pillar: h.pillar,
      difficulty: h.difficulty,
      time: h.time,
      schedule: scheduleLabel(h.schedule),
      adopted: adoptedHabits.has(h.slug),
      ...catalogLinks("habit", h.slug, origin),
    }))

  return NextResponse.json({
    pillars: PILLAR_IDS,
    protocols,
    habits: standalone,
  })
}
