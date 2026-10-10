import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { calculateStreak, isHabitDueOnDate } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { userTimeZone, userToday } from "@/lib/habits/api/time-zone"
import { subHours, parseISO } from "date-fns"
import { localNowIn } from "@/lib/habits/coach/limits"

/**
 * GET /api/v1/audit
 * Returns a technical audit of the user's habit discipline: missed critical
 * habits, streaks, drift and what to do next. "Critical" is the user's own
 * call: their focus habits (profile.focusHabits) and anything at priority 4-5.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const { data } = user
  const habits = (data.habits ?? []).filter((h) => !h.archived)
  const completions = data.completions ?? []
  const today = userToday(request, data, undefined, new URL(request.url).searchParams.get("tz"))
  const todayDate = parseDateOnly(today)
  const weekStartsOn = data.preferences?.weekStartsOn ?? 1
  // Habits asked for today. A times-per-week habit whose target is already
  // met this week isn't, so a rest day isn't a miss.
  const dueToday = habits.filter((h) => isHabitDueOnDate(h, todayDate, completions, weekStartsOn, todayDate))
  const dueIds = new Set(dueToday.map((h) => h.id))

  // 1. Identify Critical Habits
  const focus = new Set(data.profile?.focusHabits ?? [])
  const criticalHabits = habits.filter((h) => focus.has(h.id) || (h.priority ?? 0) >= 4)

  // 2. Check for Missed Critical Habits (last 24h)
  const missedCritical: string[] = []
  const twentyFourHoursAgo = subHours(new Date(), 24)

  for (const h of criticalHabits.filter((c) => dueIds.has(c.id))) {
    const isCompletedRecently = completions.some(c => 
      c.habitId === h.id && 
      c.completed && 
      (c.date === today || (c.completedAt && parseISO(c.completedAt) > twentyFourHoursAgo))
    )
    if (!isCompletedRecently) {
      missedCritical.push(h.name)
    }
  }

  // 3. Calculate Streaks (weeks for times-per-week habits, listed in streakUnits)
  const streaks: Record<string, number> = {}
  const streakUnits: Record<string, "days" | "weeks"> = {}
  habits.forEach(h => {
    const s = calculateStreak(h.id, completions, undefined, h, todayDate, weekStartsOn)
    streaks[h.name] = s.current
    streakUnits[h.name] = s.unit ?? "days"
  })

  // 4. Calculate Drift
  // Drift = true if missed more than 1 critical habit OR overall completion rate today < 50% (if after 6pm)
  const completedTodayCount = dueToday.filter(h =>
    completions.some(c => c.habitId === h.id && c.date === today && c.completed)
  ).length

  const completionRateToday = dueToday.length > 0 ? completedTodayCount / dueToday.length : 1
  // The user's clock, not the server's (UTC): "late" is 18:00 where they are.
  const isLateDay = localNowIn(userTimeZone(request, data)).minutes >= 18 * 60
  
  const drift = missedCritical.length > 0 || (isLateDay && completionRateToday < 0.5)

  // 5. Generate Recommendations
  const recommendations: string[] = []
  if (habits.length === 0) {
    recommendations.push("Start by adding your first habit to build momentum.")
  } else if (criticalHabits.length === 0) {
    // Nothing to audit: say so instead of praising a quiet day.
    recommendations.push(
      "No critical habits are set, so the audit has nothing to check. Choose up to 3 focus habits in Settings → Profile, or give habits priority 4–5."
    )
  }
  if (missedCritical.length > 0) {
    recommendations.push(`Priority: Complete your critical habits: ${missedCritical.join(", ")}.`)
  }
  if (drift && completionRateToday < 0.5) {
    recommendations.push("You're drifting from your routine. Try a 5-minute 'reset' meditation to regain focus.")
  }
  if (recommendations.length === 0) {
    recommendations.push(
      completionRateToday >= 0.5
        ? "Your critical habits are on track. Keep the momentum."
        : `Your critical habits are on track; ${completedTodayCount} of ${dueToday.length} habits due today are done so far.`
    )
  }

  return NextResponse.json({
    critical: criticalHabits.map((h) => h.name),
    // What "critical" means here, so an empty list isn't read as "all good".
    criticalRule: "Focus habits from the profile, or priority 4–5. Drift = a missed critical habit, or under half of today's due habits done after 18:00 local.",
    today: { done: completedTodayCount, due: dueToday.length },
    drift,
    missedCritical,
    streaks,
    streakUnits,
    recommendations
  })
}
