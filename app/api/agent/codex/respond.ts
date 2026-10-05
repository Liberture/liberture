import { NextResponse } from "next/server"

import { SidecarError, sidecarConfigured } from "@/lib/habits/agent/sidecar"
import { isCoachAdminRequest } from "@/lib/habits/app-auth"

/**
 * Shared shape of the coach-login routes: admin only, and sidecar errors
 * reported as what they are rather than as a 500.
 *
 * Admin rather than any logged-in user because whoever completes the device
 * flow decides which ChatGPT account every user's coach runs on.
 */
export async function adminSidecarCall(request: Request, action: () => Promise<unknown>): Promise<NextResponse> {
  if (!await isCoachAdminRequest(request)) {
    return NextResponse.json({ error: "Sign in with the tracker account that manages the coach." }, { status: 401 })
  }
  if (!sidecarConfigured()) {
    return NextResponse.json(
      { error: "The coach is not configured on this instance (HABIT_AGENT_SOCKET / HABIT_AGENT_SECRET)." },
      { status: 503 }
    )
  }
  try {
    return NextResponse.json(await action())
  } catch (error) {
    if (error instanceof SidecarError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[agent/codex]", error)
    return NextResponse.json({ error: "the coach could not handle that" }, { status: 500 })
  }
}
