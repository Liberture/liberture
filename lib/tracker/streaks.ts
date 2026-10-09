import type { Schedule } from "./types"

/**
 * Schedule wording for the public protocol pages. The tracker's own streak,
 * rate and due-day maths lives in lib/habits/habit-utils.ts.
 */
export function scheduleLabel(schedule: Schedule): string {
  switch (schedule.type) {
    case "daily":
      return "Every day"
    case "specific_days": {
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const days = [...schedule.days].sort((a, b) => a - b)
      if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "Weekdays"
      if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends"
      return days.map((d) => names[d]).join(", ")
    }
    case "times_per_week":
      return `${schedule.timesPerWeek}× per week`
  }
}
