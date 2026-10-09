import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { calculateStreak, isHabitScheduledOnDate } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { userToday } from "@/lib/habits/api/time-zone"
import { subHours, parseISO } from "date-fns"

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

  // 1. Identify Critical Habits
  const focus = new Set(data.profile?.focusHabits ?? [])
  const criticalHabits = habits.filter((h) => focus.has(h.id) || (h.priority ?? 0) >= 4)

  // 2. Check for Missed Critical Habits (last 24h)
  const missedCritical: string[] = []
  const twentyFourHoursAgo = subHours(new Date(), 24)

  for (const h of criticalHabits.filter((c) => isHabitScheduledOnDate(c, todayDate, todayDate))) {
    const isCompletedRecently = completions.some(c => 
      c.habitId === h.id && 
      c.completed && 
      (c.date === today || (c.completedAt && parseISO(c.completedAt) > twentyFourHoursAgo))
    )
    if (!isCompletedRecently) {
      missedCritical.push(h.name)
    }
  }

  // 3. Calculate Streaks
  const streaks: Record<string, number> = {}
  habits.forEach(h => {
    const s = calculateStreak(h.id, completions, undefined, h, todayDate)
    streaks[h.name] = s.current
  })

  // 4. Calculate Drift
  // Drift = true if missed more than 1 critical habit OR overall completion rate today < 50% (if after 6pm)
  const completedTodayCount = habits.filter(h => 
    completions.some(c => c.habitId === h.id && c.date === today && c.completed)
  ).length
  
  const completionRateToday = habits.length > 0 ? completedTodayCount / habits.length : 1
  const isLateDay = new Date().getHours() >= 18
  
  const drift = missedCritical.length > 0 || (isLateDay && completionRateToday < 0.5)

  // 5. Generate Recommendations
  const recommendations: string[] = []
  if (missedCritical.length > 0) {
    recommendations.push(`Priority: Complete your critical habits: ${missedCritical.join(", ")}.`)
  }
  if (drift && completionRateToday < 0.5) {
    recommendations.push("You're drifting from your routine. Try a 5-minute 'reset' meditation to regain focus.")
  }
  if (habits.length === 0) {
    recommendations.push("Start by adding your first habit to build momentum.")
  }
  if (recommendations.length === 0) {
    recommendations.push("Great job! You're staying disciplined. Maintain the momentum.")
  }

  return NextResponse.json({
    critical: criticalHabits.map((h) => h.name),
    drift,
    missedCritical,
    streaks,
    recommendations
  })
}
