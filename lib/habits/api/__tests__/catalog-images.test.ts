import { existsSync } from "node:fs"
import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"
import type { StorageData } from "@/lib/habits/types"

/**
 * Official catalog images over the MCP tools: `imageUrl` on search_catalog,
 * get_recommendations, get_habit and get_coach_state, and resource_link
 * blocks for clients on MCP 2025-06-18+.
 */

const state: { data: StorageData } = { data: {} as StorageData }

vi.mock("@/lib/habits/integration-auth", () => {
  const user = () => ({ userId: 1, apiKey: null, nostrPubkey: null, connectionId: null, data: state.data })
  return {
    authorizeIntegration: async () => user(),
    verifyIntegrationTokenValue: async () => user(),
    verifyIntegrationToken: async () => user(),
  }
})
// get_coach_state reads the nudge ledger; without a database it reports none.
vi.mock("@/lib/habits/db", () => ({ getDb: () => { throw new Error("no database in unit tests") } }))

import { catalogImageUrl, catalogLinks } from "@/lib/habits/api/assistant"
import { callMcpTool, imageLinksFrom, supportsResourceLinks } from "@/lib/habits/api/mcp-tools"
import { CATALOG_PROTOCOLS, STANDALONE_HABITS } from "@/lib/habits/protocols/catalog"
import { protocolImage, standaloneHabitImage } from "@/lib/habits/protocols/images"

const ORIGIN = "https://liberture.com"
const meditation = CATALOG_PROTOCOLS.find((p) => p.slug === "daily-mindfulness-meditation")!
const multiHabit = CATALOG_PROTOCOLS.find((p) => p.habits.length > 1)!
const standalone = STANDALONE_HABITS[0]

const call = (name: string, args: Record<string, unknown> = {}, protocolVersion?: string) =>
  callMcpTool(name, args, "hta_test", ORIGIN, { protocolVersion })

