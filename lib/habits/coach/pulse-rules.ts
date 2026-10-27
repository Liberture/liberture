import { timeToMinutes, type LocalNow } from "@/lib/habits/coach/limits"
import { COACH_URL, todayProgress, type CoachMessage } from "@/lib/habits/coach/rules"
import { effectiveStatus, suggestionName } from "@/lib/habits/coach/suggestions"
import { ALL_QUOTES } from "@/lib/habits/philosophy"
import { PILLAR_IDS, pillarForHabit, type PillarId } from "@/lib/habits/pillars"
import { adoptedProtocolSlugs, adoptedSlugs } from "@/lib/habits/protocols/adopt"
import { CATALOG_PROTOCOLS, STANDALONE_HABITS, type CatalogHabit } from "@/lib/habits/protocols/catalog"
import { hash32 } from "@/lib/habits/reminders/due"
import { DEFAULT_COACH_PREFERENCES, type CoachRecommendationEntry, type HabitCompletion, type StorageData } from "@/lib/habits/types"
import { formatMessage } from "@/lib/i18n-format"
import { translations, type Locale } from "@/lib/translations"

/**
 * Daytime pulses as pure functions: when they fall (a few random minutes a
 * day, the same all day for a given user and date) and what they say (a
 * pending suggestion, today's progress, a catalog idea or a quote, rotated
 * so consecutive pulses differ). The runner and the limits are in pulses.ts.
 */

export const MAX_PULSES = 3
/** A pulse fires on any tick in [slot, slot + WINDOW): ticks can drift, and the claim dedupes. */
export const PULSE_WINDOW_MINUTES = 5
/** Keep clear of the edges of quiet hours. */
const PULSE_MARGIN_MINUTES = 30
/** Slots closer than this can't both fit. */
const MIN_SEGMENT_MINUTES = 30
/** Without valid quiet hours, pulses stay in 08:00–22:00 anyway. */
const DEFAULT_AWAKE = { start: 8 * 60, end: 22 * 60 }
export const MAX_QUOTE_LENGTH = 160
const MAX_BODY_LENGTH = 180

type PulseSource = "suggestion" | "progress" | "idea" | "quote"
const SOURCES: PulseSource[] = ["suggestion", "progress", "idea", "quote"]

/** coach.pulsesPerDay clamped to 0–3 (0 = off, the default). */
export function pulsesPerDay(data: Pick<StorageData, "preferences"> | null | undefined): number {
  const n = Number(data?.preferences?.coach?.pulsesPerDay ?? DEFAULT_COACH_PREFERENCES.pulsesPerDay)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(MAX_PULSES, Math.floor(n))
}

/**
 * The waking part of the day, [start, end) in minutes: from the end of quiet
 * hours to their start. Quiet hours that don't wrap midnight leave two
 * pieces; the longer one is used.
 */
function awakeWindow(quietHours: { start: string; end: string } | undefined): { start: number; end: number } {
  const quietStart = timeToMinutes(quietHours?.start)
  const quietEnd = timeToMinutes(quietHours?.end)
  if (quietStart === null || quietEnd === null || quietStart === quietEnd) return DEFAULT_AWAKE
  if (quietStart > quietEnd) return { start: quietEnd, end: quietStart }
  return 24 * 60 - quietEnd >= quietStart ? { start: quietEnd, end: 24 * 60 } : { start: 0, end: quietStart }
}

/**
 * Minutes since midnight of the day's pulses, ascending: the waking window
 * (minus margins) cut into `perDay` equal parts, one random minute in each.
 * Deterministic per user and date; [] when the window is too short.
 */
export function pulseSlots(userId: number, date: string, perDay: number, quietHours?: { start: string; end: string }): number[] {
  const { start, end } = awakeWindow(quietHours ?? DEFAULT_COACH_PREFERENCES.quietHours)
  const from = start + PULSE_MARGIN_MINUTES
  const span = end - PULSE_MARGIN_MINUTES - from
  if (perDay <= 0 || span < perDay * MIN_SEGMENT_MINUTES) return []
  const segment = Math.floor(span / perDay)
  const spread = Math.max(1, segment - PULSE_WINDOW_MINUTES)
  return Array.from({ length: perDay }, (_, i) => from + i * segment + (hash32(`${userId}|${date}|pulse|${i}`) % spread))
}

/** Index of the pulse whose window contains `localNow`, or null. */
export function duePulseSlot(userId: number, data: Pick<StorageData, "preferences">, localNow: LocalNow): number | null {
  const slots = pulseSlots(userId, localNow.date, pulsesPerDay(data), data.preferences?.coach?.quietHours)
  const index = slots.findIndex((slot) => localNow.minutes >= slot && localNow.minutes < slot + PULSE_WINDOW_MINUTES)
  return index === -1 ? null : index
}

