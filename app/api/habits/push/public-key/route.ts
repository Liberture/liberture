import { NextResponse } from "next/server"

import { vapidPublicKey } from "@/lib/habits/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET: the VAPID public key browsers subscribe with. 503 when this instance has no push configured. */
export async function GET() {
  const publicKey = vapidPublicKey()
  if (!publicKey) {
    return NextResponse.json({ error: "Push notifications are not configured on this server.", code: "push_not_configured" }, { status: 503 })
  }
  return NextResponse.json({ publicKey }, { headers: { "Cache-Control": "no-store" } })
}
