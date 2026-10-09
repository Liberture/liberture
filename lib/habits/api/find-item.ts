import { NextResponse } from "next/server"
import { resolveByName, spokenList } from "@/lib/habits/api/resolve"

/**
 * One todo, project or event from what the user called it, for the
 * name-based write routes (the same contract as findHabitByName): the item, or
 * the 409 (ambiguous, with `options`) / 404 response to send back with a `say`
 * sentence. `preferred` is searched first (open todos, upcoming events), the
 * rest only when nothing there matches.
 */
export function findItemByName<T extends { id: string }>(
  items: T[],
  query: unknown,
  nameOf: (item: T) => string,
  noun: string,
  preferred?: T[]
): T | NextResponse {
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: `${noun} (its name or id) is required` }, { status: 400 })
  }
  let resolved = preferred?.length ? resolveByName(preferred, query, nameOf) : resolveByName(items, query, nameOf)
  if (resolved.kind === "none" && preferred?.length) resolved = resolveByName(items, query, nameOf)
  if (resolved.kind === "match") return resolved.item
  const names = resolved.options.slice(0, 6).map(nameOf)
  if (resolved.kind === "ambiguous") {
    return NextResponse.json(
      { error: `More than one ${noun} matches`, code: "ambiguous", options: names, say: `Which one: ${spokenList(names)}?` },
      { status: 409 }
    )
  }
  return NextResponse.json(
    { error: `No ${noun} matches`, code: "not_found", options: names, say: `I can't find that ${noun}.` },
    { status: 404 }
  )
}

/** Forward to an id-based /api/v1 handler with the caller's credentials and zone. */
export function forwardRequest(request: Request, path: string, method: string, body?: unknown): Request {
  const headers: Record<string, string> = { Authorization: request.headers.get("Authorization") ?? "" }
  for (const name of ["x-time-zone", "x-timezone", "x-local-date"]) {
    const value = request.headers.get(name)
    if (value) headers[name] = value
  }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  return new Request(new URL(path, request.url), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
}
