import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { spokenList } from "@/lib/habits/api/resolve"
import { applyProfileUpdate, mutateProfile, profileView, type ProfileUpdateInput } from "@/lib/habits/api/profile"

/**
 * GET /api/v1/profile (get_profile, scope read)
 *
 * The user's name, mission, focus habits, check-in times and app
 * preferences (theme, week start, clock, time zone, layout, reminders),
 * defaults filled in.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user
  return NextResponse.json(profileView(user.data.profile, user.data.preferences, user.data.habits ?? []), {
    headers: { "Cache-Control": "no-store" },
  })
}

/**
 * POST /api/v1/profile (update_profile, scope settings)
 * Body: any of { name, missionStatement, focusHabits: [habit names], checkInTimes: { morning, midday, evening },
 *   theme, weekStartsOn, timeFormat, timeZone, morningDashboard, habitsLayout, defaultReminderTime, notifications }
 *
 * Stamped with updatedAt so an open tab can't revert it on its next save.
 * Reminders on/off is the account setting; the browser's own notification
 * permission still has to be granted on each device.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "settings")
  if (user instanceof NextResponse) return user

  let body: ProfileUpdateInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  let changes: string[] = []
  let result
  try {
    result = await mutateProfile(user.userId, (state, habits) => {
      const next = applyProfileUpdate(state, body, habits, new Date().toISOString())
      if ("error" in next) return { error: next }
      changes = next.changes
      return { profile: next.profile, preferences: next.preferences }
    })
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
  if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if ("error" in result) {
    const failure = result.error as { error: string; code?: string; options?: string[] }
    const status = failure.code === "ambiguous" ? 409 : failure.code === "not_found" ? 404 : 400
    return NextResponse.json(
      {
        ...failure,
        ...(failure.options ? { say: failure.code === "ambiguous" ? `Which one: ${spokenList(failure.options)}?` : "I can't find that habit." } : {}),
      },
      { status }
    )
  }

  return NextResponse.json({
    ...profileView(result.profile, result.preferences, user.data.habits ?? []),
    say: `Saved: ${changes.join(", ")}.`,
  })
}
