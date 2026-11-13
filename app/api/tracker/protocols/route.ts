import { NextResponse } from "next/server"

import { appendHabits } from "@/lib/habits/api/habit-writes"
import { userToday } from "@/lib/habits/api/time-zone"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { adoptedProtocolSlugs, adoptedSlugs, catalogHabitToHabit } from "@/lib/habits/protocols/adopt"
import { isLocale } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { catalogProtocols } from "@/lib/habits/protocols/localized-catalog"
import { CATALOG_PROTOCOLS } from "@/lib/habits/protocols/catalog"

/**
 * The public /protocols page's view of the signed-in user's tracker
 * (session cookie). GET lists adopted protocol slugs; POST { slug } adds a
 * protocol's habits, skipping any already tracked.
 */
export async function GET(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ signedIn: false, adopted: [] })
  const adopted = adoptedProtocolSlugs(user.data.habits ?? [], CATALOG_PROTOCOLS)
  return NextResponse.json({ signedIn: true, adopted: [...adopted] })
}

export async function POST(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let slug: unknown
  let requestedLocale: unknown
  try {
    const body = await request.json()
    slug = body?.slug
    requestedLocale = body?.locale
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const locale = isLocale(requestedLocale) ? requestedLocale : await getRequestLocale()
  const protocol = typeof slug === "string" ? catalogProtocols(locale).find(p => p.slug === slug) : undefined
  if (!protocol) return NextResponse.json({ error: "Unknown protocol" }, { status: 404 })

  const existing = adoptedSlugs(user.data.habits ?? [])
  const habits = protocol.habits
    .filter((h) => !existing.has(h.slug))
    .map((h) => catalogHabitToHabit(h, { protocolSlug: protocol.slug }))

  try {
    await appendHabits(user.userId, habits, userToday(request, user.data))
  } catch (error) {
    console.error("Failed to adopt protocol:", error)
    return NextResponse.json({ error: "Failed to add habits" }, { status: 500 })
  }
  return NextResponse.json({ added: habits.length })
}
