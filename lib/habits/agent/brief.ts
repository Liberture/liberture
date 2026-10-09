import { calculateStreak, calculateSuccessRate, weeklyProgress, type WeekStart } from "@/lib/habits/habit-utils"
import { PILLAR_IDS, PILLAR_LABELS, pillarForHabit, type PillarId } from "@/lib/habits/pillars"
import { scheduleLabel } from "@/lib/habits/protocols/catalog"
import { adoptedProtocolSlugs, adoptedSlugs } from "@/lib/habits/protocols/adopt"
import { CATALOG_PROTOCOLS } from "@/lib/habits/protocols/catalog"
import type { Habit, HabitCompletion, StorageData } from "@/lib/habits/types"

/**
 * Turns a user's storage blob into the two files the coach agent reads.
 *
 * Not the raw blob. Three reasons: it can carry thousands of completion rows,
 * the agent has no tooling to aggregate them (see `catalog-export.ts` on the
 * sandbox), and it holds fields — integration tokens, accountability partners'
 * details — that have nothing to do with coaching and should not leave the
 * database. So we compute the answers here, in TypeScript, next to the types,
 * and hand over a digest.
 */

export interface AgentBrief {
  habitsMarkdown: string
  completionsCsv: string
  /** Passed to the catalog exporter so the index can mark what they already have. */
  adoptedHabitSlugs: Set<string>
  adoptedProtocolSlugs: Set<string>
}

/** How much raw history to ship. Enough to see seasonality, not the whole life. */
const HISTORY_DAYS = 180

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