function epochDay(date: string): number {
  const [y, m, d] = date.split("-").map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

function clip(text: string, max = MAX_BODY_LENGTH): string {
  const trimmed = text.replace(/\s+/g, " ").trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

type PulseData = Pick<StorageData, "habits" | "todos" | "preferences" | "coachRecommendations">

interface PulseInput {
  data: PulseData
  /** Completed completions, about a week back (the tick's). */
  completions: HabitCompletion[]
  localNow: LocalNow
  slot: number
  locale: Locale
  /** For snoozes that have run out. */
  now?: Date
}

function copy(locale: Locale) {
  return translations[locale].habits.app.coachMessages
}

/** A suggestion the user hasn't answered, isn't snoozing and hasn't already adopted. */
function openSuggestions(data: PulseData, now: Date): CoachRecommendationEntry[] {
  const habits = (data.habits ?? []).filter((h) => !h.archived)
  const slugs = adoptedSlugs(habits)
  const protocols = adoptedProtocolSlugs(habits, CATALOG_PROTOCOLS)
  const names = new Set(habits.map((h) => h.name.trim().toLowerCase()))
  return (data.coachRecommendations?.entries ?? []).filter((entry) => {
    if (effectiveStatus(entry, now) !== "pending") return false
    if (entry.kind === "habit" && entry.slug) return !slugs.has(entry.slug)
    if (entry.kind === "protocol" && entry.slug) return !protocols.has(entry.slug)
    return Boolean(entry.custom?.name) && !names.has(entry.custom!.name.trim().toLowerCase())
  })
}

function suggestionPulse({ data, localNow, slot, locale, now = new Date() }: PulseInput): CoachMessage | null {
  const open = openSuggestions(data, now)
  if (!open.length) return null
  const entry = open[(epochDay(localNow.date) + slot) % open.length]
  const t = copy(locale)
  return {
    title: t.pulseSuggestionTitle,
    body: clip(formatMessage(t.pulseSuggestionBody, { name: suggestionName(entry), reason: entry.reason })),
    url: `${COACH_URL}&tab=coach`,
  }
}

function progressPulse({ data, completions, localNow, locale }: PulseInput): CoachMessage | null {
  const { done, total, next } = todayProgress(data, completions, localNow.date)
  if (total === 0) return null
  const t = copy(locale)
  if (done >= total || !next) {
    return { title: t.pulseAllDoneTitle, body: formatMessage(t.pulseAllDoneBody, { total }), url: "/tracker?view=habits" }
  }
  return {
    title: t.pulseProgressTitle,
    body: clip(formatMessage(t.pulseProgressBody, { done, total, next: next.name.trim() })),
    url: "/tracker?view=habits",
  }
}

let catalogHabits: CatalogHabit[] | null = null
/** Every catalog habit once: standalone ones and those inside protocols. */
function allCatalogHabits(): CatalogHabit[] {
  if (!catalogHabits) {
    const bySlug = new Map<string, CatalogHabit>()
    for (const habit of [...STANDALONE_HABITS, ...CATALOG_PROTOCOLS.flatMap((p) => p.habits)]) {
      if (!bySlug.has(habit.slug)) bySlug.set(habit.slug, habit)
    }
    catalogHabits = [...bySlug.values()]
  }
  return catalogHabits
}

/** A catalog habit not adopted yet, from the pillar the user has the fewest habits in. */
function ideaPulse({ data, localNow, slot, locale }: PulseInput): CoachMessage | null {
  const habits = (data.habits ?? []).filter((h) => !h.archived)
  const adopted = adoptedSlugs(habits)
  const candidates = allCatalogHabits().filter((h) => !adopted.has(h.slug))
  if (!candidates.length) return null

  const perPillar = new Map<PillarId, number>(PILLAR_IDS.map((p) => [p, 0]))
  for (const habit of habits) {
    const pillar = pillarForHabit(habit)
    perPillar.set(pillar, (perPillar.get(pillar) ?? 0) + 1)
  }
  // Ties rotate by day so the same pillar doesn't win every time.
  const offset = epochDay(localNow.date) % PILLAR_IDS.length
  const order = [...PILLAR_IDS.slice(offset), ...PILLAR_IDS.slice(0, offset)].filter((p) => candidates.some((h) => h.pillar === p))
  if (!order.length) return null
  const pillar = order.reduce((best, p) => ((perPillar.get(p) ?? 0) < (perPillar.get(best) ?? 0) ? p : best), order[0])

  const pool = candidates.filter((h) => h.pillar === pillar)
  const pick = pool[hash32(`${localNow.date}|idea|${slot}`) % pool.length]
  const t = copy(locale)
  return {
    title: formatMessage(t.pulseIdeaTitle, { pillar: translations[locale].habits.app.pillarTag.pillars[pillar] }),
    body: clip(formatMessage(t.pulseIdeaBody, { name: pick.name, why: pick.why })),
    url: COACH_URL,
  }
}

const SHORT_QUOTES = ALL_QUOTES.filter((q) => q.text.trim().length <= MAX_QUOTE_LENGTH)

function quotePulse({ localNow, slot, locale }: PulseInput): CoachMessage | null {
  if (!SHORT_QUOTES.length) return null
  const quote = SHORT_QUOTES[hash32(`${localNow.date}|quote|${slot}`) % SHORT_QUOTES.length]
  const t = copy(locale)
  return {
    title: t.pulseQuoteTitle,
    body: clip(formatMessage(t.pulseQuoteBody, { text: quote.text.trim(), author: quote.author })),
    url: "/tracker?view=habits",
  }
}

const BUILDERS: Record<PulseSource, (input: PulseInput) => CoachMessage | null> = {
  suggestion: suggestionPulse,
  progress: progressPulse,
  idea: ideaPulse,
  quote: quotePulse,
}

/**
 * What this pulse says. The starting source rotates with the day and the
 * slot; a source with nothing to say passes to the next. Null only when
 * none has anything.
 */
export function pickPulse(input: PulseInput): CoachMessage | null {
  const start = (epochDay(input.localNow.date) + input.slot) % SOURCES.length
  for (let i = 0; i < SOURCES.length; i++) {
    const message = BUILDERS[SOURCES[(start + i) % SOURCES.length]](input)
    if (message) return message
  }
  return null
}
