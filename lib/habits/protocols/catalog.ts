import { readingFromCollection } from "@/lib/habits/philosophy"
import type { PillarId } from "@/lib/habits/pillars"
import type { Habit, ReadingContent } from "@/lib/habits/types"

import { type Author, findAuthor } from "./authors"
import { type CostTier, type ProtocolCost, resolveTier } from "./cost"
import { protocols as libraryProtocols, daily, on, weekdays } from "./library"
import type { SeedProtocol } from "./library"
import { normalizeSources, type Source } from "./sources"

/**
 * The marketplace catalog.
 *
 * Protocol prose comes from ./library. What the library does not carry is the
 * concrete daily shape of a protocol — what time it happens and on which days —
 * except that it now does, via each protocol's `blueprints`. This file turns the
 * seed shape into the shape the UI consumes.
 *
 * The catalog is static app data, never user data: adopting an entry produces
 * ordinary `Habit` records (see ./adopt.ts), so nothing about the storage blob
 * changes and the result stays readable by any other instance of this tracker.
 */

export type Difficulty = "easy" | "moderate" | "hard"

/** Same shape as `Habit["schedule"]`, so blueprints drop straight into a habit. */
type Schedule = Habit["schedule"]

/** A habit template as it appears in the catalog, before the user adopts it. */
export interface CatalogHabit {
  slug: string
  name: string
  /** The one-line reason this habit earns its place. */
  why: string
  pillar: PillarId
  time: string // "HH:MM"
  schedule: Schedule
  difficulty: Difficulty
  /** Inherited from the parent protocol unless the blueprint overrides it. */
  cost: CostTier
  /** Present when this habit is completed by reading rather than by doing. */
  readingContent?: ReadingContent
}

/** A protocol groups habits into a routine with evidence and context to read. */
export interface CatalogProtocol {
  slug: string
  name: string
  tagline: string
  description: string
  why: string
  pillar: PillarId
  difficulty: Difficulty
  duration: string
  /** Legacy display string. Prefer `author` when it resolves. */
  creator: string
  author?: Author
  coAuthors: Author[]
  featured: boolean
  steps: string[]
  benefits: string[]
  /** Practical cautions. Empty when there is nothing meaningful to warn about. */
  risks: string[]
  equipment: string[]
  cost?: ProtocolCost
  /** Always present, inferred when the protocol didn't declare a cost. */
  costTier: CostTier
  evidence: Source[]
  habits: CatalogHabit[]
  /**
   * Lowercased haystack for the marketplace search box. Precomputed once at
   * module load so filtering stays free per keystroke.
   */
  searchText: string
}

const DIFFICULTY: Record<SeedProtocol["difficulty"], Difficulty> = {
  beginner: "easy",
  intermediate: "moderate",
  advanced: "hard",
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
}

/** Easiest first, for sorting. */
export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "moderate", "hard"]

function toCatalogProtocol(p: SeedProtocol): CatalogProtocol {
  const difficulty = DIFFICULTY[p.difficulty]
  const pillar = p.pillar
  const equipment = p.equipment ?? []
  const costTier = resolveTier(p.cost, equipment)
  const author = findAuthor(p.authorId)
  const coAuthors = (p.coAuthorIds ?? []).map(findAuthor).filter((a): a is Author => Boolean(a))

  const habits: CatalogHabit[] = p.blueprints.map((b) => ({
    slug: b.slug,
    name: b.name,
    why: b.why,
    pillar,
    time: b.time,
    schedule: b.schedule,
    difficulty: b.difficulty ?? difficulty,
    cost: b.cost ?? costTier,
    readingContent: b.readingContent,
  }))

  return {
    slug: p.slug,
    name: p.name,
    // The tagline used to be a literal copy of the description, which made the
    // card and the reader say the same thing twice.
    tagline: p.tagline ?? p.description,
    description: p.description,
    why: p.why,
    pillar,
    difficulty,
    duration: p.duration,
    creator: p.creator,
    author,
    coAuthors,
    featured: p.featured ?? false,
    steps: p.steps,
    benefits: p.benefits,
    risks: p.risks ?? [],
    equipment,
    cost: p.cost,
    costTier,
    evidence: normalizeSources(p.references),
    habits,
    searchText: [
      p.name,
      p.tagline ?? "",
      p.description,
      p.why,
      p.creator,
      author?.name ?? "",
      ...coAuthors.map((a) => a.name),
      ...equipment,
      ...habits.map((h) => h.name),
    ]
      .join(" ")
      .toLowerCase(),
  }
}

export const CATALOG_PROTOCOLS: CatalogProtocol[] = libraryProtocols
  .map(toCatalogProtocol)
  // A protocol with no habits can't be tracked, so it doesn't belong in the marketplace.
  .filter((p) => p.habits.length > 0)

