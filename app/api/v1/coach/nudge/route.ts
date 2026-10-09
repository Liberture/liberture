import { NextResponse } from "next/server"

import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { userTimeZone } from "@/lib/habits/api/time-zone"
import { COACH_NUDGE_KINDS, canNudge, localNowIn, type CoachNudgeKind } from "@/lib/habits/coach/limits"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SAY: Record<string, string> = {
  quiet_hours: "It's the user's quiet hours; don't send it.",
  daily_limit: "The user has had enough coach messages today; don't send it.",
  duplicate: "That check-in already went out; don't send another.",
}

/**
 * POST /api/v1/coach/nudge (record_coach_nudge, scope settings)
 * Body: { kind: morning|afternoon|evening|weekly|missed_logging|other, message?, timeZone? }
 *
 * An assistant calls this right before messaging the user unprompted. Same
 * limits as Liberture's own push check-ins (quiet hours, daily cap, one per
 * kind per day or week), and the same ledger: an allowed answer is recorded,
 * so the two coaches never double up. Message the user only if `allowed`.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "settings")
  if (user instanceof NextResponse) return user

  let body: { kind?: unknown; message?: unknown; timeZone?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (typeof body.kind !== "string" || !(COACH_NUDGE_KINDS as readonly string[]).includes(body.kind)) {
    return NextResponse.json({ error: `kind must be one of ${COACH_NUDGE_KINDS.join(", ")}` }, { status: 400 })
  }
  const message = typeof body.message === "string" ? body.message.slice(0, 500) : undefined
  const timeZone = userTimeZone(request, user.data, body.timeZone)
  const localNow = localNowIn(timeZone)

  try {
    const verdict = await canNudge({
      userId: user.userId,
      kind: body.kind as CoachNudgeKind,
      localNow,
      data: { preferences: { ...user.data.preferences, ...(timeZone ? { timeZone } : {}) } },
      channel: "assistant",
      message,
    })
    return NextResponse.json(
      {
        allowed: verdict.allowed,
        reason: verdict.reason,
        sentToday: verdict.sentToday,
        remainingToday: Math.max(0, verdict.limit - verdict.sentToday),
        say: verdict.allowed ? "Recorded. Go ahead and send it." : SAY[verdict.reason ?? ""],
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Failed to record coach nudge:", error)
    return NextResponse.json({ error: "Failed to record the nudge" }, { status: 500 })
  }
}
