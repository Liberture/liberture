import type { PillarId } from "@/lib/translations"

export type Difficulty = "easy" | "moderate" | "hard"

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime"

/** How often a habit is expected. Mirrors the schedule model in the reference tracker. */
export type Schedule =
  | { type: "daily" }
  | { type: "specific_days"; days: number[] } // 0 = Sunday
  | { type: "times_per_week"; timesPerWeek: number }

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
}

/** A protocol groups habits into a routine with evidence and context to read. */
export interface CatalogProtocol {
  slug: string
  name: string
  tagline: string
  /** Long-form rationale shown when the user opens the protocol to read it. */
  description: string
  why: string
  pillar: PillarId
  difficulty: Difficulty
  duration: string
  benefits: string[]
  /** Practical cautions. Empty array when there is nothing meaningful to warn about. */
  risks: string[]
  evidence: string[]
  habits: CatalogHabit[]
}

/** A habit the user has actually adopted. */
export interface Habit {
  id: string
  name: string
  why: string
  pillar: PillarId
  time: string
  schedule: Schedule
  difficulty: Difficulty
  timeOfDay: TimeOfDay
  /** Slug of the protocol this came from, when adopted as part of one. */
  protocolSlug?: string
  /** Catalog slug, so re-adoption can be detected. */
  sourceSlug?: string
  createdAt: string // ISO
  archived?: boolean
}

/** One completion record. Keyed by habit + date so a habit is done at most once a day. */
export interface Completion {
  habitId: string
  date: string // YYYY-MM-DD
  completedAt: string // ISO
}

export interface StreakSummary {
  current: number
  longest: number
  /** Scheduled days completed / scheduled days elapsed, over the trailing window. */
  rate7: number
  rate30: number
}

export const TRACKER_SCHEMA_VERSION = 1

export interface TrackerState {
  version: number
  /** Set once the wizard completes; the tracker redirects to the wizard until then. */
  onboarded: boolean
  displayName?: string
  /** Pillars the user said they care about, used to order the catalog. */
  focusPillars: PillarId[]
  habits: Habit[]
  completions: Completion[]
  adoptedProtocols: string[]
  /**
   * Protocols picked from /protocols before the setup wizard was finished.
   * They are held here — not turned into habits — until the wizard completes,
   * so an abandoned setup leaves the tracker untouched.
   */
  pendingProtocols: string[]
  createdAt?: string
  updatedAt?: string
}

export const EMPTY_STATE: TrackerState = {
  version: TRACKER_SCHEMA_VERSION,
  onboarded: false,
  focusPillars: [],
  habits: [],
  completions: [],
  adoptedProtocols: [],
  pendingProtocols: [],
}
