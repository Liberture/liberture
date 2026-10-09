/**
 * Cursor pagination for assistant lists (todos, events, habit history). The
 * cursor is opaque to the caller (base64url of an offset), so it can change
 * shape later without breaking anyone who only passes it back.
 */

export interface Page<T> {
  items: T[]
  /** Pass back as `cursor` for the next page; null when this is the last. */
  nextCursor: string | null
  total: number
}

export function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset })).toString("base64url")
}

export function decodeCursor(cursor: unknown): number | null {
  if (cursor === undefined || cursor === null || cursor === "") return 0
  if (typeof cursor !== "string") return null
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { o?: unknown }
    return typeof parsed.o === "number" && Number.isInteger(parsed.o) && parsed.o >= 0 ? parsed.o : null
  } catch {
    return null
  }
}

export function paginate<T>(items: T[], limit: unknown, cursor: unknown, defaults = { limit: 25, max: 100 }): Page<T> | { error: string } {
  const offset = decodeCursor(cursor)
  if (offset === null) return { error: "cursor is invalid; pass back nextCursor exactly as received" }
  const n = limit === undefined || limit === null || limit === "" ? defaults.limit : Number(limit)
  if (!Number.isInteger(n) || n < 1) return { error: `limit must be 1-${defaults.max}` }
  const size = Math.min(n, defaults.max)
  const page = items.slice(offset, offset + size)
  const end = offset + page.length
  return { items: page, nextCursor: end < items.length ? encodeCursor(end) : null, total: items.length }
}

/** True when the caller asked for a page, so list routes keep their plain-array shape for old scripts. */
export function wantsPage(searchParams: URLSearchParams): boolean {
  return searchParams.has("limit") || searchParams.has("cursor")
}
