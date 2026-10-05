import { inferTimeOfDay } from "@/lib/habits/habit-utils"
import { PILLAR_HEX, type PillarId } from "@/lib/habits/pillars"
import type { Habit, HabitTag, StreakData } from "@/lib/habits/types"

import type { CatalogHabit, CatalogProtocol } from "./catalog"

/**
 * Turns catalog entries into ordinary `Habit` records.
 *
 * Deliberately produces nothing exotic: every field written here already existed
 * in the schema, and the two provenance fields (`protocolSlug`, `catalogSlug`)
 * are optional. The storage blob stays at schemaVersion 7, so a habit adopted
 * from the marketplace round-trips through any other instance of this tracker
 * untouched — `validateStorageData` rejects anything above v7, which is exactly
 * why the marketplace does not introduce a version of its own.
 */

/** The milestone ladder every new habit starts with (mirrors `addHabit`). */
export function freshStreakData(): StreakData {
  return {
    current: 0,
    longest: 0,
    freezesAvailable: 0,
    freezesUsed: 0,
    milestones: [
      { days: 3, celebrated: false },
      { days: 7, celebrated: false },
      { days: 14, celebrated: false },
      { days: 21, celebrated: false },
      { days: 30, celebrated: false },
      { days: 66, celebrated: false },
    ],
  }
}

/** Pillars map onto the existing `HabitTag` union so tag-based features keep working. */
export const PILLAR_TAG: Record<PillarId, HabitTag> = {
  work: "productivity",
  sleep: "sleep",
  nutrition: "nutrition",
  mind: "mindfulness",
  exercise: "exercise",
  finance: "finance",
}

/** Difficulty maps onto the 1–5 priority scale — harder habits earn more attention. */
const DIFFICULTY_PRIORITY = { easy: 2, moderate: 3, hard: 4 } as const

export function catalogHabitToHabit(
  entry: CatalogHabit,
  options: { protocolSlug?: string } = {}
): Habit {
  return {
    id: crypto.randomUUID(),
    name: entry.name,
    description: entry.why,
    time: entry.time,
    color: PILLAR_HEX[entry.pillar],
    schedule: entry.schedule,
    priority: DIFFICULTY_PRIORITY[entry.difficulty],
    category: entry.pillar,
    tags: [PILLAR_TAG[entry.pillar]],
    timeOfDay: inferTimeOfDay(entry.time),
    archived: false,
    createdAt: new Date().toISOString(),
    protocolSlug: options.protocolSlug,
    catalogSlug: entry.slug,
    // Carried straight through. Undefined for every non-reading entry, which is
    // most of them, so the adopted habit is byte-identical to what it was before
    // read-to-complete existed.
    readingContent: entry.readingContent,
    randomRemindersEnabled: false,
    // The catalog's "why" is the behavior half of an implementation intention;
    // the trigger is the scheduled time, which is what the user actually cues on.
    implementationIntention: {
      trigger: `it is ${entry.time}`,
      behavior: entry.name,
    },
    streakData: freshStreakData(),
  }
}

export function adoptProtocol(protocol: CatalogProtocol): Habit[] {
  return protocol.habits.map((entry) =>
    catalogHabitToHabit(entry, { protocolSlug: protocol.slug })
  )
}

/** Catalog slugs already present, so the UI can show what's adopted. */
export function adoptedSlugs(habits: Habit[]): Set<string> {
  const slugs = new Set<string>()
  for (const habit of habits) {
    if (habit.archived) continue
    if (habit.catalogSlug) slugs.add(habit.catalogSlug)
  }
  return slugs
}

/** A protocol counts as adopted once every one of its habits is present. */
export function adoptedProtocolSlugs(habits: Habit[], protocols: CatalogProtocol[]): Set<string> {
  const slugs = adoptedSlugs(habits)
  const adopted = new Set<string>()
  for (const protocol of protocols) {
    if (protocol.habits.length > 0 && protocol.habits.every((h) => slugs.has(h.slug))) {
      adopted.add(protocol.slug)
    }
  }
  return adopted
}
