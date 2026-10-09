import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"
import type { StorageData } from "@/lib/habits/types"
// vi.mock calls below are hoisted above these imports by vitest.
import { handleMcpPost } from "@/lib/habits/api/mcp-server"
import { API_OPERATIONS, OPENAPI_OPERATIONS, buildOpenApiDocument } from "@/lib/habits/api/operations"
import { HANDLERS, MCP_TOOLS, callMcpTool } from "@/lib/habits/api/mcp-tools"
import { API_SCOPES } from "@/lib/habits/api-scopes"
import { protocolSlugs } from "@/lib/habits/api/mcp-resources"

/**
 * The MCP server end to end, minus the database: integration-auth is
 * replaced by an in-memory user whose permissions the test controls, and the
 * one handler that would write (todos POST) is mocked to capture what it got.
 */

const state: { data: StorageData; permissions: Record<string, boolean> } = {
  data: {} as StorageData,
  permissions: {},
}

vi.mock("@/lib/habits/integration-auth", async () => {
  const scopes = await import("@/lib/habits/api-scopes")
  const user = () => ({ userId: 1, apiKey: null, nostrPubkey: null, data: { ...state.data, integrationPermissions: state.permissions } as StorageData })
  return {
    authorizeIntegration: async (_request: Request, scope: Parameters<typeof scopes.hasScope>[1]) => {
      if (!scopes.hasScope(state.permissions, scope)) {
        return NextResponse.json(
          { error: "Permission disabled", code: "scope_disabled", scope, message: scopes.scopeDeniedMessage(scope) },
          { status: 403 }
        )
      }
      return user()
    },
    verifyIntegrationTokenValue: async () => user(),
    verifyIntegrationToken: async () => user(),
  }
})

const captured: Request[] = []
vi.mock("@/app/api/v1/todos/route", () => ({
  GET: async (request: Request) => {
    captured.push(request)
    return NextResponse.json({ todos: [{ id: "t1", title: "Call the bank" }], nextCursor: null, total: 1 })
  },
  POST: async (request: Request) => {
    captured.push(request)
    return NextResponse.json({ id: "t2", say: "Added: Buy milk." }, { status: 201 })
  },
}))


const ORIGIN = "https://liberture.test"

