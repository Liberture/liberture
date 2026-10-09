import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"
import type { CoachRecommendationSet, StorageData } from "@/lib/habits/types"
// vi.mock calls below are hoisted above these imports by vitest.
import { handleMcpPost } from "@/lib/habits/api/mcp-server"
import { API_OPERATIONS, OPENAPI_OPERATIONS, TOOL_COUNT, TOOLS_VERSION, buildOpenApiDocument, computeToolsVersion } from "@/lib/habits/api/operations"
import { HANDLERS, MCP_TOOLS, callMcpTool } from "@/lib/habits/api/mcp-tools"
import { applyCoachUpdate, applyProfileUpdate } from "@/lib/habits/api/profile"
import { carryResponses, markAccepted, mergeCoachRecommendations, respondInSet } from "@/lib/habits/coach/suggestions"

/**
 * The coach's MCP tools and tool sync, minus the database: auth is an
 * in-memory user, the notification ledger a Set, and the suggestions
 * read-modify-write applies to that same user.
 */

const state = vi.hoisted(() => ({
  data: {} as StorageData,
  claimed: new Set<string>(),
  sentToday: 0,
}))

vi.mock("@/lib/habits/integration-auth", async () => {
  const scopes = await import("@/lib/habits/api-scopes")
  const user = () => ({ userId: 1, apiKey: null, nostrPubkey: null, data: state.data })
  return {
    authorizeIntegration: async (_request: Request, scope: Parameters<typeof scopes.hasScope>[1]) => {
      if (!scopes.hasScope({}, scope)) return NextResponse.json({ code: "scope_disabled" }, { status: 403 })
      return user()
    },
    verifyIntegrationTokenValue: async () => user(),
    verifyIntegrationToken: async () => user(),
  }
})

vi.mock("@/lib/habits/push", () => ({
  ensurePushTables: async () => {},
  claimNotification: async (_userId: number, key: string) => {
    if (state.claimed.has(key)) return false
    state.claimed.add(key)
    state.sentToday++
    return true
  },
  countSentToday: async () => state.sentToday,
  localDayStartUtc: () => new Date("2026-10-09T00:00:00Z"),
  pushConfigured: () => false,
  sendPush: async () => ({ sent: 0, failed: 0, removed: 0 }),
  reminderStatus: async () => ({ notifications: true, pushConfigured: false, devices: 0, sentToday: 0, sentTodayByKind: { habit: 0, coach: 0 } }),
}))

vi.mock("@/lib/habits/db", () => ({
  getDb: () => () => Promise.resolve([{ kind: "coach:morning", last: new Date("2026-10-09T09:00:00Z") }]),
}))

vi.mock("@/lib/habits/coach/suggestions-store", () => ({
  mutateCoachRecommendations: async (_userId: number, change: (current: CoachRecommendationSet | undefined) => unknown) => {
    const next = change(state.data.coachRecommendations) as CoachRecommendationSet | { error: unknown }
    if (!("error" in next)) state.data.coachRecommendations = next
    return next
  },
}))

const ORIGIN = "https://liberture.test"
const NEW_TOOLS = ["get_coach_state", "record_coach_nudge", "respond_to_suggestion", "get_reminder_status"]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-10-09T12:00:00Z"))
  state.claimed.clear()
  state.sentToday = 0
  state.data = {
    habits: [
      { id: "h1", name: "Journal", time: "", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-09-01T12:00:00.000Z" },
      { id: "h2", name: "Run", time: "", color: "#fff", schedule: { type: "times_per_week", timesPerWeek: 3 }, createdAt: "2026-09-01T12:00:00.000Z" },
    ],
    completions: [{ habitId: "h1", date: "2026-10-05", completed: true }, { habitId: "h2", date: "2026-10-06", completed: true }],
    todos: [],
    projects: [],
    calendarEvents: [],
    lastUpdated: "2026-10-01T00:00:00.000Z",
    preferences: { timeZone: "UTC", coach: { maxNudgesPerDay: 2 } },
    coachRecommendations: {
      generatedAt: "2026-10-08T10:00:00.000Z",
      question: "What next?",
      entries: [
        { kind: "custom", reason: "You sit a lot", custom: { name: "Evening walk", why: "", time: "19:00", pillar: "exercise", scheduleType: "daily" } },
        { kind: "custom", reason: "Sleep", custom: { name: "No screens after 22", why: "", time: "22:00", pillar: "sleep", scheduleType: "daily" } },
      ],
    },
  } as StorageData
})

