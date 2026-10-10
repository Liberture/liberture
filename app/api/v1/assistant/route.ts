import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { effectivePermissions } from "@/lib/habits/api-scopes"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { userToday } from "@/lib/habits/api/time-zone"
import { TOOL_COUNT, TOOLS_VERSION } from "@/lib/habits/api/operations"
import { connectionKeyFor, syncStatusFor } from "@/lib/habits/api/connector-sync"

/**
 * GET /api/v1/assistant
 *
 * The first call an assistant should make: who it is talking to, today's date
 * for them, and which scopes the user left on — so it can say "you've turned
 * that off" instead of attempting a write and failing.
 *
 * `connector` is what this server offers right now. A client whose tool list
 * is shorter (or whose cached version differs) is stale: the user should
 * refresh the connector in their assistant's settings.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const url = new URL(request.url)
  const sync = await syncStatusFor(connectionKeyFor(user)).catch(() => null)
  return NextResponse.json(
    {
      name: user.data.profile?.name ?? null,
      today: userToday(request, user.data, undefined, url.searchParams.get("tz")),
      timeZone: user.data.preferences?.timeZone ?? null,
      permissions: effectivePermissions((user.data as unknown as Record<string, unknown>).integrationPermissions),
      docsUrl: `${requestOrigin(request)}/docs`,
      activeHabits: (user.data.habits ?? []).filter((h) => !h.archived).length,
      connector: {
        tools: TOOL_COUNT,
        version: TOOLS_VERSION,
        // What *this* connection loaded, and what it's missing. null before its first tools/list
        // (or when called over plain HTTP, e.g. a Custom GPT action, which has no tool list).
        yourSync: sync && {
          syncedAt: sync.syncedAt,
          version: sync.toolsVersion,
          syncCount: sync.syncCount,
          upToDate: sync.upToDate,
          newTools: sync.newTools,
          removedTools: sync.removedTools,
        },
        refreshGuide: `${requestOrigin(request)}/docs/updates`,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
