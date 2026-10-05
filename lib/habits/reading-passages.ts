import { daySeed } from "@/lib/habits/philosophy"
import type { HabitCompletion, ReadingContent, ReadingPassage } from "@/lib/habits/types"

/**
 * Choosing which passage a reading habit shows.
 *
 * Deliberately pure and deterministic. The alternative — picking at random, or
 * storing a cursor on the habit — either shuffles the text under you when the
 * modal reopens, or adds persisted state to a storage blob we are keeping at
 * schemaVersion 7. Deriving from the date costs nothing and does neither.
 */

export function selectPassage(
  content: ReadingContent,
  dateStr: string,
  completedCount = 0
): ReadingPassage | undefined {
  const { passages } = content
  if (passages.length === 0) return undefined
  if (passages.length === 1) return passages[0]

  if (content.mode === "sequence") {
    return passages[completedCount % passages.length]
  }
  return passages[daySeed(dateStr) % passages.length]
}

/**
 * How many days of this habit are already complete — drives `sequence` mode.
 *
 * Counts completions rather than tracking a cursor, so the sequence position is
 * always recoverable from data that already exists.
 */
export function completedCountFor(habitId: string, completions: HabitCompletion[]): number {
  let count = 0
  for (const completion of completions) {
    if (completion.habitId === habitId && completion.completed) count++
  }
  return count
}

/** Whether this habit should open the reading modal rather than toggling. */
export function isReadingHabit(content: ReadingContent | undefined): content is ReadingContent {
  return Boolean(content?.enabled && content.passages.length > 0)
}
