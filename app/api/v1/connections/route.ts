import { NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { listConnections } from "@/lib/habits/oauth/store"
import { syncStatusesFor, type ToolSyncStatus } from "@/lib/habits/api/connector-sync"
import { TOOL_COUNT, TOOLS_VERSION } from "@/lib/habits/api/operations"

function toolsSummary(status: ToolSyncStatus | undefined) {
  return status
    ? { syncedAt: status.syncedAt, version: status.toolsVersion, syncCount: status.syncCount, upToDate: status.upToDate, newTools: status.newTools }
    : null
}

/**
 * GET /api/v1/connections — the assistants connected to this account. Owner auth.
 * Each carries `tools`: when it last loaded the tool list and what it's missing
 * (null if it never has), so Settings can say "refresh ChatGPT to get N new tools".
 */
export async function GET(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const [connections, syncs] = await Promise.all([
    listConnections(user.userId),
    syncStatusesFor(user.userId).catch(() => new Map<string, ToolSyncStatus>()),
  ])
  return NextResponse.json(
    {
      connections: connections.map((c) => ({ ...c, tools: toolsSummary(syncs.get(`conn:${c.id}`)) })),
      scriptTokenTools: toolsSummary(syncs.get(`script:${user.userId}`)),
      server: { tools: TOOL_COUNT, version: TOOLS_VERSION },
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
