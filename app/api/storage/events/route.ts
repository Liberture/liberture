import { NextResponse } from "next/server"

import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { subscribeToChanges } from "@/lib/habits/change-events"
import { isLocalStorageMode } from "@/lib/habits/local-storage"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Comment line every 20 s so proxies (Cloudflare, nginx) keep the stream open. */
const HEARTBEAT_MS = 20_000

/**
 * GET /api/storage/events — Server-Sent Events for the signed-in user.
 *
 * Sends `event: change` with `{ lastUpdated }` whenever their data changes
 * anywhere (assistant/MCP, another device, the API). The tracker reloads on
 * it. Auth: the session cookie, or `?apiKey=` for legacy key users
 * (EventSource can't send headers).
 */
export async function GET(request: Request) {
  if (isLocalStorageMode()) {
    return NextResponse.json({ error: "Live updates need database mode" }, { status: 501 })
  }

  const userId = await verifiedTrackerUserId(request)
  if (userId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const encoder = new TextEncoder()
  let cleanup = () => {}

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          cleanup()
        }
      }

      let unsubscribe = () => {}
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS)
      cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // Already closed by the client.
        }
      }
      request.signal.addEventListener("abort", () => cleanup())

      // Tell EventSource to reconnect quickly if the stream drops.
      send("retry: 3000\n\n")
      try {
        unsubscribe = await subscribeToChanges(userId, (event) => {
          send(`event: change\ndata: ${JSON.stringify({ lastUpdated: event.lastUpdated })}\n\n`)
        })
        send(`event: ready\ndata: {}\n\n`)
      } catch (error) {
        console.error("storage events: could not subscribe", error)
        cleanup()
      }
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // nginx: don't buffer the stream.
      "X-Accel-Buffering": "no",
    },
  })
}
