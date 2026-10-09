import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { effectivePermissions } from "@/lib/habits/api-scopes"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { userToday } from "@/lib/habits/api/time-zone"

/**
 * GET /api/v1/assistant
 *
 * The first call an assistant should make: who it is talking to, today's date
 * for them, and which scopes the user left on — so it can say "you've turned
 * that off" instead of attempting a write and failing.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const url = new URL(request.url)
  return NextResponse.json(
    {
      name: user.data.profile?.name ?? null,
      today: userToday(request, user.data, undefined, url.searchParams.get("tz")),
      timeZone: user.data.preferences?.timeZone ?? null,
      permissions: effectivePermissions((user.data as unknown as Record<string, unknown>).integrationPermissions),
      docsUrl: `${requestOrigin(request)}/docs`,
      activeHabits: (user.data.habits ?? []).filter((h) => !h.archived).length,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
