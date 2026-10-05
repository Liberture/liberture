import type { PillarId } from "@/lib/habits/pillars"
import type { ReadingContent, ReadingPassage } from "@/lib/habits/types"

import { atomicHabits } from "./collections/atomic-habits"
import { deepWork } from "./collections/deep-work"
import { sleepWisdom } from "./collections/sleep-wisdom"
import { stoicism } from "./collections/stoicism"
import { strength } from "./collections/strength"
import { tinyHabits } from "./collections/tiny-habits"
import type { Collection, CollectionId, Quote } from "./types"

export type { Collection, CollectionId, Quote, QuoteKind } from "./types"

export const COLLECTIONS: Collection[] = [
  stoicism,
  atomicHabits,
  tinyHabits,
  deepWork,
  strength,
  sleepWisdom,
]

export const ALL_QUOTES: Quote[] = COLLECTIONS.flatMap((c) => c.quotes)

export function findCollection(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id)
}

export function findQuote(id: string): Quote | undefined {
  return ALL_QUOTES.find((q) => q.id === id)
}

/**
 * The day's integer seed, matching the idiom in lib/motivational-messages.ts so
 * the two systems rotate on the same boundary.
 *
 * Takes a `yyyy-MM-dd` string rather than a Date on purpose: it keeps selection
 * pure and free of `Math.random`, so the server and client render the same
 * passage and reopening the modal doesn't shuffle the text under you.
 */
export function daySeed(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return 0
  return year * 10000 + month * 100 + day
}

/** Deterministic pick from a fixed pool. The same date always yields the same item. */
export function pickForDate<T>(items: T[], dateStr: string): T | undefined {
  if (items.length === 0) return undefined
  return items[daySeed(dateStr) % items.length]
}

/** The day's quote, optionally scoped to one collection. Stable for the whole day. */
export function getDailyQuote(dateStr: string, collection?: CollectionId): Quote | undefined {
  const pool = collection ? (findCollection(collection)?.quotes ?? []) : ALL_QUOTES
  return pickForDate(pool, dateStr)
}

/**
 * A quote that speaks to a given pillar, for celebration moments. Falls back to
 * the universal pool when a pillar has nothing tagged to it.
 */
export function getQuoteForPillar(pillar: PillarId, dateStr: string): Quote | undefined {
  const tagged = ALL_QUOTES.filter((q) => q.pillars?.includes(pillar))
  const byCollection = COLLECTIONS.filter((c) => c.pillar === pillar).flatMap((c) => c.quotes)
  const pool = tagged.length > 0 ? tagged : byCollection
  return pickForDate(pool.length > 0 ? pool : ALL_QUOTES, dateStr)
}

export function quoteToPassage(quote: Quote): ReadingPassage {
  return {
    id: quote.id,
    body: quote.text,
    attribution: quote.author,
    source: quote.source,
    url: quote.url,
    application: quote.application,
  }
}

/**
 * Build a reading habit's content from a curated collection.
 *
 * This is the bridge between the philosophy layer and the catalog: a protocol
 * declares which tradition it draws on, and the passages come along for free.
 */
export function readingFromCollection(
  id: CollectionId,
  options: {
    mode?: ReadingContent["mode"]
    prompt?: string
    captureReflection?: boolean
    /** Restrict to quotes tagged with this pillar, when the collection is broad. */
    pillar?: PillarId
    limit?: number
  } = {}
): ReadingContent {
  const all = findCollection(id)?.quotes ?? []
  const scoped = options.pillar ? all.filter((q) => q.pillars?.includes(options.pillar as PillarId)) : all
  const chosen = scoped.length > 0 ? scoped : all

  return {
    enabled: true,
    mode: options.mode ?? "daily",
    captureReflection: options.captureReflection ?? true,
    prompt: options.prompt,
    minutes: 1,
    passages: chosen.slice(0, options.limit ?? chosen.length).map(quoteToPassage),
  }
}