afterEach(() => {
  vi.useRealTimers()
})

async function rpc(method: string, params?: Record<string, unknown>) {
  const response = await handleMcpPost(
    new Request(`${ORIGIN}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }),
    "hta_test"
  )
  return response.json()
}

describe("tool sync", () => {
  it("lists the coach tools, MCP only, and keeps OpenAPI at 30 or fewer", async () => {
    const { result } = await rpc("tools/list")
    const names = (result.tools as { name: string }[]).map((t) => t.name)
    for (const name of NEW_TOOLS) {
      expect(names).toContain(name)
      expect(HANDLERS[name]).toBeTypeOf("function")
      expect(OPENAPI_OPERATIONS.map((op) => op.id)).not.toContain(name)
    }
    expect(names).toHaveLength(TOOL_COUNT)
    expect(OPENAPI_OPERATIONS.length).toBeLessThanOrEqual(30)
    const byName = Object.fromEntries(MCP_TOOLS.map((t) => [t.name, t]))
    expect(byName.get_coach_state.annotations.readOnlyHint).toBe(true)
    expect(byName.record_coach_nudge.annotations.readOnlyHint).toBe(false)
    expect(byName.record_coach_nudge.securitySchemes[0].scopes).toEqual(["habits", "settings"])
    expect(byName.respond_to_suggestion.securitySchemes[0].scopes).toEqual(["habits", "settings"])
  })

  it("versions the server by the tool schemas", async () => {
    const { result } = await rpc("initialize", { protocolVersion: "2025-06-18" })
    expect(result.serverInfo.version).toBe(`1.2.0+${TOOLS_VERSION}`)
    expect(result.instructions).toContain("refresh the Liberture connector")
    expect(result.instructions).toContain("record_coach_nudge")
    expect((buildOpenApiDocument(ORIGIN) as { info: { version: string } }).info.version).toBe(`1.2.0+${TOOLS_VERSION}`)
    expect(TOOLS_VERSION).toMatch(/^[0-9a-f]{8}$/)
  })

  it("changes TOOLS_VERSION when a schema changes, not when a description does", () => {
    expect(computeToolsVersion(API_OPERATIONS)).toBe(TOOLS_VERSION)
    const [first, ...rest] = API_OPERATIONS
    const reworded = [{ ...first, description: "something else" }, ...rest]
    expect(computeToolsVersion(reworded)).toBe(TOOLS_VERSION)
    const extraParam = [{ ...first, params: [...(first.params ?? []), { name: "x", in: "query" as const, description: "x", schema: { type: "string" as const } }] }, ...rest]
    expect(computeToolsVersion(extraParam)).not.toBe(TOOLS_VERSION)
    expect(computeToolsVersion(rest)).not.toBe(TOOLS_VERSION)
  })

  it("get_permissions reports the connector's tool count and version", async () => {
    const result = await callMcpTool("get_permissions", {}, "hta_test", ORIGIN)
    expect(result?.structuredContent).toMatchObject({ connector: { tools: TOOL_COUNT, version: TOOLS_VERSION } })
  })
})

describe("record_coach_nudge", () => {
  it("allows the first nudge of a kind and refuses a duplicate", async () => {
    const first = await callMcpTool("record_coach_nudge", { kind: "morning", message: "Two priorities…" }, "hta_test", ORIGIN)
    expect(first?.structuredContent).toMatchObject({ allowed: true, reason: null, remainingToday: 1 })
    const again = await callMcpTool("record_coach_nudge", { kind: "morning" }, "hta_test", ORIGIN)
    expect(again?.structuredContent).toMatchObject({ allowed: false, reason: "duplicate" })
  })

  it("refuses at the daily limit", async () => {
    state.sentToday = 2
    const result = await callMcpTool("record_coach_nudge", { kind: "afternoon" }, "hta_test", ORIGIN)
    expect(result?.structuredContent).toMatchObject({ allowed: false, reason: "daily_limit", remainingToday: 0 })
    expect(state.claimed.size).toBe(0)
  })

  it("refuses in quiet hours, in the user's zone", async () => {
    vi.setSystemTime(new Date("2026-10-09T23:30:00Z"))
    const result = await callMcpTool("record_coach_nudge", { kind: "other", message: "hi" }, "hta_test", ORIGIN)
    expect(result?.structuredContent).toMatchObject({ allowed: false, reason: "quiet_hours" })
    expect(result?.content[0].text).toContain("quiet hours")
    // 23:30 UTC is 20:30 in Buenos Aires: not quiet there.
    const there = await callMcpTool("record_coach_nudge", { kind: "other", message: "hi", timeZone: "America/Argentina/Buenos_Aires" }, "hta_test", ORIGIN)
    expect(there?.structuredContent).toMatchObject({ allowed: true })
  })

  it("rejects an unknown kind", async () => {
    const result = await callMcpTool("record_coach_nudge", { kind: "spam" }, "hta_test", ORIGIN)
    expect(result?.isError).toBe(true)
  })
})

describe("get_coach_state", () => {
  it("reports limits, nudges, suggestions and per-habit logging", async () => {
    state.sentToday = 1
    const result = await callMcpTool("get_coach_state", {}, "hta_test", ORIGIN)
    const body = result?.structuredContent as Record<string, any>
    expect(body.settings).toMatchObject({ maxNudgesPerDay: 2, quietHours: { start: "22:00", end: "08:00" }, missedLogging: false, checkIns: {} })
    expect(body.nudges).toMatchObject({ sentToday: 1, remainingToday: 1, inQuietHours: false, lastByKind: { morning: "2026-10-09T09:00:00.000Z" } })
    expect(body.suggestions.pending.map((s: { name: string }) => s.name)).toEqual(["Evening walk", "No screens after 22"])
    const journal = body.habits.find((h: { name: string }) => h.name === "Journal")
    expect(journal).toMatchObject({ lastLoggedOn: "2026-10-05", unloggedDueDays: 3 })
    expect(journal.weeklyProgress).toBeUndefined()
    const run = body.habits.find((h: { name: string }) => h.name === "Run")
    expect(run.weeklyProgress).toMatchObject({ done: 1, target: 3, met: false })
  })
})

describe("respond_to_suggestion", () => {
  it("snoozes and dismisses by name, and hides them from get_recommendations", async () => {
    const snooze = await callMcpTool("respond_to_suggestion", { suggestion: "evening walk", response: "snooze", days: 3 }, "hta_test", ORIGIN)
    expect(snooze?.structuredContent).toMatchObject({ suggestion: "Evening walk", say: "Snoozed Evening walk for 3 days." })
    const entry = state.data.coachRecommendations!.entries[0]
    expect(entry).toMatchObject({ status: "snoozed", snoozedUntil: "2026-10-12T12:00:00.000Z" })

    await callMcpTool("respond_to_suggestion", { suggestion: "screens", response: "dismiss" }, "hta_test", ORIGIN)
    const state1 = await callMcpTool("get_coach_state", {}, "hta_test", ORIGIN)
    const suggestions = (state1?.structuredContent as Record<string, any>).suggestions
    expect(suggestions.pending).toEqual([])
    expect(suggestions.snoozed.map((s: { name: string }) => s.name)).toEqual(["Evening walk"])

    const recs = await callMcpTool("get_recommendations", {}, "hta_test", ORIGIN)
    expect(recs?.structuredContent).toMatchObject({ recommendations: [], hidden: 2 })
  })

  it("asks which one when the name is unclear", async () => {
    const result = await callMcpTool("respond_to_suggestion", { suggestion: "swimming", response: "dismiss" }, "hta_test", ORIGIN)
    expect(result?.isError).toBe(false)
    expect(result?.structuredContent).toMatchObject({ ok: false, code: "not_found", options: ["Evening walk", "No screens after 22"] })
  })
})

describe("suggestion helpers", () => {
  const set = (): CoachRecommendationSet => ({
    generatedAt: "2026-10-08T10:00:00.000Z",
    question: "",
    entries: [
      { kind: "habit", slug: "morning-light", reason: "" },
      { kind: "custom", reason: "", custom: { name: "Evening walk", why: "", time: "19:00", pillar: "exercise", scheduleType: "daily" } },
    ],
  })

  it("marks adopted suggestions accepted, by slug or custom name", () => {
    const now = new Date("2026-10-09T12:00:00Z")
    expect(markAccepted(set(), { slugs: ["morning-light"] }, now)!.entries[0]).toMatchObject({ status: "accepted", respondedAt: now.toISOString() })
    expect(markAccepted(set(), { names: ["evening walk"] }, now)!.entries[1].status).toBe("accepted")
    const unchanged = set()
    expect(markAccepted(unchanged, { slugs: ["nope"] }, now)).toBe(unchanged)
  })

  it("keeps the latest answer per entry when a stale tab saves", () => {
    const server = respondInSet(set(), 1, "dismiss", new Date("2026-10-09T12:00:00Z"))
    expect(mergeCoachRecommendations(set(), server)!.entries[1].status).toBe("dismissed")
    const newer = { ...set(), generatedAt: "2026-10-09T13:00:00.000Z" }
    expect(mergeCoachRecommendations(newer, server)).toBe(newer)
    expect(carryResponses(newer, server).entries[1].status).toBe("dismissed")
  })
})

describe("update_profile: coach and language", () => {
  it("validates and merges the coach group", () => {
    const ok = applyCoachUpdate({ maxNudgesPerDay: 3 }, { checkIns: { morning: "8:30", weekly: { day: 0, time: "18:00" } }, quietHours: { start: "23:00", end: "07:00" } })
    expect(ok).toMatchObject({ coach: { maxNudgesPerDay: 3, checkIns: { morning: "08:30", weekly: { day: 0, time: "18:00" } }, quietHours: { start: "23:00", end: "07:00" } } })
    expect(applyCoachUpdate({}, { checkIns: { morning: "25:00" } })).toHaveProperty("error")
    expect(applyCoachUpdate({}, { checkIns: { weekly: { day: 7, time: "18:00" } } })).toHaveProperty("error")
    expect(applyCoachUpdate({}, { maxNudgesPerDay: 11 })).toHaveProperty("error")
    expect(applyCoachUpdate({}, { maxNudgesPerDay: 0 })).toHaveProperty("error")
    const off = applyCoachUpdate({ checkIns: { morning: "08:00", afternoon: "14:00" } }, { checkIns: { morning: "" } })
    expect(off).toMatchObject({ coach: { checkIns: { afternoon: "14:00" } } })
    expect((off as { coach: { checkIns: Record<string, unknown> } }).coach.checkIns.morning).toBeUndefined()
  })

  it("passes coach and language through update_profile", () => {
    const result = applyProfileUpdate({ profile: {}, preferences: {} }, { language: "es", coach: { missedLogging: true } }, [], "2026-10-09T12:00:00Z")
    expect(result).toMatchObject({ preferences: { language: "es", coach: { missedLogging: true } } })
    expect(applyProfileUpdate({ profile: {}, preferences: {} }, { language: "fr" }, [], "2026-10-09T12:00:00Z")).toHaveProperty("error")
  })
})
