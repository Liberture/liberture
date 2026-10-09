import { NextResponse } from "next/server"

import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { claimNotification } from "@/lib/habits/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const KEY_RE = /^[\w:.\-]{1,200}$/
const KIND_RE = /^[\w:.\-]{1,40}$/

/**
 * POST { key, kind } → { claimed }. The in-tab reminder loop calls this before
 * showing anything; only the first claimer (a tab, another device or the
 * server tick) gets claimed: true.
 */
export async function POST(request: Request) {
  const userId = await verifiedTrackerUserId(request)
  if (!userId) return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
  let body: { key?: unknown; kind?: unknown } | null = null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const key = body?.key
  const kind = body?.kind
  if (typeof key !== "string" || !KEY_RE.test(key) || typeof kind !== "string" || !KIND_RE.test(kind)) {
    return NextResponse.json({ error: "Body must be { key, kind }." }, { status: 400 })
  }
  const claimed = await claimNotification(userId, key, kind, "local")
  return NextResponse.json({ claimed })
}
