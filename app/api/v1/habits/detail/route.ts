import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findHabitByName } from "@/lib/habits/api/find-habit"
import { catalogLinks, requestOrigin } from "@/lib/habits/api/assistant"
import { userToday } from "@/lib/habits/api/time-zone"
import { calculateStreak, isHabitScheduledOnDate } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { format, subDays } from "date-fns"

/**
 * GET /api/v1/habits/detail?habit=<name as said>&tz=
 *
 * Everything about one habit (get_habit): schedule, plan, what it tracks,
 * streaks, the last two weeks, and its catalog page if it came from one.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const url = new URL(request.url)
  const found = findHabitByName(user.data.habits ?? [], url.searchParams.get("habit"))
  if (found instanceof NextResponse) return found
  const h = found

  const today = userToday(request, user.data, undefined, url.searchParams.get("tz"))
  const todayDate = parseDateOnly(today)
  const completions = (user.data.completions ?? []).filter((c) => c.habitId === h.id)
  const streak = calculateStreak(h.id, user.data.completions ?? [], undefined, h, todayDate)
  const since = format(subDays(todayDate, 13), "yyyy-MM-dd")
  const recent = completions
    .filter((c) => c.date >= since && (c.completed || c.data || c.context))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((c) => ({ date: c.date, completed: c.completed, data: c.data ?? null, note: c.context ?? null }))
  const origin = requestOrigin(request)
  const link = h.catalogSlug
    ? catalogLinks("habit", h.catalogSlug, origin)
    : h.protocolSlug
      ? catalogLinks("protocol", h.protocolSlug, origin)
      : { infoUrl: null }

  return NextResponse.json({
    id: h.id,
    name: h.name,
    description: h.description ?? null,
    archived: Boolean(h.archived),
    schedule: h.schedule,
    time: h.time || null,
    timeOfDay: h.timeOfDay ?? null,
    priority: h.priority ?? null,
    pillar: h.category ?? null,
    color: h.color,
    tags: h.tags ?? [],
    intention: h.implementationIntention ?? null,
    identity: h.identity?.identityType ?? null,
    dataEntry: h.dataEntry ?? null,
    randomReminders: Boolean(h.randomRemindersEnabled),
    protocolSlug: h.protocolSlug ?? null,
    catalogSlug: h.catalogSlug ?? null,
    createdAt: h.createdAt,
    startDate: h.startDate ?? null,
    scheduledToday: isHabitScheduledOnDate(h, todayDate, todayDate),
    doneToday: completions.some((c) => c.date === today && c.completed),
    currentStreak: streak.current,
    longestStreak: streak.longest,
    totalCompletions: completions.filter((c) => c.completed).length,
    recent,
    reading: h.readingContent?.enabled
      ? { mode: h.readingContent.mode, passages: h.readingContent.passages.length, minutes: h.readingContent.minutes ?? null }
      : null,
    ...link,
  })
}
