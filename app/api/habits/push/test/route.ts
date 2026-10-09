import { NextResponse } from "next/server"

import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { getDb } from "@/lib/habits/db"
import { getDictionary, isLocale, LOCALE_COOKIE } from "@/lib/habits/i18n"
import { pushConfigured, sendPush } from "@/lib/habits/push"
import { REMINDER_URL } from "@/lib/habits/reminders/due"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function cookieLocale(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? ""
  return cookie.split(";").map((part) => part.trim().split("=")).find(([name]) => name === LOCALE_COOKIE)?.[1]
}

/** POST: sends a real push from the server to every device of the caller, so delivery with the app closed can be proven. */
export async function POST(request: Request) {
  const userId = await verifiedTrackerUserId(request)
  if (!userId) return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured on this server.", code: "push_not_configured" }, { status: 503 })
  }

  const rows = await getDb()`SELECT data->'preferences'->>'language' AS language FROM habit_users WHERE id = ${userId}`
  const saved = rows[0]?.language
  const locale = isLocale(saved) ? saved : (() => { const c = cookieLocale(request); return isLocale(c) ? c : "en" })()
  const t = getDictionary(locale).app.notificationManager

  const result = await sendPush(userId, { title: t.testTitle, body: t.testBody, tag: "habit-server-test", url: REMINDER_URL })
  return NextResponse.json({ ...result, devices: result.sent + result.failed + result.removed })
}
