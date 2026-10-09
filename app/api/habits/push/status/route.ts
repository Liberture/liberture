import { NextResponse } from "next/server"

import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { reminderStatus } from "@/lib/habits/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET: devices subscribed, last delivery/failure and today's count, for Settings → Reminders. */
export async function GET(request: Request) {
  const userId = await verifiedTrackerUserId(request)
  if (!userId) return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
  return NextResponse.json(await reminderStatus(userId), { headers: { "Cache-Control": "no-store" } })
}
