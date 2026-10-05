/**
 * Matches what a person said ("the walk", "meditación", "bank call") to one
 * habit or todo, so an assistant can act in one call instead of listing ids
 * first. Pure; shared by the /api/v1 write routes.
 */

export type Resolution<T> =
  | { kind: "match"; item: T }
  | { kind: "ambiguous"; options: T[] }
  | { kind: "none"; options: T[] }

/** Lowercase, no accents, no punctuation, single spaces. */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const FILLER = new Set(["the", "my", "a", "an", "el", "la", "los", "las", "mi", "mis", "un", "una", "habit", "habito", "todo", "task", "tarea"])

function words(value: string): string[] {
  return normalizeName(value)
    .split(" ")
    .filter((w) => w && !FILLER.has(w))
}

/** "running" ~ "run", "walks" ~ "walk": a cheap stem good enough for names. */
function stem(word: string): string {
  return word.replace(/(ing|ings|es|s|ed)$/, "").replace(/(.)\1$/, "$1")
}

export function resolveByName<T extends { id: string }>(items: T[], query: string, nameOf: (item: T) => string): Resolution<T> {
  const trimmed = query.trim()
  const byId = items.find((item) => item.id === trimmed)
  if (byId) return { kind: "match", item: byId }

  const q = normalizeName(trimmed)
  if (!q) return { kind: "none", options: items }

  const tiers: Array<(name: string) => boolean> = [
    (name) => normalizeName(name) === q,
    (name) => normalizeName(name).includes(q) || (q.includes(normalizeName(name)) && normalizeName(name).length >= 3),
    (name) => {
      const qs = words(q).map(stem).filter((w) => w.length >= 2)
      const ns = words(name).map(stem).filter((n) => n.length >= 2)
      return qs.length > 0 && qs.every((w) => ns.some((n) => n === w || (Math.min(w.length, n.length) >= 3 && (n.startsWith(w) || w.startsWith(n)))))
    },
  ]

  for (const test of tiers) {
    const hits = items.filter((item) => test(nameOf(item)))
    if (hits.length === 1) return { kind: "match", item: hits[0] }
    if (hits.length > 1) return { kind: "ambiguous", options: hits }
  }
  return { kind: "none", options: items }
}

/** "a, b or c" for a spoken question. */
export function spokenList(names: string[], or = "or"): string {
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} ${or} ${names[names.length - 1]}`
}
