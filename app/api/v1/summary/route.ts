import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { buildSpokenSummary, habitsForDay } from "@/lib/habits/api/assistant"
import { dateForRequest } from "@/lib/habits/date-utils"
import { effectivePermissions } from "@/lib/habits/api-scopes"

/**
 * GET /api/v1/summary?tz=Europe/Madrid&format=json
 *
 * The one call an assistant makes to start (get_today): who, the date,
 * switched-off permissions, and today at a glance: what's left, what's done, streaks,
 * open todos. Markdown by default so it can be read out as-is; format=json for
 * the same data structured. The day comes from `tz`, then the usual
 * X-Local-Date / X-Time-Zone headers, then the server's configured zone.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const url = new URL(request.url)
  const today = dateForRequest(request, url.searchParams.get("date"), url.searchParams.get("tz"))

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
  }
  return new NextResponse(buildSpokenSummary(user.data, today, context), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" },
  })
}
