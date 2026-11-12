import { translations } from "@/lib/translations"
import type { Habit, HabitCompletion } from "./types"

// Existing onboarding plans stored the tiny and full tasks but no middle step.
const middleSteps = new Map<string, string>()
for (const dictionary of Object.values(translations)) {
  for (const choices of Object.values(dictionary.habits.app.onboardingStep2.choices)) {
    for (const choice of choices) middleSteps.set(choice.full + "\n" + choice.tiny, choice.medium)
  }
}

export const STARTER_WEEKS = 3

export function starterMilestones(weeks: number, timesPerWeek: number) {
  const full = weeks * timesPerWeek
  return { medium: Math.ceil(full / 2), full }
}

export function habitMilestones(habit: Habit) {
  const times = habit.schedule?.type === "times_per_week" ? habit.schedule.timesPerWeek ?? 7 : 7
  return starterMilestones(habit.tinyHabit?.targetWeeks ?? 2, times)
}

export function progressStarterHabits(habits: Habit[], completions: HabitCompletion[], today: string): Habit[] {
  const days = new Map<string, Set<string>>()
  for (const entry of completions) {
    if (!entry.completed || entry.date >= today) continue
    const completed = days.get(entry.habitId) ?? new Set<string>()
    completed.add(entry.date)
    days.set(entry.habitId, completed)
  }

  return habits.map(habit => {
    const plan = habit.tinyHabit
    if (!plan) return habit
    const medium = plan.progression === "starter" ? plan.mediumVersion : middleSteps.get(plan.fullVersion + "\n" + plan.tinyVersion)
    if (!medium || ![plan.fullVersion, plan.tinyVersion, medium].includes(habit.name)) return habit
    const count = days.get(habit.id)?.size ?? 0
    const thresholds = habitMilestones(habit)
    const level = count >= thresholds.full ? "full" : count >= thresholds.medium ? "medium" : "tiny"
    const name = level === "full" ? plan.fullVersion : level === "medium" ? medium : plan.tinyVersion
    if (plan.progression === "starter" && name === habit.name && level === plan.currentLevel && medium === plan.mediumVersion) return habit
    return { ...habit, name, tinyHabit: { ...plan, progression: "starter", mediumVersion: medium, currentLevel: level } }
  })
}
