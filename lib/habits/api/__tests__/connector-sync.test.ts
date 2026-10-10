import { describe, expect, it, vi } from "vitest"

const recorded: { userId: number; key: string }[] = []
vi.mock("@/lib/habits/db", () => ({ getDb: () => { throw new Error("no database in unit tests") } }))

import { compareSync, connectionKeyFor, staleConnectorLine } from "@/lib/habits/api/connector-sync"
import { MCP_TOOL_NAMES, TOOL_COUNT, TOOLS_VERSION } from "@/lib/habits/api/operations"

const base = {
  key: "conn:abc",
  toolCount: 3,
  syncCount: 2,
  firstSyncedAt: "2026-10-01T12:00:00.000Z",
  syncedAt: "2026-10-05T12:00:00.000Z",
}

describe("compareSync", () => {
  it("is up to date when the connection loaded the current version", () => {
    const status = compareSync({ ...base, toolsVersion: TOOLS_VERSION, toolNames: [...MCP_TOOL_NAMES] })
    expect(status.upToDate).toBe(true)
    expect(status.newTools).toEqual([])
    expect(status.syncCount).toBe(2)
  })

  it("lists the tools published since the last load, and ones that went away", () => {
    const seen = MCP_TOOL_NAMES.filter((n) => n !== "get_agenda" && n !== "update_event")
    const status = compareSync({ ...base, toolsVersion: "old00000", toolNames: [...seen, "retired_tool"] })
    expect(status.upToDate).toBe(false)
    expect(status.newTools.sort()).toEqual(["get_agenda", "update_event"])
    expect(status.removedTools).toEqual(["retired_tool"])
  })

  it("is stale on a version change even with the same names (a schema changed)", () => {
    const status = compareSync({ ...base, toolsVersion: "old00000", toolNames: [...MCP_TOOL_NAMES] })
    expect(status.upToDate).toBe(false)
    expect(status.newTools).toEqual([])
  })
})

describe("staleConnectorLine", () => {
  it("says nothing when current or unknown", () => {
    expect(staleConnectorLine(null)).toBeNull()
    expect(staleConnectorLine(compareSync({ ...base, toolsVersion: TOOLS_VERSION, toolNames: [...MCP_TOOL_NAMES] }))).toBeNull()
  })

  it("tells the assistant what's new and to ask the user to refresh", () => {
    const seen = MCP_TOOL_NAMES.filter((n) => n !== "get_agenda")
    const line = staleConnectorLine(compareSync({ ...base, toolsVersion: "old00000", toolNames: seen }))!
    expect(line).toContain("loaded 2026-10-05")
    expect(line).toContain(`now ${TOOLS_VERSION}`)
    expect(line).toContain("1 new tool since: get_agenda")
    expect(line).toContain("refresh the Liberture connector")
  })
})

describe("connectionKeyFor", () => {
  it("keys OAuth connections by id and the script token by user", () => {
    expect(connectionKeyFor({ userId: 7, connectionId: "c1" })).toBe("conn:c1")
    expect(connectionKeyFor({ userId: 7, connectionId: null })).toBe("script:7")
  })
})

describe("tools/list records the sync", () => {
  it("records once per tools/list with the caller's key", async () => {
    vi.resetModules()
    vi.doMock("@/lib/habits/api/connector-sync", async (importOriginal) => ({
      ...(await importOriginal<typeof import("@/lib/habits/api/connector-sync")>()),
      recordToolSync: async (userId: number, key: string) => {
        recorded.push({ userId, key })
      },
    }))
    const { handleMcpPost } = await import("@/lib/habits/api/mcp-server")
    const post = (method: string) =>
      handleMcpPost(
        new Request("https://liberture.test/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method }) }),
        "hta_x",
        { userId: 9, connectionId: "conn-9" }
      )
    const response = await post("tools/list")
    const body = await response.json()
    expect(body.result.tools).toHaveLength(TOOL_COUNT)
    await post("initialize")
    expect(recorded).toEqual([{ userId: 9, key: "conn:conn-9" }])
  })
})
