import { NextResponse } from "next/server"
import { resolveByName, spokenList } from "@/lib/habits/api/resolve"
import type { Habit } from "@/lib/habits/types"

/**
 * One habit from what the user called it: active habits first, archived ones
 * only if nothing active matches. Returns the habit or the 404/409 response
 * (with `options` and a `say` question) to send back.
 */
export function findHabitByName(habits: Habit[], query: unknown): Habit | NextResponse {
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "habit (its name or id) is required" }, { status: 400 })
  }
  const active = habits.filter((h) => !h.archived)
  let resolved = resolveByName(active, query, (h) => h.name)
  if (resolved.kind === "none") resolved = resolveByName(habits, query, (h) => h.name)
  if (resolved.kind === "match") return resolved.item
  const names = resolved.options.slice(0, 6).map((h) => h.name)
  return resolved.kind === "ambiguous"
    ? NextResponse.json({ error: "More than one habit matches", code: "ambiguous", options: names, say: `Which one: ${spokenList(names)}?` }, { status: 409 })
    : NextResponse.json({ error: "No habit matches", code: "not_found", options: names, say: `I can't find that habit. You track ${spokenList(names, "and")}.` }, { status: 404 })
}
