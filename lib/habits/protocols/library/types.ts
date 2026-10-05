import type { PillarId } from "@/lib/habits/pillars"
import type { ReadingContent } from "@/lib/habits/types"

import type { AuthorId } from "../authors"
import type { CostTier, ProtocolCost } from "../cost"
import type { SourceRef } from "../sources"

/**
 * The shape every protocol in the library is authored against.
 *
 * Split out of the old flat library.ts so the six pillar modules can share it
 * without importing each other.
 */

/**
 * The concrete daily shape of one habit inside a protocol — what time it happens
 * and on which days.
 *
 * Authored next to the protocol prose rather than in a separate lookup table.
 * The lookup table came first, and it has a sharp edge: `CATALOG_PROTOCOLS`
 * drops any protocol with zero habits, so a protocol whose blueprints were
 * forgotten disappears from the marketplace with no error at all. Co-locating
 * makes that omission visible while you are writing the protocol.
 */
export interface SeedHabitBlueprint {
  slug: string
  name: string
  why: string
  time: string // "HH:MM"
  schedule: { type: "daily" | "specific_days" | "times_per_week"; days?: number[]; timesPerWeek?: number }
  /** Per-habit override; defaults to the protocol's difficulty. */
  difficulty?: "easy" | "moderate" | "hard"
  /** Per-habit override; defaults to the protocol's cost tier. */
  cost?: CostTier
  /** Present when this habit is completed by reading rather than doing. */
  readingContent?: ReadingContent
}

export interface SeedProtocol {
  slug: string
  name: string
  /** One line for cards. Falls back to `description` when omitted. */
  tagline?: string
  description: string
  why: string
  pillar: PillarId
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  /** Display string kept for back-compat with pre-registry entries. */
  creator: string
  authorId?: AuthorId
  /** Secondary contributors — a research lead plus a popularizer, typically. */
  coAuthorIds?: AuthorId[]
  featured?: boolean
  steps: string[]
  benefits: string[]
  risks?: string[]
  /** What you need. What it *costs* lives in `cost.items`. */
  equipment?: string[]
  cost?: ProtocolCost
  references: SourceRef[]
  blueprints: SeedHabitBlueprint[]
}