/** id null sends a notification (no id). */
async function rpc(method: string, params?: Record<string, unknown>, id: number | null = 1) {
  const body = { jsonrpc: "2.0", ...(id === null ? {} : { id }), method, ...(params ? { params } : {}) }
  const response = await handleMcpPost(
    new Request(`${ORIGIN}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    "hta_test"
  )
  return { status: response.status, json: response.status === 202 ? null : await response.json() }
}

beforeEach(() => {
  captured.length = 0
  state.permissions = {}
  state.data = {
    habits: [
      { id: "h1", name: "Morning walk", time: "07:00", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "h2", name: "Evening walk", time: "19:00", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "h3", name: "Pushups", time: "", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-01-01T00:00:00.000Z" },
    ],
    completions: [],
    todos: [],
    projects: [{ id: "p1", name: "House", createdAt: "2026-01-01T00:00:00.000Z" }],
    calendarEvents: [],
    lastUpdated: "2026-10-01T00:00:00.000Z",
  } as StorageData
})

describe("initialize", () => {
  it("negotiates the version and advertises every capability", async () => {
    const { json } = await rpc("initialize", { protocolVersion: "2025-06-18" })
    expect(json.result.protocolVersion).toBe("2025-06-18")
    expect(json.result.capabilities).toEqual({
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false },
      completions: {},
      logging: {},
    })
    expect(json.result.serverInfo.name).toBe("liberture-habits")
    expect(json.result.instructions).toContain("get_today")
  })

  it("falls back to the newest version it knows", async () => {
    const { json } = await rpc("initialize", { protocolVersion: "1999-01-01" })
    expect(json.result.protocolVersion).toBe("2025-11-25")
  })
})

describe("tools/list", () => {
  it("lists one tool per operation, each with a name and schemas", async () => {
    const { json } = await rpc("tools/list")
    const tools = json.result.tools as Array<Record<string, any>>
    expect(tools).toHaveLength(API_OPERATIONS.length)
    expect(tools.length).toBe(35)
    expect(new Set(tools.map((t) => t.name)).size).toBe(tools.length)
    for (const tool of tools) {
      expect(typeof tool.name).toBe("string")
      expect(tool.inputSchema.type).toBe("object")
      expect(tool.outputSchema.type).toBe("object")
      expect(tool.annotations.title).toBeTruthy()
      expect(HANDLERS[tool.name]).toBeTypeOf("function")
    }
  })

  it("keeps the OpenAPI document within the Custom GPT limit of 30", () => {
    expect(OPENAPI_OPERATIONS.length).toBeLessThanOrEqual(30)
    const doc = buildOpenApiDocument(ORIGIN) as { paths: Record<string, Record<string, { operationId: string }>> }
    const ids = Object.values(doc.paths).flatMap((methods) => Object.values(methods).map((op) => op.operationId))
    expect(ids.sort()).toEqual(OPENAPI_OPERATIONS.map((op) => op.id).sort())
    expect(ids).not.toContain("export_data")
  })

  it("derives annotations and scopes from the operation", () => {
    const byName = Object.fromEntries(MCP_TOOLS.map((t) => [t.name, t]))
    for (const name of ["delete_habit", "delete_todo", "delete_event", "delete_project"]) {
      expect(byName[name].annotations.destructiveHint).toBe(true)
    }
    expect(byName.add_todo.annotations.idempotentHint).toBe(false)
    expect(byName.get_today.annotations.readOnlyHint).toBe(true)
    expect(byName.log_habit.annotations.readOnlyHint).toBe(false)
    expect(byName.delete_todo.securitySchemes[0].scopes).toEqual(["habits", "delete_items"])
    expect(byName.update_profile.securitySchemes[0].scopes).toEqual(["habits", "settings"])
  })

  it("only uses known permission scopes", () => {
    for (const op of API_OPERATIONS) expect(API_SCOPES).toContain(op.scope)
  })
})

describe("tools/call", () => {
  it("passes only declared arguments, plus the zone as a header", async () => {
    const result = await callMcpTool("add_todo", { title: "Buy milk", project: "House", bogus: "x", tz: "Europe/Madrid" }, "hta_test", ORIGIN)
    expect(result?.isError).toBe(false)
    expect(result?.content[0]).toEqual({ type: "text", text: "Added: Buy milk." })
    expect(result?.structuredContent).toEqual({ id: "t2", say: "Added: Buy milk." })
    const request = captured[0]
    expect(await request.json()).toEqual({ title: "Buy milk", project: "House" })
    expect(request.headers.get("X-Time-Zone")).toBe("Europe/Madrid")
    expect(request.headers.get("Authorization")).toBe("Bearer hta_test")
  })

  it("pages lists by default and drops unknown query args", async () => {
    await callMcpTool("list_todos", { status: "pending", project: "House", nonsense: "1" }, "hta_test", ORIGIN)
    const url = new URL(captured[0].url)
    expect(url.pathname).toBe("/api/v1/todos")
    expect(url.searchParams.get("limit")).toBe("25")
    expect(url.searchParams.get("status")).toBe("pending")
    expect(url.searchParams.get("project")).toBe("House")
    expect(url.searchParams.has("nonsense")).toBe(false)
  })

  it("asks which one on an ambiguous name (409) and says what exists on none (404)", async () => {
    const ambiguous = await callMcpTool("log_habit", { habit: "walk" }, "hta_test", ORIGIN)
    expect(ambiguous?.isError).toBe(true)
    expect(ambiguous?.content[0].text).toBe("Which one: Morning walk or Evening walk?")
    expect(ambiguous?.structuredContent).toBeUndefined()

    const none = await callMcpTool("archive_habit", { habit: "swimming" }, "hta_test", ORIGIN)
    expect(none?.isError).toBe(true)
    expect(JSON.parse(none!.content[1].text)).toMatchObject({ code: "not_found", options: ["Morning walk", "Evening walk", "Pushups"] })
  })

  it("relays scope_disabled, with delete_items off by default", async () => {
    const result = await callMcpTool("delete_todo", { todo: "anything" }, "hta_test", ORIGIN)
    expect(result?.isError).toBe(true)
    expect(result?.content[0].text).toContain("Deleting todos, projects and calendar events is off")
  })

  it("returns the habit detail as structured content", async () => {
    const result = await callMcpTool("get_habit", { habit: "pushups" }, "hta_test", ORIGIN)
    expect(result?.isError).toBe(false)
    expect(result?.structuredContent).toMatchObject({ id: "h3", name: "Pushups", currentStreak: 0 })
  })

  it("errors on an unknown tool", async () => {
    const { json } = await rpc("tools/call", { name: "nope", arguments: {} })
    expect(json.error.code).toBe(-32602)
  })
})

describe("resources", () => {
  it("lists static resources and the protocol template", async () => {
    const list = await rpc("resources/list")
    expect(list.json.result.resources.map((r: { uri: string }) => r.uri)).toEqual([
      "liberture://today",
      "liberture://habits",
      "liberture://calendar.ics",
      "liberture://export",
    ])
    const templates = await rpc("resources/templates/list")
    expect(templates.json.result.resourceTemplates[0].uriTemplate).toBe("liberture://protocol/{slug}")
  })

  it("reads a catalog protocol and refuses unknown uris", async () => {
    const slug = protocolSlugs()[0]
    const read = await rpc("resources/read", { uri: `liberture://protocol/${slug}` })
    expect(read.json.result.contents[0].mimeType).toBe("text/markdown")
    expect(read.json.result.contents[0].text).toContain(`protocolSlug "${slug}"`)

    const missing = await rpc("resources/read", { uri: "liberture://nothing" })
    expect(missing.json.error.code).toBe(-32002)
  })

  it("reads the habits through the API handler", async () => {
    const read = await rpc("resources/read", { uri: "liberture://habits" })
    const habits = JSON.parse(read.json.result.contents[0].text)
    expect(habits.map((h: { name: string }) => h.name)).toEqual(["Morning walk", "Evening walk", "Pushups"])
  })
})

