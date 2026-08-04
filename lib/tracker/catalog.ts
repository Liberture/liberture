import { protocols as libraryProtocols, type SeedProtocol } from "@/lib/protocols/library"
import type { PillarId } from "@/lib/translations"
import type { CatalogHabit, CatalogProtocol, Difficulty, Schedule } from "./types"

/**
 * The wizard's marketplace. Protocol content comes from the shared library in
 * lib/protocols/library.ts — the same source the database seeder uses — so the
 * tracker never drifts from the published protocol pages.
 *
 * What the library doesn't carry is the concrete daily shape of a protocol:
 * what time it happens and on which days. That mapping lives here.
 */

const WEEKDAYS = [1, 2, 3, 4, 5]
const daily: Schedule = { type: "daily" }
const weekdays: Schedule = { type: "specific_days", days: WEEKDAYS }
const on = (...days: number[]): Schedule => ({ type: "specific_days", days })

const DIFFICULTY: Record<SeedProtocol["difficulty"], Difficulty> = {
  beginner: "easy",
  intermediate: "moderate",
  advanced: "hard",
}

type HabitBlueprint = Omit<CatalogHabit, "pillar" | "difficulty">

/** Concrete habits each protocol breaks down into. Every slug here must exist in the library. */
const HABIT_BLUEPRINTS: Record<string, HabitBlueprint[]> = {
  "deep-work-blocks": [
    {
      slug: "deep-work-block",
      name: "Deep work block",
      why: "One 90-minute undistracted block on the day's hardest task.",
      time: "09:00",
      schedule: weekdays,
    },
    {
      slug: "choose-tomorrows-task",
      name: "Choose tomorrow's block task",
      why: "Deciding the night before removes the morning's hardest decision.",
      time: "17:30",
      schedule: weekdays,
    },
  ],
  "pomodoro-method": [
    {
      slug: "pomodoro-session",
      name: "Pomodoro session",
      why: "25 minutes on, 5 off — the entry-level rep for focus.",
      time: "10:00",
      schedule: weekdays,
    },
  ],
  "morning-sunlight-exposure": [
    {
      slug: "morning-light",
      name: "Morning light",
      why: "10–30 minutes of outdoor light anchors your circadian clock.",
      time: "07:00",
      schedule: daily,
    },
  ],
  "caffeine-cutoff": [
    {
      slug: "caffeine-cutoff",
      name: "Last caffeine of the day",
      why: "Caffeine's half-life means an afternoon coffee is still working at bedtime.",
      time: "14:00",
      schedule: daily,
    },
  ],
  "time-restricted-eating": [
    {
      slug: "open-eating-window",
      name: "Open the eating window",
      why: "First food of the day, on purpose rather than by habit.",
      time: "12:00",
      schedule: daily,
    },
    {
      slug: "close-eating-window",
      name: "Close the eating window",
      why: "Last food of the day — the boundary that makes the protocol real.",
      time: "20:00",
      schedule: daily,
    },
  ],
  "protein-first-breakfast": [
    {
      slug: "protein-first-breakfast",
      name: "Protein-first breakfast",
      why: "30g of protein before carbs flattens the mid-morning crash.",
      time: "08:00",
      schedule: daily,
    },
  ],
  "daily-mindfulness-meditation": [
    {
      slug: "meditation",
      name: "Meditation",
      why: "Ten minutes of noticing your attention wandered and bringing it back.",
      time: "07:30",
      schedule: daily,
    },
  ],
  "gratitude-journaling": [
    {
      slug: "gratitude-journal",
      name: "Gratitude journal",
      why: "Three specific things, written down — specificity is what makes it work.",
      time: "21:30",
      // The protocol is explicitly 3×/week; daily journaling blunts the effect.
      schedule: on(1, 3, 5),
    },
  ],
  "daily-walking-baseline": [
    {
      slug: "daily-walk",
      name: "Daily walk",
      why: "The aerobic floor. Free, joint-friendly, needs no scheduling.",
      time: "18:00",
      schedule: daily,
    },
  ],
  "resistance-training-basics": [
    {
      slug: "resistance-training",
      name: "Resistance training",
      why: "Two full-body sessions a week is where strength and bone density move.",
      time: "18:30",
      schedule: on(1, 4),
    },
  ],
  "pay-yourself-first": [
    {
      slug: "pay-yourself-first",
      name: "Move money before spending it",
      why: "Savings that leave the account first never have to survive the month.",
      time: "09:00",
      schedule: on(5),
    },
  ],
  "weekly-money-review": [
    {
      slug: "weekly-money-review",
      name: "Weekly money review",
      why: "Twenty minutes looking at what actually happened last week.",
      time: "10:00",
      schedule: on(0),
    },
  ],
}

