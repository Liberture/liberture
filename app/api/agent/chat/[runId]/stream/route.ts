import { Readable } from "node:stream"

import { NextResponse } from "next/server"

import { SidecarError, sidecarConfigured, streamRun } from "@/lib/habits/agent/sidecar"
import { getAuthFromRequest, userKeyFor } from "@/lib/habits/app-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Server-sent events for one run, proxied from the sidecar.
 *
 * The sidecar decides whether this run belongs to the caller — we pass the user
 * key we derived from the session it cannot see, and it compares. A run id on
 * its own proves nothing, so it is never enough to read someone else's answer.
 */
export async function GET(request: Request, context: { params: Promise<{ runId: string }> }) {
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

    const upstream = await streamRun(runId, userKeyFor(auth))

    // Hang up on the sidecar when the browser goes away, so a closed tab does
    // not leave a subscriber attached for the rest of the run.
    request.signal.addEventListener("abort", () => upstream.destroy())

    return new Response(Readable.toWeb(upstream) as ReadableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Without this a buffering proxy holds the whole answer back and
        // delivers it in one lump when the run ends.
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    if (error instanceof SidecarError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[agent/chat] stream failed:", error)
    return NextResponse.json({ error: "Could not reach the coach." }, { status: 500 })
  }
}
