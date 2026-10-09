import { NextResponse } from "next/server"
import { appendHabits } from "@/lib/habits/api/habit-writes"
import { spokenList } from "@/lib/habits/api/resolve"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { catalogLinks, protocolSlugForHabit, requestOrigin } from "@/lib/habits/api/assistant"
import { adoptedSlugs, catalogHabitToHabit } from "@/lib/habits/protocols/adopt"
import { findCatalogHabit, findProtocol } from "@/lib/habits/protocols/catalog"
import type { Habit } from "@/lib/habits/types"
import { markAccepted } from "@/lib/habits/coach/suggestions"
import { mutateCoachRecommendations } from "@/lib/habits/coach/suggestions-store"

/**
 * POST /api/v1/habits/adopt
 * Body: { protocolSlug: string } or { habitSlug: string }
 *
 * Adds catalog habits to the user's tracker, exactly as the marketplace's Add
 * button does. Needs the add_habits scope (on unless the user switched it off).
 * Habits already tracked are skipped, so calling it twice is harmless.
 *
 * Appends with one atomic jsonb update (lib/api/habit-writes.ts). For habits
 * that aren't in the catalog, POST /api/v1/habits.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "add_habits")
  if (user instanceof NextResponse) return user

  let body: { protocolSlug?: unknown; habitSlug?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const origin = requestOrigin(request)
  const existing = adoptedSlugs(user.data.habits ?? [])
  let candidates: Habit[]
  let links: ReturnType<typeof catalogLinks>

  if (typeof body.protocolSlug === "string") {
    const protocol = findProtocol(body.protocolSlug)
    if (!protocol) {
      return NextResponse.json({ error: `Unknown protocol "${body.protocolSlug}". Search with GET /api/v1/catalog.` }, { status: 404 })
    }
    candidates = protocol.habits
      .filter((h) => !existing.has(h.slug))
      .map((h) => catalogHabitToHabit(h, { protocolSlug: protocol.slug }))
    links = catalogLinks("protocol", protocol.slug, origin)
  } else if (typeof body.habitSlug === "string") {
    const entry = findCatalogHabit(body.habitSlug)
    if (!entry) {
      return NextResponse.json({ error: `Unknown habit "${body.habitSlug}". Search with GET /api/v1/catalog.` }, { status: 404 })
    }
    candidates = existing.has(entry.slug) ? [] : [catalogHabitToHabit(entry, { protocolSlug: protocolSlugForHabit(entry.slug) })]
    links = catalogLinks("habit", entry.slug, origin)
  } else {
    return NextResponse.json({ error: "Send protocolSlug or habitSlug" }, { status: 400 })
  }

  try {
    await appendHabits(user.userId, candidates)
  } catch (error) {
    console.error("Failed to adopt habits:", error)
    return NextResponse.json({ error: "Failed to add habits" }, { status: 500 })
  }

  // Adopting something the coach suggested answers that suggestion.
  const adoptedSlug = typeof body.protocolSlug === "string" ? body.protocolSlug : (body.habitSlug as string)
  if (markAccepted(user.data.coachRecommendations, { slugs: [adoptedSlug] }) !== user.data.coachRecommendations) {
    await mutateCoachRecommendations(user.userId, (current) => markAccepted(current, { slugs: [adoptedSlug] }) ?? { error: null }).catch(
      (error) => console.warn("Failed to mark the suggestion accepted:", error)
    )
  }

  return NextResponse.json({
    added: candidates.map((h) => ({ id: h.id, name: h.name, time: h.time, catalogSlug: h.catalogSlug })),
    alreadyTracked: candidates.length === 0,
    say:
      candidates.length === 0
        ? "You already track that."
        : `Added ${spokenList(candidates.map((h) => `${h.name}${h.time ? ` at ${h.time}` : ""}`), "and")}.`,
    ...links,
  })
}