describe("prompts", () => {
  it("lists the five prompts and fills arguments in", async () => {
    const list = await rpc("prompts/list")
    expect(list.json.result.prompts.map((p: { name: string }) => p.name)).toEqual([
      "morning_checkin",
      "evening_review",
      "weekly_review",
      "plan_my_day",
      "pick_a_protocol",
    ])
    const prompt = await rpc("prompts/get", { name: "pick_a_protocol", arguments: { goal: "sleep better" } })
    const text = prompt.json.result.messages[0].content.text as string
    expect(text).toContain("search_catalog")
    expect(text).toContain('q="sleep better"')

    const unknown = await rpc("prompts/get", { name: "nope" })
    expect(unknown.json.error.code).toBe(-32602)
  })
})

describe("completion, logging and errors", () => {
  it("completes habit names and protocol slugs", async () => {
    const habits = await rpc("completion/complete", { ref: { type: "ref/prompt", name: "weekly_review" }, argument: { name: "habit", value: "pu" } })
    expect(habits.json.result.completion.values).toEqual(["Pushups"])

    const slug = protocolSlugs()[0]
    const slugs = await rpc("completion/complete", {
      ref: { type: "ref/resource", uri: "liberture://protocol/{slug}" },
      argument: { name: "slug", value: slug.slice(0, 3) },
    })
    expect(slugs.json.result.completion.values).toContain(slug)
  })

  it("accepts logging/setLevel", async () => {
    const { json } = await rpc("logging/setLevel", { level: "info" })
    expect(json.result).toEqual({})
  })

  it("answers unknown methods with -32601 and ignores notifications", async () => {
    const { json } = await rpc("sampling/whatever")
    expect(json.error.code).toBe(-32601)
    const notification = await rpc("notifications/initialized", undefined, null)
    expect(notification.status).toBe(202)
  })
})
