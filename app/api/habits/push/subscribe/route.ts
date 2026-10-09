import { NextResponse } from "next/server"

import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { isPushSubscriptionInput, pushConfigured, removeSubscription, replaceSubscription, saveSubscription } from "@/lib/habits/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UNAUTHORIZED = { error: "Valid API key or Nostr session required." }

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json()
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * POST { subscription } from the app (signed in), or { subscription, oldEndpoint }
 * from the service worker's pushsubscriptionchange, which has no credentials:
 * the old endpoint, matching a stored row, is the proof of ownership.
 */
export async function POST(request: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured on this server.", code: "push_not_configured" }, { status: 503 })
  }
  const body = await readJson(request)
  const subscription = body?.subscription
  if (!isPushSubscriptionInput(subscription)) {
    return NextResponse.json({ error: "Body must be { subscription: PushSubscription.toJSON() }." }, { status: 400 })
  }
  const userAgent = request.headers.get("user-agent")

  const userId = await verifiedTrackerUserId(request)
  if (userId) {
    await saveSubscription(userId, subscription, userAgent)
    return NextResponse.json({ subscribed: true })
  }

  const oldEndpoint = body?.oldEndpoint
  if (typeof oldEndpoint === "string" && oldEndpoint) {
    const owner = await replaceSubscription(oldEndpoint, subscription, userAgent)
    if (owner) return NextResponse.json({ subscribed: true })
  }
  return NextResponse.json(UNAUTHORIZED, { status: 401 })
}

/** DELETE { endpoint }: this device stops getting reminders with the app closed. */
export async function DELETE(request: Request) {
  const userId = await verifiedTrackerUserId(request)
  if (!userId) return NextResponse.json(UNAUTHORIZED, { status: 401 })
  const body = await readJson(request)
  const endpoint = body?.endpoint
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "Body must be { endpoint }." }, { status: 400 })
  }
  const removed = await removeSubscription(userId, endpoint)
  return NextResponse.json({ removed })
}
