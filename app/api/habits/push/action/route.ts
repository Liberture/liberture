import { NextResponse } from "next/server"

import { runAfterResponse } from "@/lib/habits/after-response"
import { getDb } from "@/lib/habits/db"
import { ensurePushTables, sendPush } from "@/lib/habits/push"
import { PUSH_ACTION_TOKEN_RE, consumePushAction, undoPushAction } from "@/lib/habits/push-actions"
import { checkRateLimit, clientIp } from "@/lib/habits/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Taps are rare; this only slows down someone guessing tokens. */
const ACTIONS_PER_MINUTE = 30

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

/**
 * POST { token, action: "undo" } → { ok, reason }. Called by the service
 * worker when a notification button is tapped. There is no session: the
 * single-use token from the push (lib/habits/push-actions.ts) is the proof,
 * as the old endpoint is for /subscribe. 404 unknown or used, 410 expired;
 * ok false with reason "changed" when the item moved on since.
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(`push-action:${clientIp(request)}`, ACTIONS_PER_MINUTE)
  if (!limit.allowed) return reply({ ok: false, reason: "rate_limited" }, 429)

  let body: { token?: unknown; action?: unknown } | null = null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const token = body?.token
  if (typeof token !== "string" || !PUSH_ACTION_TOKEN_RE.test(token) || body?.action !== "undo") {
    return reply({ ok: false, reason: "invalid" }, 400)
  }

  await ensurePushTables()
  const sql = getDb()
  const consumed = await consumePushAction(sql, token)
  if (consumed === null) return reply({ ok: false, reason: "unknown" }, 404)
  if (consumed === "expired") return reply({ ok: false, reason: "expired" }, 410)

  const result = await undoPushAction(sql, consumed.userId, consumed.action)
  const notice = consumed.action.notice
  if (result === "undone" && notice) {
    // The receipt is still showing on the user's other devices: replace it quietly.
    runAfterResponse("push-action", () =>
      sendPush(consumed.userId, { title: notice.title, body: notice.body, tag: notice.tag, url: notice.url, silent: true }),
    )
  }
  return reply({ ok: result === "undone", reason: result })
}
