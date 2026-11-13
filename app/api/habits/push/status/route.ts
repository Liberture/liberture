import { NextResponse } from "next/server"

import { withTrackerOwner } from "@/lib/habits/api/with-tracker-owner"
import { reminderStatus } from "@/lib/habits/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET: devices subscribed, last delivery/failure and today's count, for Settings → Reminders. */
export const GET = withTrackerOwner(async (userId) => {
  return NextResponse.json(await reminderStatus(userId), { headers: { "Cache-Control": "no-store" } })
}, "Valid API key or Nostr session required.")