function describeHabit(habit: Habit, completions: HabitCompletion[], weekStartsOn: WeekStart): string {
  const now = new Date()
  const streak = calculateStreak(habit.id, completions, habit.streakData, habit, now, weekStartsOn)
  const rate7 = calculateSuccessRate(habit, completions, 7, now, weekStartsOn, now)
  const rate30 = calculateSuccessRate(habit, completions, 30, now, weekStartsOn, now)
  const unit = streak.unit === "weeks" ? "week" : "day"
  const week = habit.schedule?.type === "times_per_week" ? weeklyProgress(habit, completions, now, weekStartsOn) : null
  const pillar = pillarForHabit(habit)

  const lines = [
    `### ${habit.name}`,
    ...(habit.description ? [`- description: ${habit.description.replace(/\s+/g, " ")}`] : []),
    `- pillar: ${pillar} · time: ${habit.time || "unset"} · ${scheduleLabel(habit.schedule).toLowerCase()}`,
    `- streak: ${streak.current} ${unit}${streak.current === 1 ? "" : "s"} (longest ${streak.longest})${streak.unit === "weeks" ? " — weeks in a row that met the target" : ""}`,
    ...(week ? [`- this week: ${week.done}/${week.target} done${week.met ? " (target met)" : `, ${week.daysLeft} day${week.daysLeft === 1 ? "" : "s"} left after today`}`] : []),
    `- completion: ${pct(rate7)} last 7 days, ${pct(rate30)} last 30 days`,
    `- created: ${habit.createdAt ? habit.createdAt.slice(0, 10) : "unknown"}`,
  ]
  if (habit.catalogSlug) {
    lines.push(`- from catalog: \`${habit.catalogSlug}\`${habit.protocolSlug ? ` (protocol \`${habit.protocolSlug}\`)` : ""}`)
  }
  if (habit.identity?.identityType) {
    lines.push(`- identity: they are becoming "a ${habit.identity.identityType}"`)
  }
  if (habit.implementationIntention?.trigger) {
    lines.push(`- cue: when ${habit.implementationIntention.trigger}`)
  }
  if (habit.tinyHabit && habit.tinyHabit.currentLevel !== "full") {
    // Worth knowing: they have already made this one easier, so "try a smaller
    // version" is advice they have taken.
    lines.push(`- scaled down to the ${habit.tinyHabit.currentLevel} version ("${habit.tinyHabit.tinyVersion}")`)
  }
  return lines.join("\n")
}

/**
 * A protocol the user is part-way through. These are the strongest
 * recommendations available, so they are called out rather than left for the
 * agent to derive by cross-referencing slugs.
 */
function partialProtocols(adopted: Set<string>): string[] {
  const out: string[] = []
  for (const protocol of CATALOG_PROTOCOLS) {
    const have = protocol.habits.filter((h) => adopted.has(h.slug))
    if (have.length === 0 || have.length === protocol.habits.length) continue
    const missing = protocol.habits.filter((h) => !adopted.has(h.slug))
    out.push(
      `- \`${protocol.slug}\` (${protocol.name}): has ${have.length} of ${protocol.habits.length}. Missing ${missing.map((h) => `\`${h.slug}\` (${h.name})`).join(", ")}.`
    )
  }
  return out
}

function buildHabitsMarkdown(data: StorageData, adopted: Set<string>): string {
  const habits = data.habits ?? []
  const completions = data.completions ?? []
  const active = habits.filter((h) => !h.archived)
  const archived = habits.filter((h) => h.archived)

  const sections: string[] = [
    "# This user's habits",
    "",
    `Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC. Rewritten before every turn.`,
  ]

  if (data.profile?.missionStatement) {
    sections.push("", "## What they said they want", `> ${data.profile.missionStatement}`)
  }
  if (data.profile?.name) {
    sections.push("", `Their name is ${data.profile.name}.`)
  }

  sections.push("", `## Active habits (${active.length})`)
  if (active.length === 0) {
    sections.push("", "None yet — they are starting from scratch.")
  } else {
    // Busiest times matter: a recommendation at an hour they have already
    // filled is a recommendation they will not keep.
    const byTime = active
      .map((h) => h.time)
      .filter(Boolean)
      .sort()
    sections.push("", `Times already in use: ${byTime.length > 0 ? byTime.join(", ") : "none set"}.`)
    sections.push("", ...active.map((h) => describeHabit(h, completions, data.preferences?.weekStartsOn ?? 1)))
  }

  const counts = new Map<PillarId, number>()
  for (const habit of active) {
    const pillar = pillarForHabit(habit)
    counts.set(pillar, (counts.get(pillar) ?? 0) + 1)
  }
  sections.push(
    "",
    "## Pillar coverage",
    "",
    ...PILLAR_IDS.map((id) => {
      const n = counts.get(id) ?? 0
      return `- ${PILLAR_LABELS[id]} (\`${id}\`): ${n === 0 ? "**nothing**" : `${n} habit${n === 1 ? "" : "s"}`}`
    })
  )

  const partial = partialProtocols(adopted)
  if (partial.length > 0) {
    sections.push("", "## Protocols they have only partly adopted", "", ...partial)
  }

  if (archived.length > 0) {
    sections.push(
      "",
      `## Archived (${archived.length})`,
      "",
      "They stopped these. Suggesting one again needs a reason that acknowledges it.",
      "",
      ...archived.map((h) => `- ${h.name}${h.archivedAt ? ` (archived ${h.archivedAt.slice(0, 10)})` : ""}`)
    )
  }

  const todos = data.todos ?? []
  const openTodos = todos.filter((t) => t.status !== "completed")
  sections.push("", "## Elsewhere in the app", "", `- ${openTodos.length} open todo${openTodos.length === 1 ? "" : "s"} of ${todos.length} total`, `- ${(data.projects ?? []).length} project(s)`)

  return sections.join("\n")
}

/**
 * Raw history, so the agent can spot patterns the summary flattens — a habit
 * that only ever fails on weekends, or one abandoned two months ago.
 * `habitId` is included so rows join back to the habits file by name.
 */
function buildCompletionsCsv(data: StorageData): string {
  const cutoff = isoDaysAgo(HISTORY_DAYS)
  const names = new Map((data.habits ?? []).map((h) => [String(h.id), h.name]))
  const rows = (data.completions ?? [])
    .filter((c) => c.date >= cutoff)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((c) => `${names.get(String(c.habitId)) ?? "(deleted habit)"},${c.date},${c.completed ? "yes" : "no"}`)

  return ["habit,date,completed", ...rows].join("\n")
}

export function buildBrief(data: StorageData): AgentBrief {
  const habits = data.habits ?? []
  const adoptedHabits = adoptedSlugs(habits)
  return {
    habitsMarkdown: buildHabitsMarkdown(data, adoptedHabits),
    completionsCsv: buildCompletionsCsv(data),
    adoptedHabitSlugs: adoptedHabits,
    adoptedProtocolSlugs: adoptedProtocolSlugs(habits, CATALOG_PROTOCOLS),
  }
}