function toCatalogProtocol(p: SeedProtocol): CatalogProtocol {
  const difficulty = DIFFICULTY[p.difficulty]
  const pillar = p.pillar as PillarId
  const blueprints = HABIT_BLUEPRINTS[p.slug] ?? []

  return {
    slug: p.slug,
    name: p.name,
    tagline: p.description,
    description: p.description,
    why: p.why,
    pillar,
    difficulty,
    duration: p.duration,
    benefits: p.benefits,
    risks: p.risks ?? [],
    evidence: p.references,
    habits: blueprints.map((b) => ({ ...b, pillar, difficulty })),
  }
}

export const CATALOG_PROTOCOLS: CatalogProtocol[] = libraryProtocols
  .map(toCatalogProtocol)
  // A protocol with no habits can't be tracked, so it doesn't belong in the wizard.
  .filter((p) => p.habits.length > 0)

/** Single habits that stand on their own, for users who don't want a whole protocol. */
export const STANDALONE_HABITS: CatalogHabit[] = [
  {
    slug: "hydrate-on-waking",
    name: "Water on waking",
    why: "You wake up dehydrated. A glass before coffee costs nothing.",
    pillar: "nutrition",
    time: "07:00",
    schedule: daily,
    difficulty: "easy",
  },
  {
    slug: "screens-off",
    name: "Screens off",
    why: "A hard stop an hour before bed protects sleep onset.",
    pillar: "sleep",
    time: "22:00",
    schedule: daily,
    difficulty: "moderate",
  },
  {
    slug: "consistent-wake-time",
    name: "Same wake time",
    why: "A fixed wake time is the single strongest circadian anchor.",
    pillar: "sleep",
    time: "07:00",
    schedule: daily,
    difficulty: "moderate",
  },
  {
    slug: "read-pages",
    name: "Read 10 pages",
    why: "Small enough to never skip, large enough to finish books.",
    pillar: "mind",
    time: "21:00",
    schedule: daily,
    difficulty: "easy",
  },
  {
    slug: "inbox-zero-block",
    name: "Single email block",
    why: "Batching mail into one window stops it fragmenting the day.",
    pillar: "work",
    time: "16:00",
    schedule: weekdays,
    difficulty: "moderate",
  },
  {
    slug: "mobility-stretch",
    name: "10-minute mobility",
    why: "Cheap insurance against the stiffness a desk builds.",
    pillar: "exercise",
    time: "19:00",
    schedule: daily,
    difficulty: "easy",
  },
  {
    slug: "no-spend-check",
    name: "Log today's spending",
    why: "Awareness alone reduces spending before any budget does.",
    pillar: "finance",
    time: "21:00",
    schedule: daily,
    difficulty: "easy",
  },
  {
    slug: "walk-after-meals",
    name: "Walk after dinner",
    why: "A short post-meal walk blunts the glucose spike.",
    pillar: "nutrition",
    time: "20:30",
    schedule: daily,
    difficulty: "easy",
  },
]

export function protocolsForPillars(pillars: PillarId[]): CatalogProtocol[] {
  if (pillars.length === 0) return CATALOG_PROTOCOLS
  const focus = new Set(pillars)
  // Focused pillars first, everything else still reachable underneath.
  return [...CATALOG_PROTOCOLS].sort((a, b) => {
    const af = focus.has(a.pillar) ? 0 : 1
    const bf = focus.has(b.pillar) ? 0 : 1
    return af - bf
  })
}

export function findProtocol(slug: string): CatalogProtocol | undefined {
  return CATALOG_PROTOCOLS.find((p) => p.slug === slug)
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
}