beforeEach(() => {
  state.data = {
    habits: [
      {
        id: "h1",
        name: meditation.habits[0].name,
        time: "07:30",
        color: "#fff",
        schedule: { type: "daily" },
        createdAt: "2026-10-01T00:00:00.000Z",
        catalogSlug: meditation.habits[0].slug,
        protocolSlug: meditation.slug,
      },
      {
        id: "h3",
        name: "10-minute mobility",
        time: "19:00",
        color: "#fff",
        schedule: { type: "daily" },
        createdAt: "2026-10-01T00:00:00.000Z",
        catalogSlug: "mobility-stretch",
      },
      { id: "h2", name: "My own thing", time: "", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-10-01T00:00:00.000Z" },
    ],
    completions: [],
    todos: [],
    projects: [],
    calendarEvents: [],
    lastUpdated: "2026-10-10T00:00:00.000Z",
    coachRecommendations: {
      generatedAt: "2026-10-10T00:00:00.000Z",
      question: "sleep",
      entries: [
        { kind: "protocol", slug: "morning-sunlight-exposure", reason: "Light anchors the clock." },
        { kind: "custom", reason: "Your own idea.", custom: { name: "Tea at 9", why: "", time: "21:00", pillar: "sleep", scheduleType: "daily" } },
      ],
    },
  } as unknown as StorageData
})

describe("catalogImageUrl / catalogLinks", () => {
  it("gives a protocol its own PNG, as an absolute URL", () => {
    expect(catalogImageUrl("protocol", meditation.slug, ORIGIN)).toBe(`${ORIGIN}/protocols/images/${meditation.slug}.png`)
  })

  it("gives every habit of a multi-habit protocol the protocol's image", () => {
    for (const habit of multiHabit.habits) {
      expect(catalogImageUrl("habit", habit.slug, ORIGIN)).toBe(`${ORIGIN}/protocols/images/${multiHabit.slug}.png`)
    }
  })

  it("gives a standalone catalog habit its own image", () => {
    expect(catalogImageUrl("habit", standalone.slug, ORIGIN)).toBe(`${ORIGIN}/protocols/images/habits/${standalone.slug}.png`)
    expect(catalogImageUrl("habit", "mobility-stretch", ORIGIN)).toBe(`${ORIGIN}/protocols/images/habits/mobility-stretch.png`)
  })

  it("is null where no official image exists", () => {
    expect(catalogImageUrl("custom", null, ORIGIN)).toBeNull()
    expect(catalogImageUrl("habit", "no-such-habit", ORIGIN)).toBeNull()
    expect(catalogImageUrl("protocol", "no-such-protocol", ORIGIN)).toBeNull()
  })

  it("keeps infoUrl exactly as before (backward compatible)", () => {
    expect(catalogLinks("protocol", meditation.slug, ORIGIN).infoUrl).toBe(`${ORIGIN}/protocols/${meditation.slug}`)
    expect(catalogLinks("habit", standalone.slug, ORIGIN).infoUrl).toBe(`${ORIGIN}/protocols#${standalone.slug}`)
  })

  it("points at a file that exists for every catalog protocol and standalone habit (public, no auth)", () => {
    for (const protocol of CATALOG_PROTOCOLS) {
      const image = protocolImage(protocol.slug)!
      expect(existsSync(path.join(process.cwd(), "public", image.png))).toBe(true)
    }
    for (const habit of STANDALONE_HABITS) {
      const image = standaloneHabitImage(habit.slug)!
      expect(existsSync(path.join(process.cwd(), "public", image.png))).toBe(true)
    }
  })
})

describe("imageUrl in tool results", () => {
  it("search_catalog: protocols, their habits' catalog entries and standalone habits", async () => {
    const result = await call("search_catalog", { q: "meditation" })
    const body = result!.structuredContent as { protocols: Record<string, unknown>[]; habits: Record<string, unknown>[] }
    const protocol = body.protocols.find((p) => p.slug === meditation.slug)!
    expect(protocol.imageUrl).toBe(`${ORIGIN}/protocols/images/${meditation.slug}.png`)
    // Existing fields are untouched.
    expect(protocol).toMatchObject({ kind: "protocol", name: meditation.name, infoUrl: `${ORIGIN}/protocols/${meditation.slug}`, adopted: true })

    const all = await call("search_catalog", { limit: 50 })
    const standaloneHit = (all!.structuredContent as { habits: Record<string, unknown>[] }).habits.find((h) => h.slug === standalone.slug)!
    expect(standaloneHit.imageUrl).toBe(`${ORIGIN}/protocols/images/habits/${standalone.slug}.png`)
  })

  it("get_habit: an adopted catalog habit keeps its protocol's image; a custom habit has none", async () => {
    const adopted = await call("get_habit", { habit: "h1" })
    expect((adopted!.structuredContent as Record<string, unknown>).imageUrl).toBe(`${ORIGIN}/protocols/images/${meditation.slug}.png`)
    // The reported case: an adopted standalone habit ("10-minute mobility") used to come back null.
    const mobility = await call("get_habit", { habit: "h3" })
    expect((mobility!.structuredContent as Record<string, unknown>).imageUrl).toBe(`${ORIGIN}/protocols/images/habits/mobility-stretch.png`)
    const custom = await call("get_habit", { habit: "h2" })
    expect((custom!.structuredContent as Record<string, unknown>).imageUrl).toBeNull()
  })

  it("get_recommendations: catalog suggestions carry imageUrl", async () => {
    const result = await call("get_recommendations")
    const cards = (result!.structuredContent as { recommendations: Record<string, unknown>[] }).recommendations
    expect(cards.find((c) => c.slug === "morning-sunlight-exposure")?.imageUrl).toBe(`${ORIGIN}/protocols/images/morning-sunlight-exposure.png`)
  })

  it("get_coach_state: suggestions carry imageUrl, custom ones null", async () => {
    const result = await call("get_coach_state")
    const pending = (result!.structuredContent as { suggestions: { pending: Record<string, unknown>[] } }).suggestions.pending
    expect(pending.find((s) => s.slug === "morning-sunlight-exposure")?.imageUrl).toBe(`${ORIGIN}/protocols/images/morning-sunlight-exposure.png`)
    expect(pending.find((s) => s.kind === "custom")?.imageUrl).toBeNull()
  })
})

describe("resource_link blocks (MCP 2025-06-18+)", () => {
  it("only for clients that negotiated 2025-06-18 or later", () => {
    expect(supportsResourceLinks("2025-06-18")).toBe(true)
    expect(supportsResourceLinks("2025-11-25")).toBe(true)
    expect(supportsResourceLinks("2025-03-26")).toBe(false)
    expect(supportsResourceLinks(undefined)).toBe(false)
  })

  it("adds one image link per distinct image, after the unchanged text blocks", async () => {
    const result = await call("search_catalog", { q: "meditation" }, "2025-06-18")
    expect(result!.content[0].type).toBe("text")
    const links = result!.content.filter((c) => c.type === "resource_link")
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toMatchObject({ uri: `${ORIGIN}/protocols/images/${meditation.slug}.png`, mimeType: "image/png", title: meditation.name })
    expect(new Set(links.map((l) => (l as { uri: string }).uri)).size).toBe(links.length)
  })

  it("leaves older clients' results exactly as before", async () => {
    const result = await call("search_catalog", { q: "meditation" }, "2025-03-26")
    expect(result!.content.every((c) => c.type === "text")).toBe(true)
    const none = await call("search_catalog", { q: "meditation" })
    expect(none!.content.every((c) => c.type === "text")).toBe(true)
  })

  it("caps the number of links and skips null images", () => {
    const many = { protocols: Array.from({ length: 30 }, (_, i) => ({ name: `P${i}`, imageUrl: `${ORIGIN}/p/${i}.png` })), habits: [{ name: "x", imageUrl: null }] }
    expect(imageLinksFrom(many)).toHaveLength(10)
    expect(imageLinksFrom({ habits: [{ name: "x", imageUrl: null }] })).toEqual([])
  })
})
