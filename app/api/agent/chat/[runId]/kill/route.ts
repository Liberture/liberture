import { NextResponse } from "next/server"

import { SidecarError, killRun, sidecarConfigured } from "@/lib/habits/agent/sidecar"
import { getAuthFromRequest, userKeyFor } from "@/lib/habits/app-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Stop a run in flight — the Stop button while the coach is thinking. */
export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  if (!sidecarConfigured()) {
    return NextResponse.json({ error: "The coach is not enabled on this instance." }, { status: 503 })
  }

  const { runId } = await context.params
  if (!/^[0-9a-f]{16}$/.test(runId)) {
    return NextResponse.json({ error: "Unknown run." }, { status: 400 })
  }

  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
    }

    await killRun(runId, userKeyFor(auth))
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof SidecarError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[agent/chat] kill failed:", error)
    return NextResponse.json({ error: "Could not reach the coach." }, { status: 500 })
  }
}
