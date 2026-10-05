import type { PillarId } from "@/lib/habits/pillars"

/**
 * The philosophy layer: the ideas behind the habits.
 *
 * The tracker already had streaks and identity scaffolding — the machinery of
 * habit formation — but nothing that carried the *reasoning*. A streak tells you
 * that you showed up; it doesn't tell you why showing up matters. These
 * collections fill that gap, and because a passage is short enough to read in
 * under a minute, reading one is itself a trackable habit.
 *
 * Static app data. Only a collection id ever reaches the storage blob.
 */

export type CollectionId =
  | "stoicism"
  | "atomic-habits"
  | "tiny-habits"
  | "deep-work"
  | "strength"
  | "sleep-wisdom"

/**
 * quote  — someone else's words, quoted
 * quip   — a short sharp line, ours or theirs
 * mantra — written in the second person, meant to be re-read rather than admired
 */
export type QuoteKind = "quote" | "quip" | "mantra"

export interface Quote {
  /** Collection-prefixed and stable: "stoicism-control-1". Doubles as a passage id. */
  id: string
  kind: QuoteKind
  text: string
  /** Who said it. For in-house mantras, the framework they come from. */
  author: string
  /** Where. "Meditations, 5.1" */
  source?: string
  url?: string
  collection: CollectionId
  /** Pillars this speaks to, for contextual surfacing. Empty means universal. */
  pillars?: PillarId[]
  /** One line on how to use it today. */
  application?: string
}

export interface Collection {
  id: CollectionId
  name: string
  description: string
  /** The pillar this tradition sits closest to. */
  pillar?: PillarId
  /**
   * Attribution note shown in the reader. Public-domain sources say so; living
   * authors get a pointer to the book, because the right move there is to send
   * people to the source rather than to reproduce it.
   */
  attributionNote?: string
  quotes: Quote[]
}
