import { describe, expect, it } from "vitest"
import { normalizeName, resolveByName, spokenList } from "@/lib/habits/api/resolve"

const habits = [
  { id: "h1", name: "Morning walk" },
  { id: "h2", name: "Meditación" },
  { id: "h3", name: "Running" },
  { id: "h4", name: "Evening walk" },
]
const name = (h: { name: string }) => h.name

describe("resolveByName", () => {
  it("matches by id", () => {
    expect(resolveByName(habits, "h3", name)).toEqual({ kind: "match", item: habits[2] })
  })

  it("matches ignoring case and accents", () => {
    const r = resolveByName(habits, "meditacion", name)
    expect(r.kind).toBe("match")
    if (r.kind === "match") expect(r.item.id).toBe("h2")
  })

  it("matches a stem and drops filler words", () => {
    const r = resolveByName(habits, "my run", name)
    expect(r.kind).toBe("match")
    if (r.kind === "match") expect(r.item.id).toBe("h3")
  })

  it("is ambiguous when several match", () => {
    const r = resolveByName(habits, "walk", name)
    expect(r.kind).toBe("ambiguous")
    if (r.kind === "ambiguous") expect(r.options.map((h) => h.id).sort()).toEqual(["h1", "h4"])
  })

  it("prefers an exact name over partial matches", () => {
    const r = resolveByName([...habits, { id: "h5", name: "Walk" }], "walk", name)
    expect(r).toEqual({ kind: "match", item: { id: "h5", name: "Walk" } })
  })

  it("returns none with every item as options", () => {
    const r = resolveByName(habits, "swimming", name)
    expect(r.kind).toBe("none")
    if (r.kind === "none") expect(r.options).toHaveLength(4)
  })
})

describe("normalizeName / spokenList", () => {
  it("normalizes", () => {
    expect(normalizeName("  Ñoño, Café!  ")).toBe("nono cafe")
  })
  it("joins names for speech", () => {
    expect(spokenList(["a"])).toBe("a")
    expect(spokenList(["a", "b", "c"])).toBe("a, b or c")
    expect(spokenList(["a", "b"], "and")).toBe("a and b")
  })
})