/** Authors who actually have protocols in the catalog, for the browse filter. */
export const CATALOG_AUTHORS: Author[] = (() => {
  const seen = new Map<string, Author>()
  for (const p of CATALOG_PROTOCOLS) {
    if (p.author?.kind === "person") seen.set(p.author.id, p.author)
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
})()

/** Single habits that stand on their own, for users who don't want a whole protocol. */
export const STANDALONE_HABITS: CatalogHabit[] = [
  {
    slug: "read-pages",
    name: "Read 10 pages",
    why: "Small enough to never skip, large enough to finish books.",
    pillar: "mind",
    time: "21:00",
    schedule: daily,
    difficulty: "easy",
    cost: "free",
  },
  {
    slug: "mobility-stretch",
    name: "10-minute mobility",
    why: "Cheap insurance against the stiffness a desk builds.",
    pillar: "exercise",
    time: "19:00",
    schedule: daily,
    difficulty: "easy",
    cost: "free",
  },
  {
    slug: "daily-stoic-passage",
    name: "Daily Stoic passage",
    why: "One minute of Marcus Aurelius. Read it, apply it once, close the app.",
    pillar: "mind",
    time: "07:15",
    schedule: daily,
    difficulty: "easy",
    cost: "free",
    readingContent: readingFromCollection("stoicism", {
      mode: "daily",
      prompt: "Where does this apply today?",
    }),
  },
  {
    slug: "daily-mantra",
    name: "Daily mantra",
    why: "Re-read who you're becoming before the day gets a vote.",
    pillar: "mind",
    time: "06:45",
    schedule: daily,
    difficulty: "easy",
    cost: "free",
    readingContent: readingFromCollection("tiny-habits", {
      mode: "sequence",
      prompt: "What's the smallest version of today's habit?",
      captureReflection: false,
    }),
  },
  {
    slug: "step-outside",
    name: "Step outside",
    why: "Ten minutes of daylight, whatever else the day does.",
    pillar: "sleep",
    time: "12:00",
    schedule: daily,
    difficulty: "easy",
    cost: "free",
  },
  {
    slug: "one-hard-conversation",
    name: "One hard thing",
    why: "The task you've been avoiding, first, before it compounds.",
    pillar: "work",
    time: "09:00",
    schedule: weekdays,
    difficulty: "moderate",
    cost: "free",
  },
  {
    slug: "phone-out-of-bedroom",
    name: "Phone out of the bedroom",
    why: "The single change most people notice within three nights.",
    pillar: "sleep",
    time: "22:00",
    schedule: daily,
    difficulty: "moderate",
    cost: "free",
  },
  {
    slug: "stairs-not-lift",
    name: "Stairs, not the lift",
    why: "Free vertical work, several times a day, that you were going to do anyway.",
    pillar: "exercise",
    time: "09:00",
    schedule: weekdays,
    difficulty: "easy",
    cost: "free",
  },
  {
    slug: "check-one-number",
    name: "Check one number",
    why: "One financial number a week. Not all of them — that's why you stop.",
    pillar: "finance",
    time: "10:00",
    schedule: on(0),
    difficulty: "easy",
    cost: "free",
  },
  {
    slug: "vegetables-first",
    name: "Vegetables first",
    why: "Eat the plants on the plate before anything else on it.",
    pillar: "nutrition",
    time: "19:00",
    schedule: daily,
    difficulty: "easy",
    cost: "free",
  },
]

export function findProtocol(slug: string): CatalogProtocol | undefined {
  return CATALOG_PROTOCOLS.find((p) => p.slug === slug)
}

export function findCatalogHabit(slug: string): CatalogHabit | undefined {
  const standalone = STANDALONE_HABITS.find((h) => h.slug === slug)
  if (standalone) return standalone
  for (const protocol of CATALOG_PROTOCOLS) {
    const match = protocol.habits.find((h) => h.slug === slug)
    if (match) return match
  }
  return undefined
}

/** Human-readable summary of a blueprint's schedule, e.g. "Mon–Fri". */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function scheduleLabel(schedule: Schedule): string {
  if (schedule.type === "daily") return "Every day"
  if (schedule.type === "times_per_week") {
    const n = schedule.timesPerWeek ?? 1
    return `${n}× per week`
  }
  const days = schedule.days ?? []
  if (days.length === 0) return "No days set"
  if (days.length === 7) return "Every day"
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "Mon–Fri"
  return days.map((d) => DAY_NAMES[d]).join(", ")
}

/**
 * Development-only integrity checks.
 *
 * Two failure modes here are silent and expensive. A protocol authored without
 * blueprints is filtered out of `CATALOG_PROTOCOLS` above and simply never
 * appears; and a duplicated slug breaks `findCatalogHabit` and the adoption
 * dedup in ways that only show up as a habit mysteriously not being added.
 * Neither throws on its own, so we say something loudly in development.
 */
if (process.env.NODE_ENV !== "production") {
  const dropped = libraryProtocols.filter((p) => p.blueprints.length === 0)
  if (dropped.length > 0) {
    console.warn(
      `[catalog] ${dropped.length} protocol(s) have no blueprints and are hidden from the marketplace:`,
      dropped.map((p) => p.slug)
    )
  }

  // Protocol slugs and habit slugs are separate namespaces — `findProtocol`
  // only searches protocols and `adoptedSlugs` only collects habit slugs — so a
  // protocol sharing a slug with its own single habit is fine and common.
  // Checking them together would flag those as errors.
  const findDuplicates = (slugs: string[]): string[] => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const slug of slugs) {
      if (seen.has(slug)) duplicates.push(slug)
      seen.add(slug)
    }
    return duplicates
  }

  const duplicateProtocols = findDuplicates(CATALOG_PROTOCOLS.map((p) => p.slug))
  if (duplicateProtocols.length > 0) {
    console.warn("[catalog] duplicate protocol slugs:", duplicateProtocols)
  }

  const duplicateHabits = findDuplicates([
    ...CATALOG_PROTOCOLS.flatMap((p) => p.habits.map((h) => h.slug)),
    ...STANDALONE_HABITS.map((h) => h.slug),
  ])
  if (duplicateHabits.length > 0) {
    console.warn("[catalog] duplicate habit slugs — adoption dedup will misbehave:", duplicateHabits)
  }
}
