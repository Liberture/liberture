import { NextResponse } from "next/server"

import { appendHabits } from "@/lib/habits/api/habit-writes"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { adoptedProtocolSlugs, adoptedSlugs, catalogHabitToHabit } from "@/lib/habits/protocols/adopt"
import { CATALOG_PROTOCOLS, findProtocol } from "@/lib/habits/protocols/catalog"

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
  try {
    slug = (await request.json())?.slug
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const protocol = typeof slug === "string" ? findProtocol(slug) : undefined
  if (!protocol) return NextResponse.json({ error: "Unknown protocol" }, { status: 404 })

  const existing = adoptedSlugs(user.data.habits ?? [])
  const habits = protocol.habits
    .filter((h) => !existing.has(h.slug))
    .map((h) => catalogHabitToHabit(h, { protocolSlug: protocol.slug }))

  try {
    await appendHabits(user.userId, habits)
  } catch (error) {
    console.error("Failed to adopt protocol:", error)
    return NextResponse.json({ error: "Failed to add habits" }, { status: 500 })
  }
  return NextResponse.json({ added: habits.length })
}
