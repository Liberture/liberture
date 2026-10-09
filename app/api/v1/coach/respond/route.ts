import { NextResponse } from "next/server"

import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { spokenList } from "@/lib/habits/api/resolve"
import { DEFAULT_SNOOZE_DAYS, findSuggestion, respondInSet, suggestionName, type SuggestionResponse } from "@/lib/habits/coach/suggestions"
import { mutateCoachRecommendations } from "@/lib/habits/coach/suggestions-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RESPONSES: readonly SuggestionResponse[] = ["accept", "dismiss", "snooze"]

type Failure = { status: number; body: Record<string, unknown> }

/**
 * POST /api/v1/coach/respond (respond_to_suggestion, scope settings)
 * Body: { suggestion: name or slug, response: accept|dismiss|snooze, days? }
 *
 * Records what the user decided about one of the coach's latest suggestions.
 * Dismissed and snoozed ones leave the coach panel (a snooze until it ends);
 * accepting doesn't add anything — adopt_habit does that.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "settings")
  if (user instanceof NextResponse) return user

  let body: { suggestion?: unknown; response?: unknown; days?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const query = typeof body.suggestion === "string" ? body.suggestion.trim() : ""
  const response = body.response as SuggestionResponse
  if (!query) return NextResponse.json({ error: "Send suggestion: its name or slug" }, { status: 400 })
  if (!RESPONSES.includes(response)) return NextResponse.json({ error: "response must be accept, dismiss or snooze" }, { status: 400 })
  const days = body.days === undefined ? DEFAULT_SNOOZE_DAYS : Number(body.days)
  if (!Number.isInteger(days) || days < 1 || days > 90) return NextResponse.json({ error: "days must be 1 to 90" }, { status: 400 })

  let name = ""
  let result
  try {
    result = await mutateCoachRecommendations<Failure>(user.userId, (current) => {
      if (!current?.entries.length) {
        return { error: { status: 404, body: { error: "The coach has no suggestions yet", code: "not_found", options: [], say: "The coach hasn't suggested anything yet." } } }
      }
      const found = findSuggestion(current.entries, query)
      if (found.kind !== "match") {
        const options = found.options.map((o) => o.name)
        return {
          error: {
            status: found.kind === "ambiguous" ? 409 : 404,
            body: {
              error: found.kind === "ambiguous" ? `More than one suggestion matches "${query}"` : `No suggestion matches "${query}"`,
              code: found.kind === "ambiguous" ? "ambiguous" : "not_found",
              options,
              say: found.kind === "ambiguous" ? `Which one: ${spokenList(options)}?` : `I can't find that suggestion. The current ones are ${spokenList(options, "and")}.`,
            },
          },
        }
      }
      name = suggestionName(current.entries[found.item.index])
      return respondInSet(current, found.item.index, response, new Date(), days)
    })
  } catch (error) {
    console.error("Failed to record suggestion response:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
  if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if ("error" in result) return NextResponse.json(result.error.body, { status: result.error.status })

  const say =
    response === "accept"
      ? `Noted: you're taking on ${name}.`
      : response === "dismiss"
        ? `Dismissed ${name}; the coach won't bring it up again.`
        : `Snoozed ${name} for ${days} day${days === 1 ? "" : "s"}.`
  return NextResponse.json({ suggestion: name, response, say })
}
