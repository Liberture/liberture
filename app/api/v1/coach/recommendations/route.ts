import { NextResponse } from "next/server"

import { resolveRecommendationCard, type RecommendationCard } from "@/lib/habits/agent/recommendation-cards"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { catalogLinks, requestOrigin } from "@/lib/habits/api/assistant"
import { adoptedProtocolSlugs, adoptedSlugs } from "@/lib/habits/protocols/adopt"
import { CATALOG_PROTOCOLS } from "@/lib/habits/protocols/catalog"

/**
 * GET /api/v1/coach/recommendations
 *
 * The coach's most recent suggestions, resolved into self-contained cards.
 * Auth: Authorization: Bearer hti_...
 *
 * Exists so a CLI or an external agent can act on what the coach said without
 * scraping the chat. Only `{kind, slug, reason}` is stored — the catalog is app
 * code and a per-user copy would go stale — so the slugs are resolved here into
 * name, cost, evidence, the habits a protocol would add, and whether the user
 * already tracks it.
 *
 * Read-only, like the coach itself. Each card carries `infoUrl` (this site's
 * public protocol page) to hand to the user; adopting
 * is POST /api/v1/habits/adopt, gated by the user's add_habits scope.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { data } = user
  const stored = data.coachRecommendations

  if (!stored || stored.entries.length === 0) {
    return NextResponse.json({
      generatedAt: null,
      question: null,
      recommendations: [] as RecommendationCard[],
      // Distinguishes "the coach has never run" from "it ran and suggested
      // nothing", which are different answers to "what should I do next".
      hasRun: Boolean(stored),
    })
  }

  const origin = requestOrigin(request)
  const habits = data.habits ?? []
  const adoptedHabits = adoptedSlugs(habits)
  const adoptedProtocols = adoptedProtocolSlugs(habits, CATALOG_PROTOCOLS)

  const recommendations = stored.entries
    .map((entry) => resolveRecommendationCard(entry, adoptedHabits, adoptedProtocols))
    // A stored slug can outlive the catalog entry it points at.
    .filter((card): card is RecommendationCard => card !== null)
    .map((card) => ({ ...card, ...catalogLinks(card.kind, card.slug, origin) }))

  return NextResponse.json(
    {
      generatedAt: stored.generatedAt,
      question: stored.question,
      recommendations,
      hasRun: true,
      /** Set when the catalog moved on and some suggestions no longer resolve. */
      unresolved: stored.entries.length - recommendations.length,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
