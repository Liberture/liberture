import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findHabitByName } from "@/lib/habits/api/find-habit"
import { paginate } from "@/lib/habits/api/paginate"
import { userToday } from "@/lib/habits/api/time-zone"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { format, subDays } from "date-fns"

/**
 * GET /api/v1/habits/history?habit=<name>&days=90&limit=30&cursor=
 *
 * One habit's logged days, newest first, with values and notes
 * (get_habit_history). Paged: pass nextCursor back for older days.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const url = new URL(request.url)
  const found = findHabitByName(user.data.habits ?? [], url.searchParams.get("habit"))
  if (found instanceof NextResponse) return found

  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 90, 1), 3650)
  const today = userToday(request, user.data, undefined, url.searchParams.get("tz"))
  const cutoff = format(subDays(parseDateOnly(today), days - 1), "yyyy-MM-dd")
  const entries = (user.data.completions ?? [])
    .filter((c) => c.habitId === found.id && c.date >= cutoff && c.date <= today && (c.completed || c.data || c.context))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((c) => ({ date: c.date, completed: c.completed, completedAt: c.completedAt ?? null, data: c.data ?? null, note: c.context ?? null }))

  const page = paginate(entries, url.searchParams.get("limit") ?? undefined, url.searchParams.get("cursor") ?? undefined, { limit: 30, max: 366 })
  if ("error" in page) return NextResponse.json({ error: page.error }, { status: 400 })

  const done = entries.filter((e) => e.completed).length
  return NextResponse.json({
    habit: { id: found.id, name: found.name },
    from: cutoff,
    to: today,
    completedDays: done,
    entries: page.items,
    nextCursor: page.nextCursor,
    total: page.total,
    say: `${found.name}: done ${done} day${done === 1 ? "" : "s"} in the last ${days}.`,
  })
}
