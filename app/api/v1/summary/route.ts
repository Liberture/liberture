import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { buildSpokenSummary, habitsForDay } from "@/lib/habits/api/assistant"
import { userToday } from "@/lib/habits/api/time-zone"
import { effectivePermissions } from "@/lib/habits/api-scopes"
import { connectionKeyFor, staleConnectorLine, syncStatusFor } from "@/lib/habits/api/connector-sync"
import { welcomeNoticeFor } from "@/lib/habits/api/welcome"

/**
 * GET /api/v1/summary?tz=Europe/Madrid&format=json
 *
 * The one call an assistant makes to start (get_today): who, the date,
 * switched-off permissions, and today at a glance: what's left, what's done, streaks,
 * open todos. Markdown by default so it can be read out as-is; format=json for
 * the same data structured. The day comes from `tz`, then the usual
 * X-Local-Date / X-Time-Zone headers, then the zone saved in the user's
 * preferences, then the server's configured zone.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const url = new URL(request.url)
  const today = userToday(request, user.data, url.searchParams.get("date"), url.searchParams.get("tz"))

  if (url.searchParams.get("format") === "json") {
    const habits = habitsForDay(user.data, today)
    const openTodos = (user.data.todos ?? []).filter((t) => t.status !== "completed")
    return NextResponse.json(
      {
        date: today,
        habits,
        done: habits.filter((h) => h.done).length,
        total: habits.length,
        openTodos: openTodos.length,
        overdueTodos: openTodos.filter((t) => t.dueDate && t.dueDate < today).length,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  const permissions = effectivePermissions((user.data as unknown as Record<string, unknown>).integrationPermissions)
  const context = {
    name: user.data.profile?.name ?? null,
    disabledScopes: Object.entries(permissions).filter(([, on]) => !on).map(([scope]) => scope),
    connectorNotice: staleConnectorLine(await syncStatusFor(connectionKeyFor(user)).catch(() => null)),
    welcomeNotice: await welcomeNoticeFor(
      user.userId,
      connectionKeyFor(user),
      (user.data.habits ?? []).filter((h) => !h.archived).length
    ),
  }
  return new NextResponse(buildSpokenSummary(user.data, today, context), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" },
  })
}
