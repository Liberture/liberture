import { NextResponse } from "next/server"

import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { userTimeZone } from "@/lib/habits/api/time-zone"
import { getDb } from "@/lib/habits/db"
import { countSentToday, ensurePushTables, localDayStartUtc } from "@/lib/habits/push"
import { COACH_KIND_PREFIX, coachPrefs, inQuietHours, localNowIn } from "@/lib/habits/coach/limits"
import { lastLoggedOn, unloggedDueDays } from "@/lib/habits/coach/rules"
import { effectiveStatus, suggestionName } from "@/lib/habits/coach/suggestions"
import { weeklyProgress } from "@/lib/habits/habit-utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/v1/coach/state (get_coach_state, scope read)
 *
 * Everything an assistant's automation needs before deciding to nudge: the
 * check-in settings and limits, how many coach messages went out today (from
 * any coach) and the last one per kind, the suggestions still open, and per
 * habit when it was last logged and how many due days have no record.
 * Sending is a separate step: record_coach_nudge.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { data } = user
  const url = new URL(request.url)
  const timeZone = userTimeZone(request, data, url.searchParams.get("tz"))
  const localNow = localNowIn(timeZone)
  const prefs = coachPrefs(data)
  const weekStartsOn = data.preferences?.weekStartsOn === 0 ? 0 : 1
  const completions = data.completions ?? []

  let sentToday: number | null = null
  let lastByKind: Record<string, string> = {}
  try {
    await ensurePushTables()
    sentToday = await countSentToday(user.userId, COACH_KIND_PREFIX, localDayStartUtc(timeZone))
    const rows = await getDb()`
      SELECT kind, MAX(sent_at) AS last FROM habit_notifications_sent
      WHERE user_id = ${user.userId} AND kind LIKE ${`${COACH_KIND_PREFIX}%`}
      GROUP BY kind`
    lastByKind = Object.fromEntries(
      rows.map((row) => [String(row.kind).slice(COACH_KIND_PREFIX.length), row.last instanceof Date ? row.last.toISOString() : String(row.last)])
    )
  } catch (error) {
    console.warn("[coach] state: nudge ledger unavailable:", error instanceof Error ? error.message : error)
  }

  const now = new Date()
  const suggestions = (data.coachRecommendations?.entries ?? []).map((entry) => ({
    name: suggestionName(entry),
    slug: entry.slug ?? null,
    kind: entry.kind,
    reason: entry.reason,
    status: effectiveStatus(entry, now),
    snoozedUntil: entry.snoozedUntil ?? null,
  }))

  const habits = (data.habits ?? [])
    .filter((h) => !h.archived)
    .map((habit) => ({
      name: habit.name,
      lastLoggedOn: lastLoggedOn(habit.id, completions),
      unloggedDueDays: unloggedDueDays(habit, completions, localNow.date, weekStartsOn),
      ...(habit.schedule?.type === "times_per_week"
        ? { weeklyProgress: weeklyProgress(habit, completions, localNow.dateObj, weekStartsOn) }
        : {}),
    }))

  return NextResponse.json(
    {
      today: localNow.date,
      localTime: `${String(Math.floor(localNow.minutes / 60)).padStart(2, "0")}:${String(localNow.minutes % 60).padStart(2, "0")}`,
      timeZone: timeZone ?? null,
      settings: {
        checkIns: prefs.checkIns,
        missedLogging: prefs.missedLogging,
        quietHours: prefs.quietHours,
        maxNudgesPerDay: prefs.maxNudgesPerDay,
        language: data.preferences?.language ?? "en",
      },
      nudges: {
        inQuietHours: inQuietHours(localNow.minutes, prefs.quietHours),
        sentToday,
        remainingToday: sentToday === null ? null : Math.max(0, prefs.maxNudgesPerDay - sentToday),
        lastByKind,
      },
      suggestions: {
        generatedAt: data.coachRecommendations?.generatedAt ?? null,
        pending: suggestions.filter((s) => s.status === "pending"),
        snoozed: suggestions.filter((s) => s.status === "snoozed"),
      },
      habits,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
